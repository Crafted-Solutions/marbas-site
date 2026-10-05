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

// ─── colour scheme (dark mode, 0.17) ──────────────────────────────────────────
//
// A v2 theme names its dark palette in the header comment (`@dark <preset>`). A project chooses
// `theme.scheme = { mode: "light" | "dark" | "auto", dark: { palette, colors } }`:
//   light — today's behaviour, nothing is emitted (no attribute, no CSS, no script)
//   dark  — the dark palette is the only palette (no switcher)
//   auto  — follows the system; visitors may switch (footer/header controls, choice kept in localStorage)
// The dark block copies ALL custom properties of the dark preset (forms set their own variables there, e.g.
// --product-foot-*), then `dark.colors`. `:root:root:root[data-scheme="dark"]` (0,4,0) outranks theme.colors
// (`:root:root[data-palette]`, 0,3,0) so light brand colours never leak into the dark scheme.

export const SCHEME_MODES = ['light', 'dark', 'auto'];
const DARK_MARKER = /@dark\s+([a-z0-9][a-z0-9-]{0,31})\b/;

/** `@dark <preset>` from the theme header, or null. */
export function readDarkPreset(css) {
  const comments = String(css || '').match(/\/\*[\s\S]*?\*\//g) || [];
  for (const comment of comments) {
    const match = DARK_MARKER.exec(comment);
    if (match) return match[1];
  }
  return null;
}

/** All custom-property declarations of a preset block (`:root[data-palette="name"] { --x: …; }`), in order. */
export function readPresetDeclarations(css, preset) {
  const source = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  for (const [, selector, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const parts = selector.split(',').map((s) => s.trim());
    if (!parts.includes(`:root[data-palette="${preset}"]`)) continue;
    for (const [, name, value] of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out.push([name, value.trim()]);
  }
  return out;
}

/**
 * Validate `theme.scheme`. Missing block → mode "light" (unchanged output).
 * @returns {{ mode: 'light'|'dark'|'auto', darkPalette: string|null, darkColors: Record<string,string>, errors: string[] }}
 */
export function normalizeSchemeConfig(theme = {}) {
  const errors = [];
  const scheme = theme?.scheme;
  if (scheme == null) return { mode: 'light', darkPalette: null, darkColors: {}, errors };
  if (typeof scheme !== 'object' || Array.isArray(scheme)) {
    return { mode: 'light', darkPalette: null, darkColors: {}, errors: ['theme.scheme muss ein Objekt sein, z.B. { "mode": "auto" }'] };
  }
  let mode = 'light';
  if (scheme.mode != null && scheme.mode !== '') {
    if (SCHEME_MODES.includes(scheme.mode)) mode = scheme.mode;
    else errors.push(`theme.scheme.mode "${scheme.mode}" unbekannt (erlaubt: ${SCHEME_MODES.join(', ')})`);
  }
  const dark = scheme.dark && typeof scheme.dark === 'object' && !Array.isArray(scheme.dark) ? scheme.dark : {};
  if (scheme.dark != null && dark !== scheme.dark) errors.push('theme.scheme.dark muss ein Objekt sein, z.B. { "palette": "nacht" }');
  const normalized = normalizePaletteConfig({ palette: dark.palette, colors: dark.colors });
  errors.push(...normalized.errors.map((e) => e.replace(/^theme\./, 'theme.scheme.dark.')));
  return { mode, darkPalette: normalized.preset, darkColors: normalized.colors, errors };
}

/**
 * CSS for the dark scheme (empty for mode "light").
 * @param {{ mode, declarations: Array<[string,string]>, colors: Record<string,string> }} input
 */
export function schemeCss({ mode, declarations = [], colors = {} }) {
  if (mode !== 'dark' && mode !== 'auto') return '';
  const lines = [...declarations.map(([k, v]) => `  ${k}: ${v};`),
    ...Object.entries(colors).filter(([k]) => PALETTE_KEYS.includes(k)).map(([k, v]) => `  --p-${k}: ${v};`),
    '  color-scheme: dark;'];
  const block = lines.join('\n');
  let out = '\n/* marbas-project.json → theme.scheme (dark) */\n';
  out += `:root:root:root[data-scheme="dark"] {\n${block}\n}\n`;
  if (mode === 'auto') {
    out += `:root[data-scheme="auto"] { color-scheme: light dark; }\n`;
    out += `@media (prefers-color-scheme: dark) {\n  :root:root:root[data-scheme="auto"] {\n${block.replace(/^/gm, '  ')}\n  }\n}\n`;
  }
  return out;
}
