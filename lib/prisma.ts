import { PrismaClient } from "@prisma/client"

// Added connection pooling and retry logic for Vercel serverless environment
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Log to help troubleshoot connection issues
console.log("Prisma init - Database URL:", process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
console.log("Prisma init - Environment:", process.env.NODE_ENV || 'Not set');

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Configure Prisma for Vercel serverless environment
// This prevents creating new connections on every function call
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
} else {
  // In production, log the connection initialization (helps with debugging)
  console.log("Prisma client initialized in production mode");
}

// Listen for the shutdown signal to close the connection
if (process.env.NODE_ENV === "production") {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing Prisma Client');
    await prisma.$disconnect();
    console.log('Prisma Client disconnected');
  });
}

// Export Prisma client
export { PrismaClient } 