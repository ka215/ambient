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

    console.log('[OK] ' + file);
  }

  if (hasErrors) {
    process.exit(1);
  }
}

main();
