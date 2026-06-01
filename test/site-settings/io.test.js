import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { readSiteSettings, saveSiteSettings } from '../../src/site-settings/io.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

let tmpDir;

function makeProject(base) {
  const dir = fs.mkdtempSync(path.join(base, 'proj-'));
  fs.mkdirSync(path.join(dir, 'pages', '_data'), { recursive: true });
  return dir;
}

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-io-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readSiteSettings', () => {
  it('returns ok:false when pagesDir does not exist', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'no-pages-'));
    const result = readSiteSettings(dir, {});
    assert.equal(result.ok, false);
    assert.ok(result.error);
  });

  it('returns defaults when site.json does not exist', () => {
    const dir = makeProject(tmpDir);
    const result = readSiteSettings(dir, {});
    assert.equal(result.ok, true);
    assert.ok(result.site.title);
    assert.equal(result.site.header.preset, 'brand-nav');
  });

  it('reads and normalizes a full site.json fixture', () => {
    const dir = makeProject(tmpDir);
    const fixture = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'full-site.json'), 'utf8'));
    fs.writeFileSync(path.join(dir, 'pages', '_data', 'site.json'), JSON.stringify(fixture, null, 2), 'utf8');

    const result = readSiteSettings(dir, {});
    assert.equal(result.ok, true);
    assert.equal(result.site.title, 'Muster GmbH');
    assert.equal(result.site.header.preset, 'brand-nav-actions');
    assert.equal(result.site.footer.variant, 'accent');
  });

  it('reads and normalizes legacy fixture with address/links migration', () => {
    const dir = makeProject(tmpDir);
    const fixture = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'legacy-site.json'), 'utf8'));
    fs.writeFileSync(path.join(dir, 'pages', '_data', 'site.json'), JSON.stringify(fixture, null, 2), 'utf8');

    const result = readSiteSettings(dir, {});
    assert.equal(result.ok, true);
    assert.equal(result.site.footer.contact.address.street, 'Altstraße 5');
    assert.equal(result.site.footer.bottomLinks.links[0].href, '/impressum/');
  });

  it('returns error when site.json is invalid JSON', () => {
    const dir = makeProject(tmpDir);
    fs.writeFileSync(path.join(dir, 'pages', '_data', 'site.json'), '{ bad json }', 'utf8');

    const result = readSiteSettings(dir, {});
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('could not be read'));
  });

  it('preserves _schema block on read', () => {
    const dir = makeProject(tmpDir);
    const siteWithSchema = { title: 'Test', _schema: { title: { widget: 'text' } } };
    fs.writeFileSync(path.join(dir, 'pages', '_data', 'site.json'), JSON.stringify(siteWithSchema), 'utf8');

    const result = readSiteSettings(dir, {});
    assert.equal(result.ok, true);
    assert.ok(result.site._schema);
    assert.equal(result.site._schema.title.widget, 'text');
  });

  it('uses custom pagesDir from config', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'custom-pages-'));
    fs.mkdirSync(path.join(dir, 'content', '_data'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'content', '_data', 'site.json'),
      JSON.stringify({ title: 'Custom Pages' }),
      'utf8'
    );

    const result = readSiteSettings(dir, { paths: { pagesDir: './content' } });
    assert.equal(result.ok, true);
    assert.equal(result.site.title, 'Custom Pages');
  });
});

describe('saveSiteSettings', () => {
  it('returns ok:false when pagesDir does not exist', () => {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'no-pages-save-'));
    const result = saveSiteSettings(dir, {}, { title: 'Test' });
    assert.equal(result.ok, false);
  });

  it('saves valid settings and returns ok:true', () => {
    const dir = makeProject(tmpDir);
    const result = saveSiteSettings(dir, {}, { title: 'Saved Site' });
    assert.equal(result.ok, true);
    assert.equal(result.site.title, 'Saved Site');
    assert.ok(fs.existsSync(result.filePath));
  });

  it('returns ok:false for invalid settings (missing title)', () => {
    const dir = makeProject(tmpDir);
    const result = saveSiteSettings(dir, {}, { title: '' });
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
  });

  it('round-trip: read → save → read gives identical normalized object', () => {
    const dir = makeProject(tmpDir);
    const fixture = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'full-site.json'), 'utf8'));
    fs.writeFileSync(path.join(dir, 'pages', '_data', 'site.json'), JSON.stringify(fixture, null, 2), 'utf8');

    const first = readSiteSettings(dir, {});
    assert.equal(first.ok, true);

    const saved = saveSiteSettings(dir, {}, first.site);
    assert.equal(saved.ok, true);

    const second = readSiteSettings(dir, {});
    assert.equal(second.ok, true);
    assert.deepEqual(first.site, second.site);
  });

  it('preserves _schema block through save', () => {
    const dir = makeProject(tmpDir);
    const schema = { title: { widget: 'text', required: true } };
    const siteWithSchema = { title: 'Schema Site', _schema: schema };
    fs.writeFileSync(path.join(dir, 'pages', '_data', 'site.json'), JSON.stringify(siteWithSchema), 'utf8');

    const readResult = readSiteSettings(dir, {});
    const saveResult = saveSiteSettings(dir, {}, readResult.site);
    assert.equal(saveResult.ok, true);

    const reread = readSiteSettings(dir, {});
    assert.ok(reread.site._schema);
    assert.equal(reread.site._schema.title.widget, 'text');
  });
});
