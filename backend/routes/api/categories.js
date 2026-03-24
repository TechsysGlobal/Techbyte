import express from 'express';
import prisma from '../../lib/prisma.js';

const router = express.Router();

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

export default router;
