import express from 'express';
import prisma from '../../lib/prisma.js';
import cache from '../../lib/cache.js';

const router = express.Router();

// GET /api/brands
router.get('/', async (req, res) => {
    try {
        const cacheKey = 'brands_list';
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' },
        });

        cache.set(cacheKey, brands);
        res.json(brands);
    } catch (err) {
        console.error('GET /api/brands error:', err);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// GET /api/brands/:slug — Brand detail with its products
router.get('/:slug', async (req, res) => {
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: req.params.slug },
        });
        if (!brand) return res.status(404).json({ error: 'Brand not found' });

        const products = await prisma.product.findMany({
            where: { brand: brand.name, published: true },
            orderBy: { title: 'asc' },
        });

        res.json({ brand, products });
    } catch (err) {
        console.error('GET /api/brands/:slug error:', err);
        res.status(500).json({ error: 'Failed to fetch brand' });
    }
});

export default router;
