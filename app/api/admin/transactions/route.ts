import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateServerAdminToken } from "@/lib/admin-utils";

export async function GET(request: Request) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    if (!validateServerAdminToken(authHeader)) {
      return NextResponse.json({ error: 'אין הרשאות גישה' }, { status: 401 });
    }

    // Get transactions with their registration data
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        registration: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 