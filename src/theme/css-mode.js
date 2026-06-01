const VALID_CSS_MODES = new Set(['marbas', 'external']);

export function getCssMode(siteSettings) {
  const raw = String(siteSettings?.cssMode || '').trim().toLowerCase();
  return VALID_CSS_MODES.has(raw) ? raw : 'marbas';
}

/**
 * Returns the list of CSS asset hrefs to load in the layout <head>.
 * Paths are relative to the site root (starting with /).
 *
 * @param {object} opts
 * @param {'marbas'|'external'} opts.cssMode
 * @param {string} [opts.themeFile]  e.g. "theme-atlas.css"
 * @returns {string[]}
 */
export function getActiveCssAssets({ cssMode, themeFile = '' }) {
  if (cssMode === 'external') {
    return [];
  }

  const assets = ['/_assets/css/base.full.css'];

  const normalizedTheme = String(themeFile || '').trim();
  if (normalizedTheme) {
    assets.push(`/_assets/css/${normalizedTheme}`);
  }

  assets.push('/_assets/css/_lib/custom.bundle.css');

  return assets;
}
