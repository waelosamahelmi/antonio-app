import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Function to upload image to Supabase Storage
export async function uploadImageToSupabase(file: Express.Multer.File): Promise<string> {
  try {
    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `menu-items/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
}

// Function to delete image from Supabase Storage
export async function deleteImageFromSupabase(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    const filePath = pathSegments.slice(-2).join('/'); // Get 'menu-items/filename'

    const { error } = await supabase.storage
      .from('restaurant-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image from Supabase:', error);
    return false;
  }
}

// Function to ensure storage bucket exists
export async function ensureStorageBucket(): Promise<void> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'restaurant-images');

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('restaurant-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (error && !error.message.includes('already exists')) {
        throw new Error(`Failed to create storage bucket: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    throw error;
  }
}

export { upload };
