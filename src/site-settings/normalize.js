import { getDefaultSiteSettings } from './defaults.js';

const VALID_HEADER_PRESETS = ['brand-nav', 'brand-nav-actions', 'utility-brand-nav', 'centered-nav'];
const VALID_FOOTER_PRESETS = ['simple', 'columns', 'columns-social', 'columns-cta', 'editorial'];
const VALID_ACTION_STYLES = ['primary', 'secondary', 'outline'];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asObject(value) {
  return isObject(value) ? value : {};
}

function readString(value, fallback = '') {
  if (typeof value === 'string') {
    return value.trim();
  }

  return fallback;
}

function readBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return fallback;
}

function normalizeNavigationVariant(value, fallback = 'default') {
  const normalized = readString(value, fallback);
  if (normalized === 'compact' || normalized === 'pill' || normalized === 'underline') {
    return normalized;
  }

  return 'default';
}

function normalizeHeaderVariant(value, fallback = 'default') {
  const normalized = readString(value, fallback);
  if (normalized === 'compact' || normalized === 'accent' || normalized === 'line' || normalized === 'glass') {
    return normalized;
  }

  return 'default';
}

function normalizeFooterVariant(value, fallback = 'default') {
  const normalized = readString(value, fallback);
  if (normalized === 'compact' || normalized === 'accent' || normalized === 'contrast') {
    return normalized;
  }

  return 'default';
}

function normalizeHeaderPreset(value) {
  const preset = readString(value, 'brand-nav');
  return VALID_HEADER_PRESETS.includes(preset) ? preset : 'brand-nav';
}

function normalizeFooterPreset(value) {
  const preset = readString(value, 'simple');
  return VALID_FOOTER_PRESETS.includes(preset) ? preset : 'simple';
}

function normalizeLink(value) {
  const source = asObject(value);
  const link = {
    label: readString(source.label),
    href: readString(source.href)
  };
  if (source.description !== undefined) link.description = readString(source.description);
  if (source.ariaLabel !== undefined) link.ariaLabel = readString(source.ariaLabel);
  if (source.external !== undefined) link.external = Boolean(source.external);
  return link;
}

function normalizeActionLink(value) {
  const source = asObject(value);
  return {
    label: readString(source.label),
    href: readString(source.href),
    style: VALID_ACTION_STYLES.includes(source.style) ? source.style : 'primary'
  };
}

function normalizeSocialLink(value) {
  const source = asObject(value);
  const social = {
    platform: readString(source.platform),
    label: readString(source.label),
    href: readString(source.href)
  };
  if (source.ariaLabel !== undefined) social.ariaLabel = readString(source.ariaLabel);
  return social;
}

function normalizeLinkSource(value, fallbackLinks = []) {
  const source = asObject(value);
  const sourceType = readString(source.source, 'manual');

  if (sourceType === 'tagCollection') {
    return {
      source: 'tagCollection',
      tags: Array.isArray(source.tags) ? source.tags.filter(t => typeof t === 'string') : [],
      limit: Number.isInteger(source.limit) && source.limit > 0 ? source.limit : 10
    };
  }

  return {
    source: 'manual',
    links: Array.isArray(source.links) ? source.links.map(normalizeLink) : fallbackLinks
  };
}

function normalizeFooterGroup(value) {
  const source = asObject(value);
  const sourceType = readString(source.source, 'manual');

  if (sourceType === 'tagCollection') {
    return {
      title: readString(source.title),
      source: 'tagCollection',
      tags: Array.isArray(source.tags) ? source.tags.filter(t => typeof t === 'string') : [],
      limit: Number.isInteger(source.limit) && source.limit > 0 ? source.limit : 10
    };
  }

  return {
    title: readString(source.title),
    source: 'manual',
    links: Array.isArray(source.links) ? source.links.map(normalizeLink) : []
  };
}

