/**
 * This script is used to safely run database migrations,
 * especially in production environments like Vercel where
 * database connections have timeouts.
 * 
 * We're now ENABLING migrations in production but with safer parameters.
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

async function main() {
  // Check if we're running on Vercel production
  const isVercelProduction = process.env.VERCEL_ENV === 'production';

  console.log(`Environment: ${isVercelProduction ? 'Vercel Production' : 'Development/Other'}`);
  console.log('Running database migrations...');
  
  try {
    // Use the same command for both environments - without the unsupported flag
    const command = 'npx prisma migrate deploy';
    
    if (isVercelProduction) {
      console.log('⚠️ Running in Vercel production environment');
    }
    
    console.log(`Executing: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Database migrations completed successfully');
    
    // In production, let's generate the Prisma client separately
    if (isVercelProduction) {
      console.log('Generating Prisma client...');
      const { stdout: genStdout, stderr: genStderr } = await execPromise('npx prisma generate');
      
      if (genStdout) console.log(genStdout);
      if (genStderr) console.error(genStderr);
      
      console.log('✅ Prisma client generation completed');
    }
  } catch (error) {
    console.error('❌ Error in database operation:', error);
    
    // In production, don't fail the build but log the error
    if (isVercelProduction) {
      console.error('⚠️ Continuing build despite migration error. The app might still work if the schema is compatible.');
    } else {
      // In development, it's better to fail fast
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error('Unhandled error in migration script:', err);
  process.exit(1);
}); 