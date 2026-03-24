import express from 'express';
import prisma from '../../lib/prisma.js';
import supabase from '../../lib/supabase.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /admin/brands
router.get('/', async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
        const brandsWithCount = await Promise.all(
            brands.map(async b => ({
                ...b,
                productCount: await prisma.product.count({ where: { brand: b.name } }),
            }))
        );
        res.render('admin/brands/list', { brands: brandsWithCount, error: null });
    } catch (err) {
        res.render('admin/error', { error: 'Failed to load brands' });
    }
});

// GET /admin/brands/:slug — View brand products
router.get('/:slug', async (req, res) => {
    try {
        const brand = await prisma.brand.findUnique({ where: { slug: req.params.slug } });
        if (!brand) return res.redirect('/admin/brands');
        const products = await prisma.product.findMany({
            where: { brand: brand.name },
            orderBy: { title: 'asc' },
        });
        res.render('admin/brands/detail', { brand, products });
    } catch (err) {
        res.redirect('/admin/brands');
    }
});

// POST /admin/brands — Create
router.post('/', upload.single('logo'), async (req, res) => {
    try {
        const { name } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let logoUrl = null;

        if (req.file) {
            const fileName = `brands/${Date.now()}-${req.file.originalname}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            logoUrl = urlData.publicUrl;
        }

        await prisma.brand.create({ data: { name, slug, logoUrl } });
        res.redirect('/admin/brands');
    } catch (err) {
        console.error('Create brand error:', err);
        res.redirect('/admin/brands');
    }
});

// POST /admin/brands/:id/update
router.post('/:id/update', upload.single('logo'), async (req, res) => {
    try {
        const { name } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const updateData = { name, slug };

        if (req.file) {
            const fileName = `brands/${Date.now()}-${req.file.originalname}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            updateData.logoUrl = urlData.publicUrl;
        }

        await prisma.brand.update({ where: { id: req.params.id }, data: updateData });
        res.redirect('/admin/brands');
    } catch (err) {
        res.redirect('/admin/brands');
    }
});

// POST /admin/brands/:id/delete
router.post('/:id/delete', async (req, res) => {
    try {
        await prisma.brand.delete({ where: { id: req.params.id } });
        res.redirect('/admin/brands');
    } catch (err) {
        res.redirect('/admin/brands');
    }
});

export default router;
