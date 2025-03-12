import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAuth } from '@/lib/admin-utils'

// קבלת רשימת הרישומים לטורניר
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Params must be awaited in Next.js 15.1.0
  const unwrappedParams = await params;
  const id = unwrappedParams.id;

  try {
    console.log('GET /api/tournaments/[id]/registrations: Getting registrations for tournament ID:', id);
    
    // אימות הרשאות מנהל רק אם מועברות כותרות אימות
    const isAdmin = validateAdminAuth(request);
    console.log('Is admin request:', isAdmin);
    
    // מצא את כל הרישומים לטורניר
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { 
        tournamentId: id,
      },
      include: {
        player: true,
      },
      orderBy: [
        { isApproved: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    return NextResponse.json({
      registrations,
    });
  } catch (error) {
    console.error('Error fetching tournament registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament registrations' },
      { status: 500 }
    );
  }
} 