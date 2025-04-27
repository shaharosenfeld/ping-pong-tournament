import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { validateServerAdminToken } from '@/lib/admin-utils'
import { prisma } from "@/lib/prisma"

// Configure maximum file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024

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
    const registrationId = data.get('registrationId') as string
    const notes = data.get('notes') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing registration ID' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the limit (2MB)' },
        { status: 400 }
      )
    }

    const fileType = file.type
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: { tournament: true }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payments')
    await fs.mkdir(uploadDir, { recursive: true })

    const fileExtension = fileType.split('/')[1] || 'png'
    const uniqueFilename = `payment-${registrationId}-${uuidv4().slice(0, 8)}.${fileExtension}`
    const filePath = join(uploadDir, uniqueFilename)

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, fileBuffer)

    const fileUrl = `/uploads/payments/${uniqueFilename}`

    await prisma.transaction.create({
      data: {
        registrationId: registrationId,
        amount: registration.tournament.price || 0,
        currency: 'ILS',
        status: 'pending',
        paymentMethod: registration.paymentMethod,
        paymentReference: `file-upload-${Date.now()}`,
        notes: notes || 'תשלום עם הוכחת תשלום',
        evidenceUrl: fileUrl,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 