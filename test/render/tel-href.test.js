import { test } from 'node:test';
import assert from 'node:assert/strict';
import { telHref } from '../../src/render/filters/html.js';

test('telHref keeps a leading + and digits only', () => {
  assert.equal(telHref('030 / 4737 8115'), '03047378115');
  assert.equal(telHref('0171/1234567'), '01711234567');
  assert.equal(telHref('+49 30 4737-8115'), '+493047378115');
});

test('telHref drops the (0) trunk prefix of international notation', () => {
  assert.equal(telHref('+49 (0)30 123-45'), '+493012345');
  assert.equal(telHref('+49 (0) 30 4737-8115'), '+493047378115');
});

test('telHref handles empty and malformed input', () => {
  assert.equal(telHref(''), '');
  assert.equal(telHref(null), '');
  assert.equal(telHref('++49 30'), '+4930');
});
