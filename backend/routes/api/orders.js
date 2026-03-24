import express from 'express';
import prisma from '../../lib/prisma.js';
import { syncOrderToPicqer } from '../../lib/picqerCheckout.js';

const router = express.Router();

// Auth middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    next();
}

// POST /api/orders — Place order (atomic with stock check)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { items, shippingAddress, poNumber, shippingNotes, termsAccepted } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: 'No items in order' });
        if (!termsAccepted) return res.status(400).json({ error: 'You must accept the B2B Terms of Sale' });

        // Use interactive transaction for atomicity (prevents race condition on stock)
        const order = await prisma.$transaction(async (tx) => {
            // Check for customer discount
            const customerDiscount = await tx.customerDiscount.findFirst({
                where: { customerId: req.session.userId, isActive: true },
                include: { discount: true },
            });

            let subtotal = 0;
            const orderItems = [];

            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error(`Product ${item.productId} not found`);
                if (product.variantInventoryQty < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.title}`);
                }

                let price = parseFloat(product.variantPrice);
                // Apply discount
                if (customerDiscount && customerDiscount.discount.active) {
                    const disc = customerDiscount.discount;
                    if (disc.type === 'PERCENTAGE') {
                        price = price - (price * parseFloat(disc.value) / 100);
                    } else if (disc.type === 'FIXED') {
                        price = price - parseFloat(disc.value);
                    }
                    price = Math.max(0, price);
                }

                subtotal += price * item.quantity;
                orderItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtSale: Math.round(price * 100) / 100,
                });
            }

            const vatRate = 0.05; // 5% VAT
            const vatPrice = Math.round(subtotal * vatRate * 100) / 100;
            const shippingPrice = subtotal > 500 ? 0 : 25;
            const totalAmount = Math.round((subtotal + vatPrice + shippingPrice) * 100) / 100;

            const createdOrder = await tx.order.create({
                data: {
                    userId: req.session.userId,
                    subtotal,
                    vatRate,
                    vatPrice,
                    shippingPrice,
                    totalAmount,
                    currentStatus: 'pending',
                    termsAcceptedAt: new Date(),
                    items: { create: orderItems },
                    statusHistory: {
                        create: {
                            status: 'pending',
                            details: { message: 'Order placed', shippingAddress },
                        },
                    },
                },
                include: { items: true },
            });

            // Decrement stock (inside transaction — atomic)
            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        variantInventoryQty: { decrement: item.quantity },
                        ordered: { increment: item.quantity },
                    },
                });
            }

            return createdOrder;
        });

        // ── Picqer Sync (runs after DB commit — non-blocking) ────────────
        // If this fails, the order is still saved. Errors go to IntegrationLogs.
        await syncOrderToPicqer(order, req.session.userId, { poNumber, shippingNotes });

        // Re-fetch order to include any Picqer IDs that were saved
        const freshOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true },
        });

        res.status(201).json({ order: freshOrder });
    } catch (err) {
        console.error('POST /api/orders error:', err);
        // Differentiate validation errors from server errors
        if (err.message.includes('not found') || err.message.includes('Insufficient stock')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// GET /api/orders — User's orders
router.get('/', requireAuth, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.session.userId },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    } catch (err) {
        console.error('GET /api/orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id — Single order
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const order = await prisma.order.findFirst({
            where: { id: req.params.id, userId: req.session.userId },
            include: {
                items: { include: { product: true } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error('GET /api/orders/:id error:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

export default router;
