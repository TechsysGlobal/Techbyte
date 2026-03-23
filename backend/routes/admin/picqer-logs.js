const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// Need to match folder depth and layout standards for Admin pages
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20; // Number of items per page
        const skip = (page - 1) * limit;
        const filter = req.query.filter; // e.g. 'webhook'

        // Define the where clause based on the filter
        let whereClause = {};
        if (filter === 'webhook') {
            // Webhook logs from the queue processor don't have an eventType set (it's null)
            // or we could filter out the known manual event types
            whereClause = {
                eventType: null
            };
        } else if (filter === 'manual') {
            whereClause = {
                eventType: { not: null }
            };
        }

        // Fetch paginated logs
        const [logs, totalCount] = await Promise.all([
            prisma.integrationLogs.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.integrationLogs.count({ where: whereClause }) // Get total for pagination logic
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        res.render('admin/picqer-logs/index', {
            title: 'Picqer Sync Logs',
            path: '/admin/picqer-logs',
            logs,
            currentPage: page,
            totalPages,
            totalCount,
            currentFilter: filter
        });
    } catch (error) {
        console.error('Error fetching Picqer exact logs:', error);
        res.status(500).render('admin/error', {
            message: 'Failed to load Picqer sync logs'
        });
    }
});

module.exports = router;
