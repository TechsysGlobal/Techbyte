/**
 * Audit log cleanup script.
 * Deletes activity logs older than the specified retention period.
 *
 * Usage: node scripts/cleanupAuditLogs.js [--days=90]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Parse --days argument (default: 90)
    const daysArg = process.argv.find(a => a.startsWith('--days='));
    const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    console.log(`Deleting audit logs older than ${days} days (before ${cutoff.toISOString()})...`);

    const result = await prisma.activityLog.deleteMany({
        where: {
            createdAt: { lt: cutoff },
        },
    });

    console.log(`Deleted ${result.count} audit log entries.`);
}

main()
    .catch((e) => {
        console.error('Cleanup failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
