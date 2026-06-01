/**
 * Resolves the announcement bar config from site settings.
 * Dismiss logic (cookie/localStorage) is client-side only — this returns
 * only the data that templates need to render the bar.
 */
export function resolveAnnouncementConfig(announcement) {
  const src = announcement && typeof announcement === 'object' ? announcement : {};
  const enabled = src.enabled === true;

  if (!enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    id: String(src.id || '').trim(),
    text: String(src.text || '').trim(),
    label: String(src.label || '').trim(),
    href: String(src.href || '').trim()
  };
}
