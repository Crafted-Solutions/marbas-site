/**
 * Renders a named partial through the Nunjucks environment already configured
 * by Eleventy (all filters, shortcodes, MarbasResolver). Called with `this`
 * bound to the normalised shortcode context provided by Eleventy v3:
 *   this.env  — the live nunjucks.Environment (MarbasResolver included)
 *   this.ctx  — the current template data frame (site, page, buildConfig, …)
 *
 * The partial name is resolved project-first via MarbasResolver:
 *   <projectRoot>/_includes/<name>  beats  <libRoot>/_includes/<name>
 *
 * @param {string} partialName  Relative partial name, e.g. "topNavigation.njk"
 * @returns {Promise<string>}
 */
function renderPartial(partialName) {
  return new Promise((resolve, reject) => {
    this.env.render(partialName, this.ctx, (err, html) => {
      if (err) reject(err);
      else resolve(html || '');
    });
  });
}

/**
 * Registers site-chrome async shortcodes.
 *
 * Usage in templates (no arguments needed — data comes from this.ctx):
 *   {% siteMeta %}       → header_seo.njk  (meta tags, OG, robots)
 *   {% siteHeadAssets %} → _head-assets.njk (CSS/JS links)
 *   {% siteHeader %}     → topNavigation.njk (preset-routed header)
 *   {% siteFooter %}     → footerGlobal.njk (preset-routed footer)
 *
 * @param {object} eleventyConfig
 */
export function registerSiteChromeShortcodes(eleventyConfig) {
  eleventyConfig.addAsyncShortcode('siteMeta', function () {
    return renderPartial.call(this, 'header_seo.njk');
  });

  eleventyConfig.addAsyncShortcode('siteHeadAssets', function () {
    return renderPartial.call(this, '_head-assets.njk');
  });

  eleventyConfig.addAsyncShortcode('siteHeader', function () {
    return renderPartial.call(this, 'topNavigation.njk');
  });

  eleventyConfig.addAsyncShortcode('siteFooter', function () {
    return renderPartial.call(this, 'footerGlobal.njk');
  });
}
