import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, '../public/products_export_1.csv');
const outputFilePath = path.join(__dirname, '../src/data/products.js');

function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote string
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++; // Skip \n
            }
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Push last row if exists
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    return rows;
}

function mapToProduct(headers, values) {
    const getVal = (headerName) => {
        const index = headers.indexOf(headerName);
        return index !== -1 && index < values.length ? values[index] : null;
    };

    const clean = (val) => val ? val.trim() : null;

    const handle = clean(getVal('Handle'));
    // Skip empty lines or malformed
    if (!handle) return null;

    const title = clean(getVal('Title'));
    const vendor = clean(getVal('Vendor'));
    const metaBrand = clean(getVal('Brand (product.metafields.custom.brand)'));
    const brand = metaBrand || vendor;
    const priceStr = getVal('Variant Price');
    const price = priceStr ? parseFloat(priceStr) : 0;
    const image = clean(getVal('Image Src'));

    if (!title) return null; // Skip if no title

    let category = 'other';
    const rawCategory = (clean(getVal('Product Category')) || '').toLowerCase();
    const rawTitle = (title || '').toLowerCase();
    const rawBrand = (brand || '').toLowerCase();

    // Normalized Categorization
    if (rawBrand === 'apple') {
        if (rawTitle.includes('iphone')) category = 'iphone';
        else if (rawTitle.includes('ipad')) category = 'ipad';
        else if (rawTitle.includes('airpod') || rawTitle.includes('headphone')) category = 'airpods';
        else if (rawTitle.includes('macbook') || rawTitle.includes('laptop')) category = 'macbook';
        else if (rawTitle.includes('watch')) category = 'watch';
        else category = 'apple_misc';
    } else if (rawBrand === 'samsung') {
        if (rawTitle.includes('watch')) category = 'watch';
        if (rawTitle.includes('galaxy') && rawTitle.includes('tab')) category = 'tablet';
        else if (rawTitle.includes('galaxy')) category = 'galaxy';
        else category = 'samsung_misc';
    } else if (rawBrand === 'xiaomi') {
        category = 'xiaomi';
        if (rawTitle.includes('poco')) category = 'poco';
        if (rawTitle.includes('redmi')) category = 'redmi';
    }

    const storage = clean(getVal('Storage (product.metafields.custom.storage)'));
    const color = clean(getVal('Color (product.metafields.custom.color)'));
    const region = clean(getVal('Region (product.metafields.custom.region)'));
    const inStock = parseInt(getVal('Variant Inventory Qty')) || 0;

    return {
        id: handle,
        name: title,
        brand: brand || 'TechByte',
        price: price,
        image: image || 'https://via.placeholder.com/400',
        category: category,
        storage: storage ? storage.toLowerCase() : null,
        color: color ? color.toLowerCase() : null,
        region: region ? region.toLowerCase() : 'global',
        inStock: inStock
    };
}

try {
    const content = fs.readFileSync(csvFilePath, 'utf8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
        console.error("No rows parsed");
        process.exit(1);
    }

    const headers = rows[0].map(h => h.trim()); // Remove BOM or spaces
    const dataRows = rows.slice(1);

    // Filter duplicates if Handle is repeated (multiple variants)
    // For now, we want to list all variants as separate products or group them? 
    // The previous products.js listed variants as items.
    // However, if we preserve Handles, we might have duplicate Handles in the CSV if options are split by rows.
    // Let's check logic: if multiple rows have same handle, it means they are variants of same product.
    // If we simply map them, we will have duplicate IDs in `products.js`.
    // React map key error if using ID.
    // We should make ID unique or group them.
    // If rows have "Option1 Value" set, they are variants.
    // The current React app seems to treat "Product" as a single card.
    // If I list "iPhone 13 128GB Blue" and "iPhone 13 128GB Black" as separate items, valid.
    // But they share the same Handle "apple-iphone-13-128gb-blue-indian"? 
    // Wait, line 2 handle: `apple-iphone-13-128gb-blue-indian`.
    // Line 5 handle: `samsung-galaxy-s25...`
    // It seems each row has a different Handle in this export logic?
    // Let's verify unique handles.

    const products = [];
    const seenHandles = new Set();

    for (const values of dataRows) {
        if (values.length < headers.length) continue; // Basic skip
        const product = mapToProduct(headers, values);
        if (product) {
            // Ensure unique ID for products array.
            // If handle assumes uniqueness, but we find duplicates, we modify ID.
            let uniqueId = product.id;
            if (seenHandles.has(uniqueId)) {
                // If the CSV has duplicate handles, it means multiple rows for same product (e.g. variants/images).
                // Usually first row is main, others are variants. 
                // We'll skip secondary rows for now if they are just variants to keep it simple, 
                // OR we accept them but suffix the ID.
                // Let's just suffix for now to see everything.
                uniqueId = `${uniqueId}_${products.length}`;
                product.id = uniqueId;
            }
            seenHandles.add(uniqueId);
            products.push(product);
        }
    }

    if (products.length > 0) {
        const fileContent = `export const products = ${JSON.stringify(products, null, 4)};\n`;
        fs.writeFileSync(outputFilePath, fileContent);
        console.log(`Successfully migrated ${products.length} products (parsed ${rows.length} rows)`);
    } else {
        console.log("No products found after mapping.");
    }

} catch (err) {
    console.error("Migration failed:", err);
}
