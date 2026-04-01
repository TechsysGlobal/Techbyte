import express from 'express';
import prisma from '../../lib/prisma.js';
import supabase from '../../lib/supabase.js';
import { sendDeclineEmail } from '../../lib/email.js';
import { logActivity } from '../../lib/audit.js';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizeEmail = (email) => email.trim().toLowerCase();

const isExistingAuthUserError = (error) => {
    if (!error) return false;
    const message = error.message || '';
    return error.code === 'email_exists' || /already registered|already exists/i.test(message);
};

const buildCustomerDisplayName = (customer) => {
    return customer.personalName || customer.ceoName || customer.companyName || normalizeEmail(customer.email);
};

async function ensureAuthUser(customer) {
    const email = normalizeEmail(customer.email);
    const { error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: buildCustomerDisplayName(customer) },
    });

    if (error && !isExistingAuthUserError(error)) {
        throw new Error(`Auth Error: ${error.message}`);
    }
}

async function sendPasswordSetupInvite(customer) {
    const email = normalizeEmail(customer.email);
    await ensureAuthUser({ ...customer, email });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${FRONTEND_URL}/reset-password`,
    });

    if (error) {
        throw new Error(`Supabase Email Error: ${error.message}`);
    }
}

// GET /admin/customers — Customer List
router.get('/', async (req, res) => {
    try {
        const { search, status, page = 1 } = req.query;
        const pageSize = 25;
        const where = {};
        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { ceoName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) where.status = status;

        const [customers, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { email: 'asc' },
                skip: (parseInt(page) - 1) * pageSize,
                take: pageSize,
            }),
            prisma.user.count({ where }),
        ]);
        res.render('admin/customers/list', {
            customers, total,
            page: parseInt(page),
            totalPages: Math.ceil(total / pageSize),
            search: search || '',
            statusFilter: status || '',
        });
    } catch (err) {
        console.error('Admin customers list error:', err);
        res.render('admin/error', { error: 'Failed to load customers' });
    }
});

// GET /admin/customers/new — Add Customer Form
router.get('/new', (req, res) => {
    res.render('admin/customers/form', { customer: null, error: null });
});

// POST /admin/customers — Create Customer (auto-approved)
router.post('/', async (req, res) => {
    try {
        const data = {
            ...req.body,
            email: normalizeEmail(req.body.email),
        };

        // 1. Ensure the auth user exists before we send a setup link
        await ensureAuthUser(data);

        // 2. Create customer in DB
        const customer = await prisma.user.create({
            data: {
                email: data.email,
                companyName: data.companyName,
                companyPhone: data.companyPhone,
                companyAddr: data.companyAddr,
                country: data.country,
                zipCode: data.zipCode,
                taxId: data.taxId,
                regCertUrl: data.regCertUrl || null,
                bankName: data.bankName,
                bankAddress: data.bankAddress,
                bankCountry: data.bankCountry,
                bankIban: data.bankIban,
                ceoName: data.ceoName,
                ceoPhone: data.ceoPhone,
                ceoEmail: data.ceoEmail,
                salesName: data.salesName,
                salesEmail: data.salesEmail,
                salesPhone: data.salesPhone,
                purchaseName: data.purchaseName,
                purchaseEmail: data.purchaseEmail,
                purchasePhone: data.purchasePhone,
                logisticName: data.logisticName,
                logisticPhone: data.logisticPhone,
                personalName: data.personalName,
                personalPhone: data.personalPhone,
                status: 'approved',
                approvedAt: new Date(),
            },
        });

        // 3. Let Supabase Auth send the password setup email
        await sendPasswordSetupInvite(data);

        // 4. Log activity
        await logActivity(req.session.adminId, 'CUSTOMER_CREATED', 'User', customer.id, {
            companyName: data.companyName,
            email: data.email,
            method: 'admin_manual',
        });

        res.redirect('/admin/customers');
    } catch (err) {
        console.error('Create customer error:', err);
        res.render('admin/customers/form', { customer: req.body, error: err.message });
    }
});

// GET /admin/customers/:id — Customer Detail
router.get('/:id', async (req, res) => {
    try {
        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { items: { include: { product: true } } },
                },
                customerDiscounts: {
                    include: { discount: true },
                },
            },
        });
        if (!customer) return res.redirect('/admin/customers');

        // Check for AJAX/Partial render
        const isAjax = req.query.ajax === 'true';

        res.render('admin/customers/detail', {
            customer,
            isAjax,
            pageTitle: isAjax ? null : customer.companyName,
        });
    } catch (err) {
        console.error('Customer detail error:', err);
        res.redirect('/admin/customers');
    }
});

// GET /admin/customers/:id/edit — Edit Customer Form
router.get('/:id/edit', async (req, res) => {
    try {
        const customer = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!customer) return res.redirect('/admin/customers');

        // Get all distinct customer tags for the dropdown
        const usersWithTags = await prisma.user.findMany({
            select: { tags: true },
            where: { tags: { isEmpty: false } },
        });
        const tagSet = new Set();
        usersWithTags.forEach(u => {
            if (u.tags) u.tags.forEach(t => tagSet.add(t));
        });
        const allTags = [...tagSet].sort();

        res.render('admin/customers/form', { customer, allTags, error: null });
    } catch (err) {
        res.redirect('/admin/customers');
    }
});

// POST /admin/customers/:id/update — Update Customer
router.post('/:id/update', async (req, res) => {
    try {
        const data = req.body;
        await prisma.user.update({
            where: { id: req.params.id },
            data: {
                email: normalizeEmail(data.email),
                companyName: data.companyName,
                companyPhone: data.companyPhone,
                companyAddr: data.companyAddr,
                country: data.country,
                zipCode: data.zipCode,
                taxId: data.taxId,
                regCertUrl: data.regCertUrl || null,
                bankName: data.bankName,
                bankAddress: data.bankAddress,
                bankCountry: data.bankCountry,
                bankIban: data.bankIban,
                ceoName: data.ceoName,
                ceoPhone: data.ceoPhone,
                ceoEmail: data.ceoEmail,
                salesName: data.salesName,
                salesEmail: data.salesEmail,
                salesPhone: data.salesPhone,
                purchaseName: data.purchaseName,
                purchaseEmail: data.purchaseEmail,
                purchasePhone: data.purchasePhone,
                logisticName: data.logisticName,
                logisticPhone: data.logisticPhone,
                personalName: data.personalName,
                personalPhone: data.personalPhone,
            },
        });
        res.redirect(`/admin/customers/${req.params.id}`);
    } catch (err) {
        console.error('Update customer error:', err);
        const customer = { id: req.params.id, ...req.body };
        res.render('admin/customers/form', { customer, allTags: [], error: err.message });
    }
});

// POST /admin/customers/:id/approve — Approve registration
router.post('/:id/approve', async (req, res) => {
    try {
        const existingCustomer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                companyName: true,
                ceoName: true,
                personalName: true,
            },
        });

        if (!existingCustomer) {
            req.flash('error', 'Customer not found');
            return res.redirect(`/admin/customers/${req.params.id}`);
        }

        await sendPasswordSetupInvite(existingCustomer);

        const customer = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                email: normalizeEmail(existingCustomer.email),
                status: 'approved',
                approvedAt: new Date(),
            },
        });

        await logActivity(req.session.adminId, 'CUSTOMER_APPROVED', 'User', req.params.id, {
            email: customer.email,
        });

        req.flash('success', 'Customer approved and password setup email sent');
        res.redirect(`/admin/customers/${req.params.id}`);
    } catch (err) {
        console.error('Approve customer error:', err);
        req.flash('error', err.message || 'Failed to approve customer');
        res.redirect(`/admin/customers/${req.params.id}`);
    }
});

// POST /admin/customers/:id/send-invite — Send invite email to an already approved user
router.post('/:id/send-invite', async (req, res) => {
    try {
        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                email: true,
                status: true,
                passwordHash: true,
                companyName: true,
                ceoName: true,
                personalName: true,
            }
        });

        if (!customer) {
            return res.redirect(`/admin/customers`);
        }
        if (customer.status !== 'approved' || customer.passwordHash) {
            req.flash('error', 'Customer must be approved and not have a password yet');
            return res.redirect(`/admin/customers/${req.params.id}`);
        }

        await sendPasswordSetupInvite(customer);

        await logActivity(req.session.adminId, 'INVITE_SENT', 'User', req.params.id, {
            email: customer.email,
            type: 'password_setup',
        });

        req.flash('success', 'Password setup email sent successfully');
        res.redirect(`/admin/customers/${req.params.id}`);
    } catch (err) {
        console.error('Send invite error:', err);
        req.flash('error', err.message || 'An unexpected error occurred');
        res.redirect(`/admin/customers/${req.params.id}`);
    }
});

// POST /admin/customers/:id/decline — Decline registration
router.post('/:id/decline', async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.params.id },
            data: { status: 'declined', declineReason: req.body.reason || null },
        });
        const customer = await prisma.user.findUnique({ where: { id: req.params.id } });
        await sendDeclineEmail(customer, req.body.reason);

        await logActivity(req.session.adminId, 'CUSTOMER_DECLINED', 'User', req.params.id, {
            email: customer.email,
            companyName: customer.companyName,
            reason: req.body.reason || 'No reason provided',
        });

        res.redirect('/admin/customers');
    } catch (err) {
        console.error('Decline customer error:', err);
        res.redirect('/admin/customers');
    }
});

// POST /admin/customers/:id/add-tag — Add an access tag to a customer
router.post('/:id/add-tag', async (req, res) => {
    try {
        const { tag, newTag } = req.body;
        const tagValue = (newTag || tag || '').trim();
        if (!tagValue) return res.redirect(`/admin/customers/${req.params.id}/edit`);

        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { tags: true },
        });
        if (!customer) return res.redirect('/admin/customers');

        const currentTags = customer.tags || [];
        if (!currentTags.includes(tagValue)) {
            await prisma.user.update({
                where: { id: req.params.id },
                data: { tags: [...currentTags, tagValue] },
            });
        }

        res.redirect(`/admin/customers/${req.params.id}/edit`);
    } catch (err) {
        console.error('Add customer tag error:', err);
        res.redirect(`/admin/customers/${req.params.id}/edit`);
    }
});

// POST /admin/customers/:id/remove-tag — Remove an access tag from a customer
router.post('/:id/remove-tag', async (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag) return res.redirect(`/admin/customers/${req.params.id}/edit`);

        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { tags: true },
        });
        if (!customer) return res.redirect('/admin/customers');

        const updatedTags = (customer.tags || []).filter(t => t !== tag);
        await prisma.user.update({
            where: { id: req.params.id },
            data: { tags: updatedTags },
        });

        res.redirect(`/admin/customers/${req.params.id}/edit`);
    } catch (err) {
        console.error('Remove customer tag error:', err);
        res.redirect(`/admin/customers/${req.params.id}/edit`);
    }
});

// POST /admin/customers/:id/delete — Delete customer
router.post('/:id/delete', async (req, res) => {
    try {
        // Capture info before deletion for logging
        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { email: true, companyName: true },
        });

        // Clean up related records first
        await prisma.$transaction([
            prisma.customerDiscount.deleteMany({ where: { customerId: req.params.id } }),
            prisma.orderItem.deleteMany({ where: { order: { userId: req.params.id } } }),
            prisma.orderStatusHistory.deleteMany({ where: { order: { userId: req.params.id } } }),
            prisma.order.deleteMany({ where: { userId: req.params.id } }),
            prisma.user.delete({ where: { id: req.params.id } }),
        ]);

        if (customer) {
            await logActivity(req.session.adminId, 'CUSTOMER_DELETED', 'User', req.params.id, {
                email: customer.email,
                companyName: customer.companyName,
            });
        }

        res.redirect('/admin/customers');
    } catch (err) {
        console.error('Delete customer error:', err);
        res.redirect('/admin/customers');
    }
});

export default router;
