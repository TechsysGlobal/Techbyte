/**
 * Health check endpoint.
 * Returns database status, uptime, and memory usage.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

router.get('/', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        },
        database: 'unknown',
    };

    try {
        await prisma.$queryRaw`SELECT 1`;
        health.database = 'connected';
    } catch {
        health.database = 'disconnected';
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

module.exports = router;
