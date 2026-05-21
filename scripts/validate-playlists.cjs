const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020').default;

const assetsDir = path.resolve(__dirname, '..', 'assets');
const schemaPath = path.resolve(__dirname, '..', 'schemas', 'playlist.schema.json');

function isPlaylistCandidate(fileName) {
  if (!fileName.toLowerCase().endsWith('.json')) {
    return false;
  }
  return !/^lang(?:-|\.|$)/i.test(fileName);
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        const linkTarget = fs.readlinkSync(filePath);
        const resolvedTarget = path.resolve(path.dirname(filePath), linkTarget);
        return fs.readFileSync(resolvedTarget, 'utf8');
      }
    }
    throw error;
  }
}

function hasUnsafeScheme(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const match = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!match) return false;
  const scheme = String(match[1] || '').toLowerCase();
  return !['http', 'https'].includes(scheme);
}

function validateSanitizePolicy(data) {
  let total = 0;
  let rejected = 0;
  const errors = [];

  for (const [category, items] of Object.entries(data)) {
    if (category === 'options') continue;
    if (!Array.isArray(items)) {
      errors.push('/' + category + ' must be an array');
      continue;
    }
    items.forEach((item, index) => {
      total += 1;
      if (!item || typeof item !== 'object') {
        rejected += 1;
        errors.push('/' + category + '/' + index + ' must be object');
        return;
      }
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (title === '' || title.length > 100) {
        rejected += 1;
        errors.push('/' + category + '/' + index + '/title invalid');
      }
      if (typeof item.artist === 'string' && item.artist.length > 100) {
        errors.push('/' + category + '/' + index + '/artist exceeds 100 chars');
      }
      if (typeof item.desc === 'string' && item.desc.length > 500) {
        errors.push('/' + category + '/' + index + '/desc exceeds 500 chars');
      }
      ['file', 'image', 'thumb'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(item, key) && hasUnsafeScheme(item[key])) {
          rejected += 1;
          errors.push('/' + category + '/' + index + '/' + key + ' has unsafe scheme');
        }
      });
    });
  }

  if (total === 0) {
    errors.push('playlist has no media item');
    return { ok: false, errors };
  }
  if (rejected > 10 || rejected / Math.max(1, total) > 0.05) {
    errors.push('rejected media ratio exceeded threshold (rejected=' + rejected + ', total=' + total + ')');
    return { ok: false, errors };
  }
  return { ok: errors.length === 0, errors };
}

function main() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const files = fs
    .readdirSync(assetsDir)
    .filter(isPlaylistCandidate)
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log('No playlist JSON files found under assets/.');
    process.exit(0);
  }

  let hasErrors = false;

  for (const file of files) {
    const fullPath = path.join(assetsDir, file);
    const raw = readText(fullPath);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      hasErrors = true;
      console.error('[INVALID JSON] ' + file + ': ' + error.message);
      continue;
    }

    const ok = validate(data);
    if (!ok) {
      hasErrors = true;
      console.error('[SCHEMA ERROR] ' + file);
      for (const err of validate.errors || []) {
        const location = err.instancePath || '/';
        console.error('  - ' + location + ' ' + err.message);
      }
      continue;
    }

    const sanitizeResult = validateSanitizePolicy(data);
    if (!sanitizeResult.ok) {
      console.warn('[SANITIZE POLICY WARN] ' + file);
      for (const message of sanitizeResult.errors) {
        console.warn('  - ' + message);
      }
      console.log('[OK] ' + file + ' (schema valid, sanitize warnings)');
      continue;
    }

    console.log('[OK] ' + file);
  }

  if (hasErrors) {
    process.exit(1);
  }
}

main();
