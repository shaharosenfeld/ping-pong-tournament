import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get a properly formatted image URL for avatars
 * Includes improved error handling and path normalization
 */
export function getImageUrl(avatar: string | null | undefined): string {
  // Add console log for debugging
  console.log('Original avatar path:', avatar);
  
  if (!avatar) {
    console.log('Using default placeholder image');
    return '/placeholder-user.jpg'; // Default placeholder image
  }
  
  // Handle URLs that already have http(s)
  if (avatar.startsWith('http')) {
    console.log('Using full URL:', avatar);
    return avatar;
  }
  
  // For uploads folder, ensure it starts with a slash
  if (avatar.startsWith('uploads/')) {
    const path = `/${avatar}`;
    console.log('Fixed uploads path:', path);
    return path;
  }
  
  // If path starts with /uploads, use it directly
  if (avatar.startsWith('/uploads/')) {
    console.log('Using uploads path directly:', avatar);
    return avatar;
  }
  
  // If it's just a filename, add the uploads path
  if (!avatar.includes('/')) {
    const path = `/uploads/${avatar}`;
    console.log('Adding uploads prefix:', path);
    return path;
  }
  
  // If starts with a slash, use as is
  if (avatar.startsWith('/')) {
    console.log('Using path with slash:', avatar);
    return avatar;
  }
  
  // Add a slash for any other case
  const path = `/${avatar}`;
  console.log('Added leading slash:', path);
  return path;
}

/**
 * Calculate win rate percentage for a player
 * @param wins Number of wins
 * @param losses Number of losses
 * @returns Win rate percentage (0-100)
 */
export function getWinRate(wins: number, losses: number): number {
  if (wins + losses === 0) return 0;
  return Math.round((wins / (wins + losses)) * 100);
}

/**
 * Calculate player level based on their percentile rank among all players
 * @param playerRating The player's rating
 * @param allPlayersRatings Array of all players' ratings
 * @returns Player level (1-5)
 */
export function getPlayerLevelByPercentile(playerRating: number, allPlayersRatings: number[]): number {
  if (allPlayersRatings.length === 0) return 1;
  
  // Sort ratings in ascending order
  const sortedRatings = [...allPlayersRatings].sort((a, b) => a - b);
  
  // Find where the player stands
  const playerPosition = sortedRatings.findIndex(rating => rating >= playerRating);
  const position = playerPosition === -1 
    ? sortedRatings.length 
    : playerPosition;
  
  // Calculate percentile (0-100)
  const percentile = (position / sortedRatings.length) * 100;

  // Assign level based on percentile - חלוקה חדשה
  if (percentile >= 80) return 5; // שחקן מקצועי - 20% עליונים
  if (percentile >= 60) return 4; // שחקן מתקדם - 20% הבאים
  if (percentile >= 40) return 3; // שחקן בינוני - 20% הבאים
  if (percentile >= 20) return 2; // שחקן מתחיל - 20% הבאים
  return 1; // שחקן מתחיל חדש - 20% תחתונים
}

/**
 * Get the level description based on player level
 * @param level Player level (1-5)
 * @returns Level description
 */
export function getLevelDescription(level: number): string {
  switch (level) {
    case 5: return "שחקן מקצועי";
    case 4: return "שחקן מתקדם";
    case 3: return "שחקן בינוני";
    case 2: return "שחקן מתחיל";
    case 1: return "שחקן מתחיל חדש";
    default: return "לא ידוע";
  }
}

/**
 * Get rating description based on player rating
 * @param rating Player ELO rating
 * @returns Rating description
 */
export function getRatingDescription(rating: number): string {
  if (rating >= 1500) return "שחקן מקצועי";
  if (rating >= 1350) return "שחקן מתקדם";
  if (rating >= 1200) return "שחקן בינוני";
  if (rating >= 1050) return "שחקן מתחיל";
  return "שחקן מתחיל חדש";
}

/**
 * Get the appropriate CSS class for player level stars
 * @param index Star index (0-4)
 * @param level Player level (1-5)
 * @returns CSS class name
 */
export function getLevelStarClass(index: number, level: number): string {
  if (index >= level) return "text-gray-300"; // Inactive star
  
  if (level === 5) return "text-red-500 dark:text-red-400";
  if (level === 4) return "text-amber-500 dark:text-amber-400";
  if (level === 3) return "text-yellow-500 dark:text-yellow-400";
  if (level === 2) return "text-green-500 dark:text-green-400";
  return "text-blue-500 dark:text-blue-400";
}
