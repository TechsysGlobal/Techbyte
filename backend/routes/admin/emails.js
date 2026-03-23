const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// GET /admin/emails — Email templates list
router.get('/', async (req, res) => {
    try {
        const templates = await prisma.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } });
        res.render('admin/emails/list', { templates, error: null });
    } catch (err) {
        res.render('admin/error', { error: 'Failed to load email templates' });
    }
});

// GET /admin/emails/new — New template form
router.get('/new', (req, res) => {
    res.render('admin/emails/form', { template: null, error: null });
});

// POST /admin/emails — Create template
router.post('/', async (req, res) => {
    try {
        const { name, subject, htmlContent } = req.body;
        await prisma.emailTemplate.create({ data: { name, subject, htmlContent } });
        res.redirect('/admin/emails');
    } catch (err) {
        console.error('Create template error:', err);
        res.render('admin/emails/form', { template: req.body, error: err.message });
    }
});

// GET /admin/emails/:id/edit — Edit template
router.get('/:id/edit', async (req, res) => {
    try {
        const template = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } });
        if (!template) return res.redirect('/admin/emails');
        res.render('admin/emails/form', { template, error: null });
    } catch (err) {
        res.redirect('/admin/emails');
    }
});

// POST /admin/emails/:id/update — Update template
router.post('/:id/update', async (req, res) => {
    try {
        const { name, subject, htmlContent } = req.body;
        await prisma.emailTemplate.update({
            where: { id: req.params.id },
            data: { name, subject, htmlContent },
        });
        res.redirect('/admin/emails');
    } catch (err) {
        res.render('admin/emails/form', { template: { id: req.params.id, ...req.body }, error: err.message });
    }
});

// GET /admin/emails/:id/preview — Preview HTML
router.get('/:id/preview', async (req, res) => {
    try {
        const template = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } });
        if (!template) return res.status(404).send('Not found');
        res.send(template.htmlContent);
    } catch (err) {
        res.status(500).send('Error');
    }
});

// POST /admin/emails/:id/delete
router.post('/:id/delete', async (req, res) => {
    try {
        await prisma.emailTemplate.delete({ where: { id: req.params.id } });
        res.redirect('/admin/emails');
    } catch (err) {
        res.redirect('/admin/emails');
    }
});

module.exports = router;
