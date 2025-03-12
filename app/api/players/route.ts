import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createNotification } from '@/lib/db'
import { getPlayerLevelByPercentile } from '@/lib/utils'
import { validateServerAdminToken } from '@/lib/admin-utils'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: {
        rating: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        initials: true,
        level: true,
        bio: true,
        wins: true,
        losses: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Extract all ratings for percentile calculation
    const allRatings = players.map(player => player.rating);

    // Calculate win rates and recalculate levels based on percentiles
    const formattedPlayers = players.map(player => {
      // Recalculate the level based on percentile ranking
      const newLevel = getPlayerLevelByPercentile(player.rating, allRatings);
      
      // Make sure avatar path is properly formatted
      const formattedAvatar = player.avatar 
        ? player.avatar.startsWith('http') 
          ? player.avatar 
          : player.avatar.startsWith('/') 
            ? player.avatar 
            : `/${player.avatar}`
        : null;
      
      return {
        ...player,
        avatar: formattedAvatar,
        level: newLevel, // Update the level based on percentile
        winRate: player.wins + player.losses > 0
          ? Math.round((player.wins / (player.wins + player.losses)) * 100)
          : 0,
        avgScore: Math.round(player.rating / 100) // Simplified average score calculation
      };
    });

    // Save the updated levels back to the database
    await Promise.all(
      formattedPlayers.map(player => 
        prisma.player.update({
          where: { id: player.id },
          data: { 
            level: player.level,
            // Update avatar format in database too
            ...(player.avatar !== players.find(p => p.id === player.id)?.avatar && {
              avatar: player.avatar
            })
          }
        })
      )
    );

    return NextResponse.json(formattedPlayers)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

// הפונקציה לבדיקת הרשאות מנהל
function validateAdminAuth(request: Request): boolean {
  console.log('validateAdminAuth: Checking admin permissions from headers');
  
  // בדיקת הרשאות מנהל - הרחבת הבדיקה לכלול טוקנים שונים
  const authHeader = request.headers.get('Authorization');
  const adminTokenHeader = request.headers.get('X-Admin-Token');
  const isAdminHeader = request.headers.get('X-Is-Admin');
  
  console.log('validateAdminAuth: Auth headers:', { 
    Authorization: authHeader,
    'X-Admin-Token': adminTokenHeader,
    'X-Is-Admin': isAdminHeader
  });
  
  // בדיקה יותר מקיפה - מאפשר אימות גם דרך כותרות מותאמות אישית
  let isAuthenticated = false;
  
  // בדיקת ה-Authorization header הסטנדרטי
  if (authHeader && validateServerAdminToken(authHeader)) {
    console.log('validateAdminAuth: Authentication successful via Authorization header');
    isAuthenticated = true;
  } 
  // בדיקת הכותרת המותאמת אישית
  else if (adminTokenHeader && adminTokenHeader.length >= 10) {
    console.log('validateAdminAuth: Authentication successful via X-Admin-Token header');
    isAuthenticated = true;
  }
  // בדיקה שיש X-Is-Admin וגם טוקן כלשהו
  else if (isAdminHeader === 'true' && (authHeader || adminTokenHeader)) {
    console.log('validateAdminAuth: Authentication successful via X-Is-Admin flag');
    isAuthenticated = true;
  }
  
  if (!isAuthenticated) {
    console.error('validateAdminAuth: Admin permission check failed');
    console.error('Auth header value:', authHeader);
    console.error('X-Admin-Token value:', adminTokenHeader);
    console.error('X-Is-Admin value:', isAdminHeader);
  }
  
  return isAuthenticated;
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/players: Starting request');
    
    // Log all request headers for debugging
    console.log('POST /api/players: All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // בדיקת הרשאות מנהל באמצעות הפונקציה החדשה
    if (!validateAdminAuth(request)) {
      console.error('POST /api/players: Admin permission check failed');
      return NextResponse.json(
        { error: 'אין הרשאות מנהל. נא להתחבר מחדש.' },
        { status: 401 }
      )
    }
    
    console.log('POST /api/players: Authentication successful');
    const body = await request.json()
    console.log('POST /api/players: Received body:', JSON.stringify(body));
    
    const { name, email, phone, avatar, level, bio } = body
    
    // Generate initials from name
    const initials = name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const player = await prisma.player.create({
      data: {
        name,
        email,
        phone,
        avatar,
        initials,
        level: parseInt(level) || 3,
        bio,
      }
    })

    // Create notification for new player
    await createNotification({
      title: 'שחקן חדש נוסף',
      message: `שחקן חדש "${name}" נוסף למערכת`,
      type: 'player'
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
} 