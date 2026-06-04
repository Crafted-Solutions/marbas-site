import { configureLocalMediaFilters as _configureLocalMedia } from './filters/local-media.js';
import { configureHtmlFilters as _configureHtml } from './filters/html.js';
import { configureAriaFilters as _configureAria } from './filters/aria.js';
import { configureLocaleFilters as _configureLocale } from './filters/locale.js';
import { configureHtmlShortcodes as _configureShortcodes } from './shortcodes/html.js';
import { registerSiteChromeShortcodes as _configureSiteChrome } from './shortcodes/site-chrome.js';
import { registerMissingComponentShortcode as _configureMissingComponent } from './shortcodes/missing-component.js';

export { configureLocalMediaFilters } from './filters/local-media.js';
export { configureHtmlFilters } from './filters/html.js';
export { configureAriaFilters } from './filters/aria.js';
export { configureLocaleFilters } from './filters/locale.js';
export { configureHtmlShortcodes } from './shortcodes/html.js';
export { registerSiteChromeShortcodes } from './shortcodes/site-chrome.js';
export { registerMissingComponentShortcode } from './shortcodes/missing-component.js';
export { escapeHtml } from './html-escape.js';
export { shouldBypassEleventyImageProcessing, createFallbackImageHtml } from './image-processing.js';
export { MediaExporter } from './media-exporter.js';
export { createDir, copyRecursive } from './fs.js';

/**
 * Registers all Marbas render filters and shortcodes with an Eleventy config.
 *
 * @param {object} eleventyConfig  Eleventy configuration object
 * @param {object} [options]
 * @param {string} [options.publishFolder]  Output folder for image processing
 * @param {string} [options.domain]  Site domain for shortcodes
 * @param {object} [options.localeConfig]  Language/locale configuration
 */
export function registerWithEleventy(eleventyConfig, { publishFolder = '', domain = '', localeConfig = null } = {}) {
  _configureLocalMedia(eleventyConfig, publishFolder);
  _configureHtml(eleventyConfig);
  _configureAria(eleventyConfig);
  if (localeConfig?.languages) {
    _configureLocale(eleventyConfig, localeConfig);
  }
  _configureShortcodes(eleventyConfig, domain);
  _configureSiteChrome(eleventyConfig);
  _configureMissingComponent(eleventyConfig);
}
