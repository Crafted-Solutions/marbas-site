// lib/filters/html.js
// SIMPLIFIED VERSION - Removed filters that are no longer needed with embedded data

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

    // KEEP: stringify filter for debugging
    eleventyConfig.addFilter('stringify', (data) => {
      return JSON.stringify(data, null, "\t")
    });

    // REMOVED: getComponentObject - componentType now embedded in YAML front matter
    // REMOVED: getClassesStringFromRenderingParameters - classes now pre-computed in YAML
  }
