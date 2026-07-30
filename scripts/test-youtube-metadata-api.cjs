const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const testRoot = path.join(root, 'tmp', 'youtube-metadata-api-smoke');
const counterPath = path.join(testRoot, 'youtube-metadata-usage.json');
const port = Number(process.env.YOUTUBE_METADATA_API_SMOKE_PORT || 8094);
const baseUrl = `http://127.0.0.1:${port}/`;

function writeCounter(count, limitMonth) {
  fs.mkdirSync(testRoot, { recursive: true });
  fs.writeFileSync(counterPath, JSON.stringify({
    version: 1,
    months: {
      [limitMonth]: {
        youtubeMetadataRequests: count,
        updatedAt: '2026-07-31T00:00:00+09:00',
      },
    },
  }, null, 2));
}

function requestJson(pathname) {
  return new Promise((resolve, reject) => {
    const request = http.get(`${baseUrl}${pathname}`, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve({
            statusCode: response.statusCode,
            body: JSON.parse(body),
          });
        } catch (error) {
          reject(new Error(`Invalid JSON response for ${pathname}: ${body}`));
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(10_000, () => {
      request.destroy(new Error(`Request timed out for ${pathname}`));
    });
  });
}

function waitForServer() {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(baseUrl, (response) => {
        response.resume();
        resolve();
      });
      request.on('error', () => {
        if (Date.now() - startedAt > 10_000) {
          reject(new Error('PHP smoke server did not become ready.'));
          return;
        }
        setTimeout(tick, 250);
      });
      request.setTimeout(1000, () => {
        request.destroy();
      });
    };
    tick();
  });
}

function assertResponse(actual, expected) {
  const reason = actual.body && actual.body.data ? actual.body.data.reason : undefined;
  if (actual.body.code !== expected.code || reason !== expected.reason) {
    throw new Error(
      `Expected ${expected.code}/${expected.reason}, got ${actual.body.code}/${reason}: ${JSON.stringify(actual.body)}`
    );
  }
}

async function main() {
  fs.rmSync(testRoot, { recursive: true, force: true });
  fs.mkdirSync(testRoot, { recursive: true });

  const month = new Date().toISOString().slice(0, 7);
  writeCounter(2, month);

  const env = {
    ...process.env,
    AMP_ENV: 'cloud',
    DEBUG_MODE: 'false',
    YOUTUBE_DATA_API_KEY: 'dummy-key-for-limit-guard',
    YOUTUBE_METADATA_MONTHLY_LIMIT: '2',
    YOUTUBE_METADATA_ALLOW_OVER_LIMIT: 'false',
    YOUTUBE_METADATA_COUNTER_PATH: counterPath,
  };
  delete env.E2E_BASE_URL;

  const php = childProcess.spawn('php', ['-S', `127.0.0.1:${port}`, 'router.php'], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let stderr = '';
  php.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  try {
    await waitForServer();

    const invalid = await requestJson('youtube-metadata/bad');
    assertResponse(invalid, { code: 400, reason: 'invalid-video-id' });

    const limited = await requestJson('youtube-metadata/dQw4w9WgXcQ');
    assertResponse(limited, { code: 429, reason: 'quota-exceeded' });
    const countAfter = JSON.parse(fs.readFileSync(counterPath, 'utf8')).months[month].youtubeMetadataRequests;
    if (countAfter !== 2) {
      throw new Error(`Limit guard should not increment counter, got ${countAfter}.`);
    }

    console.log('YouTube metadata API smoke checks passed.');
  } finally {
    if (!php.killed) {
      php.kill();
    }
    fs.rmSync(testRoot, { recursive: true, force: true });
    if (stderr && /Fatal error|Parse error/i.test(stderr)) {
      throw new Error(stderr);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
