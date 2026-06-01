import { getThemeDefaults } from './library.js';

/**
 * Returns the variant defaults for a given theme ID.
 * Falls back to { default, default, default } for unknown themes.
 */
export function getVariantDefaultsForTheme(themeId) {
  return getThemeDefaults(themeId);
}

/**
 * Applies theme variant defaults to siteSettings header/footer/navigation.
 * Without force: only sets fields that are already at their default values.
 * With force: overwrites existing values.
 *
 * @param {object} siteSettings  Normalized site settings object
 * @param {string} themeId       Theme ID, e.g. "theme-atlas"
 * @param {object} [opts]
 * @param {boolean} [opts.force] If true, overwrite existing values
 * @returns {object} New siteSettings object with variant defaults applied
 */
export function applyVariantDefaultsToSiteSettings(siteSettings, themeId, { force = false } = {}) {
  const defaults = getVariantDefaultsForTheme(themeId);
  const header = siteSettings?.header ?? {};
  const footer = siteSettings?.footer ?? {};

  const shouldSetHeader = force || !header.variant || header.variant === 'default';
  const shouldSetNav = force || !header.navigationVariant || header.navigationVariant === 'default';
  const shouldSetFooter = force || !footer.variant || footer.variant === 'default';

  return {
    ...siteSettings,
    header: {
      ...header,
      ...(shouldSetHeader ? { variant: defaults.headerVariant } : {}),
      ...(shouldSetNav ? { navigationVariant: defaults.navigationVariant } : {})
    },
    footer: {
      ...footer,
      ...(shouldSetFooter ? { variant: defaults.footerVariant } : {})
    }
  };
}
