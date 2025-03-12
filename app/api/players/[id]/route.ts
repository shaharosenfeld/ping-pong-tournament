import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateServerAdminToken, validateAdminAuth } from '@/lib/admin-utils'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  console.log(`API GET request for player with ID: ${id}`)
  
  if (!id) {
    console.error('Player ID is missing')
    return NextResponse.json(
      { error: 'Player ID is required' },
      { status: 400 }
    )
  }
  
  try {
    const player = await prisma.player.findUnique({
      where: { id }
    })
    
    if (!player) {
      console.log(`Player not found with ID: ${id}`)
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }
    
    console.log(`Successfully retrieved player: ${id}`)
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  console.log(`API PUT request for player with ID: ${id}`)
  
  try {
    // בדיקת הרשאות מנהל
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Validate that token exists and starts with admin-
    if (!token || !token.startsWith('admin-')) {
      console.error('Authentication failed: Invalid token format');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    const body = await request.json()
    const { name, email, phone, avatar, level, bio } = body

    // Generate initials from name if name is provided
    const updateData: any = {
      email,
      phone,
      avatar,
      level: level ? parseInt(level) : undefined,
      bio
    }

    if (name) {
      updateData.name = name
      updateData.initials = name
        .split(' ')
        .map((part: string) => part?.[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData
    })

    console.log(`Successfully updated player: ${id}`)
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json(
      { error: 'Failed to update player', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  
  console.log(`API DELETE request for player with ID: ${id}`)
  
  try {
    // Log all request headers for debugging
    console.log('DELETE /api/players/[id]: All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // בדיקת הרשאות מנהל - השתמש בפונקציה החדשה
    if (!validateAdminAuth(request)) {
      console.error('DELETE /api/players/[id]: Admin permission check failed');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      );
    }
    
    console.log('DELETE /api/players/[id]: Authentication successful');
    
    await prisma.player.delete({
      where: { id }
    })

    console.log(`Successfully deleted player: ${id}`)
    return NextResponse.json({ message: 'Player deleted successfully' })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json(
      { error: 'Failed to delete player', details: (error as Error).message },
      { status: 500 }
    )
  }
} 