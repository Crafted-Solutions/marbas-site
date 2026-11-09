/**
 * Inactive components (Task 211).
 *
 * A component entry in a placeholder list can carry `active: false`. It stays in the page file (the editor keeps
 * showing it) but is never rendered — in no environment, and not in the preview. A missing field means active, so
 * existing pages build exactly as before.
 *
 * The filter runs as an Eleventy preprocessor, i.e. before any template sees the page data. That way every
 * consumer of `Placeholder_*` is covered at once — the render loop (placeholder.njk), the H1 decision in base.njk
 * (an inactive Hero must not suppress the page title), the layouts' `Placeholder_Hero[0].flushNav` / length checks,
 * and layouts a project has ejected.
 */

/**
 * @param {unknown} component
 * @returns {boolean}  false only for an object with `active` set to the boolean false
 */
export function isComponentActive(component) {
  return !(component && typeof component === 'object' && component.active === false);
}

/**
 * Replaces every `Placeholder_*` array in `data` with a copy without inactive components.
 * The arrays are replaced, not spliced — the parsed front matter object may be shared (Eleventy caches it).
 *
 * @param {Record<string, unknown>} data
 * @returns {number}  how many components were removed
 */
export function filterInactiveComponents(data) {
  if (!data || typeof data !== 'object') return 0;
  let removed = 0;
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (!key.startsWith('Placeholder_') || !Array.isArray(value)) continue;
    const active = value.filter(isComponentActive);
    if (active.length !== value.length) {
      removed += value.length - active.length;
      data[key] = active;
    }
  }
  return removed;
}

/**
 * @param {object} eleventyConfig
 */
export function addActiveComponentsPreprocessor(eleventyConfig) {
  eleventyConfig.addPreprocessor('marbas-active-components', '*', (data, content) => {
    filterInactiveComponents(data);
    return content;
  });
}
