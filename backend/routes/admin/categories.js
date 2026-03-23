const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// GET /admin/categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        // Get product count per category
        const categoriesWithCount = await Promise.all(
            categories.map(async cat => ({
                ...cat,
                productCount: await prisma.product.count({ where: { productCategory: cat.name } }),
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
        const { name, imageUrl } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await prisma.category.create({ data: { name, slug, imageUrl: imageUrl || null } });
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Create category error:', err);
        res.redirect('/admin/categories');
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

module.exports = router;
