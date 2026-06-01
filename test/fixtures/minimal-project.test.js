import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { build } from '../../src/build/build.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'minimal-project');
const BUILD_OUTPUT = path.join(FIXTURE, 'build', 'public_development');
const BUILD_CONTEXT = path.join(FIXTURE, '.marbas', 'build-context');

function cleanup() {
  fs.rmSync(path.join(FIXTURE, 'build'), { recursive: true, force: true });
  fs.rmSync(BUILD_CONTEXT, { recursive: true, force: true });
  fs.rmSync(path.join(FIXTURE, '_webpack'), { recursive: true, force: true });
}

test('minimal-project: build produces index.html with site title', async () => {
  cleanup();

  await build({ projectPath: FIXTURE, environment: 'development' });

  const indexHtml = path.join(BUILD_OUTPUT, 'index.html');
  assert.ok(fs.existsSync(indexHtml), `index.html not found at ${indexHtml}`);

  const content = fs.readFileSync(indexHtml, 'utf8');
  assert.ok(content.includes('minimal-project'), 'site title not found in output HTML');

  cleanup();
});
