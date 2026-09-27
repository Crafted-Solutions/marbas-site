import { textValue } from './text.js';
const VALID_ACTION_STYLES = new Set(['primary', 'secondary', 'outline']);

function normalizeActionStyle(style) {
  const s = String(style || '').trim();
  return VALID_ACTION_STYLES.has(s) ? s : 'primary';
}

/**
 * Normalizes a list of header action buttons (max 2).
 */
export function resolveActions(actionsInput) {
  if (!Array.isArray(actionsInput)) {
    return [];
  }

  return actionsInput.slice(0, 2).map(item => {
    const src = item && typeof item === 'object' ? item : {};
    return {
      label: textValue(src.label),
      href: textValue(src.href),
      style: normalizeActionStyle(src.style)
    };
  });
}
