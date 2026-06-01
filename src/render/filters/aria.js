export function configureAriaFilters(eleventyConfig) {
    // Add getAriaLabelAttribute filter
    eleventyConfig.addFilter("getAriaLabelAttribute", (label) => {
      if (Array.isArray(label)) {
        label = label.join(" ");
      }
      // Return the attribute with quotes
      return label != "" ? `aria-label="${label}"` : "";
    });
  }