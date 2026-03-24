/**
 * Health check endpoint.
 * Returns database status, uptime, and memory usage.
 */
import express from 'express';
import prisma from '../../lib/prisma.js';

const router = express.Router();

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

export default router;
