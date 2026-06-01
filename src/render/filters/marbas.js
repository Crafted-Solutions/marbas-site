// lib/filters/marbas.js
// DEPRECATED - Media filters moved to local-media.js
// This file kept for backward compatibility during transition

export function configureMarbasFilters(eleventyConfig, marbasConf, marbasApi = null, publishFolder = "") {
    // No filters configured - all media now processed at import time
    // Media filters moved to lib/filters/local-media.js

    console.log("  Marbas filters: No API-based filters configured (media now local)");

    return {};
}
