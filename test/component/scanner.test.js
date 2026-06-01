import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { scanComponent, scanAllComponents } from '../../src/component/scanner.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-scanner-'));
}

function makeComponent(parentDir, name, { template = false, api = [], client = [], buildHook = false, schema = false, ai = false } = {}) {
  const compDir = path.join(parentDir, name);
  fs.mkdirSync(compDir, { recursive: true });

  if (template) fs.writeFileSync(path.join(compDir, `${name}.njk`), `<!-- ${name} -->`);
  if (buildHook) fs.writeFileSync(path.join(compDir, 'build.js'), 'export default async function() {}');
  if (schema) fs.writeFileSync(path.join(compDir, 'schema.json'), '{}');
  if (ai) fs.writeFileSync(path.join(compDir, 'ai.json'), '{}');

  if (api.length > 0) {
    fs.mkdirSync(path.join(compDir, '_api'), { recursive: true });
    for (const file of api) {
      fs.writeFileSync(path.join(compDir, '_api', file), `// ${file}`);
    }
  }

  if (client.length > 0) {
    fs.mkdirSync(path.join(compDir, 'client'), { recursive: true });
    for (const file of client) {
      fs.writeFileSync(path.join(compDir, 'client', file), `// ${file}`);
    }
  }

  return compDir;
}

test('scanComponent — template only', () => {
  const tmp = makeTmpDir();
  const compDir = makeComponent(tmp, 'Hero', { template: true });

  const result = scanComponent(compDir);

  assert.equal(result.name, 'Hero');
  assert.ok(result.templatePath?.endsWith('Hero.njk'));
  assert.equal(result.apiFiles.length, 0);
  assert.equal(result.clientFiles.length, 0);
  assert.equal(result.buildHookPath, null);
  assert.equal(result.schemaPath, null);
  assert.equal(result.aiPath, null);

  fs.rmSync(tmp, { recursive: true });
});

test('scanComponent — full capabilities', () => {
  const tmp = makeTmpDir();
  const compDir = makeComponent(tmp, 'Search', {
    template: true,
    api: ['index.js'],
    client: ['search.js', 'search.css'],
    buildHook: true,
    schema: true,
    ai: true
  });

  const result = scanComponent(compDir);

  assert.equal(result.name, 'Search');
  assert.ok(result.templatePath !== null);
  assert.equal(result.apiFiles.length, 1);
  assert.ok(result.apiDir !== null);
  assert.equal(result.clientFiles.length, 2);
  assert.ok(result.buildHookPath !== null);
  assert.ok(result.schemaPath !== null);
  assert.ok(result.aiPath !== null);

  fs.rmSync(tmp, { recursive: true });
});

test('scanComponent — partial: no template', () => {
  const tmp = makeTmpDir();
  const compDir = makeComponent(tmp, 'Util', { buildHook: true });

  const result = scanComponent(compDir);

  assert.equal(result.templatePath, null);
  assert.ok(result.buildHookPath !== null);

  fs.rmSync(tmp, { recursive: true });
});

test('scanComponent — no _api → apiDir is null', () => {
  const tmp = makeTmpDir();
  const compDir = makeComponent(tmp, 'Nav', { template: true });

  const result = scanComponent(compDir);

  assert.equal(result.apiDir, null);
  assert.equal(result.apiFiles.length, 0);

  fs.rmSync(tmp, { recursive: true });
});

test('scanAllComponents — project component overrides lib (complete)', () => {
  const tmp = makeTmpDir();
  const projectRoot = path.join(tmp, 'project');
  const libRoot = path.join(tmp, 'lib');

  // Project components live in _components/; lib built-ins in _includes/components/.
  const libComponents = path.join(libRoot, '_includes', 'components');
  fs.mkdirSync(path.join(projectRoot, '_components'), { recursive: true });
  fs.mkdirSync(libComponents, { recursive: true });

  // Same name in both — project wins
  makeComponent(path.join(projectRoot, '_components'), 'Header', { template: true });
  makeComponent(libComponents, 'Header', { template: true, buildHook: true });
  // Lib-only component
  makeComponent(libComponents, 'Footer', { template: true });

  const components = scanAllComponents({ projectRoot, libRoot });

  assert.equal(components.length, 2);

  const header = components.find((c) => c.name === 'Header');
  assert.ok(header);
  // Project version: no build hook
  assert.equal(header.buildHookPath, null);
  assert.ok(header.componentDir.includes('project'));

  const footer = components.find((c) => c.name === 'Footer');
  assert.ok(footer);
  assert.ok(footer.componentDir.includes('lib'));

  fs.rmSync(tmp, { recursive: true });
});

test('scanAllComponents — no _components dirs → empty array', () => {
  const tmp = makeTmpDir();
  const components = scanAllComponents({ projectRoot: tmp, libRoot: tmp });
  assert.equal(components.length, 0);
  fs.rmSync(tmp, { recursive: true });
});

test('scanComponent — client files: only js and css included', () => {
  const tmp = makeTmpDir();
  const compDir = path.join(tmp, 'Widget');
  fs.mkdirSync(path.join(compDir, 'client'), { recursive: true });
  fs.writeFileSync(path.join(compDir, 'client', 'widget.js'), '');
  fs.writeFileSync(path.join(compDir, 'client', 'widget.css'), '');
  fs.writeFileSync(path.join(compDir, 'client', 'data.json'), '{}');

  const result = scanComponent(compDir);

  assert.equal(result.clientFiles.length, 2);
  assert.ok(result.clientFiles.every((f) => /\.(js|css)$/.test(f)));

  fs.rmSync(tmp, { recursive: true });
});
