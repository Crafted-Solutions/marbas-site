import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { build } from '../../src/build/build.js';

const FIXTURE_SRC = path.resolve(import.meta.dirname, '../fixtures/parity-minimal');

// Build into a tmp copy so this test doesn't conflict with parity tests running in parallel
let tmpProject;

describe('site-chrome shortcodes (smoke)', () => {
  before(async () => {
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-site-chrome-'));
    fs.cpSync(FIXTURE_SRC, tmpProject, { recursive: true });
    await build({ projectPath: tmpProject, environment: 'development' });
  });

  after(() => {
    fs.rmSync(tmpProject, { recursive: true, force: true });
  });

  it('renders <header> via {% siteHeader %}', () => {
    const html = fs.readFileSync(path.join(tmpProject, 'build/public_development/index.html'), 'utf8');
    assert.ok(html.includes('<header'), 'output should contain <header');
  });

  it('renders <footer> via {% siteFooter %}', () => {
    const html = fs.readFileSync(path.join(tmpProject, 'build/public_development/index.html'), 'utf8');
    assert.ok(html.includes('<footer'), 'output should contain <footer');
  });

  it('renders meta tags via {% siteMeta %}', () => {
    const html = fs.readFileSync(path.join(tmpProject, 'build/public_development/index.html'), 'utf8');
    assert.ok(html.includes('<meta name="robots"'), 'output should contain robots meta');
    assert.ok(html.includes('<meta name="title"'), 'output should contain title meta');
  });

  it('renders CSS/JS assets via {% siteHeadAssets %}', () => {
    const html = fs.readFileSync(path.join(tmpProject, 'build/public_development/index.html'), 'utf8');
    assert.ok(html.includes('main.bundle.js'), 'output should reference main.bundle.js');
  });
});
