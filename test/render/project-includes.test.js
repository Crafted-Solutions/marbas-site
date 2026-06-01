import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { build } from '../../src/build/build.js';

// Uses parity-with-eject fixture which has:
//   _includes/base.njk     — ejected layout (project override via _includes/)
//   _includes/project-banner.njk  — project-only include used inside base.njk
const FIXTURE_SRC = path.resolve(import.meta.dirname, '../fixtures/parity-with-eject');

let tmpProject;

describe('project includes smoke test', () => {
  before(async () => {
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-project-includes-'));
    fs.cpSync(FIXTURE_SRC, tmpProject, { recursive: true });
    await build({ projectPath: tmpProject, environment: 'development' });
  });

  after(() => {
    fs.rmSync(tmpProject, { recursive: true, force: true });
  });

  it('ejected layout (_includes/base.njk) is used instead of lib version', () => {
    // The ejected base.njk includes project-banner.njk — if ejected layout is active,
    // the project-banner sentinel will appear in the output.
    const html = fs.readFileSync(
      path.join(tmpProject, 'build/public_development/index.html'),
      'utf8'
    );
    assert.ok(html.includes('project-banner'), 'ejected base.njk should be used (renders project-banner)');
  });

  it('project-only include (project-banner.njk) renders correctly', () => {
    const html = fs.readFileSync(
      path.join(tmpProject, 'build/public_development/index.html'),
      'utf8'
    );
    assert.ok(
      html.includes('Parity-With-Eject Projekt-Include'),
      'project-banner.njk content should appear in output'
    );
  });

  it('site chrome shortcodes still render in ejected layout', () => {
    const html = fs.readFileSync(
      path.join(tmpProject, 'build/public_development/index.html'),
      'utf8'
    );
    assert.ok(html.includes('<header'), 'ejected layout: <header should be rendered');
    assert.ok(html.includes('<footer'), 'ejected layout: <footer should be rendered');
    assert.ok(html.includes('<meta name="title"'), 'ejected layout: meta tags should be rendered');
  });
});
