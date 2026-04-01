import express from 'express';
import prisma from '../../lib/prisma.js';
import supabase from '../../lib/supabase.js';
import multer from 'multer';
import * as picqerClient from '../../lib/picqerClient.js';
import logger from '../../lib/logger.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Allowed warehouse IDs from env (same list the webhook processor uses)
const ALLOWED_WAREHOUSE_IDS = (process.env.PICQER_ALLOWED_WAREHOUSE_IDS || '')
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

// GET /admin/products — All Products List
router.get('/', async (req, res) => {
    try {
        const [products, brands] = await Promise.all([
            prisma.product.findMany({
                include: { category: true, brandRel: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.brand.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
        ]);
        res.render('admin/products/list', { products, brands });
    } catch (err) {
        console.error('Admin products list error:', err);
        res.render('admin/error', { error: 'Failed to load products' });
    }
});

// POST /admin/products/sync-stock
router.post('/sync-stock', async (req, res) => {
    try {
        let allPicqerProducts = [];
        let offset = 0;
        let hasMore = true;

        logger.info('Starting manual Picqer stock sync...');

        // Fetch all products from Picqer with pagination
        while (hasMore) {
            const data = await picqerClient.getProducts(offset);
            if (!data || !Array.isArray(data)) break;
            allPicqerProducts = allPicqerProducts.concat(data);
            if (data.length < 100) { // Default Picqer limit is usually 100
                hasMore = false;
            } else {
                offset += 100;
            }
        }

        logger.info(`Fetched ${allPicqerProducts.length} products from Picqer`);

        // Filter products with a productcode (SKU) and map to standard object
        const stockMap = new Map();
        allPicqerProducts.forEach(p => {
            if (p.productcode && Array.isArray(p.stock)) {
                // Sum freestock ONLY for allowed warehouses
                const filteredStock = p.stock
                    .filter(loc => ALLOWED_WAREHOUSE_IDS.includes(loc.idwarehouse))
                    .reduce((sum, loc) => sum + (loc.freestock || 0), 0);
                
                stockMap.set(p.productcode.toLowerCase(), filteredStock);
            }
        });

        // Get all local products with a SKU
        const localProducts = await prisma.product.findMany({
            where: { variantSku: { not: null, not: '' } },
            select: { id: true, variantSku: true, variantInventoryQty: true }
        });

        const updates = [];
        let updatedCount = 0;

        for (const lp of localProducts) {
            const sku = lp.variantSku.trim().toLowerCase();
            const picqerStock = stockMap.get(sku);

            if (picqerStock !== undefined && picqerStock !== lp.variantInventoryQty) {
                updates.push(
                    prisma.product.update({
                        where: { id: lp.id },
                        data: { variantInventoryQty: picqerStock }
                    })
                );
                updatedCount++;
            }
        }

        // Execute all updates in a transaction
        if (updates.length > 0) {
            await prisma.$transaction(updates);
            logger.info(`Updated stock for ${updatedCount} products from Picqer`);
            
            // Log interaction
            await prisma.integrationLogs.create({
                data: {
                    integration: 'PICQER',
                    eventType: 'MANUAL_STOCK_SYNC',
                    status: 'SUCCESS',
                    details: { updatedCount, totalFetched: allPicqerProducts.length }
                }
            }).catch(e => logger.error(`Failed to create manual sync audit log: ${e.message}`));
        }

        res.redirect('/admin/products');
    } catch (err) {
        logger.error(`Manual Picqer sync failed: ${err.message}`);
        // Log interaction failure
        await prisma.integrationLogs.create({
            data: {
                integration: 'PICQER',
                eventType: 'MANUAL_STOCK_SYNC',
                status: 'ERROR',
                details: { error: err.message, stack: err.stack }
            }
        }).catch(e => logger.error(`Failed to create manual sync error log: ${e.message}`));
        
        res.render('admin/error', { error: `Stock Sync Failed: ${err.message}` });
    }
});

// GET /admin/bulk-price-update — Show raw text input form
// GET /admin/products/new — Add Product Form
router.get('/new', async (req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
    res.render('admin/products/form', { product: null, categories, brands, warranties: WARRANTIES, regions: REGIONS, error: null });
});

// POST /admin/products — Create Product
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        let imageSrc = data.imageSrc || null;

        // Auto-generate handle from title if not provided
        let handle = data.handle;
        if (!handle && data.title) {
            handle = data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
        }

        // Upload image to Supabase Storage
        if (req.file) {
            const fileName = `products/${Date.now()}-${req.file.originalname}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            imageSrc = urlData.publicUrl;
        }

        await prisma.product.create({
            data: {
                handle,
                title: data.title,
                vendor: data.vendor,
                categoryId: data.categoryId || null,
                brandId: data.brandId || null,
                productCategory: null, // Legacy string column
                brand: null,           // Legacy string column
                tags: data.tags || null,

                published: data.published === 'on',
                variantSku: data.variantSku,
                variantInventoryQty: parseInt(data.variantInventoryQty) || 0,
                variantPrice: parseFloat(data.variantPrice),
                imageSrc,
                imagePosition: data.imagePosition ? parseInt(data.imagePosition) : 1,
                status: data.status || 'active',
            },
        });
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Create product error:', err);
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
        res.render('admin/products/form', { product: req.body, categories, brands, warranties: WARRANTIES, regions: REGIONS, error: err.message });
    }
});

// GET /admin/products/:id/edit — Edit Product Form
router.get('/:id/edit', async (req, res) => {
    try {
        const [product, categories, brands, allProducts] = await Promise.all([
            prisma.product.findUnique({
                where: { id: req.params.id },
                include: { category: true, brandRel: true },
            }),
            prisma.category.findMany({ orderBy: { name: 'asc' } }),
            prisma.brand.findMany({ orderBy: { name: 'asc' } }),
            prisma.product.findMany({ select: { tags: true }, where: { tags: { not: null } } }),
        ]);
        if (!product) return res.redirect('/admin/products');
        // Collect all distinct tags from all products' tags column (comma-separated)
        const tagSet = new Set();
        allProducts.forEach(p => {
            if (p.tags) {
                p.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t));
            }
        });
        const allTags = [...tagSet].sort();
        res.render('admin/products/form', { product, categories, brands, allTags, warranties: WARRANTIES, regions: REGIONS, error: null });
    } catch (err) {
        res.redirect('/admin/products');
    }
});

// POST /admin/products/:id/update — Update Product
router.post('/:id/update', upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        console.log('Update Product Debug:', {
            id: req.params.id,
            removeImage: data.removeImage,
            file: req.file ? 'Present' : 'None'
        });
        const updateData = {
            handle: data.handle,
            title: data.title,
            vendor: data.vendor,
            tags: data.tags || null,

            published: data.published === 'on',
            variantSku: data.variantSku,
            variantInventoryQty: parseInt(data.variantInventoryQty) || 0,
            variantPrice: parseFloat(data.variantPrice),
            imagePosition: data.imagePosition ? parseInt(data.imagePosition) : 1,
            brand: null,           // Legacy string column
            productCategory: null, // Legacy string column
            color: data.color || null,
            inBox: data.inBox || null,
            model: data.model || null,
            region: data.region || null,
            sim: data.sim || null,
            storage: data.storage || null,
            warranty: data.warranty || null,
            status: data.status || 'active',
        };

        // Use categoryId and brandId from body
        updateData.categoryId = data.categoryId || null;
        updateData.brandId = data.brandId || null;

        // Handle image removal
        if (data.removeImage === '1' && !req.file) {
            updateData.imageSrc = null;
        } else if (req.file) {
            const fileName = `products/${Date.now()}-${req.file.originalname}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            updateData.imageSrc = urlData.publicUrl;
        }

        await prisma.product.update({ where: { id: req.params.id }, data: updateData });
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Update product error:', err);
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
        res.render('admin/products/form', { product: { id: req.params.id, ...req.body }, categories, brands, warranties: WARRANTIES, regions: REGIONS, error: err.message });
    }
});

