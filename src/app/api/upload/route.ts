import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received')
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

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

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Try to use public/uploads first, fallback to /tmp/uploads on Render
    let uploadsDir = join(process.cwd(), 'public', 'uploads')
    let usePublicDir = true
    
    try {
      // Test if we can write to public directory
      if (!existsSync(uploadsDir)) {
        console.log('Creating uploads directory in public...')
        await mkdir(uploadsDir, { recursive: true })
        console.log('Uploads directory created in public')
      } else {
        console.log('Uploads directory already exists in public')
      }
      
      // Test write permissions by creating a test file
      const testFile = join(uploadsDir, '.test-write')
      try {
        await writeFile(testFile, 'test')
        // Clean up test file
        const { unlink } = await import('fs/promises')
        await unlink(testFile).catch(() => {})
        console.log('Write permissions verified for public/uploads')
      } catch (testError) {
        console.warn('Cannot write to public/uploads, trying /tmp/uploads:', testError)
        usePublicDir = false
      }
    } catch (dirError) {
      console.warn('Error with public/uploads, trying /tmp/uploads:', dirError)
      usePublicDir = false
    }
    
    // Fallback to /tmp/uploads if public directory doesn't work
    if (!usePublicDir) {
      uploadsDir = '/tmp/uploads'
      try {
        if (!existsSync(uploadsDir)) {
          console.log('Creating uploads directory in /tmp...')
          await mkdir(uploadsDir, { recursive: true })
          console.log('Uploads directory created in /tmp')
        } else {
          console.log('Uploads directory already exists in /tmp')
        }
      } catch (tmpDirError) {
        console.error('Error creating /tmp/uploads directory:', tmpDirError)
        throw new Error('Failed to create uploads directory in both public and /tmp')
      }
    }
    
    console.log('Using uploads directory:', uploadsDir)

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    
    console.log('Saving file to:', filePath)

    // Convert file to buffer and save
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      console.log('File saved successfully')
    } catch (writeError) {
      console.error('Error writing file:', writeError)
      throw new Error(`Failed to save file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`)
    }

    // Return the public URL
    // If we're using /tmp, we need to use the API route to serve files
    const fileUrl = usePublicDir ? `/uploads/${fileName}` : `/api/static/uploads/${fileName}`
    console.log('File uploaded successfully, URL:', fileUrl)

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    )
  }
}
