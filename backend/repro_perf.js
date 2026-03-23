const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduce() {
    console.log('--- Reproduction of /api/products filter logic ---');
    const filterWhere = { published: true, variantPrice: { gt: 0 }, isPrivate: false };
    
    const start = Date.now();
    console.log('Running 6 parallel queries for filter options...');
    
    const [brands, categories, colors, storages, regions, priceAgg] = await Promise.all([
        prisma.product.findMany({ where: filterWhere, select: { brand: true }, distinct: ['brand'] }),
        prisma.product.findMany({ where: filterWhere, select: { productCategory: true }, distinct: ['productCategory'] }),
        prisma.product.findMany({ where: filterWhere, select: { color: true }, distinct: ['color'] }),
        prisma.product.findMany({ where: filterWhere, select: { storage: true }, distinct: ['storage'] }),
        prisma.product.findMany({ where: filterWhere, select: { region: true }, distinct: ['region'] }),
        prisma.product.aggregate({ where: filterWhere, _min: { variantPrice: true }, _max: { variantPrice: true } }),
    ]);
    
    const duration = Date.now() - start;
    console.log(`Brands found: ${brands.length}`);
    console.log(`Total duration for aggregation section: ${duration}ms`);
    
    await prisma.$disconnect();
}

reproduce().catch(err => {
    console.error(err);
    process.exit(1);
});
