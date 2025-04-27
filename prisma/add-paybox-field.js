// Script to directly add payboxPaymentLink field to the Tournament table
// This is used as a temporary workaround for failed migrations in production

const { PrismaClient } = require('@prisma/client');

async function addPayboxField() {
  console.log('Starting database field update script...');
  
  const prisma = new PrismaClient();
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    
    // Create SQL query that safely adds the column if it doesn't exist
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
          RAISE NOTICE 'Column payboxPaymentLink added to Tournament table';
        ELSE
          RAISE NOTICE 'Column payboxPaymentLink already exists in Tournament table';
        END IF;
      END
      $$;
    `;
    
    // Execute the query
    console.log('Executing SQL to add payboxPaymentLink field...');
    await prisma.$executeRawUnsafe(query);
    console.log('✅ SQL executed successfully');
    
  } catch (error) {
    console.error('❌ Error executing database query:', error);
    process.exit(1);
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
  
  console.log('Database field update script completed');
}

// Run the function
addPayboxField()
  .then(() => {
    console.log('Successfully completed the database update');
  })
  .catch((error) => {
    console.error('Failed to complete the database update:', error);
    process.exit(1);
  }); 