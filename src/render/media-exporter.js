// lib/media-exporter.js
// Handles downloading and storing media files during import

import fs from 'node:fs';
import path from 'node:path';
import https from 'https';
import http from 'http';

const MEDIA_DIR = './_media';
const IMAGES_DIR = `${MEDIA_DIR}/images`;
const VIDEOS_DIR = `${MEDIA_DIR}/videos`;

/**
 * MediaExporter class for downloading and processing media during import
 */
export class MediaExporter {
    #api;
    #config;
    #downloadedMedia = new Map(); // Cache to avoid re-downloading
    #agent;

    /**
     * Create a new MediaExporter instance
     * @param {Object} config - Configuration object
     * @param {Object} api - DataBrokerAPI instance
     */
    constructor(config, api) {
        this.#config = config;
        this.#api = api;
        this.#ensureDirectories();

        // Set up HTTP/HTTPS agent
        this.#agent = config.useHttps
            ? new https.Agent({ rejectUnauthorized: false })
            : new http.Agent({ keepAlive: true, rejectUnauthorized: false });
    }

    /**
     * Ensure media directories exist
     * @private
     */
    #ensureDirectories() {
        [MEDIA_DIR, IMAGES_DIR, VIDEOS_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }

    /**
     * Process an image GUID: download file and return metadata
     * @param {string} imageGuid - Image grain GUID
     * @param {string} lang - Language code
     * @returns {Promise<Object|null>} - Image metadata with local path
     */
    async processImage(imageGuid, lang) {
        if (!imageGuid) return null;

        // Check cache
        const cacheKey = `${imageGuid}-${lang}`;
        if (this.#downloadedMedia.has(cacheKey)) {
            console.log(`  📦 Using cached image: ${imageGuid}`);
            return this.#downloadedMedia.get(cacheKey);
        }

        try {
            console.log(`  🖼️  Processing image: ${imageGuid} (${lang})`);

            // Set API language
            this.#api.language = lang;

            // Get the image grain
            const imageGrain = await this.#api.getGrain(imageGuid);
            if (!imageGrain) {
                console.warn(`  ⚠️  Image grain not found: ${imageGuid}`);
                return null;
            }

            // Get traits for the image
            const traits = await this.#api.getGrainTraits(imageGrain);
            if (!traits) {
                console.warn(`  ⚠️  No traits found for image: ${imageGuid}`);
                return null;
            }

            // Extract the actual file GUID from traits
            const fileGuid = this.#findTraitValue(traits, "Image");
            if (!fileGuid) {
                console.warn(`  ⚠️  No file reference in image traits: ${imageGuid}`);
                return null;
            }

            // Get file information
            const fileInfo = await this.#getFileInfo(fileGuid);
            if (!fileInfo) {
                console.warn(`  ⚠️  Could not get file info: ${fileGuid}`);
                return null;
            }

            // Download the file
            const localPath = await this.#downloadImageFile(fileGuid, fileInfo.format);
            if (!localPath) {
                console.warn(`  ⚠️  Failed to download image: ${fileGuid}`);
                return null;
            }

            // Build metadata object
            const metadata = {
                src: localPath,
                alt: this.#findTraitValue(traits, "AltText", ""),
                altCulture: lang,
                caption: this.#findTraitValue(traits, "Caption", ""),
                captionCulture: lang,
                copyright: this.#findTraitValue(traits, "Copyright", ""),
                description: this.#findTraitValue(traits, "Description", ""),
                source: this.#findTraitValue(traits, "Source", ""),
                enableEnlargement: this.#findTraitValue(traits, "EnableImageEnlargement", false),
                format: fileInfo.format,
                mimeType: fileInfo.mimeType,
                originalId: imageGuid,
                fileId: fileGuid
            };

            // Cache the metadata
            this.#downloadedMedia.set(cacheKey, metadata);
            console.log(`  ✅ Image processed: ${path.basename(localPath)}`);

            return metadata;

        } catch (error) {
            console.error(`  ❌ Error processing image ${imageGuid}:`, error.message);
            return null;
        }
    }

    /**
     * Process a video GUID: download all files and return metadata
     * @param {string} videoGuid - Video grain GUID
     * @returns {Promise<Object|null>} - Video metadata with local paths
     */
    async processVideo(videoGuid) {
        if (!videoGuid) return null;

        // Check cache
        if (this.#downloadedMedia.has(videoGuid)) {
            console.log(`  📦 Using cached video: ${videoGuid}`);
            return this.#downloadedMedia.get(videoGuid);
        }

        try {
            console.log(`  🎬 Processing video: ${videoGuid}`);

            // Get video grain and traits
            const videoGrain = await this.#api.getGrain(videoGuid);
            if (!videoGrain) {
                console.warn(`  ⚠️  Video grain not found: ${videoGuid}`);
                return null;
            }

            const traits = await this.#api.getGrainTraits(videoGrain);
            if (!traits) {
                console.warn(`  ⚠️  No traits found for video: ${videoGuid}`);
                return null;
            }

            // Extract video file GUIDs
            const webmGuid = this.#findTraitValue(traits, "VideoWebM");
            const mp4Guid = this.#findTraitValue(traits, "VideoMP4");
            const posterGuid = this.#findTraitValue(traits, "PosterImage");

            // Download all files
            const webmPath = webmGuid ? await this.#downloadVideoFile(webmGuid, "webm") : null;
            const mp4Path = mp4Guid ? await this.#downloadVideoFile(mp4Guid, "mp4") : null;
            const posterPath = posterGuid ? await this.#downloadImageFile(posterGuid, "jpg") : null;

            // Build metadata object
            const metadata = {
                webm: webmPath,
                mp4: mp4Path,
                poster: posterPath,
                description: this.#findTraitValue(traits, "Description", ""),
                source: this.#findTraitValue(traits, "Source", ""),
                descriptionEasyLanguage: this.#findTraitValue(traits, "DescriptionEasyLanguage", ""),
                originalId: videoGuid
            };

            // Cache the metadata
            this.#downloadedMedia.set(videoGuid, metadata);
            console.log(`  ✅ Video processed: ${videoGuid}`);

            return metadata;

        } catch (error) {
            console.error(`  ❌ Error processing video ${videoGuid}:`, error.message);
            return null;
        }
    }

