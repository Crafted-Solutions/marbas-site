import path from 'path';

export function getDefaultSiteSettings(projectRoot) {
  const title = path.basename(String(projectRoot || '').trim()) || 'Marbas';
  const year = new Date().getFullYear();

  return {
    title,
    theme: {
      id: 'theme-bloom',
      cssMode: 'marbas'
    },
    logo: {
      show: true,
      path: '/_assets/images/Logo.png'
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
        links: [
          { label: 'Impressum', href: '/impressum/' },
          { label: 'Datenschutz', href: '/datenschutz/' }
        ]
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
