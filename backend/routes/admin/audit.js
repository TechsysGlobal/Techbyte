const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// ─── Action-to-Category Mapping ─────────────────────────────────────────────
const ACTION_CATEGORIES = {
    // Products
    'CREATE': 'Products',
    'UPDATE': 'Products',
    'DELETE': 'Products',
    'PRODUCT_IMPORT': 'Import/Export',
    'PRODUCT_EXPORT': 'Import/Export',
    // Customers
    'CUSTOMER_CREATED': 'Customers',
    'CUSTOMER_APPROVED': 'Customers',
    'CUSTOMER_DECLINED': 'Customers',
    'CUSTOMER_DELETED': 'Customers',
    'INVITE_SENT': 'Customers',
    // Emails
    'EMAIL_SENT': 'Emails',
    'EMAIL_FAILED': 'Emails',
    // Orders
    'UPSERT': 'Orders',
};

// Map action to human-readable label
const ACTION_LABELS = {
    'CREATE': 'Created',
    'UPDATE': 'Updated',
    'DELETE': 'Deleted',
    'PRODUCT_IMPORT': 'Product Import',
    'PRODUCT_EXPORT': 'Product Export',
    'CUSTOMER_CREATED': 'Customer Created',
    'CUSTOMER_APPROVED': 'Customer Approved',
    'CUSTOMER_DECLINED': 'Customer Declined',
    'CUSTOMER_DELETED': 'Customer Deleted',
    'INVITE_SENT': 'Invite Sent',
    'EMAIL_SENT': 'Email Sent',
    'EMAIL_FAILED': 'Email Failed',
    'UPSERT': 'Upserted',
};

// Helper: get category for an action+entity combo
function getCategory(action, entity) {
    // Check action-specific category first
    if (ACTION_CATEGORIES[action]) return ACTION_CATEGORIES[action];
    // Fall back to entity-based categorization
    if (entity === 'Product') return 'Products';
    if (entity === 'User') return 'Customers';
    if (entity === 'Order') return 'Orders';
    if (entity === 'Email') return 'Emails';
    if (entity === 'Discount') return 'Discounts';
    return 'Other';
}

// GET /admin/audit — List Logs
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const { action, entity, admin, category, dateFrom, dateTo } = req.query;

        const where = {};
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (admin) where.adminUser = { email: { contains: admin, mode: 'insensitive' } };

        // Category filter → maps to list of actions
        if (category) {
            const actionsInCategory = Object.entries(ACTION_CATEGORIES)
                .filter(([, cat]) => cat === category)
                .map(([act]) => act);
            if (actionsInCategory.length > 0) {
                // Merge with existing action filter if present
                if (where.action) {
                    // If both category and action are specified, action takes priority
                } else {
                    where.action = { in: actionsInCategory };
                }
            }
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = toDate;
            }
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: { adminUser: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.activityLog.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        // Get filter options
        const [actionsList, entities] = await Promise.all([
            prisma.activityLog.findMany({ select: { action: true }, distinct: ['action'] }),
            prisma.activityLog.findMany({ select: { entity: true }, distinct: ['entity'] }),
        ]);

        // Category summary counts
        const allLogs = await prisma.activityLog.findMany({
            select: { action: true, entity: true },
        });
        const categoryCounts = {};
        allLogs.forEach(log => {
            const cat = getCategory(log.action, log.entity);
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Enrich logs with labels, categories, and item names
        const enrichedLogs = logs.map(log => {
            let itemName = '';
            const d = log.details || {};
            if (d.original && d.original.title) itemName = d.original.title;
            else if (d.original && d.original.companyName) itemName = d.original.companyName;
            else if (d.data && d.data.title) itemName = d.data.title;
            else if (d.data && d.data.companyName) itemName = d.data.companyName;
            else if (d.companyName) itemName = d.companyName;
            else if (d.recipient) itemName = d.recipient;
            else if (d.email) itemName = d.email;
            else if (d.deleted && d.deleted.title) itemName = d.deleted.title;
            else if (d.deleted && d.deleted.companyName) itemName = d.deleted.companyName;
            else if (d.fileName) itemName = d.fileName;
            else if (d.summary) itemName = `${d.summary.updated || 0} updated, ${d.summary.inserted || 0} inserted`;

            return {
                ...log,
                actionLabel: ACTION_LABELS[log.action] || log.action,
                category: getCategory(log.action, log.entity),
                itemName,
            };
        });

        // Available categories for the filter dropdown
        const categories = [...new Set(Object.values(ACTION_CATEGORIES))].sort();

        res.render('admin/audit/list', {
            pageTitle: 'Activity Logs',
            logs: enrichedLogs,
            currentPage: page,
            totalPages,
            total,
            categoryCounts,
            categories,
            filters: {
                actions: actionsList.map(f => f.action).sort(),
                entities: entities.map(e => e.entity).sort(),
                query: req.query,
            },
        });
    } catch (err) {
        console.error('Audit log error:', err);
        res.render('admin/error', { error: 'Failed to load audit logs' });
    }
});

module.exports = router;