export function normalizeSiteSettings(input, projectRoot) {
  const fallback = getDefaultSiteSettings(projectRoot);
  const source = asObject(input);
  const sourceLogo = asObject(source.logo);
  const sourceHeader = asObject(source.header);
  const sourceFooter = asObject(source.footer);

  const sourceAnnouncement = asObject(sourceHeader.announcement);
  const sourceMobile = asObject(sourceHeader.mobile);
  const sourceActions = Array.isArray(sourceHeader.actions) ? sourceHeader.actions : [];

  // Contact migration: old format = footer.contact {phone, email} + footer.address {street,...}
  const sourceContactRaw = asObject(sourceFooter.contact);
  const legacyAddress = asObject(sourceFooter.address);
  const sourceContactAddress = isObject(sourceContactRaw.address)
    ? asObject(sourceContactRaw.address)
    : legacyAddress;

  // bottomLinks migration: old format = footer.links {imprint, privacy}
  const sourceLinks = asObject(sourceFooter.links);
  let bottomLinksNormalized;
  if (isObject(sourceFooter.bottomLinks)) {
    bottomLinksNormalized = normalizeLinkSource(sourceFooter.bottomLinks, fallback.footer.bottomLinks.links);
  } else {
    const legacyImprint = asObject(sourceLinks.imprint);
    const legacyPrivacy = asObject(sourceLinks.privacy);
    const derivedLinks = [];
    if (readString(legacyImprint.href) || readString(legacyImprint.label)) {
      derivedLinks.push(normalizeLink(legacyImprint));
    }
    if (readString(legacyPrivacy.href) || readString(legacyPrivacy.label)) {
      derivedLinks.push(normalizeLink(legacyPrivacy));
    }
    bottomLinksNormalized = {
      source: 'manual',
      links: derivedLinks.length > 0 ? derivedLinks : [...fallback.footer.bottomLinks.links]
    };
  }

  const sourceGroups = Array.isArray(sourceFooter.groups) ? sourceFooter.groups : [];
  const sourceSocialLinks = Array.isArray(sourceFooter.socialLinks) ? sourceFooter.socialLinks : [];
  const sourceCtaBlock = asObject(sourceFooter.ctaBlock);

  const sourceSeo = asObject(source.seo);
  const sourceDefaultImage = asObject(sourceSeo.defaultImage);

  // Spread source first so app-only fields (e.g. _schema) pass through unchanged
  return {
    ...source,
    title: readString(source.title, fallback.title),
    logo: {
      ...fallback.logo,
      ...sourceLogo,
      show: readBoolean(sourceLogo.show, fallback.logo.show),
      path: readString(sourceLogo.path, fallback.logo.path)
    },
    header: {
      ...fallback.header,
      ...sourceHeader,
      preset: normalizeHeaderPreset(sourceHeader.preset),
      showCompanyName: readBoolean(sourceHeader.showCompanyName, fallback.header.showCompanyName),
      navigationVariant: normalizeNavigationVariant(sourceHeader.navigationVariant, fallback.header.navigationVariant),
      variant: normalizeHeaderVariant(sourceHeader.variant, fallback.header.variant),
      sticky: readBoolean(sourceHeader.sticky, fallback.header.sticky),
      announcement: {
        enabled: readBoolean(sourceAnnouncement.enabled, false),
        id: readString(sourceAnnouncement.id),
        text: readString(sourceAnnouncement.text),
        label: readString(sourceAnnouncement.label),
        href: readString(sourceAnnouncement.href)
      },
      utilityLinks: normalizeLinkSource(sourceHeader.utilityLinks, []),
      actions: sourceActions.slice(0, 2).map(normalizeActionLink),
      mobile: {
        drawer: readBoolean(sourceMobile.drawer, fallback.header.mobile.drawer),
        showUtilityLinksInDrawer: readBoolean(sourceMobile.showUtilityLinksInDrawer, fallback.header.mobile.showUtilityLinksInDrawer),
        showActionsInDrawer: readBoolean(sourceMobile.showActionsInDrawer, fallback.header.mobile.showActionsInDrawer)
      }
    },
    footer: {
      ...fallback.footer,
      ...(({ links: _l, address: _a, ...rest }) => rest)(sourceFooter),
      preset: normalizeFooterPreset(sourceFooter.preset),
      variant: normalizeFooterVariant(sourceFooter.variant, fallback.footer.variant),
      companyName: readString(sourceFooter.companyName, fallback.footer.companyName),
      intro: readString(sourceFooter.intro),
      groups: sourceGroups.slice(0, 4).map(normalizeFooterGroup),
      contact: {
        address: {
          street: readString(sourceContactAddress.street),
          zip: readString(sourceContactAddress.zip),
          city: readString(sourceContactAddress.city),
          country: readString(sourceContactAddress.country)
        },
        phone: readString(sourceContactRaw.phone),
        email: readString(sourceContactRaw.email)
      },
      socialLinks: sourceSocialLinks.slice(0, 8).map(normalizeSocialLink),
      ctaBlock: {
        enabled: readBoolean(sourceCtaBlock.enabled, false),
        title: readString(sourceCtaBlock.title),
        text: readString(sourceCtaBlock.text),
        label: readString(sourceCtaBlock.label),
        href: readString(sourceCtaBlock.href)
      },
      bottomLinks: bottomLinksNormalized,
      copyright: readString(sourceFooter.copyright, fallback.footer.copyright)
    },
    seo: {
      ...fallback.seo,
      ...sourceSeo,
      defaultAuthor: readString(sourceSeo.defaultAuthor, fallback.seo.defaultAuthor),
      defaultCopyright: readString(sourceSeo.defaultCopyright, fallback.seo.defaultCopyright),
      siteName: readString(sourceSeo.siteName, fallback.seo.siteName),
      twitterSiteHandle: readString(sourceSeo.twitterSiteHandle, fallback.seo.twitterSiteHandle),
      defaultTwitterCreatorHandle: readString(sourceSeo.defaultTwitterCreatorHandle, fallback.seo.defaultTwitterCreatorHandle),
      defaultImage: {
        ...fallback.seo.defaultImage,
        ...sourceDefaultImage,
        src: readString(sourceDefaultImage.src, fallback.seo.defaultImage.src),
        alt: readString(sourceDefaultImage.alt, fallback.seo.defaultImage.alt),
        width: readString(sourceDefaultImage.width, fallback.seo.defaultImage.width),
        height: readString(sourceDefaultImage.height, fallback.seo.defaultImage.height),
        type: readString(sourceDefaultImage.type, fallback.seo.defaultImage.type)
      }
    }
  };
}

export function validateSiteSettings(site) {
  const errors = [];

  if (!readString(site?.title)) {
    errors.push('Site-Titel ist erforderlich.');
  }

  const headerPreset = readString(site?.header?.preset);
  if (headerPreset && !VALID_HEADER_PRESETS.includes(headerPreset)) {
    errors.push(`Ungültiges Header-Preset: "${headerPreset}". Gültig: ${VALID_HEADER_PRESETS.join(', ')}.`);
  }

  const footerPreset = readString(site?.footer?.preset);
  if (footerPreset && !VALID_FOOTER_PRESETS.includes(footerPreset)) {
    errors.push(`Ungültiges Footer-Preset: "${footerPreset}". Gültig: ${VALID_FOOTER_PRESETS.join(', ')}.`);
  }

  const defaultImageAlt = readString(site?.seo?.defaultImage?.alt);
  const defaultImageSrc = readString(site?.seo?.defaultImage?.src);
  if (defaultImageAlt && !defaultImageSrc) {
    errors.push('SEO Standard-Bild: Alt-Text ohne Bildpfad ist nicht erlaubt.');
  }

  return errors;
}