// POST /admin/products/:id/delete — Delete Product
router.post('/:id/delete', async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Delete product error:', err);
        res.redirect('/admin/products');
    }
});

// POST /admin/products/:id/toggle — Toggle published
router.post('/:id/toggle', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        await prisma.product.update({
            where: { id: req.params.id },
            data: { published: !product.published },
        });
        res.redirect('/admin/products');
    } catch (err) {
        res.redirect('/admin/products');
    }
});

// POST /admin/products/:id/add-tag — Add a tag to a product
router.post('/:id/add-tag', async (req, res) => {
    try {
        const { tag, newTag } = req.body;
        const tagValue = (newTag || tag || '').trim();
        if (!tagValue) return res.redirect(`/admin/products/${req.params.id}/edit`);

        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            select: { tags: true },
        });
        if (!product) return res.redirect('/admin/products');

        const currentTags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (!currentTags.includes(tagValue)) {
            currentTags.push(tagValue);
            await prisma.product.update({
                where: { id: req.params.id },
                data: { tags: currentTags.join(', ') },
            });
        }

        res.redirect(`/admin/products/${req.params.id}/edit`);
    } catch (err) {
        console.error('Add product tag error:', err);
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
});

// POST /admin/products/:id/remove-tag — Remove a tag from a product
router.post('/:id/remove-tag', async (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag) return res.redirect(`/admin/products/${req.params.id}/edit`);

        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            select: { tags: true },
        });
        if (!product) return res.redirect('/admin/products');

        const currentTags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const updatedTags = currentTags.filter(t => t !== tag);
        await prisma.product.update({
            where: { id: req.params.id },
            data: { tags: updatedTags.length > 0 ? updatedTags.join(', ') : null },
        });

        res.redirect(`/admin/products/${req.params.id}/edit`);
    } catch (err) {
        console.error('Remove product tag error:', err);
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
});

export default router;
