import express from 'express';
import prisma from '../../lib/prisma.js';

const router = express.Router();

// POST /api/cart/validate — Validate cart items (check stock, get latest prices)
router.post('/validate', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !items.length) return res.json({ valid: true, items: [] });

        const validatedItems = [];
        const issues = [];

        // Check for customer discount
        let customerDiscount = null;
        if (req.session && req.session.userId) {
            customerDiscount = await prisma.customerDiscount.findFirst({
                where: { customerId: req.session.userId, isActive: true },
                include: { discount: true },
            });
        }

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) {
                issues.push({ productId: item.productId, issue: 'Product no longer available' });
                continue;
            }

            let price = parseFloat(product.variantPrice);
            let finalPrice = price;

            if (customerDiscount && customerDiscount.discount.active) {
                const disc = customerDiscount.discount;
                if (disc.type === 'PERCENTAGE') {
                    finalPrice = price - (price * parseFloat(disc.value) / 100);
                } else if (disc.type === 'FIXED') {
                    finalPrice = price - parseFloat(disc.value);
                }
                finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
            }

            const validItem = {
                productId: product.id,
                handle: product.handle,
                title: product.title,
                price: price,
                finalPrice: finalPrice,
                imageSrc: product.imageSrc,
                maxQuantity: product.variantInventoryQty,
                quantity: Math.min(item.quantity, product.variantInventoryQty),
            };

            if (item.quantity > product.variantInventoryQty) {
                issues.push({ productId: product.id, issue: `Only ${product.variantInventoryQty} in stock` });
            }

            validatedItems.push(validItem);
        }

        // Calculate Totals
        const subtotal = validatedItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
        const taxRate = 0.05; // 5% VAT
        const tax = Math.round(subtotal * taxRate * 100) / 100;
        const shipping = subtotal > 500 ? 0 : 25;
        const total = subtotal + tax + shipping;

        res.json({
            valid: issues.length === 0,
            items: validatedItems,
            issues,
            summary: {
                subtotal,
                tax,
                shipping,
                total
            }
        });
    } catch (err) {
        console.error('POST /api/cart/validate error:', err);
        res.status(500).json({ error: 'Failed to validate cart' });
    }
});

export default router;
