import { NextResponse } from 'next/server'
import { calculatePlayerLevels, createNotification } from '@/lib/db'

export async function POST() {
  try {
    // Calculate new levels for all players based on percentile ranking
    await calculatePlayerLevels()
    
    // Create notification about the recalculation
    await createNotification({
      title: "עדכון רמות שחקנים",
      message: "רמות כל השחקנים חושבו מחדש לפי שיטת האחוזונים.",
      type: "info"
    })
    
    return NextResponse.json({ message: 'Player levels recalculated successfully' })
  } catch (error) {
    console.error('Error recalculating player levels:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate player levels', details: (error as Error).message },
      { status: 500 }
    )
  }
} 