import express from 'express';
import prisma from '../../lib/prisma.js';
import cache from '../../lib/cache.js';

const router = express.Router();

// Helper to sort storage values numerically (e.g. 64GB < 128GB < 1TB)
const sortStorageOptions = (storagesArray) => {
    return storagesArray.filter(Boolean).sort((a, b) => {
        const getVal = (str) => {
            const match = str.match(/([\d.]+)\s*(GB|TB)/i);
            if (!match) return 0;
            const num = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return unit === 'TB' ? num * 1024 : num;
        };
        return getVal(a) - getVal(b);
    });
};

// GET /api/products — List products with filters, pagination, sort
router.get('/', async (req, res) => {
    try {
        const {
            search, brand, category, color, storage, region, status,
            minPrice, maxPrice, tags, sort, order, inStock,
            page = 1, limit = 24
        } = req.query;

        // ── Pagination params ──
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        // ── Cache key (includes user for discount-aware pricing) ──
        const userKey = req.session?.userId || 'anon';
        const cacheKey = `products_list_${userKey}_${JSON.stringify(req.query)}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        // ── Parallel: user lookup + cached visibility rules ──
        const [user, visibilityRules] = await Promise.all([
            req.session?.userId
                ? prisma.user.findUnique({
                    where: { id: req.session.userId },
                    select: { tags: true },
                })
                : null,
            (function () {
                const cached = cache.get('visibility_rules');
                if (cached) return cached;
                return prisma.visibilityRule.findMany().then((rules) => {
                    cache.set('visibility_rules', rules, 600); // 10-min TTL
                    return rules;
                });
            })(),
        ]);

        const userTags = user?.tags || [];

        // ── Determine which product tags this user can access ──
        const allowedProductTags = visibilityRules
            .filter((rule) => userTags.includes(rule.customerTag))
            .map((rule) => rule.productTag);

        // ── Build Prisma WHERE — visibility at DB level ──
        const where = {
            published: true,
            variantPrice: { gt: 0 },
        };

        // Visibility: public products always visible.
        // Private products visible ONLY if user has a matching tag via ProductTagAccess.
        if (allowedProductTags.length > 0) {
            where.OR = [
                { isPrivate: false },
                {
                    isPrivate: true,
                    tagAccess: {
                        some: { tag: { in: allowedProductTags } },
                    },
                },
            ];
        } else {
            // No allowed tags (anon or user without tags) → only public products
            where.isPrivate = false;
        }

        // ── Search ──
        if (search) {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { vendor: { contains: search, mode: 'insensitive' } },
                        { brand: { contains: search, mode: 'insensitive' } },
                        { model: { contains: search, mode: 'insensitive' } },
                        { variantSku: { contains: search, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        // ── Other filters ──
        if (brand) where.brand = { equals: brand, mode: 'insensitive' };
        if (category) where.productCategory = { equals: category, mode: 'insensitive' };
        if (color) where.color = { equals: color, mode: 'insensitive' };
        if (storage) where.storage = { equals: storage, mode: 'insensitive' };
        if (region) where.region = { equals: region, mode: 'insensitive' };
        if (status) where.status = status;
        if (tags) where.tags = { contains: tags, mode: 'insensitive' };

        if (inStock === 'true' || inStock === true) {
            where.variantInventoryQty = { gt: 0 };
        }

        if (minPrice || maxPrice) {
            where.variantPrice = {};
            if (minPrice) where.variantPrice.gte = parseFloat(minPrice);
            if (maxPrice) where.variantPrice.lte = parseFloat(maxPrice);
        }

        // ── Sorting ──
        const orderBy = {};
        const sortField = sort || 'createdAt';
        const sortOrder = order || 'desc';
        orderBy[sortField] = sortOrder;

        // ── DB query: products (paginated) + count in parallel ──
        const [products, totalItems] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                take: pageSize,
                skip,
            }),
            prisma.product.count({ where }),
        ]);

        // ── Apply discounts (if user has one) ──
        let finalProducts = products;
        if (req.session?.userId) {
            const customerDiscount = await prisma.customerDiscount.findFirst({
                where: { customerId: req.session.userId, isActive: true },
                include: { discount: true },
            });
            if (customerDiscount?.discount?.active) {
                const disc = customerDiscount.discount;
                finalProducts = products.map((p) => {
                    const price = parseFloat(p.variantPrice);
                    let finalPrice = price;
                    if (disc.type === 'PERCENTAGE') {
                        finalPrice = price - (price * parseFloat(disc.value)) / 100;
                    } else if (disc.type === 'FIXED') {
                        finalPrice = price - parseFloat(disc.value);
                    }
                    return { ...p, finalPrice: Math.max(0, Math.round(finalPrice * 100) / 100) };
                });
            }
        }

        // ── Filter aggregations (cached) ──
        let availableFilters = cache.get('filter_options');
        if (!availableFilters) {
            // Replace 6 queries with a single raw SQL query
            // Optimized: Replace 6 queries and array_agg(DISTINCT) with dedicated grouped subqueries
            let rawQuery;
            if (allowedProductTags.length > 0) {
                const tagsList = allowedProductTags.map(t => `'${t}'`).join(',');
            // Flattening aggregations to rely on the B-Tree indexes we just added instead of costly sub-queries
            let rawQuery;
            if (allowedProductTags.length > 0) {
                const tagsList = allowedProductTags.map(t => `'${t}'`).join(',');
                rawQuery = `
                    SELECT 
                        array_agg(DISTINCT brand) FILTER(WHERE brand IS NOT NULL) as brands,
                        array_agg(DISTINCT "productCategory") FILTER(WHERE "productCategory" IS NOT NULL) as categories,
                        array_agg(DISTINCT color) FILTER(WHERE color IS NOT NULL) as colors,
                        array_agg(DISTINCT storage) FILTER(WHERE storage IS NOT NULL) as storages,
                        array_agg(DISTINCT region) FILTER(WHERE region IS NOT NULL) as regions,
                        MIN("variantPrice") as min_price,
                        MAX("variantPrice") as max_price
                    FROM "Product" p
                    WHERE published = true 
                      AND "variantPrice" > 0 
                      ${inStock === 'true' || inStock === true ? 'AND "variantInventoryQty" > 0' : ''}
                      AND (
                          "isPrivate" = false OR 
                          EXISTS (
                              SELECT 1 FROM "ProductTagAccess" pta 
                              WHERE pta."productId" = p.id AND pta.tag IN (${tagsList})
                          )
                      )
                `;
            } else {
                 rawQuery = `
                    SELECT 
                        array_agg(DISTINCT brand) FILTER(WHERE brand IS NOT NULL) as brands,
                        array_agg(DISTINCT "productCategory") FILTER(WHERE "productCategory" IS NOT NULL) as categories,
                        array_agg(DISTINCT color) FILTER(WHERE color IS NOT NULL) as colors,
                        array_agg(DISTINCT storage) FILTER(WHERE storage IS NOT NULL) as storages,
                        array_agg(DISTINCT region) FILTER(WHERE region IS NOT NULL) as regions,
                        MIN("variantPrice") as min_price,
                        MAX("variantPrice") as max_price
                    FROM "Product"
                    WHERE published = true 
                      AND "variantPrice" > 0 
                      ${inStock === 'true' || inStock === true ? 'AND "variantInventoryQty" > 0' : ''}
                      AND "isPrivate" = false
                `;
            }
            const [rawResult] = await prisma.$queryRawUnsafe(rawQuery);

            availableFilters = {
                brands: (rawResult?.brands || []).filter(Boolean).sort(),
                categories: (rawResult?.categories || []).filter(Boolean).sort(),
                colors: (rawResult?.colors || []).filter(Boolean).sort(),
                storages: sortStorageOptions((rawResult?.storages || []).filter(Boolean)),
                regions: (rawResult?.regions || []).filter(Boolean).sort(),
                priceRange: {
                    min: rawResult?.min_price ? Math.floor(parseFloat(rawResult.min_price)) : 0,
                    max: rawResult?.max_price ? Math.ceil(parseFloat(rawResult.max_price)) : 10000,
                }
            };
            cache.set('filter_options', availableFilters); // 5-min TTL (default)
        }

        // ── Structured response ──
        const responseData = {
            products: finalProducts,
            meta: {
                pagination: {
                    currentPage: pageNum,
                    itemsPerPage: pageSize,
                    totalItems,
                    totalPages: Math.ceil(totalItems / pageSize),
                },
                availableFilters,
            },
        };

        cache.set(cacheKey, responseData);
        res.json(responseData);
        }
    } catch (err) {
        console.error('GET /api/products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/filters/options — Get unique filter values
// ⚠️ MUST be above /:handle or Express will match "filters" as a handle
router.get('/filters/options', async (req, res) => {
    try {
        const rawQuery = `
            SELECT 
                array_agg(DISTINCT brand) FILTER(WHERE brand IS NOT NULL) as brands,
                array_agg(DISTINCT "productCategory") FILTER(WHERE "productCategory" IS NOT NULL) as categories,
                array_agg(DISTINCT color) FILTER(WHERE color IS NOT NULL) as colors,
                array_agg(DISTINCT storage) FILTER(WHERE storage IS NOT NULL) as storages,
                array_agg(DISTINCT region) FILTER(WHERE region IS NOT NULL) as regions
            FROM "Product"
            WHERE published = true 
              AND "variantPrice" > 0 
              AND "isPrivate" = false
        `;

        const [rawResult] = await prisma.$queryRawUnsafe(rawQuery);

        res.json({
            brands: (rawResult?.brands || []).filter(Boolean).sort(),
            categories: (rawResult?.categories || []).filter(Boolean).sort(),
            colors: (rawResult?.colors || []).filter(Boolean).sort(),
            storages: sortStorageOptions((rawResult?.storages || []).filter(Boolean)),
            regions: (rawResult?.regions || []).filter(Boolean).sort(),
        });
    } catch (err) {
        console.error('GET /api/products/filters error:', err);
        res.status(500).json({ error: 'Failed to fetch filter options' });
    }
});

// GET /api/products/:handle — Single product by handle
router.get('/:handle', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { handle: req.params.handle },
        });

        if (!product || !product.published || parseFloat(product.variantPrice) <= 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Discount logic
        if (req.session && req.session.userId) {
            const customerDiscount = await prisma.customerDiscount.findFirst({
                where: { customerId: req.session.userId, isActive: true },
                include: { discount: true },
            });
            if (customerDiscount && customerDiscount.discount.active) {
                const disc = customerDiscount.discount;
                const price = parseFloat(product.variantPrice);
                let finalPrice = price;
                if (disc.type === 'PERCENTAGE') {
                    finalPrice = price - (price * parseFloat(disc.value) / 100);
                } else if (disc.type === 'FIXED') {
                    finalPrice = price - parseFloat(disc.value);
                }
                product.finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
            }
        }

        res.json(product);
    } catch (err) {
        console.error('GET /api/products/:handle error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

export default router;
