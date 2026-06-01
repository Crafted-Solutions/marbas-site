export function configureLocaleFilters(eleventyConfig, localeConfig) {
    
    const configuredLanguages = JSON.stringify(localeConfig.languages);
    
    // Add custom locale_url filter that handles root default language
    eleventyConfig.addFilter('locale_url', function(url, locale) {
      const defaultLang = localeConfig.defaultLanguage;
      const targetLang = locale || this.ctx.pageLanguage || defaultLang;
      
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