    /**
     * Get file information (format, mime type)
     * @param {string} fileGuid - File GUID
     * @returns {Promise<Object|null>} - File info object
     * @private
     */
    async #getFileInfo(fileGuid) {
        try {
            const fileGrain = await this.#api.getGrain(fileGuid);
            const fileTraits = await this.#api.getGrainTraits(fileGrain);

            const mimeType = this.#findTraitValue(fileTraits, "MimeType");
            let format = "";

            if (mimeType) {
                switch (mimeType) {
                    case "image/jpeg":
                        format = "jpg";
                        break;
                    case "image/png":
                        format = "png";
                        break;
                    case "image/gif":
                        format = "gif";
                        break;
                    case "image/webp":
                        format = "webp";
                        break;
                    case "video/mp4":
                        format = "mp4";
                        break;
                    case "video/webm":
                        format = "webm";
                        break;
                    default:
                        format = "unknown";
                }
            }

            return { mimeType, format };

        } catch (error) {
            console.error(`Error getting file info for ${fileGuid}:`, error.message);
            return null;
        }
    }

    /**
     * Download an image file
     * @param {string} fileGuid - File GUID
     * @param {string} format - File format extension
     * @returns {Promise<string|null>} - Local path or null
     * @private
     */
    async #downloadImageFile(fileGuid, format) {
        const filename = `${fileGuid}.${format}`;
        const localPath = `${IMAGES_DIR}/${filename}`;

        // Check if already exists
        if (fs.existsSync(localPath)) {
            console.log(`    📄 Image already exists: ${filename}`);
            return `/_media/images/${filename}`;
        }

        const success = await this.#downloadFile(fileGuid, localPath);
        return success ? `/_media/images/${filename}` : null;
    }

    /**
     * Download a video file
     * @param {string} fileGuid - File GUID
     * @param {string} format - File format extension
     * @returns {Promise<string|null>} - Local path or null
     * @private
     */
    async #downloadVideoFile(fileGuid, format) {
        const filename = `${fileGuid}.${format}`;
        const localPath = `${VIDEOS_DIR}/${filename}`;

        // Check if already exists
        if (fs.existsSync(localPath)) {
            console.log(`    📄 Video already exists: ${filename}`);
            return `/_media/videos/${filename}`;
        }

        const success = await this.#downloadFile(fileGuid, localPath);
        return success ? `/_media/videos/${filename}` : null;
    }

    /**
     * Download a file from Marbas
     * @param {string} fileGuid - File GUID
     * @param {string} destPath - Destination path (absolute or relative)
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async #downloadFile(fileGuid, destPath) {
        try {
            // Build URL to file
            const fileUrl = `${this.#config.authModule.brokerUrl.replace(/\/api\/marbas\/?$/, "")}/api/marbas/File/${fileGuid}/Attachment`;

            console.log(`    ⬇️  Downloading: ${path.basename(destPath)}`);

            // Create request with authentication
            const urlObj = new URL(fileUrl);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'Authorization': `${this.#config.authModule.authType} ${this.#config.authModule.authToken}`
                },
                agent: this.#agent
            };

            // Use https or http based on protocol
            const httpModule = urlObj.protocol === 'https:' ? https : http;

            return new Promise((resolve, reject) => {
                const req = httpModule.request(options, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                        return;
                    }

                    const fileStream = fs.createWriteStream(destPath);
                    res.pipe(fileStream);

                    fileStream.on('finish', () => {
                        fileStream.close();

                        // Verify file was written
                        const stats = fs.statSync(destPath);
                        if (stats.size === 0) {
                            fs.unlinkSync(destPath);
                            reject(new Error('Downloaded file is empty'));
                        } else {
                            console.log(`    ✓ Downloaded: ${path.basename(destPath)} (${this.#formatBytes(stats.size)})`);
                            resolve(true);
                        }
                    });

                    fileStream.on('error', (err) => {
                        fs.unlinkSync(destPath);
                        reject(err);
                    });
                });

                req.on('error', reject);
                req.setTimeout(60000, () => {
                    req.destroy();
                    reject(new Error('Download timeout'));
                });

                req.end();
            });

        } catch (error) {
            console.error(`    ❌ Download failed: ${error.message}`);
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            return false;
        }
    }

    /**
     * Find a trait value by name
     * @param {Object} traits - Object of traits
     * @param {string} name - Trait name
     * @param {*} defaultValue - Default value if trait not found
     * @returns {*} Trait value or default
     * @private
     */
    #findTraitValue(traits, name, defaultValue = null) {
        if (traits && traits[name] && Array.isArray(traits[name]) && traits[name].length > 0) {
            return traits[name][0].value;
        }
        return defaultValue;
    }

    /**
     * Format bytes to human-readable size
     * @param {number} bytes - Byte count
     * @returns {string} - Formatted string
     * @private
     */
    #formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get download statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        return {
            totalDownloaded: this.#downloadedMedia.size,
            cached: Array.from(this.#downloadedMedia.keys())
        };
    }

    /**
     * Clear download cache
     */
    clearCache() {
        this.#downloadedMedia.clear();
    }
}
