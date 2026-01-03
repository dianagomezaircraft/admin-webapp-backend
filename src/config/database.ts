import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a PostgreSQL connection pool with explicit configuration
const pool = new Pool({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.tllcfupbarosdeeujakl',
  password: 'airtooradmin1',
  database: 'postgres',
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with the adapter
export const prisma = new PrismaClient({
  adapter: adapter,
  log: ['query', 'error', 'warn'],
});

// Function to test database connection
async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export default testDatabaseConnection;