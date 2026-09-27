import path from 'path';

const LANGUAGE_LABELS = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  nl: 'Nederlands'
};

// Legal bottom links of the starter pages, per language (non-German → English starter).
const LEGAL_LINKS = {
  de: [
    { label: 'Impressum', href: '/impressum/' },
    { label: 'Datenschutz', href: '/datenschutz/' }
  ],
  en: [
    { label: 'Imprint', href: '/imprint/' },
    { label: 'Privacy', href: '/privacy/' }
  ]
};

const primaryLanguage = (code) => String(code || '').toLowerCase().split('-')[0];

export function languageLabel(code) {
  return LANGUAGE_LABELS[code] || LANGUAGE_LABELS[primaryLanguage(code)] || String(code).toUpperCase();
}

/**
 * Default site.json for a new project.
 * @param {string} projectRoot
 * @param {object} [options]
 * @param {string} [options.title]  Site/company name (default: folder name)
 * @param {string} [options.lang]   Default language code (default: "de")
 */
export function getDefaultSiteSettings(projectRoot, { title: explicitTitle, lang = 'de' } = {}) {
  const title = String(explicitTitle || '').trim() || path.basename(String(projectRoot || '').trim()) || 'Marbas';
  const year = new Date().getFullYear();

  return {
    title,
    locale: {
      defaultLanguage: lang,
      languages: [{ code: lang, label: languageLabel(lang) }]
    },
    logo: {
      show: true,
      path: '/_assets/images/Logo.svg'
    },
    header: {
      preset: 'brand-nav',
      showCompanyName: true,
      variant: 'default',
      navigationVariant: 'default',
      sticky: false,
      announcement: {
        enabled: false,
        id: '',
        text: '',
        label: '',
        href: ''
      },
      utilityLinks: {
        source: 'manual',
        links: []
      },
      actions: [],
      mobile: {
        drawer: true,
        showUtilityLinksInDrawer: true,
        showActionsInDrawer: true
      }
    },
    footer: {
      preset: 'simple',
      variant: 'default',
      companyName: title,
      intro: '',
      groups: [],
      contact: {
        address: {
          street: '',
          zip: '',
          city: '',
          country: ''
        },
        phone: '',
        email: ''
      },
      socialLinks: [],
      ctaBlock: {
        enabled: false,
        title: '',
        text: '',
        label: '',
        href: ''
      },
      bottomLinks: {
        source: 'manual',
        links: (LEGAL_LINKS[primaryLanguage(lang)] || LEGAL_LINKS.en).map((link) => ({ ...link }))
      },
      copyright: `© ${year} ${title}`
    },
    seo: {
      defaultAuthor: '',
      defaultCopyright: '',
      siteName: '',
      twitterSiteHandle: '',
      defaultTwitterCreatorHandle: '',
      defaultImage: {
        src: '',
        alt: '',
        width: '',
        height: '',
        type: ''
      }
    }
  };
}
