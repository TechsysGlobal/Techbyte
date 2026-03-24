import express from 'express';
import prisma from '../../lib/prisma.js';
import supabase from '../../lib/supabase.js';
import { sendApprovalEmail, sendDeclineEmail, sendPasswordSetupEmail } from '../../lib/email.js';
import { logActivity } from '../../lib/audit.js';

const router = express.Router();

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
        const data = req.body;

        // 1. Create Supabase Auth User
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            email_confirm: true,
            user_metadata: { name: data.personalName || data.ceoName || data.companyName }
        });
        if (authError) throw new Error('Auth Error: ' + authError.message);

        // 2. Generate Password Setup Link
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: data.email
        });
        if (linkError) throw new Error('Link Gen Error: ' + linkError.message);

        // 3. Create Profile in DB (linked to Auth ID)
        await prisma.user.create({
            data: {
                id: authUser.user.id, // Link to Supabase Auth ID
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
                personalEmail: data.personalEmail || null,
                personalPhone: data.personalPhone,
                status: 'approved',
                approvedAt: new Date(),
            },
        });

        // 4. Send Welcome Email
        await sendPasswordSetupEmail(data.email, linkData.properties.action_link);

        // 5. Log activity
        await logActivity(req.session.adminId, 'CUSTOMER_CREATED', 'User', authUser.user.id, {
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
            msg: req.query.msg || null,
            error: req.query.error || null
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
                personalEmail: data.personalEmail || null,
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
        const customer = await prisma.user.update({
            where: { id: req.params.id },
            data: { status: 'approved', approvedAt: new Date() },
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Try inviting via Supabase (sends email via configured SMTP/Resend)
        let { error: emailError } = await supabase.auth.admin.inviteUserByEmail(
            customer.email,
            { redirectTo: `${frontendUrl}/reset-password` }
        );

        // If user already exists in Supabase Auth, fall back to password recovery email
        if (emailError && emailError.code === 'email_exists') {
            console.warn(`User ${customer.email} already in auth, sending recovery email instead...`);
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                customer.email,
                { redirectTo: `${frontendUrl}/reset-password` }
            );
            emailError = resetError;
        }

        if (emailError) {
            console.error('Supabase email error on approve:', emailError);
            return res.redirect(`/admin/customers/${req.params.id}?error=Approved,+but+email+failed:+${encodeURIComponent(emailError.message)}`);
        }

        await logActivity(req.session.adminId, 'CUSTOMER_APPROVED', 'User', req.params.id, {
            email: customer.email,
        });

        res.redirect(`/admin/customers/${req.params.id}?msg=Customer+approved+and+invite+email+sent`);
    } catch (err) {
        console.error('Approve customer error:', err);
        res.redirect(`/admin/customers/${req.params.id}?error=Failed+to+approve+customer`);
    }
});

// POST /admin/customers/:id/send-invite — Send invite email to an already approved user
router.post('/:id/send-invite', async (req, res) => {
    try {
        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { email: true, status: true, passwordHash: true }
        });

        if (!customer) {
            return res.redirect(`/admin/customers`);
        }
        if (customer.status !== 'approved' || customer.passwordHash) {
            return res.redirect(`/admin/customers/${req.params.id}?error=Customer+must+be+approved+and+not+have+a+password+yet`);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // Send a password recovery email via Supabase (uses configured SMTP/Resend)
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            customer.email,
            { redirectTo: `${frontendUrl}/reset-password` }
        );

        if (resetError) {
            console.error('Supabase email error on send-invite:', resetError);
            return res.redirect(`/admin/customers/${req.params.id}?error=Failed+to+send+email:+${encodeURIComponent(resetError.message)}`);
        }

        await logActivity(req.session.adminId, 'INVITE_SENT', 'User', req.params.id, {
            email: customer.email,
            type: 'password_setup',
        });

        res.redirect(`/admin/customers/${req.params.id}?msg=Password+setup+email+sent+successfully`);
    } catch (err) {
        console.error('Send invite error:', err);
        res.redirect(`/admin/customers/${req.params.id}?error=An+unexpected+error+occurred`);
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
        await sendDeclineEmail(customer.email, customer.companyName, req.body.reason);

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
