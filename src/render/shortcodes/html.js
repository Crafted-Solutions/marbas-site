export function configureHtmlShortcodes(eleventyConfig, domain) {
    // Add SITE_DOMAIN shortcode
    eleventyConfig.addShortcode("SITE_DOMAIN", () => {
      return domain;
    });
    
    // Add getDomainWithPath filter
    eleventyConfig.addFilter("getDomainWithPath", (path) => {
      return domain + path;
    });
  }