import express from 'express';
import prisma from '../../lib/prisma.js';
import { syncOrderToPicqer } from '../../lib/picqerCheckout.js';

const router = express.Router();

// ─── Status Definitions ─────────────────────────────────────────────────────
const STATUSES = [
    'confirming', 'payment_pending', 'ordered', 'shipped',
    'delivered', 'cancelled', 'returned', 'refunded',
];

const STATUS_LABELS = {
    confirming: 'Confirming Order',
    payment_pending: 'Payment Pending',
    ordered: 'Ordered',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
    refunded: 'Refunded',
};

const STATUS_TRANSITIONS = {
    confirming: ['payment_pending', 'cancelled'],
    payment_pending: ['ordered', 'cancelled'],
    ordered: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    returned: ['refunded'],
    cancelled: [],
    refunded: [],
};

// ─── GET /admin/orders — List ────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { search, status, page = 1 } = req.query;
        const pageSize = 25;
        const where = {};

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { companyName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) where.currentStatus = status;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * pageSize,
                take: pageSize,
                include: {
                    user: { select: { companyName: true, email: true } },
                    items: true,
                },
            }),
            prisma.order.count({ where }),
        ]);

        res.render('admin/orders/list', {
            orders,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / pageSize),
            search: search || '',
            statusFilter: status || '',
            statuses: STATUSES,
            statusLabels: STATUS_LABELS,
            pageTitle: 'Orders',
        });
    } catch (err) {
        console.error('Admin orders list error:', err);
        res.render('admin/error', { error: 'Failed to load orders' });
    }
});

// ─── GET /admin/orders/:id — Detail ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                items: {
                    include: { product: { select: { title: true, variantSku: true, imageSrc: true } } },
                },
                statusHistory: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!order) return res.redirect('/admin/orders');

        const allowedTransitions = STATUS_TRANSITIONS[order.currentStatus] || [];

        res.render('admin/orders/detail', {
            order,
            allowedTransitions,
            statusLabels: STATUS_LABELS,
            pageTitle: `Order #${order.id.substring(0, 8)}`,
        });
    } catch (err) {
        console.error('Order detail error:', err);
        res.redirect('/admin/orders');
    }
});

// ─── POST /admin/orders/:id/status — Update Status ───────────────────────────
router.post('/:id/status', async (req, res) => {
    try {
        const { newStatus, reason } = req.body;
        const order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) return res.redirect('/admin/orders');

        // Validate transition
        const allowed = STATUS_TRANSITIONS[order.currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            return res.redirect(`/admin/orders/${req.params.id}?error=Invalid status transition`);
        }

        // Update order + create history entry in transaction
        await prisma.$transaction([
            prisma.order.update({
                where: { id: req.params.id },
                data: { currentStatus: newStatus },
            }),
            prisma.orderStatusHistory.create({
                data: {
                    orderId: req.params.id,
                    status: newStatus,
                    details: reason ? { reason, updatedBy: req.session.adminEmail } : { updatedBy: req.session.adminEmail },
                },
            }),
        ]);

        res.redirect(`/admin/orders/${req.params.id}`);
    } catch (err) {
        console.error('Update order status error:', err);
        res.redirect(`/admin/orders/${req.params.id}?error=${encodeURIComponent(err.message)}`);
    }
});

// ─── GET /admin/orders/:id/invoice — Downloadable Invoice ────────────────────
router.get('/:id/invoice', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                items: {
                    include: { product: { select: { title: true, variantSku: true } } },
                },
            },
        });
        if (!order) return res.redirect('/admin/orders');

        res.render('admin/orders/invoice', { order, layout: false });
    } catch (err) {
        console.error('Invoice error:', err);
        res.redirect(`/admin/orders/${req.params.id}`);
    }
});

// ─── POST /admin/orders/:id/retry-picqer-sync — Manual Picqer Retry ─────────
router.post('/:id/retry-picqer-sync', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                items: {
                    include: { product: { select: { variantSku: true, title: true } } },
                },
            },
        });
        if (!order) return res.redirect('/admin/orders');

        // Re-run the full Picqer sync (customer + order + process)
        await syncOrderToPicqer(order, order.userId, {});

        // Check if it succeeded by re-fetching the order
        const updated = await prisma.order.findUnique({
            where: { id: req.params.id },
            select: { picqerOrderId: true },
        });

        if (updated && updated.picqerOrderId) {
            res.redirect(`/admin/orders/${req.params.id}?success=Picqer sync completed successfully`);
        } else {
            res.redirect(`/admin/orders/${req.params.id}?error=Picqer sync attempt completed but order ID was not saved. Check Integration Logs for details.`);
        }
    } catch (err) {
        console.error('Retry Picqer sync error:', err);
        res.redirect(`/admin/orders/${req.params.id}?error=${encodeURIComponent('Retry failed: ' + err.message)}`);
    }
});

export default router;
