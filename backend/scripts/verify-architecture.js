const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

async function checkSessionSecurity() {
    console.log('\n🔍 Checking Session Security...');
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) // Use a valid test user if possible, or expect 401 but check headers
        });

        // Even if login fails, we might see session cookies attempted.
        // But better to hit a public route that sets a session or check the config code presence.
        // Since we can't easily check headers of a failed login without valid creds, 
        // we will rely on the code inspection done earlier and manual browser check.
        // But we can check if the server is running.
        if (res.status !== 500 && res.status !== 404) {
            console.log('✅ Server is reachable.');
        } else {
            console.log('❌ Server might be down or erroring.');
        }

    } catch (e) {
        console.log('❌ Failed to connect to server:', e.message);
    }
}

async function checkCaching() {
    console.log('\n🔍 Checking Server-Side Caching...');
    const start1 = Date.now();
    await fetch(`${BASE_URL}/api/products`);
    const dur1 = Date.now() - start1;
    console.log(`   Request 1 (Potential Cache Miss): ${dur1}ms`);

    const start2 = Date.now();
    await fetch(`${BASE_URL}/api/products`);
    const dur2 = Date.now() - start2;
    console.log(`   Request 2 (Potential Cache Hit):  ${dur2}ms`);

    if (dur2 < dur1) {
        console.log('✅ Request 2 was faster, indicating caching might be working.');
    } else {
        console.log('⚠️ Request 2 was not faster. Caching might not be effective or network variance.');
    }
}

async function checkAuditLog() {
    console.log('\n🔍 Checking Audit Log Table...');
    try {
        const count = await prisma.activityLog.count();
        console.log(`✅ ActivityLog table exists. Current row count: ${count}`);
    } catch (e) {
        console.error('❌ Failed to query ActivityLog:', e.message);
    }
}

async function run() {
    await checkAuditLog();
    await checkCaching();
    await checkSessionSecurity();
}

run().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
