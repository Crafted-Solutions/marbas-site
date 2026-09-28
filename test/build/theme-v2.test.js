/**
 * Smoke test (Task 127): Base v2 — family class on <body>, palette preset on <html>, theme.colors
 * appended to theme.css; classic projects only gain the family class.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../../src/cli/bin.js');
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', timeout: 180_000 });

const V2_THEME = `/* theme-probe — @family v2 */
:root { --p-paper: #f8f8f5; --p-ink: #252d2a; --p-muted: #53615b; --p-line: #cdd8d1; --p-accent: #234b45; --p-accent-soft: #e8efea; --p-alert: #7e332f; --p-alert-soft: #f6eeeb; }
:root[data-palette="nacht"] { --p-paper: #12172a; --p-ink: #ecebe4; --p-muted: #a9adbb; --p-accent: #d9b25f; --p-accent-soft: #1b2240; }
`;

function setTheme(projectPath, theme) {
  const file = path.join(projectPath, 'marbas-project.json');
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  cfg.theme = { ...cfg.theme, ...theme };
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
}

test('base v2: family class, palette preset, colour overrides; classic unchanged apart from the class', { timeout: 360_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-v2-'));
  try {
    const v2 = path.join(tmp, 'v2');
    assert.equal(run(['init', v2]).status, 0);
    fs.mkdirSync(path.join(v2, '_theme'), { recursive: true });
    fs.writeFileSync(path.join(v2, '_theme', 'theme-probe.css'), V2_THEME);
    setTheme(v2, { id: 'theme-probe', palette: 'nacht', colors: { accent: '#e0c070', ink: 'red; } body {' } });
    const build = run(['build', v2, '--env=development']);
    assert.equal(build.status, 0, build.stderr);
    const out = path.join(v2, 'build', 'public_development');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.match(html, /<html lang="de" data-palette="nacht">/);
    assert.match(html, /<body class="c-page c-page--v2">/);
    const css = fs.readFileSync(path.join(out, '_assets', 'css', 'theme.css'), 'utf8');
    assert.match(css, /--p-accent: #e0c070;/);
    assert.doesNotMatch(css, /body \{/, 'invalid colour must not reach the CSS');
    assert.match(build.stdout + build.stderr, /theme\.colors\.ink: "red; \} body \{" ist keine Farbe/);

    const classic = path.join(tmp, 'classic');
    assert.equal(run(['init', classic, '--theme=theme-slate']).status, 0);
    assert.equal(run(['build', classic, '--env=development']).status, 0);
    const chtml = fs.readFileSync(path.join(classic, 'build', 'public_development', 'index.html'), 'utf8');
    assert.match(chtml, /<html lang="de">/);
    assert.match(chtml, /<body class="c-page c-page--classic">/);
    const ccss = fs.readFileSync(path.join(classic, 'build', 'public_development', '_assets', 'css', 'theme.css'), 'utf8');
    assert.equal(ccss, fs.readFileSync(path.resolve(__dirname, '../../themes/theme-slate.css'), 'utf8'), 'classic theme.css is copied unchanged');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
