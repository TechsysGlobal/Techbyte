import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { performance } from 'perf_hooks';

// Ensure we are using port 5432 for the benchmark as requested
const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10 // Reduced to fit within Supabase connection limits
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runBenchmarks() {
    console.log('🚀 Starting Prisma 7 (pg-adapter) Real-World Benchmarks...\n');
    const results = [];

    try {
        // TEST 1: Cold Start (The Wasm/Binary-free test)
        const t0 = performance.now();
        await prisma.$queryRaw`SELECT 1`;
        const t1 = performance.now();
        results.push({ Test: '1. Cold Start (SELECT 1)', Time_ms: (t1 - t0).toFixed(2) });

        // TEST 2: Large Catalog Fetch (Using v7 Database JOINs)
        // Adapted to TechByte schema: Product -> Category & Brand
        const t2 = performance.now();
        await prisma.product.findMany({
            take: 500,
            relationLoadStrategy: 'join', // Forces DB-level joins, heavily optimized in v7
            include: { 
                category: true,
                brandRel: true
            }
        });
        const t3 = performance.now();
        results.push({ Test: '2. Large Catalog Fetch (500 items + joins)', Time_ms: (t3 - t2).toFixed(2) });

        // TEST 3: High Concurrency Pooling (10 simultaneous buyers)
        const t4 = performance.now();
        const concurrentRequests = Array.from({ length: 10 }).map(() => 
            prisma.product.findFirst()
        );
        await Promise.all(concurrentRequests);
        const t5 = performance.now();
        results.push({ Test: '3. Concurrency (10 simultaneous reads)', Time_ms: (t5 - t4).toFixed(2) });

        // TEST 4: Complex Transaction (Nested Write)
        // Note: Creating a temporary user or finding an existing one for the order
        const t6 = performance.now();
        await prisma.$transaction(async (tx) => {
            // Find any user or create a temporary one for benchmark purposes
            let user = await tx.user.findFirst();
            if (!user) {
                user = await tx.user.create({
                    data: {
                        email: `bench_${Date.now()}@test.com`,
                        companyName: 'Benchmark Corp',
                        companyPhone: '123456',
                        companyAddr: '123 St',
                        country: 'AE',
                        zipCode: '00000',
                        taxId: 'TX123',
                        bankName: 'Bank',
                        bankAddress: 'Addr',
                        bankCountry: 'AE',
                        bankIban: 'IBAN123',
                        ceoName: 'CEO',
                        ceoPhone: '123',
                        ceoEmail: 'ceo@test.com',
                        salesName: 'Sales',
                        salesEmail: 'sales@test.com',
                        salesPhone: '123',
                        purchaseName: 'Purchase',
                        purchaseEmail: 'purchase@test.com',
                        purchasePhone: '123',
                        logisticName: 'Logistic',
                        logisticPhone: '123',
                        personalName: 'Personal',
                        personalPhone: '123'
                    }
                });
            }

            await tx.order.create({
                data: {
                    userId: user.id,
                    currentStatus: 'concept',
                    subtotal: 1000,
                    vatRate: 0.05,
                    vatPrice: 50,
                    shippingPrice: 0,
                    totalAmount: 1050,
                    statusHistory: {
                        create: {
                            status: 'concept',
                            details: { message: 'Benchmark transaction test' }
                        }
                    }
                }
            });
        });
        const t7 = performance.now();
        results.push({ Test: '4. Complex Transaction (Write)', Time_ms: (t7 - t6).toFixed(2) });

        console.table(results);
    } catch (error) {
        console.error('❌ Benchmark error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

runBenchmarks();
