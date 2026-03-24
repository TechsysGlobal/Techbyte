import express from 'express';
import prisma from '../../lib/prisma.js';
import ExcelJS from 'exceljs';
import multer from 'multer';
import { logActivity } from '../../lib/audit.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Column Definitions ─────────────────────────────────────────────────────
const COLUMNS = [
    { header: 'Handle', key: 'handle', width: 30 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'SKU', key: 'variantSku', width: 18 },
    { header: 'Brand', key: 'brand', width: 18 },
    { header: 'Category', key: 'productCategory', width: 20 },
    { header: 'Tags', key: 'tags', width: 25 },
    { header: 'Price', key: 'variantPrice', width: 12 },
    { header: 'Stock', key: 'variantInventoryQty', width: 10 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Region', key: 'region', width: 10 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Storage', key: 'storage', width: 12 },
    { header: 'SIM', key: 'sim', width: 10 },
    { header: 'Warranty', key: 'warranty', width: 22 },
    { header: 'In Box', key: 'inBox', width: 25 },
    { header: 'Image URL', key: 'imageSrc', width: 40 },
    { header: 'Vendor', key: 'vendor', width: 20 },
    { header: 'Published', key: 'published', width: 10 },
];

const REQUIRED_FIELDS = ['title', 'variantSku', 'variantPrice', 'vendor', 'productCategory', 'status'];

