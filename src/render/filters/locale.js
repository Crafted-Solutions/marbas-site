// Fallback link labels when a component has a link but no explicit linkText.
// Keyed by primary language subtag; unknown languages fall back to English.
const DEFAULT_LINK_TEXTS = {
  de: 'weitere Informationen',
  en: 'More information'
};

// Built-in UI texts of header/footer templates (screen-reader labels, skip link).
// Keyed by primary language subtag; unknown languages fall back to English. {name} is replaced.
const UI_TEXTS = {
  de: {
    skipLink: 'Zum Inhalt springen',
    navOpen: 'Navigation öffnen',
    navClose: 'Navigation schließen',
    navigation: 'Navigation',
    mainNav: 'Hauptnavigation',
    serviceNav: 'Service-Navigation',
    submenu: 'Unterseiten von {name} anzeigen',
    announcement: 'Ankündigung',
    announcementClose: 'Ankündigung schließen',
    legal: 'Rechtliches'
  },
  en: {
    skipLink: 'Skip to content',
    navOpen: 'Open navigation',
    navClose: 'Close navigation',
    navigation: 'Navigation',
    mainNav: 'Main navigation',
    serviceNav: 'Service navigation',
    submenu: 'Show subpages of {name}',
    announcement: 'Announcement',
    announcementClose: 'Dismiss announcement',
    legal: 'Legal'
  }
};

const primaryLanguage = (lang) => String(lang ?? '').trim().toLowerCase().split(/[-_]/)[0];

/**
 * Built-in UI text for a page language.
 * @param {string} key   e.g. "navOpen"
 * @param {string} [lang]
 * @param {string} [name] replaces {name}
 */
export function uiText(key, lang, name = '') {
  const table = UI_TEXTS[primaryLanguage(lang)] || UI_TEXTS.en;
  const text = table[key] ?? UI_TEXTS.en[key] ?? key;
  return text.replace('{name}', String(name ?? ''));
}

/**
 * Resolves a value that may be localized per language: { de: "…", en: "…" } → string for `lang`
 * (then its primary subtag, then `defaultLanguage`, then the first string). Plain values pass through.
 */
export function localize(value, lang, defaultLanguage) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const candidates = [lang, primaryLanguage(lang), defaultLanguage, primaryLanguage(defaultLanguage)];
  for (const key of candidates) {
    if (key && typeof value[key] === 'string') return value[key];
  }
  const first = Object.values(value).find((v) => typeof v === 'string');
  return first ?? '';
}

/**
 * Default link label for a page language ("de", "de-AT", "en", …).
 * @param {string} [lang]
 * @returns {string}
 */
export function defaultLinkText(lang) {
  const primary = String(lang ?? '').trim().toLowerCase().split(/[-_]/)[0];
  return DEFAULT_LINK_TEXTS[primary] || DEFAULT_LINK_TEXTS.en;
}

function stripLanguagePrefix(url, code, defaultLanguage) {
  const value = String(url || '');
  if (!code || code === defaultLanguage) return value;
  if (value === `/${code}` || value === `/${code}/`) return '/';
  return value.startsWith(`/${code}/`) ? value.slice(code.length + 1) : value;
}

function translationGroup(data = {}) {
  if (data.translationKey) return `key:${data.translationKey}`;
  const sourceId = data.marbasCmsI18n?.sourcePageId || data.pageId;
  return sourceId ? `id:${sourceId}` : null;
}

/**
 * Language variants of the current page, one entry per configured language.
 * Pages belong together when they share a `translationKey`, a CMS page id
 * (`marbasCmsI18n.sourcePageId` → `pageId`) or — without explicit link — the same path
 * below their language folder (`/about/` ↔ `/en/about/`).
 *
 * @param {Array<{url:string, data:object}>} pages   e.g. collections.all
 * @param {{url:string, data:object}} current
 * @param {{defaultLanguage:string, languages:Array<{code:string,label?:string}>}} localeConfig
 * @returns {Array<{code:string, label:string, url:string|null, current:boolean}>}
 */
export function computeAlternates(pages, current, localeConfig) {
  const defaultLanguage = localeConfig.defaultLanguage;
  const currentLanguage = current?.data?.pageLanguage || defaultLanguage;
  const currentGroup = translationGroup(current?.data);
  const currentBase = stripLanguagePrefix(current?.url, currentLanguage, defaultLanguage);
  const candidates = (pages || []).filter((item) => typeof item?.url === 'string' && item.url && item.data?.pageLanguage);

  return localeConfig.languages.map(({ code, label, name }) => {
    if (code === currentLanguage) {
      return { code, label: label || name || code, url: current?.url || null, current: true };
    }
    const inLanguage = candidates.filter((item) => item.data.pageLanguage === code);
    let match = currentGroup ? inLanguage.find((item) => translationGroup(item.data) === currentGroup) : null;
    if (!match) {
      match = inLanguage.find((item) => {
        const group = translationGroup(item.data);
        // an explicitly linked page belongs to its own group, not to a same-path page
        if (group && currentGroup && group !== currentGroup) return false;
        return stripLanguagePrefix(item.url, code, defaultLanguage) === currentBase;
      });
    }
    return { code, label: label || name || code, url: match ? match.url : null, current: false };
  });
}

