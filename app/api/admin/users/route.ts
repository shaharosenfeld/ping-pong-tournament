import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateServerAdminToken } from '@/lib/admin-utils'

const prisma = new PrismaClient()

// Get all users
export async function GET(request: Request) {
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Create new user
export async function POST(request: Request) {
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

    const body = await request.json()
    const { name, email, password, role } = body

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Note: In production, password should be hashed
        role,
        active: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// Update user
export async function PUT(request: Request) {
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

    const body = await request.json()
    const { id, name, email, password, role, active } = body

    const updateData: any = {
      name,
      email,
      role,
      active
    }

    if (password) {
      updateData.password = password // Note: In production, password should be hashed
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// Delete user
export async function DELETE(request: Request) {
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
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
} 