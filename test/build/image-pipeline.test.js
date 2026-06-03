/**
 * Smoke test: image pipeline writes processed images to the correct output
 * directory and NOT to the project root.
 *
 * Regression for the publishFolder bug where missing marbas-project.json
 * caused processed images to land in ./images/ (project root) instead of
 * build/public_development/images/.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');

function run(args, opts = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    timeout: opts.timeout ?? 180_000,
    ...opts
  });
}

test('image pipeline: processed webp files land in build output, not project root', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-img-pipeline-'));
  const projectPath = path.join(tmp, 'site');

  try {
    // Init starter project — starter pages contain image components
    const init = run(['init', projectPath, '--starter']);
    assert.equal(init.status, 0, `init failed:\n${init.stderr}`);

    // Build development
    const build = run(['build', projectPath, '--env=development']);
    assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);

    const outputDir = path.join(projectPath, 'build', 'public_development');

    // Processed images must be inside the build output
    const imagesDir = path.join(outputDir, 'images');
    assert.ok(fs.existsSync(imagesDir), `Expected processed images dir at ${imagesDir}`);

    const webpFiles = fs.readdirSync(imagesDir).filter((f) => f.endsWith('.webp'));
    assert.ok(webpFiles.length > 0, 'Expected at least one .webp file in build/public_development/images/');

    // Regression: images must NOT appear in the project root
    const rootImagesDir = path.join(projectPath, 'images');
    assert.ok(
      !fs.existsSync(rootImagesDir),
      `images/ must not exist in project root (publishFolder bug regression). Found: ${rootImagesDir}`
    );

    // HTML must reference /images/ paths, not broken relative paths
    const indexHtml = path.join(outputDir, 'index.html');
    assert.ok(fs.existsSync(indexHtml), 'index.html must exist');

    const html = fs.readFileSync(indexHtml, 'utf8');
    assert.ok(html.includes('/images/'), 'index.html must reference /images/ paths');
    assert.ok(!html.includes('src="images/'), 'image src must not be a bare relative path');

  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
});
