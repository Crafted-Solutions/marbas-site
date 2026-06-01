/**
 * Parity check: builds a fixture twice and verifies output is deterministic.
 *
 * Background: Since Task 30, both App and CLI invoke the same marbas-site
 * build() function. App parity is therefore guaranteed by construction — the
 * code paths are identical. This script verifies the complementary property:
 * that the shared build() function is deterministic across runs, so that
 * byte-identical output can be promised regardless of which surface triggers it.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { build } from '../../src/build/build.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIVERGENCES_FILE = path.join(__dirname, 'expected-divergences.json');

function loadAllowList() {
  const data = JSON.parse(fs.readFileSync(DIVERGENCES_FILE, 'utf8'));
  return data.patterns ?? [];
}

function isAllowListed(relPath, patterns) {
  return patterns.some(({ glob }) => path.matchesGlob(relPath, glob));
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function collectHashes(dir, base = dir) {
  const result = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) {
      Object.assign(result, collectHashes(full, base));
    } else {
      result[rel] = hashFile(full);
    }
  }
  return result;
}

function cleanup(fixtureDir) {
  fs.rmSync(path.join(fixtureDir, 'build'), { recursive: true, force: true });
  fs.rmSync(path.join(fixtureDir, '.marbas'), { recursive: true, force: true });
}

/**
 * Run parity check for a single fixture.
 *
 * @param {string} fixtureDir  Absolute path to fixture directory
 * @returns {{ fixture, status, identical, explainedDivergent, unexpectedDivergent, log }}
 */
export async function checkParity(fixtureDir) {
  const fixtureName = path.basename(fixtureDir);
  const outputDir = path.join(fixtureDir, 'build', 'public_development');
  const allowList = loadAllowList();
  const log = [];

  cleanup(fixtureDir);

  log.push(`[${fixtureName}] Build 1/2...`);
  await build({ projectPath: fixtureDir, environment: 'development' });
  const hashes1 = collectHashes(outputDir);
  log.push(`[${fixtureName}] Build 1 produced ${Object.keys(hashes1).length} files`);

  cleanup(fixtureDir);

  log.push(`[${fixtureName}] Build 2/2...`);
  await build({ projectPath: fixtureDir, environment: 'development' });
  const hashes2 = collectHashes(outputDir);
  log.push(`[${fixtureName}] Build 2 produced ${Object.keys(hashes2).length} files`);

  cleanup(fixtureDir);

  const allPaths = new Set([...Object.keys(hashes1), ...Object.keys(hashes2)]);
  const identical = [];
  const explainedDivergent = [];
  const unexpectedDivergent = [];

  for (const relPath of allPaths) {
    const h1 = hashes1[relPath];
    const h2 = hashes2[relPath];

    if (h1 === h2) {
      identical.push(relPath);
    } else if (isAllowListed(relPath, allowList)) {
      explainedDivergent.push(relPath);
    } else {
      unexpectedDivergent.push(relPath);
    }
  }

  const status = unexpectedDivergent.length === 0 ? 'ok' : 'fail';

  log.push(`[${fixtureName}] identical=${identical.length} explained=${explainedDivergent.length} unexpected=${unexpectedDivergent.length} → ${status}`);
  if (unexpectedDivergent.length > 0) {
    for (const f of unexpectedDivergent) {
      log.push(`  UNEXPECTED DIVERGENCE: ${f}`);
    }
  }

  return { fixture: fixtureName, status, identical, explainedDivergent, unexpectedDivergent, log };
}

/**
 * Run parity checks for all three fixtures and write REPORT.md.
 */
export async function runAllParity() {
  const fixturesRoot = path.join(__dirname, '../fixtures');
  const fixtures = ['parity-minimal', 'parity-with-eject', 'parity-external-css'];
  const results = [];

  for (const name of fixtures) {
    const dir = path.join(fixturesRoot, name);
    const result = await checkParity(dir);
    results.push(result);
    for (const line of result.log) console.log(line);
  }

  writeReport(results);
  return results;
}

function writeReport(results) {
  const date = new Date().toISOString().slice(0, 10);
  const overall = results.every((r) => r.status === 'ok') ? 'PASS' : 'FAIL';
  const lines = [
    `# Parity Report`,
    ``,
    `Date: ${date}  `,
    `Overall: **${overall}**`,
    ``,
    `## Background`,
    ``,
    `Since Task 30, both App and CLI invoke the same \`marbas-site\` \`build()\` function.`,
    `App/CLI parity is guaranteed by construction — the code paths are identical.`,
    `This report verifies the complementary property: build determinism (two sequential`,
    `builds of the same fixture produce byte-identical output).`,
    ``,
    `## Results`,
    ``
  ];

  for (const r of results) {
    lines.push(`### ${r.fixture} — ${r.status.toUpperCase()}`);
    lines.push(``);
    lines.push(`| Category | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Identical | ${r.identical.length} |`);
    lines.push(`| Explained divergent | ${r.explainedDivergent.length} |`);
    lines.push(`| **Unexpected divergent** | **${r.unexpectedDivergent.length}** |`);
    lines.push(``);
    if (r.unexpectedDivergent.length > 0) {
      lines.push(`**Unexpected divergences:**`);
      for (const f of r.unexpectedDivergent) lines.push(`- \`${f}\``);
      lines.push(``);
    }
  }

  const reportPath = path.join(__dirname, 'REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`Report written to ${reportPath}`);
}
