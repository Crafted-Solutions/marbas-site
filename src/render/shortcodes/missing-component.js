import { escapeHtml } from '../html-escape.js';

/**
 * Registers the `renderMissingComponent` shortcode.
 *
 * When a page references a component that resolves to no template, the template
 * falls through to this shortcode. In development it renders a visible
 * placeholder; in any other environment it renders nothing. Each unique
 * (environment, page, placeholder, componentType) combination is warned about
 * once.
 *
 * @param {object} eleventyConfig
 */
export function registerMissingComponentShortcode(eleventyConfig) {
  const warned = new Set();

  eleventyConfig.addShortcode('renderMissingComponent', (componentType, placeholderName = '', pagePath = '', env = 'development') => {
    const ct = String(componentType || '').trim() || 'UnknownComponent';
    const key = [env, pagePath, placeholderName, ct].join('::');
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[missing-component] componentType=${ct} placeholder=${placeholderName || '-'} page=${pagePath || '-'} environment=${env}`);
    }
    if (env !== 'development') return '';
    return `<div class="c-missing-component" data-missing-component="${escapeHtml(ct)}">
  <strong>Fehlende Komponente: ${escapeHtml(ct)}</strong>
  <p>Diese Komponente wurde im Projekt nicht gefunden und wird nur im Development als Platzhalter angezeigt.</p>
</div>`;
  });
}
