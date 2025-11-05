import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary - ensure it's configured on each call
function ensureCloudinaryConfig() {
  // Check if CLOUDINARY_URL is set (preferred method - single variable)
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  
  if (cloudinaryUrl) {
    // The SDK automatically reads CLOUDINARY_URL from environment
    // Just ensure secure is enabled
    cloudinary.config({
      secure: true,
    })
    console.log('Using CLOUDINARY_URL for configuration')
    // Extract cloud name from URL for logging (format: cloudinary://key:secret@cloud_name)
    const match = cloudinaryUrl.match(/@([^\/]+)/)
    return { cloudName: match ? match[1] : 'from-url', apiKey: 'from-url', apiSecret: '***' }
  }

  // Fallback to individual variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are missing. Please set either CLOUDINARY_URL or all of: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.')
  }

  // Configure using individual variables
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return { cloudName, apiKey, apiSecret: '***' } // Don't log secret
}

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
    // Ensure Cloudinary is configured before uploading
    const config = ensureCloudinaryConfig()
    console.log('Cloudinary config verified:', { cloudName: config.cloudName, apiKey: config.apiKey })
    
    // Determine resource type based on file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const isDocument = ['pdf', 'doc', 'docx'].includes(fileExtension || '')
    const finalResourceType = isDocument ? 'raw' : resourceType

    console.log('Uploading file:', { fileName, folder, resourceType: finalResourceType, size: Buffer.isBuffer(file) ? file.length : 'unknown' })

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
    
    // Provide more detailed error information
    if (error instanceof Error) {
      // Check for specific Cloudinary errors
      if (error.message.includes('Invalid Signature')) {
        throw new Error('Cloudinary authentication failed. Please verify your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are correct.')
      }
      if (error.message.includes('401')) {
        throw new Error('Cloudinary authentication failed. Please check your API credentials.')
      }
      throw new Error(`Failed to upload to Cloudinary: ${error.message}`)
    }
    
    throw new Error(`Failed to upload to Cloudinary: Unknown error`)
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

