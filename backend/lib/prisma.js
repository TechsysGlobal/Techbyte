import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import auditLogExtension from './prismaExtension.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Initialize the v7 client with the Postgres adapter
const basePrisma = new PrismaClient({ adapter });

const prisma = basePrisma.$extends(auditLogExtension);

export { PrismaClient } from '../src/generated/prisma/index.js';
export { Prisma } from '../src/generated/prisma/index.js';
export default prisma;
