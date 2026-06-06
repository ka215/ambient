const fs = require('fs');
const path = require('path');

const root = process.cwd();
const langsDir = path.join(root, 'assets', 'langs');
const basePath = path.join(langsDir, 'lang.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'test-results', 'logs'].includes(ent.name)) {
      continue;
    }
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (/\.(php|ts)$/.test(ent.name)) {
      out.push(fullPath);
    }
  }
}

function findSourceUsedMissingKeys(baseKeySet) {
  const targets = [];
  walk(path.join(root, 'src'), targets);
  walk(path.join(root, 'views'), targets);

  const used = new Set();
  const rePhp = /__\(\s*"([^"]+)"\s*\)|__\(\s*'([^']+)'\s*\)/g;
  const reTs = /getLocalizedMessage\(\s*"([^"]+)"|getLocalizedMessage\(\s*'([^']+)'/g;

  for (const file of targets) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = rePhp.exec(text))) {
      used.add(match[1] || match[2]);
    }
    while ((match = reTs.exec(text))) {
      used.add(match[1] || match[2]);
    }
  }

  return [...used].filter((key) => !baseKeySet.has(key)).sort();
}

function findLanguageParityMissing(baseKeys) {
  const files = fs.readdirSync(langsDir)
    .filter((name) => /^lang-.*\.json$/.test(name))
    .sort();

  const result = [];
  for (const file of files) {
    const filePath = path.join(langsDir, file);
    const data = readJson(filePath);
    const missing = baseKeys.filter((key) => !Object.prototype.hasOwnProperty.call(data, key));
    if (missing.length > 0) {
      result.push({ file, missing });
    }
  }
  return result;
}

const base = readJson(basePath);
const baseKeys = Object.keys(base);
const baseKeySet = new Set(baseKeys);

const sourceUsedMissing = findSourceUsedMissingKeys(baseKeySet);
const languageMissing = findLanguageParityMissing(baseKeys);

let hasError = false;

if (sourceUsedMissing.length > 0) {
  hasError = true;
  console.error('Source-used keys missing in assets/langs/lang.json:');
  for (const key of sourceUsedMissing) {
    console.error(` - ${key}`);
  }
}

if (languageMissing.length > 0) {
  hasError = true;
  console.error('Language files missing keys defined in assets/langs/lang.json:');
  for (const item of languageMissing) {
    console.error(` - ${item.file}: ${item.missing.length} missing`);
    for (const key of item.missing) {
      console.error(`   * ${key}`);
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log('i18n coverage check passed.');
