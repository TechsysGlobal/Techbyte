const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// GET /admin/discounts
router.get('/', async (req, res) => {
    try {
        const discounts = await prisma.discount.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                customerDiscounts: {
                    include: { customer: { select: { companyName: true, email: true } } },
                },
            },
        });
        const customers = await prisma.user.findMany({
            where: { status: 'approved' },
            orderBy: { companyName: 'asc' },
            select: { id: true, companyName: true, email: true },
        });
        res.render('admin/discounts/list', { discounts, customers, error: null });
    } catch (err) {
        console.error('Discounts error:', err);
        res.render('admin/error', { error: 'Failed to load discounts' });
    }
});

// POST /admin/discounts — Create discount
router.post('/', async (req, res) => {
    try {
        const { name, type, value } = req.body;
        await prisma.discount.create({
            data: {
                name,
                type, // PERCENTAGE or FIXED
                value: parseFloat(value),
                active: true,
            },
        });
        res.redirect('/admin/discounts');
    } catch (err) {
        console.error('Create discount error:', err);
        res.redirect('/admin/discounts');
    }
});

// POST /admin/discounts/:id/assign — Assign discount to customer(s)
router.post('/:id/assign', async (req, res) => {
    try {
        let { customerIds } = req.body;
        if (!customerIds) customerIds = [];
        if (!Array.isArray(customerIds)) customerIds = [customerIds];

        // Process each customer assignment in a transaction or loop
        // (Here just loop for simplicity, or Promise.all)
        await Promise.all(customerIds.map(async (customerId) => {
            // Deactivate existing active discounts for this customer
            await prisma.customerDiscount.updateMany({
                where: { customerId, isActive: true },
                data: { isActive: false },
            });

            // Create new active assignment
            await prisma.customerDiscount.create({
                data: {
                    customerId,
                    discountId: req.params.id,
                    isActive: true,
                },
            });
        }));

        res.redirect('/admin/discounts');
    } catch (err) {
        console.error('Assign discount error:', err);
        res.redirect('/admin/discounts');
    }
});

// POST /admin/discounts/:id/toggle — Toggle discount active state
router.post('/:id/toggle', async (req, res) => {
    try {
        const discount = await prisma.discount.findUnique({ where: { id: req.params.id } });
        await prisma.discount.update({
            where: { id: req.params.id },
            data: { active: !discount.active },
        });
        res.redirect('/admin/discounts');
    } catch (err) {
        res.redirect('/admin/discounts');
    }
});

// POST /admin/discounts/:id/delete
router.post('/:id/delete', async (req, res) => {
    try {
        await prisma.customerDiscount.deleteMany({ where: { discountId: req.params.id } });
        await prisma.discount.delete({ where: { id: req.params.id } });
        res.redirect('/admin/discounts');
    } catch (err) {
        res.redirect('/admin/discounts');
    }
});

// POST /admin/discounts/customer/:id/remove — Remove discount from customer
router.post('/customer/:id/remove', async (req, res) => {
    try {
        await prisma.customerDiscount.update({
            where: { id: parseInt(req.params.id) },
            data: { isActive: false },
        });
        res.redirect('/admin/discounts');
    } catch (err) {
        res.redirect('/admin/discounts');
    }
});

module.exports = router;
