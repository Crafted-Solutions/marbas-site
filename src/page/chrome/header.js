import { VALID_HEADER_PRESETS } from './presets.js';
import { resolveAnnouncementConfig } from './announcement.js';
import { resolveActions } from './actions.js';

const HEADER_VARIANTS = new Set(['default', 'compact', 'accent', 'line', 'glass']);
const NAVIGATION_VARIANTS = new Set(['default', 'compact', 'pill', 'underline']);

function normalizeVariant(value, allowed, fallback = 'default') {
  const s = String(value || '').trim();
  return allowed.has(s) ? s : fallback;
}

/**
 * Resolves the full header render config from site settings + optional theme defaults.
 *
 * @param {object} siteSettings  Normalized site.json content
 * @param {object} [themeDefaults]  Theme variant defaults from getThemeDefaults()
 * @returns {object}  Header render object ready for template consumption
 */
export function resolveHeaderConfig(siteSettings, themeDefaults = {}) {
  const header = siteSettings?.header ?? {};
  const logo = siteSettings?.logo ?? {};

  const preset = String(header.preset || '').trim();
  const normalizedPreset = VALID_HEADER_PRESETS.includes(preset) ? preset : 'brand-nav';

  const themeHeaderVariant = String(themeDefaults.headerVariant || 'default').trim();
  const themeNavVariant = String(themeDefaults.navigationVariant || 'default').trim();

  const siteVariant = String(header.variant || '').trim();
  const siteNavVariant = String(header.navigationVariant || '').trim();

  // Use site's value if it's a valid non-default choice; otherwise fall through to theme default
  const resolvedVariant = HEADER_VARIANTS.has(siteVariant) && siteVariant !== 'default'
    ? siteVariant
    : normalizeVariant(themeHeaderVariant, HEADER_VARIANTS, 'default');
  const resolvedNavVariant = NAVIGATION_VARIANTS.has(siteNavVariant) && siteNavVariant !== 'default'
    ? siteNavVariant
    : normalizeVariant(themeNavVariant, NAVIGATION_VARIANTS, 'default');

  const mobile = header.mobile ?? {};

  return {
    preset: normalizedPreset,
    variant: resolvedVariant,
    navigationVariant: resolvedNavVariant,
    sticky: header.sticky === true,
    showCompanyName: header.showCompanyName !== false,
    logo: {
      show: logo.show !== false,
      path: String(logo.path || '').trim()
    },
    announcement: resolveAnnouncementConfig(header.announcement),
    utilityLinks: header.utilityLinks ?? { source: 'manual', links: [] },
    actions: resolveActions(header.actions),
    mobile: {
      drawer: mobile.drawer !== false,
      showUtilityLinksInDrawer: mobile.showUtilityLinksInDrawer !== false,
      showActionsInDrawer: mobile.showActionsInDrawer !== false
    }
  };
}
