const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// GET /admin/analytics
router.get('/', async (req, res) => {
    try {
        // Basic stats
        const [totalOrders, totalCustomers, pendingOrders] = await Promise.all([
            prisma.order.count(),
            prisma.user.count(),
            prisma.order.count({ where: { currentStatus: 'pending' } }),
        ]);

        // Gross sales
        const salesAgg = await prisma.order.aggregate({
            _sum: { totalAmount: true, subtotal: true, vatPrice: true, shippingPrice: true },
        });

        const grossSales = parseFloat(salesAgg._sum.subtotal || 0);
        const netSales = parseFloat(salesAgg._sum.totalAmount || 0);
        const totalTax = parseFloat(salesAgg._sum.vatPrice || 0);
        const totalShipping = parseFloat(salesAgg._sum.shippingPrice || 0);

        // Fulfilled orders
        const fulfilledOrders = await prisma.order.count({ where: { currentStatus: 'fulfilled' } });

        // Returning customers (customers with > 1 order)
        const customerOrderCounts = await prisma.order.groupBy({
            by: ['userId'],
            _count: { id: true },
        });
        const returningCustomers = customerOrderCounts.filter(c => c._count.id > 1).length;
        const returningRate = totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : 0;

        // Sales over time (last 12 months)
        const salesOverTime = await prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        SUM("totalAmount") as total,
        COUNT(*) as orders
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

        // Top products by sell-through rate
        const topProducts = await prisma.product.findMany({
            where: { ordered: { gt: 0 } },
            orderBy: { ordered: 'desc' },
            take: 10,
            select: { title: true, ordered: true, variantInventoryQty: true, variantPrice: true },
        });

        res.render('admin/analytics/index', {
            stats: {
                totalOrders,
                totalCustomers,
                pendingOrders,
                fulfilledOrders,
                grossSales: grossSales.toFixed(2),
                netSales: netSales.toFixed(2),
                totalTax: totalTax.toFixed(2),
                totalShipping: totalShipping.toFixed(2),
                returningRate,
                returningCustomers,
            },
            salesOverTime: JSON.stringify(salesOverTime),
            topProducts,
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.render('admin/error', { error: 'Failed to load analytics' });
    }
});

module.exports = router;
