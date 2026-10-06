import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'jtaylzfo',
  api_key: process.env.CLOUDINARY_API_KEY || '945469595287961',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'aqqZ1bD-TxU-PfT8D4zCdCzkmdw',
  secure: true
});

/**
 * Uploads a base64 image data URI to Cloudinary.
 * Returns the secure HTTPS Cloudinary URL.
 * If the image is already a URL, returns it unchanged.
 */
export async function uploadToCloudinary(imageStr: string, folder = 'saoudi_products'): Promise<string> {
  if (!imageStr) return imageStr;

  // If already hosted (http/https/relative path), skip
  if (!imageStr.startsWith('data:image')) {
    return imageStr;
  }

  try {
    const res = await cloudinary.uploader.upload(imageStr, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    return res.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return imageStr; // Fallback
  }
}

export default cloudinary;
