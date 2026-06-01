// lib/filters/local-media.js
// Process local media files with eleventy-img

import fs from "fs";
import path from "path";
import Image from "@11ty/eleventy-img";
import { createFallbackImageHtml, shouldBypassEleventyImageProcessing } from "../image-processing.js";
import { getLibRoot } from "../../eject/index.js";

function resolveImageSrc(src) {
  const projectPath = `.${src}`;
  if (fs.existsSync(projectPath)) return projectPath;
  const libPath = path.join(getLibRoot(), src);
  if (fs.existsSync(libPath)) return libPath;
  return projectPath;
}

/**
 * Configure local media filters for Eleventy
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {string} publishFolder - Output folder for the build
 */
export function configureLocalMediaFilters(eleventyConfig, publishFolder = "") {
    const bypassImageProcessing = shouldBypassEleventyImageProcessing();
    if (bypassImageProcessing) {
        console.warn("[marbas:image] Bypassing eleventy-img processing on this runtime.");
    }

    /**
     * Process a local image file and generate responsive versions
     * @param {Object} imageData - Image metadata from YAML
     * @param {Object} options - Processing options (sizes, placeholder_sizes)
     * @returns {Object} - { html: "...", caption: "..." }
     */
    eleventyConfig.addAsyncFilter("processLocalImage", async function(imageData, options) {
        if (!imageData || !imageData.src) {
            return { html: "", caption: "" };
        }

        // Get sizes and widths from options
        const sizes = getMediaSizes(options.sizes, options.placeholder_sizes);
        const widths = getMediaWidths(options.sizes, options.placeholder_sizes);

        if (bypassImageProcessing) {
            let html = createFallbackImageHtml({
                src: imageData.src,
                alt: imageData.alt || "",
                sizes
            });

            if (imageData.enableEnlargement) {
                html = wrapWithModal(html, imageData);
            }

            return {
                html,
                caption: imageData.caption || ""
            };
        }

        // Set output directory
        let outputDir = publishFolder ? `${publishFolder}/` : "";
        outputDir = `./${outputDir}images/`;

        const imageOptions = {
            widths: widths,
            formats: ['webp', 'jpeg'],
            urlPath: "/images/",
            outputDir: outputDir,
            filenameFormat: (id, src, width, format) => {
                return `${imageData.originalId}-${width}w.${format}`;
            }
        };

        try {
            // Process the local image file — check project first, then lib assets
            const metadata = await Image(resolveImageSrc(imageData.src), imageOptions);

            const imageAttributes = {
                alt: imageData.alt || "",
                sizes: sizes,
                loading: "lazy",
                decoding: "async"
            };

            const pictureAttributes = {
                whitespaceMode: "inline"
            };

            let html = Image.generateHTML(metadata, imageAttributes, pictureAttributes);

            // Wrap with modal if enlargement enabled
            if (imageData.enableEnlargement) {
                html = wrapWithModal(html, imageData);
            }

            return {
                html: html,
                caption: imageData.caption || ""
            };

        } catch (error) {
            console.error(`Error processing local image ${imageData.src}:`, error.message);
            return { html: "", caption: "" };
        }
    });

    /**
     * Get video paths (already downloaded, just format output)
     * @param {Object} videoData - Video metadata from YAML
     * @returns {Object} - Formatted video data
     */
    eleventyConfig.addFilter("getLocalVideo", function(videoData) {
        if (!videoData || typeof videoData === 'string') {
            // Fallback for old format (GUID string)
            return {
                webm: { path: "" },
                mp4: { path: "" },
                poster: { path: "" }
            };
        }

        return {
            webm: { path: videoData.webm || "" },
            mp4: { path: videoData.mp4 || "" },
            poster: { path: videoData.poster || "" },
            description: videoData.description || "",
            source: videoData.source || ""
        };
    });
}

/**
 * Wrap image HTML with modal for enlargement
 * @param {string} imgHtml - Image HTML markup
 * @param {Object} imageData - Image metadata
 * @returns {string} - Wrapped HTML
 */
function wrapWithModal(imgHtml, imageData) {
    const modalImageFooter = `
        <div class="image-footer">
            <div class="image-caption">
                ${imageData.caption || ""}
            </div>
            ${imageData.copyright ? `<div class="image-copyright">${imageData.copyright}</div>` : ""}
        </div>
    `;

    const modalImage = `
        <div class="box">
            <div class="box-content csol-hidden">
                <div class="box-content-x">
                    <div class="close"><span class="close_cross">&times;</span></div>
                </div>
                ${imgHtml}
                ${modalImageFooter}
            </div>
        </div>
    `;

    return `<responsive-image-modal3 modal-enabled>
        <div slot="image">${imgHtml}</div>
        <div slot="modal-image">${imgHtml}</div>
    </responsive-image-modal3>`;
}

/**
 * Calculate media sizes for responsive images
 * @param {Array} columnsForEachBreakpoint - Column sizes [xs, sm, md, lg, xl, xxl]
 * @param {Array} placeholderColumnsForEachBreakpoint - Placeholder column sizes
 * @returns {string} - Sizes attribute value
 */
function getMediaSizes(columnsForEachBreakpoint, placeholderColumnsForEachBreakpoint) {
    const widthS = 576;
    const widthSM = 768;
    const widthMD = 992;
    const widthLG = 1200;
    const widthXL = 1400;
    const widthXXL = 2400;

    const sizes = `((min-width: 100px) and (max-width: ${widthS}px)) ${~~widthS/12*columnsForEachBreakpoint[0]}px, ((min-width: ${widthS}px) and (max-width: ${widthSM}px)) ${~~widthSM/12*columnsForEachBreakpoint[0]}px, ((min-width: ${widthSM}px) and (max-width: ${widthMD}px)) ${~~widthMD/12*columnsForEachBreakpoint[1]}px, ((min-width: ${widthMD}px) and (max-width: ${widthLG}px)) ${~~widthLG/12*columnsForEachBreakpoint[2]}px, ((min-width: ${widthLG}px) and (max-width: ${widthXL}px)) ${~~widthXL/12*columnsForEachBreakpoint[3]}px, ((min-width: ${widthXL}px) and (max-width: ${widthXXL}px)) ${~~widthXXL/12*columnsForEachBreakpoint[4]}px, ${~~widthS/12*columnsForEachBreakpoint[0]}px`;

    return sizes;
}

/**
 * Calculate media widths for responsive images
 * @param {Array} columnsForEachBreakpoint - Column sizes [xs, sm, md, lg, xl, xxl]
 * @param {Array} placeholderColumnsForEachBreakpoint - Placeholder column sizes
 * @returns {Array} - Array of widths
 */
function getMediaWidths(columnsForEachBreakpoint, placeholderColumnsForEachBreakpoint) {
    const widthS = 576;
    const widthSM = 768;
    const widthMD = 992;
    const widthLG = 1200;
    const widthXL = 1400;
    const widthXXL = 2400;

    const widths = [
        ~~widthS/12*columnsForEachBreakpoint[0],
        ~~widthSM/12*columnsForEachBreakpoint[1],
        ~~widthMD/12*columnsForEachBreakpoint[2],
        ~~widthLG/12*columnsForEachBreakpoint[3],
        ~~widthXL/12*columnsForEachBreakpoint[4],
        ~~widthXXL/12*columnsForEachBreakpoint[4],
        1400
    ];

    return widths;
}
