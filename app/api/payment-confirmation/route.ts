import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.registrationId || !body.paymentMethod || !body.paymentStatus) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה: מזהה הרשמה, שיטת תשלום, וסטטוס תשלום' },
        { status: 400 }
      );
    }

    // Find the registration record
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: body.registrationId },
      include: { tournament: true, player: true }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'הרשמה זו לא נמצאה במערכת' },
        { status: 404 }
      );
    }

    // Check if the payment method matches the supported methods
    if (!['bit', 'paybox', 'credit', 'cash'].includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: 'שיטת תשלום לא נתמכת' },
        { status: 400 }
      );
    }

    // Check for valid status
    if (!['pending', 'confirmed', 'failed', 'refunded'].includes(body.paymentStatus)) {
      return NextResponse.json(
        { error: 'סטטוס תשלום לא חוקי' },
        { status: 400 }
      );
    }

    // Generate a reference number if one is not provided
    const paymentReference = body.paymentReference || 
      `${body.paymentMethod}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create a transaction record
    const transactionStatus = body.paymentStatus === 'confirmed' ? 'completed' : body.paymentStatus;
    
    await prisma.transaction.create({
      data: {
        registrationId: body.registrationId,
        amount: registration.tournament.price || 0,
        currency: 'ILS',
        status: transactionStatus,
        paymentMethod: body.paymentMethod,
        paymentReference: paymentReference,
        externalTransactionId: body.externalTransactionId,
        notes: body.notes || `תשלום טורניר: ${registration.tournament.name}`,
        evidenceUrl: body.evidenceUrl,
        completedAt: body.paymentStatus === 'confirmed' ? new Date() : null,
        processedByAdminId: body.processedByAdminId,
      }
    });

    // Update the registration with payment details
    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { id: body.registrationId },
      data: {
        paymentStatus: body.paymentStatus,
        paymentMethod: body.paymentMethod,
        paymentReference: paymentReference,
        // If payment is confirmed, automatically approve the registration
        isApproved: body.paymentStatus === 'confirmed' ? true : registration.isApproved
      }
    });

    // Add the player to the tournament players list if they're not already there
    if (body.paymentStatus === 'confirmed' && !registration.isApproved) {
      try {
        // Check if player is already in the tournament
        const tournament = await prisma.tournament.findUnique({
          where: { id: registration.tournamentId },
          include: { players: true }
        });
        
        if (tournament && !tournament.players.some(p => p.id === registration.playerId)) {
          // Add player to tournament
          await prisma.tournament.update({
            where: { id: registration.tournamentId },
            data: {
              players: {
                connect: { id: registration.playerId }
              }
            }
          });
          
          console.log(`Player ${registration.playerId} added to tournament ${registration.tournamentId} after payment confirmation`);
          
          // TODO: Send email confirmation to the player
          // In the future, implement email notification here
          // sendConfirmationEmail(registration.email, {
          //   playerName: registration.name,
          //   tournamentName: registration.tournament.name,
          //   tournamentDate: registration.tournament.startDate,
          //   paymentAmount: registration.tournament.price,
          //   paymentMethod: body.paymentMethod,
          //   paymentReference: paymentReference,
          // });
        } else {
          console.log(`Player ${registration.playerId} already in tournament ${registration.tournamentId}`);
        }
      } catch (playerUpdateError) {
        console.error('Error updating tournament players:', playerUpdateError);
        // Continue execution even if player update fails
      }
    }

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
      message: 'תשלום אושר בהצלחה'
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({
      success: false,
      message: 'אירעה שגיאה באישור התשלום'
    }, { status: 500 });
  }
} 