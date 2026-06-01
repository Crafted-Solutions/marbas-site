import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReport } from '../../src/doctor/index.js';

const SAMPLE_CHECKS = [
  { id: 'version', status: 'ok', message: 'Version 0.0.1 matches project' },
  { id: 'environments', status: 'warn', message: 'defaultEnvironment not set' },
  { id: 'css-mode', status: 'error', message: 'Something is broken' },
];

test('formatReport: human output contains symbols', () => {
  const out = formatReport({ checks: SAMPLE_CHECKS, hasError: true }, { color: false });
  assert.ok(out.includes('✓'));
  assert.ok(out.includes('⚠'));
  assert.ok(out.includes('✗'));
});

test('formatReport: human output groups errors first', () => {
  const out = formatReport({ checks: SAMPLE_CHECKS, hasError: true }, { color: false });
  const errorIdx = out.indexOf('✗');
  const okIdx = out.indexOf('✓');
  assert.ok(errorIdx < okIdx, 'errors should appear before ok');
});

test('formatReport: color=false produces no ANSI codes', () => {
  const out = formatReport({ checks: SAMPLE_CHECKS, hasError: true }, { color: false });
  assert.ok(!out.includes('\x1b['));
});

test('formatReport: color=true includes ANSI codes', () => {
  const out = formatReport({ checks: SAMPLE_CHECKS, hasError: true }, { color: true });
  assert.ok(out.includes('\x1b['));
});

test('runDoctor JSON output: all fields present', async () => {
  const { runDoctor } = await import('../../src/doctor/index.js');
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  const tmp = fs.default.mkdtempSync(path.default.join(os.default.tmpdir(), 'marbas-doctor-report-'));
  const projectPath = path.default.join(tmp, 'project');
  fs.default.mkdirSync(path.default.join(projectPath, '.marbas'), { recursive: true });
  fs.default.writeFileSync(path.default.join(projectPath, 'marbas-project.json'), JSON.stringify({
    marbasSite: '0.0.1',
    environments: { development: { baseUrl: 'http://localhost' } },
    defaultEnvironment: 'development',
  }));

  const report = runDoctor({ projectPath });
  const json = JSON.stringify(report.checks);
  const parsed = JSON.parse(json);

  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.length > 0);
  assert.ok(parsed.every((c) => c.id && c.status && c.message));

  fs.default.rmSync(tmp, { recursive: true });
});
