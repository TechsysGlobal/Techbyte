const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const supabase = require('../../lib/supabase');
const auditContext = require('../../middleware/auditContext');

// ─── Admin Auth Middleware ───────────────────────────────────────────────────

async function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
        return res.redirect('/admin/login');
    }

    try {
        const pendingCount = await prisma.user.count({ where: { status: 'pending' } });
        res.locals.pendingCustomersCount = pendingCount;
    } catch (err) {
        console.error('Failed to get pending customers count', err);
        res.locals.pendingCustomersCount = 0;
    }

    // Make admin data available to all views
    res.locals.admin = {
        id: req.session.adminId,
        email: req.session.adminEmail,
        name: req.session.adminName,
    };
    res.locals.currentPath = req.originalUrl.replace(/^\/admin/, '') || '/';

    // Apply audit context
    auditContext(req, res, next);
}

// ─── Login ───────────────────────────────────────────────────────────────────

router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Authenticate via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.render('admin/login', { error: 'Invalid email or password' });

        // Check Profile for admin role
        const profile = await prisma.profile.findUnique({ where: { id: data.user.id } });
        if (!profile || profile.role !== 'admin') {
            return res.render('admin/login', { error: 'Access denied. Admin role required.' });
        }

        req.session.adminId = profile.id;
        req.session.adminEmail = profile.email;
        req.session.adminName = profile.name;
        res.redirect('/admin');
    } catch (err) {
        console.error('Admin login error:', err);
        res.render('admin/login', { error: 'Login failed. Please try again.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

// ─── Dashboard Home ─────────────────────────────────────────────────────────

router.get('/', requireAdmin, async (req, res) => {
    try {
        const [productCount, customerCount, orderCount, pendingCount] = await Promise.all([
            prisma.product.count(),
            prisma.user.count(),
            prisma.order.count(),
            prisma.user.count({ where: { status: 'pending' } }),
        ]);

        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { companyName: true, email: true } } },
        });

        res.render('admin/dashboard', {
            stats: { productCount, customerCount, orderCount, pendingCount },
            recentOrders,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.render('admin/error', { error: 'Failed to load dashboard' });
    }
});

// ─── Mount sub-routers ──────────────────────────────────────────────────────
router.use('/products', requireAdmin, require('./importExport'));
router.use('/products', requireAdmin, require('./products'));
router.use('/bulk-price-update', requireAdmin, require('./bulk-price-update'));
router.use('/customers', requireAdmin, require('./customers'));
router.use('/categories', requireAdmin, require('./categories'));
router.use('/brands', requireAdmin, require('./brands'));
router.use('/discounts', requireAdmin, require('./discounts'));
router.use('/analytics', requireAdmin, require('./analytics'));
router.use('/emails', requireAdmin, require('./emails'));
router.use('/audit', requireAdmin, require('./audit'));
router.use('/picqer-logs', requireAdmin, require('./picqer-logs'));
router.use('/orders', requireAdmin, require('./orders'));
router.use('/visibility', requireAdmin, require('./visibility'));

module.exports = router;