// ─── EXPORT ─────────────────────────────────────────────────────────────────
// GET /admin/products/export
router.get('/export', async (req, res) => {
    try {
        const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'TechByte Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Products');
        sheet.columns = COLUMNS;

        // Style header row
        sheet.getRow(1).font = { bold: true, size: 11 };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1a1a2e' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

        // Add product rows
        products.forEach(p => {
            sheet.addRow({
                handle: p.handle,
                title: p.title,
                variantSku: p.variantSku,
                brand: p.brand || '',
                productCategory: p.productCategory,
                tags: p.tags || '',
                variantPrice: parseFloat(p.variantPrice),
                variantInventoryQty: p.variantInventoryQty || 0,
                status: p.status,
                model: p.model || '',
                region: p.region || '',
                color: p.color || '',
                storage: p.storage || '',
                sim: p.sim || '',
                warranty: p.warranty || '',
                inBox: p.inBox || '',
                imageSrc: p.imageSrc || '',
                vendor: p.vendor,
                published: p.published ? 'Yes' : 'No',
            });
        });

        // Auto-filter
        sheet.autoFilter = { from: 'A1', to: `S${products.length + 1}` };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=techbyte-products-${new Date().toISOString().slice(0, 10)}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

        // Log export activity
        await logActivity(req.session?.adminId || null, 'PRODUCT_EXPORT', 'Product', 'N/A', {
            productCount: products.length,
            exportedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Product export error:', err);
        res.status(500).json({ error: 'Export failed: ' + err.message });
    }
});

// ─── IMPORT ─────────────────────────────────────────────────────────────────
// POST /admin/products/import
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Parse Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) {
            return res.status(400).json({ error: 'No worksheet found in file' });
        }

        // Build header map from first row
        const headerRow = sheet.getRow(1);
        const headerMap = {};
        headerRow.eachCell((cell, colNumber) => {
            const headerText = (cell.value || '').toString().trim();
            // Map Excel header to DB field
            const col = COLUMNS.find(c => c.header.toLowerCase() === headerText.toLowerCase());
            if (col) {
                headerMap[colNumber] = col.key;
            }
        });

        // Parse rows into objects
        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const rowData = { _rowNumber: rowNumber };
            Object.entries(headerMap).forEach(([colNum, fieldKey]) => {
                let val = row.getCell(parseInt(colNum)).value;
                // Handle ExcelJS rich text / formula cells
                if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
                if (val && typeof val === 'object' && val.richText) val = val.richText.map(r => r.text).join('');
                rowData[fieldKey] = val !== null && val !== undefined ? String(val).trim() : '';
            });
            // Only process rows that have at least a SKU
            if (rowData.variantSku) {
                rows.push(rowData);
            }
        });

        if (rows.length === 0) {
            return res.status(400).json({ error: 'No valid product rows found in file' });
        }

        // 2. Fetch all existing products in ONE query
        const existingProducts = await prisma.product.findMany({
            select: {
                id: true, handle: true, title: true, vendor: true, productCategory: true,
                tags: true, variantSku: true, variantPrice: true, variantInventoryQty: true,
                brand: true, color: true, storage: true, model: true, region: true,
                sim: true, inBox: true, warranty: true, status: true, imageSrc: true,
                published: true,
            },
        });
        const existingBySku = {};
        existingProducts.forEach(p => {
            existingBySku[p.variantSku] = p;
        });

        // 3. Classify each row
        const toUpdate = [];
        const toInsert = [];
        const unchanged = [];
        const failed = [];

        rows.forEach(row => {
            // Validate required fields
            const missingFields = REQUIRED_FIELDS.filter(f => !row[f]);
            if (missingFields.length > 0) {
                failed.push({
                    sku: row.variantSku || '(empty)',
                    reason: `Missing required fields: ${missingFields.join(', ')}`,
                    rowNumber: row._rowNumber,
                    rowData: row,
                });
                return;
            }

            // Validate price is numeric
            const price = parseFloat(row.variantPrice);
            if (isNaN(price) || price < 0) {
                failed.push({
                    sku: row.variantSku,
                    reason: `Invalid price: "${row.variantPrice}"`,
                    rowNumber: row._rowNumber,
                    rowData: row,
                });
                return;
            }

            const existing = existingBySku[row.variantSku];

            if (existing) {
                // Compare fields to detect changes
                const changes = {};
                const compareFields = [
                    'title', 'handle', 'vendor', 'productCategory', 'tags',
                    'brand', 'color', 'storage', 'model', 'region', 'sim',
                    'inBox', 'warranty', 'status', 'imageSrc',
                ];

                compareFields.forEach(field => {
                    const newVal = row[field] || null;
                    const oldVal = existing[field] || null;
                    if (newVal !== oldVal) {
                        changes[field] = { old: oldVal, new: newVal };
                    }
                });

                // Compare numeric fields
                if (price !== parseFloat(existing.variantPrice)) {
                    changes.variantPrice = { old: parseFloat(existing.variantPrice), new: price };
                }
                const newQty = parseInt(row.variantInventoryQty) || 0;
                if (newQty !== (existing.variantInventoryQty || 0)) {
                    changes.variantInventoryQty = { old: existing.variantInventoryQty || 0, new: newQty };
                }

                // Published field
                const newPublished = row.published ? row.published.toLowerCase() === 'yes' : true;
                if (newPublished !== existing.published) {
                    changes.published = { old: existing.published, new: newPublished };
                }

                if (Object.keys(changes).length > 0) {
                    toUpdate.push({
                        id: existing.id,
                        sku: row.variantSku,
                        changes,
                        data: buildProductData(row),
                    });
                } else {
                    unchanged.push({ sku: row.variantSku, title: existing.title });
                }
            } else {
                // New product — need handle
                let handle = row.handle;
                if (!handle && row.title) {
                    handle = row.title.toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
                if (!handle) {
                    failed.push({
                        sku: row.variantSku,
                        reason: 'Could not generate handle (no title or handle provided)',
                        rowNumber: row._rowNumber,
                        rowData: row,
                    });
                    return;
                }

                toInsert.push({
                    sku: row.variantSku,
                    data: { ...buildProductData(row), handle },
                });
            }
        });

        // 4. Execute batch operations
        let updatedCount = 0;
        let insertedCount = 0;
        const updateErrors = [];
        const insertErrors = [];

        // Batch UPDATE
        if (toUpdate.length > 0) {
            try {
                await prisma.$transaction(
                    toUpdate.map(item =>
                        prisma.product.update({
                            where: { id: item.id },
                            data: item.data,
                        })
                    )
                );
                updatedCount = toUpdate.length;
            } catch (err) {
                // If batch fails, try individually to identify which ones fail
                for (const item of toUpdate) {
                    try {
                        await prisma.product.update({
                            where: { id: item.id },
                            data: item.data,
                        });
                        updatedCount++;
                    } catch (e) {
                        updateErrors.push({
                            sku: item.sku,
                            reason: `Update failed: ${e.message}`,
                            rowData: item.data,
                        });
                    }
                }
            }
        }

        // Batch INSERT
        if (toInsert.length > 0) {
            try {
                await prisma.$transaction(
                    toInsert.map(item =>
                        prisma.product.create({ data: item.data })
                    )
                );
                insertedCount = toInsert.length;
            } catch (err) {
                // If batch fails, try individually
                for (const item of toInsert) {
                    try {
                        await prisma.product.create({ data: item.data });
                        insertedCount++;
                    } catch (e) {
                        insertErrors.push({
                            sku: item.sku,
                            reason: `Insert failed: ${e.message}`,
                            rowData: item.data,
                        });
                    }
                }
            }
        }

        // Combine all failures
        const allFailed = [...failed, ...updateErrors, ...insertErrors];

        // 5. Log import activity
        await logActivity(req.session?.adminId || null, 'PRODUCT_IMPORT', 'Product', 'N/A', {
            fileName: req.file.originalname,
            summary: {
                totalProcessed: rows.length,
                updated: updatedCount,
                inserted: insertedCount,
                unchanged: unchanged.length,
                failed: allFailed.length,
            },
            updatedProducts: toUpdate.filter((_, i) => i < updatedCount).map(u => ({
                sku: u.sku,
                changes: u.changes,
            })),
            insertedProducts: toInsert.filter((_, i) => i < insertedCount).map(u => ({
                sku: u.sku,
            })),
            failedProducts: allFailed.map(f => ({
                sku: f.sku,
                reason: f.reason,
            })),
        });

        // 6. Return results
        res.json({
            success: true,
            summary: {
                totalProcessed: rows.length,
                updated: updatedCount,
                inserted: insertedCount,
                unchanged: unchanged.length,
                failed: allFailed.length,
            },
            details: {
                updated: toUpdate.filter((_, i) => i < updatedCount).map(u => ({
                    sku: u.sku,
                    changes: u.changes,
                })),
                inserted: toInsert.filter((_, i) => i < insertedCount).map(u => ({
                    sku: u.sku,
                })),
                unchanged,
                failed: allFailed,
            },
        });
    } catch (err) {
        console.error('Product import error:', err);
        res.status(500).json({ error: 'Import failed: ' + err.message });
    }
});

// ─── Helper ─────────────────────────────────────────────────────────────────
function buildProductData(row) {
    return {
        title: row.title,
        vendor: row.vendor,
        productCategory: row.productCategory,
        tags: row.tags || null,
        variantSku: row.variantSku,
        variantPrice: parseFloat(row.variantPrice),
        variantInventoryQty: parseInt(row.variantInventoryQty) || 0,
        brand: row.brand || null,
        color: row.color || null,
        storage: row.storage || null,
        model: row.model || null,
        region: row.region || null,
        sim: row.sim || null,
        inBox: row.inBox || null,
        warranty: row.warranty || null,
        status: row.status || 'active',
        imageSrc: row.imageSrc || null,
        published: row.published ? row.published.toLowerCase() === 'yes' : true,
    };
}

export default router;
