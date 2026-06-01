import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { build } from '../../src/build/build.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLE = path.join(__dirname, '../../examples/basic');
const BUILD_OUTPUT = path.join(EXAMPLE, 'build', 'public_development');

function cleanup() {
  fs.rmSync(path.join(EXAMPLE, 'build'), { recursive: true, force: true });
  fs.rmSync(path.join(EXAMPLE, '.marbas'), { recursive: true, force: true });
}

test('examples/basic: build produces index.html with site title', async () => {
  cleanup();

  await build({ projectPath: EXAMPLE, environment: 'development' });

  const indexHtml = path.join(BUILD_OUTPUT, 'index.html');
  assert.ok(fs.existsSync(indexHtml), `index.html not found at ${indexHtml}`);

  const content = fs.readFileSync(indexHtml, 'utf8');
  assert.ok(content.includes('Marbas Basic Example'), 'site title not found in output HTML');

  cleanup();
});

test('examples/basic: build produces showcase page', async () => {
  cleanup();

  await build({ projectPath: EXAMPLE, environment: 'development' });

  const showcaseHtml = path.join(BUILD_OUTPUT, 'showcase', 'index.html');
  assert.ok(fs.existsSync(showcaseHtml), `showcase/index.html not found at ${showcaseHtml}`);

  cleanup();
});
