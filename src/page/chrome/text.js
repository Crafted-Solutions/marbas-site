/**
 * A site.json text that may be localized: strings are trimmed, `{ de: "…", en: "…" }` objects are
 * kept as they are (resolved per page language by the `t` filter), anything else becomes "".
 */
export function textValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return String(value || '').trim();
}
