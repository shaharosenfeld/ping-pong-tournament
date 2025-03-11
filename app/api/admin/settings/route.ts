import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get system settings
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findFirst()
    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// Update system settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { siteName, logoUrl, primaryColor, language, welcomeMessage } = body

    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 }, // Assuming we only have one settings record
      update: {
        siteName,
        logoUrl,
        primaryColor,
        language,
        welcomeMessage
      },
      create: {
        id: 1,
        siteName,
        logoUrl,
        primaryColor,
        language,
        welcomeMessage
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
} 