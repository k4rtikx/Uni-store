import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env variables are loaded regardless of evaluation/import order
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

console.log("Cloud Name Loaded:", process.env.CLOUDINARY_CLOUD_NAME ? "Yes" : "No - Check .env file");

/**
 * Configure Cloudinary instance strictly using environment credentials
 */
export const configureCloudinary = () => {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config();

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return {
    cloud_name,
    cloudName: cloud_name,
    api_key,
    apiKey: api_key,
    api_secret,
    apiSecret: api_secret,
  };
};

configureCloudinary();


/**
 * Uploads a file buffer or base64 data URI to Cloudinary with auto-compression.
 * Applies folder: 'reusecampus', format: 'webp', width limit: 800, quality: 'auto'.
 *
 * @param {Buffer|string} fileInput - Buffer from multer or base64 data URI string
 * @param {string} [mimetype='image/jpeg'] - Optional MIME type
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export const uploadToCloudinary = (fileInput, mimetype = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    configureCloudinary();

    const uploadOptions = {
      folder: 'reusecampus',
      resource_type: 'image',
      format: 'webp',
      transformation: [
        { width: 800, crop: 'limit' },
        { quality: 'auto' },
      ],
    };

    if (Buffer.isBuffer(fileInput)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            const err = new Error(error.message || 'Cloudinary upload stream failed');
            err.http_code = error.http_code;
            return reject(err);
          }
          resolve(result);
        }
      );
      uploadStream.end(fileInput);
    } else if (typeof fileInput === 'string') {
      // Handle base64 data URI or remote image URL
      cloudinary.uploader.upload(fileInput, uploadOptions, (error, result) => {
        if (error) {
          const err = new Error(error.message || 'Cloudinary upload failed');
          err.http_code = error.http_code;
          return reject(err);
        }
        resolve(result);
      });
    } else {
      reject(new Error('Invalid file input for Cloudinary upload'));
    }
  });
};

export default cloudinary;
