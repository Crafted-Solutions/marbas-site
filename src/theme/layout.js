/**
 * Base v2 — layout of the building blocks is chosen by the theme (the form).
 *
 * A theme declares its layout in a comment, like the family marker:
 *   @layout rail=side intro=split linklist=rows split=columns notice=band cta=link
 * Missing keys fall back to the defaults below. The resolved layout becomes classes on <body>
 * (`c-l-rail-side c-l-intro-split …`); the base CSS hangs the variants on these classes. Components stay
 * data-only (they never see the theme) — the layout is a page-level decision.
 */

export const LAYOUT_OPTIONS = Object.freeze({
  rail: ['top', 'side'],               // section label: above the title / column on the left (editorial)
  intro: ['split', 'reverse', 'stacked'], // image right / image left / text above, image full width below
  linklist: ['cards', 'rows'],         // card grid / numbered rows with hairlines
  split: ['columns', 'stacked'],       // two columns / one below the other
  notice: ['box', 'band'],             // tinted box / thin band between hairlines
  cta: ['button', 'link']              // buttons / text links with ↗
});

/** Layout of a v2 theme without `@layout` (and of v2 blocks in classic themes). */
export const LAYOUT_DEFAULTS = Object.freeze({
  rail: 'top', intro: 'split', linklist: 'cards', split: 'columns', notice: 'box', cta: 'button'
});

const LAYOUT_MARKER = /@layout\b([^\n*]*)/;

/**
 * @param {string} css theme CSS
 * @returns {{ layout: Record<string,string>, warnings: string[] }}
 */
export function readThemeLayout(css) {
  const layout = { ...LAYOUT_DEFAULTS };
  const warnings = [];
  const comments = String(css || '').match(/\/\*[\s\S]*?\*\//g) || [];
  const declaration = comments.map((c) => LAYOUT_MARKER.exec(c)).find(Boolean);
  if (!declaration) return { layout, warnings };

  for (const token of declaration[1].trim().split(/\s+/).filter(Boolean)) {
    const [key, value, ...rest] = token.split('=');
    if (!Object.hasOwn(LAYOUT_OPTIONS, key)) {
      warnings.push(`@layout: unbekannter Schlüssel "${key}" (erlaubt: ${Object.keys(LAYOUT_OPTIONS).join(', ')})`);
    } else if (rest.length || !LAYOUT_OPTIONS[key].includes(value)) {
      warnings.push(`@layout ${key}="${value ?? ''}" ungültig (erlaubt: ${LAYOUT_OPTIONS[key].join(' | ')}) — "${LAYOUT_DEFAULTS[key]}" aktiv`);
    } else {
      layout[key] = value;
    }
  }
  return { layout, warnings };
}

/** `c-l-rail-top c-l-intro-split …` — stable order, only known keys/values. */
export function layoutBodyClasses(layout = LAYOUT_DEFAULTS) {
  return Object.keys(LAYOUT_OPTIONS)
    .map((key) => `c-l-${key}-${LAYOUT_OPTIONS[key].includes(layout[key]) ? layout[key] : LAYOUT_DEFAULTS[key]}`)
    .join(' ');
}
