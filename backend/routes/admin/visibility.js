import express from 'express';
import prisma from '../../lib/prisma.js';

const router = express.Router();

// GET /admin/visibility — Show rules + create form
router.get('/', async (req, res) => {
    try {
        // Get all existing rules
        const rules = await prisma.visibilityRule.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Get all distinct product tags from Product.tags column (comma-separated)
        const allProducts = await prisma.product.findMany({
            select: { tags: true },
            where: { tags: { not: null } },
        });
        const productTagSet = new Set();
        allProducts.forEach(p => {
            if (p.tags) {
                p.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => productTagSet.add(t));
            }
        });
        const productTags = [...productTagSet].sort();

        // Get all distinct customer tags (from User.tags)
        const usersWithTags = await prisma.user.findMany({
            select: { tags: true },
            where: { tags: { isEmpty: false } },
        });
        const customerTagSet = new Set();
        usersWithTags.forEach(u => {
            if (u.tags) u.tags.forEach(t => customerTagSet.add(t));
        });
        const customerTags = [...customerTagSet].sort();

        res.render('admin/visibility/list', {
            rules,
            productTags,
            customerTags,
        });
    } catch (err) {
        console.error('Visibility page error:', err);
        res.render('admin/error', { error: 'Failed to load visibility rules' });
    }
});

// POST /admin/visibility — Create a new visibility rule
router.post('/', async (req, res) => {
    try {
        const { name, description, productTag, customerTag } = req.body;

        if (!name || !productTag || !customerTag) {
            req.flash('error', 'Name, Product Tag, and Customer Tag are required');
            return res.redirect('/admin/visibility');
        }

        // Create the rule
        await prisma.visibilityRule.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                productTag: productTag.trim(),
                customerTag: customerTag.trim(),
            },
        });

        // Auto-set all products with this product tag to isPrivate = true
        // Find products whose tags column (comma-separated) contains this tag
        const allProds = await prisma.product.findMany({
            select: { id: true, tags: true },
            where: { tags: { not: null } },
        });
        const matchingIds = allProds
            .filter(p => p.tags && p.tags.split(',').map(t => t.trim()).includes(productTag.trim()))
            .map(p => p.id);
        if (matchingIds.length > 0) {
            await prisma.product.updateMany({
                where: { id: { in: matchingIds } },
                data: { isPrivate: true },
            });
        }
        const productsWithTag = { length: matchingIds.length };

        req.flash('success', `Rule "${name}" created. ${matchingIds.length} product(s) marked private.`);
        res.redirect('/admin/visibility');
    } catch (err) {
        console.error('Create visibility rule error:', err);
        req.flash('error', err.message);
        res.redirect('/admin/visibility');
    }
});

// POST /admin/visibility/:id/delete — Delete a rule
router.post('/:id/delete', async (req, res) => {
    try {
        const rule = await prisma.visibilityRule.findUnique({ where: { id: req.params.id } });
        if (!rule) return res.redirect('/admin/visibility');

        await prisma.visibilityRule.delete({ where: { id: req.params.id } });

        // Check if any OTHER rule still references this product tag
        const otherRulesWithSameTag = await prisma.visibilityRule.count({
            where: { productTag: rule.productTag },
        });

        // If no other rules use this product tag, make those products public again
        if (otherRulesWithSameTag === 0) {
            const allProds = await prisma.product.findMany({
                select: { id: true, tags: true },
                where: { tags: { not: null } },
            });
            const matchingIds = allProds
                .filter(p => p.tags && p.tags.split(',').map(t => t.trim()).includes(rule.productTag))
                .map(p => p.id);
            if (matchingIds.length > 0) {
                await prisma.product.updateMany({
                    where: { id: { in: matchingIds } },
                    data: { isPrivate: false },
                });
            }
        }

        req.flash('success', `Rule "${rule.name}" deleted.`);
        res.redirect('/admin/visibility');
    } catch (err) {
        console.error('Delete visibility rule error:', err);
        req.flash('error', err.message);
        res.redirect('/admin/visibility');
    }
});

// Legacy toggle route (backward compat)
router.post('/toggle/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (product) {
            await prisma.product.update({
                where: { id: req.params.id },
                data: { isPrivate: !product.isPrivate },
            });
        }
        res.redirect('/admin/visibility');
    } catch (err) {
        console.error('Toggle visibility error:', err);
        res.redirect('/admin/visibility');
    }
});

export default router;
