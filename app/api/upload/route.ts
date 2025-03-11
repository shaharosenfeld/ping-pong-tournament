import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { validateServerAdminToken } from '@/lib/admin-utils'

export async function POST(request: NextRequest) {
  try {
    // בדיקת הרשאות מנהל
    const authHeader = request.headers.get('Authorization')
    if (!validateServerAdminToken(authHeader)) {
      console.error('Admin permission check failed')
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      )
    }
    
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get file extension
    const originalName = file.name
    const ext = originalName.split('.').pop()
    
    // Generate unique filename
    const filename = `${uuidv4()}.${ext}`
    
    // Save to public/uploads directory
    const path = join(process.cwd(), 'public/uploads', filename)
    await writeFile(path, buffer)
    
    // Return the URL
    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      success: true 
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 