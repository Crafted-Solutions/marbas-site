/**
 * Base v2 — theme family and palette.
 *
 * Family: a theme is `v2` when its CSS declares `@family v2` in a comment (library and project
 * themes alike); everything else is `classic` (the boxed look, unchanged).
 *
 * Palette (v2 only): a theme ships its default palette (`--p-*`, 8 names + optional `surface` for the
 * `tone: white` band, default #fff — dark palettes must set it) and optional presets as
 * `:root[data-palette="<name>"] { … }`. `marbas-project.json → theme` may pick a preset
 * (`palette: "<name>"`) and override single colours (`colors: { accent: "#…" }`); the overrides are
 * appended to the output theme.css. Only the known names (PALETTE_KEYS) and plain colour values are accepted —
 * the values end up in CSS, so nothing else may pass.
 */

export const PALETTE_KEYS = ['paper', 'ink', 'muted', 'line', 'accent', 'accent-soft', 'alert', 'alert-soft', 'surface'];

/** Optional palette values and the base's fallback when a theme leaves them out. */
export const PALETTE_OPTIONAL_DEFAULTS = Object.freeze({ surface: '#ffffff' });

const FAMILY_MARKER = /@family\s+(v2|classic)\b/;
const PRESET_NAME = /^[a-z0-9][a-z0-9-]{0,31}$/;
const COLOR_VALUE = /^(#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d{1,3}(\s*,\s*|\s+)\d{1,3}(\s*,\s*|\s+)\d{1,3}(\s*[,/]\s*(0|1|0?\.\d+|\d{1,3}%))?\s*\))$/i;

/** @returns {'v2'|'classic'} */
export function readThemeFamily(css) {
  const comments = String(css || '').match(/\/\*[\s\S]*?\*\//g) || [];
  for (const comment of comments) {
    const match = FAMILY_MARKER.exec(comment);
    if (match) return match[1];
  }
  return 'classic';
}

/** Preset names a theme defines (`:root[data-palette="name"]`). */
export function readPalettePresets(css) {
  return [...new Set([...String(css || '').matchAll(/\[data-palette="([a-z0-9-]+)"\]/g)].map((m) => m[1]))];
}

/**
 * Validate `theme.palette` / `theme.colors` from marbas-project.json.
 * @returns {{ preset: string|null, colors: Record<string,string>, errors: string[] }}
 */
export function normalizePaletteConfig(theme = {}) {
  const errors = [];
  let preset = null;
  if (theme.palette != null && theme.palette !== '') {
    if (typeof theme.palette === 'string' && PRESET_NAME.test(theme.palette)) preset = theme.palette;
    else errors.push(`theme.palette "${theme.palette}" ist kein gültiger Preset-Name (a–z, 0–9, "-")`);
  }
  const colors = {};
  if (theme.colors != null) {
    if (typeof theme.colors !== 'object' || Array.isArray(theme.colors)) {
      errors.push('theme.colors muss ein Objekt sein, z.B. { "accent": "#234b45" }');
    } else {
      for (const [key, value] of Object.entries(theme.colors)) {
        if (!PALETTE_KEYS.includes(key)) {
          errors.push(`theme.colors.${key}: unbekannter Name (erlaubt: ${PALETTE_KEYS.join(', ')})`);
        } else if (typeof value !== 'string' || !COLOR_VALUE.test(value.trim())) {
          errors.push(`theme.colors.${key}: "${value}" ist keine Farbe (erlaubt: #rgb, #rrggbb, rgb(…))`);
        } else {
          colors[key] = value.trim();
        }
      }
    }
  }
  return { preset, colors, errors };
}

/** CSS appended to theme.css for `theme.colors` (empty string without overrides). */
export function paletteOverrideCss(colors) {
  const entries = Object.entries(colors || {}).filter(([key]) => PALETTE_KEYS.includes(key));
  if (!entries.length) return '';
  const lines = entries.map(([key, value]) => `  --p-${key}: ${value};`);
  // :root:root beats the theme default and :root[data-palette] presets (same specificity, later)
  return `\n/* marbas-project.json → theme.colors */\n:root:root, :root:root[data-palette] {\n${lines.join('\n')}\n}\n`;
}

// ─── contrast (WCAG 2) for the resolvable palette ─────────────────────────────

function parseHex(value) {
  let hex = String(value || '').trim().replace(/^#/, '').toLowerCase();
  if (hex.length === 3 || hex.length === 4) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) return null;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}

function luminance(rgb) {
  const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(a, b) {
  const [x, y] = [parseHex(a), parseHex(b)];
  if (!x || !y) return null;
  const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

const CHECKS = [
  ['ink', 'paper', 'Text auf Papier'],
  ['muted', 'paper', 'Nebentext auf Papier'],
  ['accent', 'paper', 'Akzent/Links auf Papier'],
  ['ink', 'accent-soft', 'Text auf Farbband'],
  ['accent', 'accent-soft', 'Akzent auf Farbband'],
  ['alert', 'alert-soft', 'Warnung auf Warnband'],
  ['ink', 'alert-soft', 'Text auf Warnband'],
  ['ink', 'surface', 'Text auf weißem Band (surface)']
];

/**
 * Palette values a theme declares at :root (default) and for a preset.
 * Only plain hex values are resolved; everything else is skipped by the contrast check.
 */
export function readPaletteValues(css, preset = null) {
  const values = {};
  const source = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const apply = (body) => {
    for (const [, key, value] of body.matchAll(/--p-([a-z-]+)\s*:\s*([^;]+);/g)) {
      if (PALETTE_KEYS.includes(key)) values[key] = value.trim();
    }
  };
  for (const [, selector, body] of blocks) if (selector.trim() === ':root') apply(body);
  if (preset) {
    for (const [, selector, body] of blocks) if (selector.includes(`[data-palette="${preset}"]`)) apply(body);
  }
  for (const [key, value] of Object.entries(PALETTE_OPTIONAL_DEFAULTS)) if (!(key in values)) values[key] = value;
  return values;
}

/** @returns {Array<{ label, fg, bg, ratio }>} pairs below 4.5:1 (only where both colours are hex) */
export function paletteContrastWarnings(values) {
  const warnings = [];
  for (const [fg, bg, label] of CHECKS) {
    const ratio = contrastRatio(values[fg], values[bg]);
    if (ratio != null && ratio < 4.5) {
      warnings.push({ label, fg: `${fg} ${values[fg]}`, bg: `${bg} ${values[bg]}`, ratio: Math.round(ratio * 100) / 100 });
    }
  }
  return warnings;
}
