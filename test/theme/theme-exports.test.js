import test from 'node:test';
import assert from 'node:assert/strict';
import * as theme from '../../src/theme/index.js';

// Task 141: palette/layout logic is public API of `@crafted.solutions/marbas-site/theme` (used by the app's theme dialog)
test('theme entry point exports the Base v2 palette and layout functions', () => {
  for (const name of ['readThemeFamily', 'readPalettePresets', 'readPaletteValues', 'normalizePaletteConfig',
    'paletteContrastWarnings', 'contrastRatio', 'readThemeLayout']) {
    assert.equal(typeof theme[name], 'function', name);
  }
  assert.ok(theme.PALETTE_KEYS.includes('surface'));
  assert.deepEqual(theme.LAYOUT_OPTIONS.rail, ['top', 'side']);
});
