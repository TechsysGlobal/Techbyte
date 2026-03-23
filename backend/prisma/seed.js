/**
 * Seed script for TechByte backend.
 *
 * Reads products from the React frontend's csvproducts.js,
 * downloads images from Shopify CDN, uploads to Supabase Storage,
 * then upserts products, categories, and brands into the database.
 *
 * Usage:  node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'product-images';

// ─── Find csvproducts.js ───────────────────────────────────────────────────
function loadProducts() {
    // Try multiple locations
    const candidates = [
        path.join(__dirname, '..', '..', 'Techbyte', 'src', 'data', 'csvproducts.js'),
        path.join(__dirname, '..', '..', 'Techbyte', 'src', 'csvproducts.js'),
        path.join(__dirname, '..', '..', 'src', 'data', 'csvproducts.js'),
        path.join(__dirname, '..', '..', 'src', 'csvproducts.js'),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            console.log(`Found products at: ${p}`);
            // Read file content and extract the array safely (no eval)
            let content = fs.readFileSync(p, 'utf-8');
            // Remove export/const statements to get the raw array expression
            content = content.replace(/export\s+(default\s+)?/, '');
            content = content.replace(/^const\s+\w+\s*=\s*/, '');
            // Use Function constructor instead of eval for slightly safer evaluation
            return new Function(`return ${content}`)();
        }
    }

    // Try the products.js directly
    const productsPath = path.join(__dirname, '..', '..', 'Techbyte', 'src', 'data', 'products.js');
    if (fs.existsSync(productsPath)) {
        console.log(`Found products at: ${productsPath}`);
        let content = fs.readFileSync(productsPath, 'utf-8');
        content = content.replace(/export\s+(default\s+)?/, '');
        content = content.replace(/^const\s+\w+\s*=\s*/, '');
        return new Function(`return ${content}`)();
    }

    throw new Error('Could not find products data file. Tried:\n' + candidates.join('\n'));
}

// ─── Download Image ────────────────────────────────────────────────────────
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { headers: { 'User-Agent': 'TechByte-Seed/1.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                return downloadImage(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

// ─── Upload to Supabase Storage ────────────────────────────────────────────
async function uploadImage(buffer, filename) {
    const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(`products/${filename}`, buffer, {
            contentType,
            upsert: true,
        });

    if (error) throw error;

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`products/${filename}`);

    return urlData.publicUrl;
}

// ─── Slugify ───────────────────────────────────────────────────────────────
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
    console.log('🔌 Starting seed...');

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.find((b) => b.name === BUCKET);
    if (!exists) {
        await supabase.storage.createBucket(BUCKET, { public: true });
        console.log(`✅ Created bucket: ${BUCKET}`);
    }

    const products = loadProducts();
    console.log(`📦 Found ${products.length} products`);

    // Extract unique categories
    const categoryNames = [...new Set(products.map((p) => p.category || p.productCategory).filter(Boolean))];
    for (const name of categoryNames) {
        await prisma.category.upsert({
            where: { slug: slugify(name) },
            create: { name, slug: slugify(name) },
            update: { name },
        });
    }
    console.log(`🏷️  Upserted ${categoryNames.length} categories`);

    // Extract unique brands
    const brandNames = [...new Set(products.map((p) => p.brand || p.vendor).filter(Boolean))];
    for (const name of brandNames) {
        await prisma.brand.upsert({
            where: { slug: slugify(name) },
            create: { name, slug: slugify(name) },
            update: { name },
        });
    }
    console.log(`🏢 Upserted ${brandNames.length} brands`);

    // Seed products
    let count = 0;
    let errors = 0;
    for (const p of products) {
        try {
            let newImageUrl = p.imageSrc || p.image || null;

            // Download and upload image if it's a URL
            if (newImageUrl && (newImageUrl.startsWith('http://') || newImageUrl.startsWith('https://'))) {
                try {
                    const buffer = await downloadImage(newImageUrl);
                    const ext = newImageUrl.includes('.png') ? '.png' : '.jpg';
                    const filename = `${slugify(p.handle || p.id || p.name || `product-${count}`)}${ext}`;
                    newImageUrl = await uploadImage(buffer, filename);
                } catch (imgErr) {
                    console.warn(`  ⚠️  Image download failed for ${p.handle || p.title}: ${imgErr.message}`);
                    // Keep original URL
                }
            }

            const handle = p.handle || slugify(p.title || p.name || `product-${count}`);

            await prisma.product.upsert({
                where: { handle },
                create: {
                    handle,
                    title: p.title || p.name || handle,
                    vendor: p.vendor || p.brand || '',
                    productCategory: p.productCategory || p.category || '',
                    tags: p.tags || '',
                    variantSku: p.variantSku || p.sku || handle,
                    variantPrice: parseFloat(p.variantPrice || p.price || 0),
                    variantInventoryQty: parseInt(p.variantInventoryQty || p.stock || p.inStock || 0, 10),
                    imageSrc: newImageUrl,
                    status: p.status || 'active',
                    published: p.published !== false,
                    brand: p.brand || p.vendor || null,
                    color: p.color || null,
                    storage: p.storage || null,
                    region: p.region || null,
                    model: p.model || null,
                    sim: p.sim || null,
                    warranty: p.warranty || null,
                    inBox: p.inBox || null,
                },
                update: {
                    title: p.title || p.name || handle,
                    vendor: p.vendor || p.brand || '',
                    variantPrice: parseFloat(p.variantPrice || p.price || 0),
                    variantInventoryQty: parseInt(p.variantInventoryQty || p.stock || p.inStock || 0, 10),
                    imageSrc: newImageUrl,
                    brand: p.brand || p.vendor || null,
                },
            });

            count++;
            if (count % 10 === 0) console.log(`  📦 ${count}/${products.length} products seeded...`);
        } catch (err) {
            console.error(`  ❌ Error seeding ${p.handle || p.title}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\n✅ Seed complete: ${count} products, ${categoryNames.length} categories, ${brandNames.length} brands`);
    if (errors > 0) console.log(`⚠️  ${errors} errors occurred`);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
