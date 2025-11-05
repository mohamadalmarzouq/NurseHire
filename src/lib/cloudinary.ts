import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  url: string
  publicId: string
  secureUrl: string
}

/**
 * Upload a file to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder path in Cloudinary (e.g., 'nurse-profiles', 'certifications', 'banners')
 * @param fileName - Original file name
 * @param resourceType - Type of resource (image, raw for PDFs/DOCs)
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string,
  fileName: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<UploadResult> {
  try {
    // Determine resource type based on file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const isDocument = ['pdf', 'doc', 'docx'].includes(fileExtension || '')
    const finalResourceType = isDocument ? 'raw' : resourceType

    // Convert buffer to base64 if it's a buffer
    const fileData = Buffer.isBuffer(file) 
      ? `data:${getMimeType(fileName)};base64,${file.toString('base64')}`
      : file

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: finalResourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    })

    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error(`Failed to upload to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

export default cloudinary

