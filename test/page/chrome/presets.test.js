import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { getHeaderPresetTemplate, getFooterPresetTemplate, VALID_HEADER_PRESETS, VALID_FOOTER_PRESETS } from '../../../src/page/chrome/presets.js';

describe('getHeaderPresetTemplate', () => {
  it('returns a path for each valid header preset', () => {
    for (const preset of VALID_HEADER_PRESETS) {
      const tmpl = getHeaderPresetTemplate(preset);
      assert.ok(tmpl.endsWith(`${preset}.njk`), `Expected path to end with ${preset}.njk`);
      assert.ok(fs.existsSync(tmpl), `Template file should exist: ${tmpl}`);
    }
  });

  it('throws for unknown header preset', () => {
    assert.throws(() => getHeaderPresetTemplate('mega-nav'), /unknown header preset/i);
  });

  it('throws for empty preset', () => {
    assert.throws(() => getHeaderPresetTemplate(''), /unknown header preset/i);
  });
});

describe('getFooterPresetTemplate', () => {
  it('returns a path for each valid footer preset', () => {
    for (const preset of VALID_FOOTER_PRESETS) {
      const tmpl = getFooterPresetTemplate(preset);
      assert.ok(tmpl.endsWith(`${preset}.njk`), `Expected path to end with ${preset}.njk`);
      assert.ok(fs.existsSync(tmpl), `Template file should exist: ${tmpl}`);
    }
  });

  it('throws for unknown footer preset', () => {
    assert.throws(() => getFooterPresetTemplate('mega-footer'), /unknown footer preset/i);
  });
});

describe('VALID_HEADER_PRESETS / VALID_FOOTER_PRESETS', () => {
  it('header presets are frozen', () => {
    assert.ok(Object.isFrozen(VALID_HEADER_PRESETS));
  });

  it('footer presets are frozen', () => {
    assert.ok(Object.isFrozen(VALID_FOOTER_PRESETS));
  });

  it('has 4 header presets', () => {
    assert.equal(VALID_HEADER_PRESETS.length, 4);
  });

  it('has 5 footer presets', () => {
    assert.equal(VALID_FOOTER_PRESETS.length, 5);
  });
});
