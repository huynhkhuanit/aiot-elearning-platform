/**
 * Cloudinary Configuration
 * 
 * This file configures Cloudinary for image uploads
 * Used for: Avatar uploads, course thumbnails, etc.
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary only if environment variables are available
// This allows the app to build even without Cloudinary config
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS
  });
}

// Helper to ensure Cloudinary is configured
function ensureCloudinaryConfig() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not defined in environment variables');
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error('CLOUDINARY_API_KEY is not defined in environment variables');
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_API_SECRET is not defined in environment variables');
  }
  // Re-configure if needed
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload image to Cloudinary
 * @param fileBuffer - File buffer from FormData
 * @param folder - Cloudinary folder path (e.g., 'dhvlearnx/avatars')
 * @param publicId - Optional custom public_id
 * @returns Upload result with URL
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'dhvlearnx/uploads',
  publicId?: string
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}> {
  ensureCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        // Transformations applied on upload
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed with no result'));
        }
      }
    );

    // Write buffer to upload stream
    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public_id (e.g., 'dhvlearnx/avatars/abc123')
 */
export async function deleteImage(publicId: string): Promise<void> {
  ensureCloudinaryConfig();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

/**
 * Generate optimized image URL with transformations
 * @param publicId - Cloudinary public_id
 * @param transformations - Array of transformations
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: Record<string, any>[] = []
): string {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      ...transformations,
    ],
    secure: true,
  });
}

/**
 * Generate avatar URL with default transformations
 * @param publicId - Cloudinary public_id
 * @param size - Avatar size (default: 200)
 * @returns Optimized avatar URL
 */
export function getAvatarUrl(publicId: string, size: number = 200): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: size, height: size, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
      { radius: 'max' }, // Make it circular
    ],
    secure: true,
  });
}

export default cloudinary;
