const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (err) {
        console.error('GET /api/categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
