/**
 * This script is used to safely run database migrations,
 * especially in production environments like Vercel where
 * database connections have timeouts.
 * 
 * We're now ENABLING migrations in production but with safer parameters.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determine environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

console.log(`Environment: ${isProduction ? 'Vercel Production' : 'Development'}`);

const runMigrationCommands = async () => {
  try {
    console.log('Running database migrations...');
    
    if (isProduction) {
      console.log('⚠️ Running in Vercel production environment');
      
      // Try to deploy migrations or handle failure
      try {
        console.log('Executing: npx prisma migrate deploy');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (migrateError) {
        console.log('❌ Error in database migration: ', migrateError.message);
        console.log('⚠️ Attempting to add missing fields directly...');
        
        // If migration failed, try to add the payboxPaymentLink column directly
        try {
          // Check if the column exists before trying to add it
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
          // Connect to the database and execute a direct query
          const query = `
            DO $$
            BEGIN
              -- Check if the column doesn't exist before adding it
              IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name='Tournament' AND column_name='payboxPaymentLink'
              ) THEN
                -- Add the column if it doesn't exist
                ALTER TABLE "Tournament" ADD COLUMN "payboxPaymentLink" TEXT;
              END IF;
            END
            $$;
          `;
          
          // Execute the query
          console.log('Executing direct SQL to add payboxPaymentLink field...');
          await prisma.$executeRawUnsafe(query);
          console.log('✅ Successfully added missing fields');
          
          await prisma.$disconnect();
        } catch (directQueryError) {
          console.log('❌ Error executing direct query:', directQueryError);
          console.log('⚠️ Continuing build despite migration error. The app might still work if the schema is compatible.');
        }
      }
    } else {
      // In development environment, we can use the normal migration process
      console.log('Executing: npx prisma migrate dev');
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('❌ Error in database operation:', error);
    console.log('⚠️ Continuing build despite migration error. The app might still work if the schema is compatible.');
  }
};

runMigrationCommands(); 