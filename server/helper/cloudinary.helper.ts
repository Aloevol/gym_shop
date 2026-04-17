"use server";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

// Configuration — called lazily before each operation
const configureCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRE;

    if (!cloudName || !apiKey || !apiSecret) throw new Error('Missing Cloudinary environment variables');

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
};

export async function uploadMultipleToCloudinary(files: File[]): Promise<string[]> {
    try {
        if (!files || files.length === 0) {
            console.error("No files provided for upload");
            return [];
        }

        configureCloudinary();

        const uploadPromises = files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            return new Promise<string>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "gym-shop",
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            resolve(result?.secure_url || "");
                        }
                    }
                );
                uploadStream.end(buffer);
            });
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        return uploadedUrls.filter((url) => url !== "");

    } catch (error) {
        console.error("Error uploading multiple files:", error);
        throw error;
    }
}

// Video upload function
export async function uploadVideoToCloudinary(file: File, folder: string = "personal-training/videos"): Promise<{ url: string; public_id: string; duration?: number; format: string }> {
    try {
        if (!file) {
            throw new Error("No file provided for upload");
        }

        // Check if file is a video
        if (!file.type.startsWith('video/')) {
            throw new Error('File must be a video');
        }

        // Check file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            throw new Error('Video file size must be less than 100MB');
        }

        configureCloudinary();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: "video",
                    chunk_size: 6000000, // 6MB chunks for better large file handling
                    eager: [
                        { width: 640, height: 360, crop: "limit", format: "mp4" },
                        { width: 1280, height: 720, crop: "limit", format: "mp4" }
                    ],
                    eager_async: true,
                    quality: "auto",
                    fetch_format: "auto",
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary video upload error:', error);
                        reject(error);
                    } else if (result) {
                        resolve({
                            url: result.secure_url,
                            public_id: result.public_id,
                            duration: result.duration,
                            format: result.format
                        });
                    } else {
                        reject(new Error('Upload failed: No result returned'));
                    }
                }
            );
            uploadStream.end(buffer);
        });

    } catch (error) {
        console.error("Error uploading video:", error);
        throw error;
    }
}

// Image upload function (for training images)
export async function uploadImageToCloudinary(file: File, folder: string = "personal-training/images"): Promise<{ url: string; public_id: string }> {
    try {
        if (!file) {
            throw new Error("No file provided for upload");
        }

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            throw new Error('Image file size must be less than 10MB');
        }

        configureCloudinary();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: "image",
                    quality: "auto",
                    fetch_format: "auto",
                    transformation: [
                        { width: 800, height: 600, crop: "limit" },
                        { quality: "auto" }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary image upload error:', error);
                        reject(error);
                    } else if (result) {
                        resolve({
                            url: result.secure_url,
                            public_id: result.public_id
                        });
                    } else {
                        reject(new Error('Upload failed: No result returned'));
                    }
                }
            );
            uploadStream.end(buffer);
        });

    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "video" = "image"): Promise<boolean> {
    try {
        if (!publicId) {
            throw new Error("No public ID provided for deletion");
        }

        configureCloudinary();

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return result.result === 'ok';

    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return false;
    }
}

// Get video information
export async function getVideoInfo(publicId: string) {
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'video'
        });

        return {
            url: result.secure_url,
            duration: result.duration,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes
        };
    } catch (error) {
        console.error("Error getting video info:", error);
        throw error;
    }
}

// Generate video thumbnail
export async function generateVideoThumbnail(publicId: string, timestamp: number = 1) {
    try {
        const thumbnailUrl = cloudinary.url(publicId, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [
                { width: 800, height: 450, crop: 'fill' },
                { start_offset: timestamp }
            ]
        });

        return thumbnailUrl;
    } catch (error) {
        console.error("Error generating video thumbnail:", error);
        throw error;
    }
}

// Upload multiple images for training
export async function uploadTrainingImages(files: File[]): Promise<string[]> {
    try {
        if (!files || files.length === 0) {
            return [];
        }

        const uploadPromises = files.map(file => uploadImageToCloudinary(file));
        const results = await Promise.all(uploadPromises);

        return results.map(result => result.url);

    } catch (error) {
        console.error("Error uploading training images:", error);
        throw error;
    }
}

// Upload training video
export async function uploadTrainingVideo(file: File): Promise<string> {
    try {
        const result = await uploadVideoToCloudinary(file);
        return result.url;
    } catch (error) {
        console.error("Error uploading training video:", error);
        throw error;
    }
}

// Check if URL is from Cloudinary
export async function isCloudinaryUrl(url: string): Promise<boolean> {
    return url.includes('cloudinary.com') && url.includes('res.cloudinary.com');
}

// Extract public ID from Cloudinary URL
export async function extractPublicIdFromUrl(url: string): Promise<string | null> {
    try {
        const matches = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
        return matches ? matches[1] : null;
    } catch (error) {
        console.error("Error extracting public ID:", error);
        return null;
    }}