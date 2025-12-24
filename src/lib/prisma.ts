import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a PostgreSQL connection pool with explicit configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'admin_portal',
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with the adapter
export const prisma = new PrismaClient({
  adapter: adapter,
  log: ['query', 'error', 'warn'],
});

export default prisma;