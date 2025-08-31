// Quick database connection test
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try to create the tables
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Job" (
        "id" TEXT NOT NULL,
        "customer_id" TEXT NOT NULL,
        "customer_email" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "location" TEXT,
        "location_lat" DOUBLE PRECISION,
        "location_lng" DOUBLE PRECISION,
        "budget_min" DOUBLE PRECISION,
        "budget_max" DOUBLE PRECISION,
        "currency" TEXT DEFAULT 'LKR',
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "priority" TEXT DEFAULT 'MEDIUM',
        "job_type" TEXT DEFAULT 'ONE_TIME',
        "requirements" TEXT,
        "notes" TEXT,
        "scheduled_at" TIMESTAMP(3),
        "deadline" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "published_at" TIMESTAMP(3),
        "completed_at" TIMESTAMP(3),
        "views" INTEGER NOT NULL DEFAULT 0,
        
        CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('✅ Job table created/verified');
    
    await prisma.$disconnect();
    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    await prisma.$disconnect();
  }
}

testConnection();
