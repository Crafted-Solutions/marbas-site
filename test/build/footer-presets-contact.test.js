/**
 * Smoke test (Task 111): every footer preset renders footer.contact, and the tel: link
 * contains only "+" and digits. Before, the columns* presets silently dropped the contact.
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
const PRESETS = ['simple', 'columns', 'columns-social', 'columns-cta', 'editorial'];

test('all footer presets render contact with a clean tel: link', { timeout: 600_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-footer-'));
  const projectPath = path.join(tmp, 'site');
  try {
    assert.equal(run(['init', projectPath, '--starter']).status, 0, 'init failed');
    const siteJsonPath = path.join(projectPath, 'pages', '_data', 'site.json');
    const base = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));

    for (const preset of PRESETS) {
      const siteJson = structuredClone(base);
      siteJson.footer = {
        ...siteJson.footer,
        preset,
        contact: { phone: '030 / 4737 8115', email: 'praxis@example.com', address: { street: 'Musterstr. 1', zip: '10115', city: 'Berlin' } },
        groups: [{ title: 'Praxis', source: 'manual', links: [{ label: 'Team', href: '/team/' }] }],
        socialLinks: [{ platform: 'instagram', label: 'Instagram', href: 'https://instagram.com/x' }],
        ctaBlock: { enabled: true, title: 'Termin', text: 'Jetzt anfragen', label: 'Kontakt', href: '/kontakt/' }
      };
      fs.writeFileSync(siteJsonPath, JSON.stringify(siteJson, null, 2));
      const build = run(['build', projectPath, '--env=development']);
      assert.equal(build.status, 0, `${preset}: build failed\n${build.stderr}`);
      const html = fs.readFileSync(path.join(projectPath, 'build', 'public_development', 'index.html'), 'utf8');
      assert.ok(html.includes(`c-footer--${preset}`), `${preset}: preset class`);
      assert.ok(html.includes('c-footer-contact__address'), `${preset}: address rendered`);
      assert.match(html, /<span>Musterstr\. 1<\/span><br><span>10115 Berlin<\/span>/, `${preset}: address lines separated`);
      assert.ok(html.includes('href="tel:03047378115"'), `${preset}: clean tel: link`);
      assert.ok(html.includes('href="mailto:praxis@example.com"'), `${preset}: mailto link`);
      if (['columns-social', 'editorial'].includes(preset)) {
        assert.match(html, /c-footer-social__link--instagram"[\s\S]*?<svg viewBox="0 0 24 24"/, `${preset}: social link has an icon`);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
