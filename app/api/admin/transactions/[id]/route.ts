import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateServerAdminToken } from "@/lib/admin-utils";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    if (!validateServerAdminToken(authHeader)) {
      return NextResponse.json({ error: 'אין הרשאות גישה' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing transaction ID' },
        { status: 400 }
      );
    }

    if (!body.status || !['pending', 'completed', 'failed', 'refunded'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { registration: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update the transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: body.status,
        completedAt: body.status === 'completed' ? new Date() : transaction.completedAt,
        processedByAdminId: authHeader?.split(' ')[1] || null, // Store admin token as reference
      },
    });

    // If the status is updated to 'completed', also update the registration status and add player to tournament
    if (body.status === 'completed') {
      // Update registration status
      await prisma.tournamentRegistration.update({
        where: { id: transaction.registrationId },
        data: {
          paymentStatus: 'confirmed',
          isApproved: true,
        },
      });

      // Add player to tournament if not already added
      const registration = await prisma.tournamentRegistration.findUnique({
        where: { id: transaction.registrationId },
        include: { tournament: { include: { players: true } } },
      });

      if (registration && 
          !registration.tournament.players.some((p: { id: string }) => p.id === registration.playerId)) {
        await prisma.tournament.update({
          where: { id: registration.tournamentId },
          data: {
            players: {
              connect: { id: registration.playerId },
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
} 