export function configureLocaleFilters(eleventyConfig, localeConfig) {
    
    const configuredLanguages = JSON.stringify(localeConfig.languages);
    
    // Add custom locale_url filter that handles root default language
    eleventyConfig.addFilter('locale_url', function(url, locale) {
      const defaultLang = localeConfig.defaultLanguage;
      // Components are rendered with an isolated context that carries the page language as `lang`.
      const targetLang = locale || this.ctx.pageLanguage || this.ctx.lang || defaultLang;
      
      // If target language is the default language, return URL as-is (root level)
      if (targetLang === defaultLang) {
        return url;
      }
      
      // For non-default languages, prepend language code
      if (url === '/') {
        return `/${targetLang}/`;
      }
      
      // Handle other URLs
      if (url.startsWith('/')) {
        return `/${targetLang}${url}`;
      }
      
      return `/${targetLang}/${url}`;
    });
    
    // Add localeUrls filter
    eleventyConfig.addFilter('localeUrls', function(currentPath) {
      return getLocales(currentPath, localeConfig);
    });
    
    // Add filterCollectionByLanguage filter
    eleventyConfig.addFilter('filterCollectionByLanguage', (collection, language) => {
      if (!collection || !Array.isArray(collection)) {
        return [];
      }
      return collection.filter(item => item.data && item.data.pageLanguage === language);
    });
    
    // Add languageAlternates filter — {% set alternates = collections.all | languageAlternates(page) %}
    eleventyConfig.addFilter('languageAlternates', function (pages, currentPage) {
      const current = (pages || []).find((item) => item.url === currentPage?.url && item.inputPath === currentPage?.inputPath)
        || { url: currentPage?.url, data: { pageLanguage: this.ctx?.pageLanguage, translationKey: this.ctx?.translationKey, pageId: this.ctx?.pageId, marbasCmsI18n: this.ctx?.marbasCmsI18n } };
      return computeAlternates(pages, current, localeConfig);
    });

    eleventyConfig.addGlobalData('websiteLanguageCount', localeConfig.languages.length);

    // Localized values from site.json — {{ site.footer.copyright | t(pageLanguage) }}
    eleventyConfig.addFilter('t', (value, lang) => localize(value, lang || localeConfig.defaultLanguage, localeConfig.defaultLanguage));
    // Built-in UI texts — {{ "navOpen" | uiText(pageLanguage) }}
    eleventyConfig.addFilter('uiText', (key, lang, name) => uiText(key, lang || localeConfig.defaultLanguage, name));

    // Add defaultLinkText filter — {{ data.linkText or (lang | defaultLinkText) }}
    eleventyConfig.addFilter('defaultLinkText', (lang) => defaultLinkText(lang || localeConfig.defaultLanguage));

    // Add getLangAttribute filter
    eleventyConfig.addFilter("getLangAttribute", (pageLang, contentLang) => {
      const normalizedContentLang = normalizeLanguageCode(contentLang);
      const normalizedPageLang = normalizeLanguageCode(pageLang);

      if (!normalizedContentLang || normalizedContentLang === normalizedPageLang) {
        return '';
      }

      return `lang="${normalizedContentLang}"`;
    });
    
    // Add global data for languages
    eleventyConfig.addGlobalData('websiteLanguages', configuredLanguages);
    eleventyConfig.addGlobalData('defaultLanguage', localeConfig.defaultLanguage);
    
    // Add languages shortcode
    eleventyConfig.addShortcode("languages", () => {
      return configuredLanguages;
    });
    
    // Add getAllLanguages shortcode
    eleventyConfig.addShortcode("getAllLanguages2", () => {
      return localeConfig.languages;
    });
    
    // Add getAllLanguages filter
    eleventyConfig.addFilter("getAllLanguages", (pageLang, contentLang) => {
      return localeConfig.languages;
  });
  }

  function normalizeLanguageCode(languageCode) {
    if (typeof languageCode !== 'string' && typeof languageCode !== 'number') {
      return '';
    }

    const normalized = String(languageCode).trim();

    if (!normalized || normalized === 'undefined' || normalized === 'null') {
      return '';
    }

    return normalized;
  }
  
  // Helper function for getting locales
  function getLocales(currentPath, localeConfig) {
    const localeCodes = localeConfig.languages.map(lang => lang.code);
    const defaultLocale = localeConfig.defaultLanguage;
  
    const localeRegex = new RegExp(`^\\/(${localeCodes.join('|')})(\\/|$)`);
    const match = currentPath.match(localeRegex);
  
    let basePath = currentPath;
  
    if (match) {
      const matchedPrefix = match[0];
      basePath = currentPath.slice(matchedPrefix.length);
  
      // Ensure basePath starts with a slash
      if (basePath === '' || basePath[0] !== '/') {
        basePath = `/${basePath}`;
      }
  
      // Preserve trailing slash from original URL
      if (currentPath.endsWith('/') && !basePath.endsWith('/')) {
        basePath += '/';
      }
    }
  
    // Normalize empty base path to root
    if (basePath === '') {
      basePath = '/';
    }
  
    return localeConfig.languages.map(language => {
      const isDefault = language.code === defaultLocale;
      let path = isDefault ? basePath : `/${language.code}${basePath}`;
  
      // Clean up any double slashes
      path = path.replace(/([^:]\/)\/+/g, '$1');
  
      return {
        code: language.code,
        path: path,
        iso: language.iso,
        name: language.name
      };
    });
  }
