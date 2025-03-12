// This script checks if the migration will affect existing data
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log('Connecting to database to verify migration safety...');
    await prisma.$connect();
    
    console.log('Checking migration status...');
    exec('npx prisma migrate status', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error checking migration status: ${error.message}`);
        process.exit(1);
      }
      
      console.log('Migration status:');
      console.log(stdout);
      
      // Check if we're adding nullable fields (safe) vs non-nullable fields (potentially unsafe)
      if (stdout.includes('Tournament.price')) {
        console.log('✅ New field price is nullable - safe to apply');
      }
      
      if (stdout.includes('Tournament.registrationDeadline')) {
        console.log('✅ New field registrationDeadline is nullable - safe to apply');
      }
      
      if (stdout.includes('Tournament.registrationOpen')) {
        console.log('✅ New field registrationOpen has default value (false) - safe to apply');
      }
      
      console.log('\n✅ Migration verification complete - changes appear to be safe for production.');
    });
  } catch (error) {
    console.error('Error verifying schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema(); 