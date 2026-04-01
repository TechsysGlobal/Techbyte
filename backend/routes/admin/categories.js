import express from 'express';
import prisma from '../../lib/prisma.js';

const router = express.Router();

// GET /admin/categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        // Get product count per category
        const categoriesWithCount = await Promise.all(
            categories.map(async cat => ({
                ...cat,
                productCount: await prisma.product.count({ where: { categoryId: cat.id } }),
            }))
        );
        res.render('admin/categories/list', { categories: categoriesWithCount, error: null });
    } catch (err) {
        res.render('admin/error', { error: 'Failed to load categories' });
    }
});

// POST /admin/categories — Create
router.post('/', async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const imageUrl = req.body.imageUrl;
        if (!name) {
            return res.redirect('/admin/categories');
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await prisma.category.create({ data: { name, slug, imageUrl: imageUrl || null } });
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Create category error:', err);
        res.redirect('/admin/categories');
    }
});

// POST /admin/categories/api — Create via JSON (for product form)
router.post('/api', async (req, res) => {
    try {
        const name = req.body.name?.trim();
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const category = await prisma.category.create({ data: { name, slug } });
        res.json(category);
    } catch (err) {
        console.error('Create category API error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /admin/categories/:id/update
router.post('/:id/update', async (req, res) => {
    try {
        const { name, imageUrl } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await prisma.category.update({ where: { id: req.params.id }, data: { name, slug, imageUrl: imageUrl || null } });
        res.redirect('/admin/categories');
    } catch (err) {
        res.redirect('/admin/categories');
    }
});

// POST /admin/categories/:id/delete
router.post('/:id/delete', async (req, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.redirect('/admin/categories');
    } catch (err) {
        res.redirect('/admin/categories');
    }
});

export default router;
