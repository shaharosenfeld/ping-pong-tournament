// This script performs a safety check before running migrations
const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function safeMigrate() {
  try {
    console.log('Checking current database connection...');
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful.');
    
    // Check if this is a production environment
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    
    if (isProd) {
      console.log('Running in production environment. Checking for pending migrations...');
      
      // First just check the status without applying migrations
      exec('npx prisma migrate status', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error checking migration status: ${error.message}`);
          process.exit(1);
        }
        
        if (stderr) {
          console.error(`Migration status check stderr: ${stderr}`);
        }
        
        console.log('Migration status check results:');
        console.log(stdout);
        
        // Now deploy the migrations
        console.log('Applying migrations...');
        exec('npx prisma migrate deploy', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error deploying migrations: ${error.message}`);
            process.exit(1);
          }
          
          console.log('Migration applied successfully:');
          console.log(stdout);
          
          if (stderr) {
            console.warn(`Migration warning: ${stderr}`);
          }
          
          process.exit(0);
        });
      });
    } else {
      console.log('Not in production. Running standard migration...');
      exec('npx prisma migrate deploy', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error deploying migrations: ${error.message}`);
          process.exit(1);
        }
        
        console.log('Migration applied successfully:');
        console.log(stdout);
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

safeMigrate(); 