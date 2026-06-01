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
      label: String(src.label || '').trim(),
      href: String(src.href || '').trim(),
      style: normalizeActionStyle(src.style)
    };
  });
}
