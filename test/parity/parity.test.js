import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkParity } from './run-parity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../fixtures');

const fixtures = [
  { name: 'parity-minimal', description: 'default layout, one page, default theme' },
  { name: 'parity-with-eject', description: 'ejected base.njk + Hero component' },
  { name: 'parity-external-css', description: 'cssMode: external with ejected layout' }
];

for (const { name, description } of fixtures) {
  test(`parity: ${name} (${description}) — builds are deterministic`, async () => {
    const result = await checkParity(path.join(FIXTURES, name));

    for (const line of result.log) console.log(line);

    assert.equal(
      result.unexpectedDivergent.length,
      0,
      `Unexpected divergences in ${name}:\n${result.unexpectedDivergent.map((f) => `  - ${f}`).join('\n')}`
    );

    assert.ok(
      result.identical.length > 0,
      `No identical files found in ${name} — build may have failed`
    );
  });
}
