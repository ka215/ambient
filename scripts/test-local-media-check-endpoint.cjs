const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourcePath = join(__dirname, '..', 'src', 'scripts', 'platform', 'local-media-check-endpoint.ts');
const source = readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const sandbox = {
  exports: {},
  URL,
  window: { location: { href: 'http://example.test/amp/' } },
};

vm.runInNewContext(transpiled, sandbox, { filename: sourcePath });

const { resolveLocalMediaCheckEndpointFromHref } = sandbox.exports;

const cases = [
  ['http://dev2.ka2.org/amp/', 'http://dev2.ka2.org/amp/local-media-check'],
  ['http://dev2.ka2.org/amp', 'http://dev2.ka2.org/amp/local-media-check'],
  ['http://dev2.ka2.org/amp/index.php', 'http://dev2.ka2.org/amp/local-media-check'],
  ['http://dev2.ka2.org/amp/index.php?lang=ja', 'http://dev2.ka2.org/amp/local-media-check'],
  ['https://dev-amp.ka2.org/index.php', 'https://dev-amp.ka2.org/local-media-check'],
  ['http://127.0.0.1:8087/index.php', 'http://127.0.0.1:8087/local-media-check'],
  ['http://dev2.ka2.org/amp/index.php/local-media-check', 'http://dev2.ka2.org/amp/local-media-check'],
];

for (const [input, expected] of cases) {
  const actual = resolveLocalMediaCheckEndpointFromHref(input);
  if (actual !== expected) {
    console.error(`Expected ${expected} for ${input}, got ${actual}`);
    process.exit(1);
  }
}

console.log(`local media check endpoint tests passed (${cases.length})`);
