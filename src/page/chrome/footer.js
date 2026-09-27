import { textValue } from './text.js';
import { VALID_FOOTER_PRESETS } from './presets.js';

const FOOTER_VARIANTS = new Set(['default', 'compact', 'accent', 'contrast']);

function normalizeVariant(value, allowed, fallback = 'default') {
  const s = String(value || '').trim();
  return allowed.has(s) ? s : fallback;
}

/**
 * Resolves the full footer render config from site settings + optional theme defaults.
 *
 * @param {object} siteSettings  Normalized site.json content
 * @param {object} [themeDefaults]  Theme variant defaults from getThemeDefaults()
 * @returns {object}  Footer render object ready for template consumption
 */
export function resolveFooterConfig(siteSettings, themeDefaults = {}) {
  const footer = siteSettings?.footer ?? {};

  const preset = String(footer.preset || '').trim();
  const normalizedPreset = VALID_FOOTER_PRESETS.includes(preset) ? preset : 'simple';

  const themeFooterVariant = String(themeDefaults.footerVariant || 'default').trim();
  const siteVariant = String(footer.variant || '').trim();

  // Use site's value if it's a valid non-default choice; otherwise fall through to theme default
  const resolvedVariant = FOOTER_VARIANTS.has(siteVariant) && siteVariant !== 'default'
    ? siteVariant
    : normalizeVariant(themeFooterVariant, FOOTER_VARIANTS, 'default');

  const contact = footer.contact ?? {};
  const address = contact.address ?? {};
  const ctaBlock = footer.ctaBlock ?? {};

  return {
    preset: normalizedPreset,
    variant: resolvedVariant,
    companyName: textValue(footer.companyName),
    intro: textValue(footer.intro),
    copyright: textValue(footer.copyright),
    groups: Array.isArray(footer.groups) ? footer.groups.slice(0, 4) : [],
    contact: {
      address: {
        street: String(address.street || '').trim(),
        zip: String(address.zip || '').trim(),
        city: String(address.city || '').trim(),
        country: String(address.country || '').trim()
      },
      phone: String(contact.phone || '').trim(),
      email: String(contact.email || '').trim()
    },
    socialLinks: Array.isArray(footer.socialLinks) ? footer.socialLinks.slice(0, 8) : [],
    ctaBlock: {
      enabled: ctaBlock.enabled === true,
      title: textValue(ctaBlock.title),
      text: textValue(ctaBlock.text),
      label: textValue(ctaBlock.label),
      href: textValue(ctaBlock.href)
    },
    bottomLinks: footer.bottomLinks ?? { source: 'manual', links: [] }
  };
}
