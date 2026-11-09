/**
 * Task 212: everything in `_static/` lands unchanged in the site root (dotfiles and subfolders included),
 * `_assets/favicons/` keeps working as a fallback, `_static/` wins on a name clash, and a large file in `_static/`
 * does not trip the production size limit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { legacyRootDirNotice } from '../../src/build/static-dir.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 300_000 });
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

test('legacyRootDirNotice: only when the legacy folder holds real files', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-static-notice-'));
  try {
    assert.equal(legacyRootDirNotice(tmp), null, 'no folder → no notice');
    write(path.join(tmp, '_assets', 'favicons', '.DS_Store'), 'x');
    assert.equal(legacyRootDirNotice(tmp), null, 'system files only → no notice');
    write(path.join(tmp, '_assets', 'favicons', 'favicon.ico'), 'x');
    assert.match(legacyRootDirNotice(tmp), /_assets\/favicons\/ is deprecated.*_static\//);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('_static/ is copied to the site root in development and production', { timeout: 600_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-static-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath]).status, 0, 'init failed');
    const staticDir = path.join(projectPath, '_static');
    const legacyDir = path.join(projectPath, '_assets', 'favicons');
    write(path.join(staticDir, 'robots.txt'), 'User-agent: *\nAllow: /\n');
    write(path.join(staticDir, '.well-known', 'security.txt'), 'Contact: mailto:security@example.com\n');
    write(path.join(staticDir, '.htaccess'), 'Options -Indexes\n');
    write(path.join(staticDir, '.DS_Store'), 'junk');
    write(path.join(staticDir, 'downloads', 'big.pdf'), Buffer.alloc(300_000, 1)); // > 200 KB production limit
    write(path.join(staticDir, 'favicon.ico'), 'from-static'); // overwrites the init favicon
    write(path.join(legacyDir, 'favicon.ico'), 'from-legacy');
    write(path.join(legacyDir, 'legacy-only.txt'), 'legacy');

    for (const env of ['development', 'production']) {
      const build = run(['build', projectPath, `--env=${env}`]);
      assert.equal(build.status, 0, `${env} build failed:\n${build.stdout}\n${build.stderr}`);
      const out = path.join(projectPath, 'build', `public_${env}`);
      const read = (rel) => fs.readFileSync(path.join(out, rel), 'utf8');

      assert.equal(read('robots.txt'), 'User-agent: *\nAllow: /\n', `${env}: robots.txt in the root`);
      assert.match(read('.well-known/security.txt'), /security@example\.com/, `${env}: subfolder + dot folder`);
      assert.equal(read('.htaccess'), 'Options -Indexes\n', `${env}: dotfile copied`);
      assert.equal(fs.existsSync(path.join(out, '.DS_Store')), false, `${env}: .DS_Store not copied`);
      assert.equal(fs.statSync(path.join(out, 'downloads', 'big.pdf')).size, 300_000, `${env}: large file copied`);
      assert.equal(read('favicon.ico'), 'from-static', `${env}: _static/ wins over _assets/favicons/`);
      assert.equal(read('legacy-only.txt'), 'legacy', `${env}: legacy folder still copied`);
      assert.match(`${build.stdout}${build.stderr}`, /_assets\/favicons\/ is deprecated/, `${env}: deprecation hint logged`);
      assert.ok(fs.existsSync(path.join(out, 'index.html')), `${env}: pages still built`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('production still rejects an oversized file in _assets/images', { timeout: 600_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-static-limit-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath]).status, 0, 'init failed');
    write(path.join(projectPath, '_assets', 'images', 'huge.jpg'), Buffer.alloc(300_000, 1));
    const build = run(['build', projectPath, '--env=production']);
    assert.notEqual(build.status, 0, 'the 200 KB limit still guards _assets/');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
