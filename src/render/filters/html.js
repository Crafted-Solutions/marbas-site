// lib/filters/html.js
// SIMPLIFIED VERSION - Removed filters that are no longer needed with embedded data

import { socialIcon } from './social-icons.js';

/**
 * Phone number for a tel: href — keeps a leading "+" and digits only.
 * "030 / 4737 8115" → "03047378115", "+49 (0)30 123-45" → "+493012345".
 * The "(0)" trunk prefix used in international notation is dropped.
 */
export function telHref(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const withoutTrunk = raw.replace(/\(\s*0\s*\)/g, '');
  const digits = withoutTrunk.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? '+' + digits.slice(1).replace(/\+/g, '') : digits.replace(/\+/g, '');
}

function escapeAttributeValue(value) {
  return String(value)
    .replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function configureHtmlFilters(eleventyConfig) {
    // KEEP: htmlAttribute filter - used in component templates
    eleventyConfig.addFilter("htmlAttribute", (attributeName, attributeValue) => {
      // Handle different value types
      let processedValue = attributeValue;

      if (Array.isArray(attributeValue)) {
        processedValue = attributeValue.join(" ");
      }

      // Handle boolean attributes (e.g., disabled, readonly)
      if (typeof processedValue === "boolean") {
        return processedValue ? attributeName : "";
      }

      // Convert numbers to strings
      if (typeof processedValue === "number") {
        processedValue = processedValue.toString();
      }

      // Handle empty values
      if (!processedValue || (typeof processedValue === "string" && processedValue.trim() === "")) {
        return "";
      }

      // Return formatted attribute — value escaped, callers output it with `| safe`
      return `${attributeName}="${escapeAttributeValue(processedValue)}"`;
    });

    eleventyConfig.addFilter("telHref", (value) => telHref(value));
    eleventyConfig.addFilter("socialIcon", (platform) => socialIcon(platform));

    // KEEP: stringify filter for debugging
    eleventyConfig.addFilter('stringify', (data) => {
      return JSON.stringify(data, null, "\t")
    });

    // REMOVED: getComponentObject - componentType now embedded in YAML front matter
    // REMOVED: getClassesStringFromRenderingParameters - classes now pre-computed in YAML
  }
