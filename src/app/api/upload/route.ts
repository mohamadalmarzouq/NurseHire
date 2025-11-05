import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received')
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const folder: string | null = data.get('folder') as string | null // Optional folder parameter

    if (!file) {
      console.error('No file in request')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('File received:', { name: file.name, size: file.size, type: file.type })

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, and WebP files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max for most files, 2MB for banners)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isBanner = folder === 'banners'
    const maxSize = isBanner ? 2 * 1024 * 1024 : 5 * 1024 * 1024 // 2MB for banners, 5MB for others
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.` },
        { status: 400 }
      )
    }

    // Determine folder based on file type or provided folder
    let uploadFolder = folder || 'general-uploads'
    
    // If no folder specified, organize by file type
    if (!folder) {
      const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')
      const isDocument = ['pdf', 'doc', 'docx'].includes(fileExtension || '')
      
      if (isImage) {
        uploadFolder = 'nurse-profiles' // Default for images, can be overridden
      } else if (isDocument) {
        uploadFolder = 'certifications' // Default for documents
      }
    }

    console.log('Uploading to Cloudinary folder:', uploadFolder)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    try {
      const result = await uploadToCloudinary(
        buffer,
        uploadFolder,
        file.name
      )

      console.log('File uploaded successfully to Cloudinary:', result.secureUrl)

      return NextResponse.json({
        success: true,
        fileUrl: result.secureUrl, // Use secure URL (HTTPS)
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        publicId: result.publicId, // Store public ID for potential deletion later
      })

    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError)
      throw cloudinaryError
    }

  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
    console.error('Error details:', errorMessage)
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
