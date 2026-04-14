import imageCompression from 'browser-image-compression';

/**
 * Compress a single image file before uploading to Cloudinary.
 * This keeps uploads within Cloudinary's free-tier bandwidth limits.
 *
 * Default settings:
 * - Max file size: 1MB (Cloudinary free tier is 25 credits/month)
 * - Max dimension: 1920px (sufficient for web display)
 * - Use WebWorker for non-blocking compression
 *
 * @param {File} file - The image file to compress
 * @param {Object} [options] - Override default compression options
 * @returns {Promise<File>} - The compressed image file
 */
const DEFAULT_OPTIONS = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg', // Convert PNGs to JPEG for smaller size
};

export async function compressImage(file, options = {}) {
    // Skip compression for files already under 1MB
    if (file.size <= 1 * 1024 * 1024) {
        return file;
    }

    try {
        const compressed = await imageCompression(file, {
            ...DEFAULT_OPTIONS,
            ...options,
        });
        console.log(
            `[ImageCompression] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${((1 - compressed.size / file.size) * 100).toFixed(0)}% reduction)`,
        );
        return compressed;
    } catch (error) {
        console.warn('[ImageCompression] Compression failed, using original:', error);
        return file; // Fallback to original if compression fails
    }
}

/**
 * Compress multiple image files.
 * @param {File[]} files - Array of image files
 * @param {Object} [options] - Override default compression options
 * @returns {Promise<File[]>} - Array of compressed image files
 */
export async function compressImages(files, options = {}) {
    return Promise.all(files.map((file) => compressImage(file, options)));
}
