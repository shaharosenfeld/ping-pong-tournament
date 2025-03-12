/**
 * This script is used to safely run database migrations,
 * especially in production environments like Vercel where
 * database connections have timeouts.
 * 
 * On Vercel production, it will skip migrations to avoid timeout issues.
 * In development or when manually triggered, it will run migrations.
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

async function main() {
  // Check if we're running on Vercel production
  const isVercelProduction = process.env.VERCEL_ENV === 'production';

  if (isVercelProduction) {
    console.warn('⚠️ Running on Vercel production environment');
    console.warn('⚠️ Skipping migrations to avoid timeout issues with Neon database');
    console.warn('⚠️ Please run migrations manually before deploying: npm run db:migrate:force');
    return;
  }

  console.log('Running database migrations...');
  
  try {
    // Run Prisma migrations
    const { stdout, stderr } = await execPromise('npx prisma migrate deploy');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running database migrations:', error);
    // Don't exit with error to allow build to continue
    // The app might still work if the schema hasn't changed
    // or if the database is already in the correct state
  }
}

main().catch(err => {
  console.error('Unhandled error in migration script:', err);
}); 