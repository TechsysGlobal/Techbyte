import prisma from '../lib/prisma.js';

async function migrate() {
    console.log('Starting migration of product relations...');

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { categoryId: null, productCategory: { not: null, not: '' } },
                { brandId: null, brand: { not: null, not: '' } }
            ]
        }
    });

    console.log(`Found ${products.length} products to migrate.`);

    for (const product of products) {
        let updateData = {};

        // Migrate Category
        if (!product.categoryId && product.productCategory) {
            let category = await prisma.category.findFirst({
                where: { name: { equals: product.productCategory, mode: 'insensitive' } }
            });

            if (!category) {
                console.log(`Creating missing category: ${product.productCategory}`);
                const slug = product.productCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                category = await prisma.category.create({
                    data: { name: product.productCategory, slug }
                });
            }
            updateData.categoryId = category.id;
        }

        // Migrate Brand
        if (!product.brandId && product.brand) {
            let brand = await prisma.brand.findFirst({
                where: { name: { equals: product.brand, mode: 'insensitive' } }
            });

            if (!brand) {
                console.log(`Creating missing brand: ${product.brand}`);
                const slug = product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                brand = await prisma.brand.create({
                    data: { name: product.brand, slug }
                });
            }
            updateData.brandId = brand.id;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.product.update({
                where: { id: product.id },
                data: updateData
            });
            console.log(`Updated product: ${product.title} (${product.id})`);
        }
    }

    console.log('Migration completed successfully.');
}

migrate()
    .catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
