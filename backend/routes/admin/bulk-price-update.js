const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');

// ── Helpers ────────────────────────────────────────────────────────────
const emojiRegex = /[\p{Extended_Pictographic}\uFE00-\uFE0F\u2060]/gu;

const cleanLine = (raw) =>
    raw.replace(emojiRegex, '')
       .replace(/\(?EU-plug\)?/gi, '')
       .replace(/\u2060/g, '')          
       .replace(/\s{2,}/g, ' ')
       .trim();

const normaliseRegion = (r) => {
    if (!r) return 'Non-Eu';
    const lower = r.toString().toLowerCase();
    if (lower.includes('non') || lower.includes('global') || lower.includes('indian')) return 'Non-Eu';
    if (lower.includes('eu')) return 'Eu';
    return 'Non-Eu';
};

// Unified Model Extractor
const extractModelId = (text) => {
    if (!text) return null;
    let desc = text.toUpperCase();
    
    // Strip internal manufacturer codes like A065, A366
    desc = desc.replace(/\b[A-Z]\d{3}\b/g, '').replace(/\s{2,}/g, ' ').trim();
    
    // Normalize "XIAOMI REDMI" to "REDMI"
    desc = desc.replace(/XIAOMI\s+(POCO|REDMI)/, '$1');

    // Normalize Airpods Generations (e.g., "(4TH GEN)" -> "4")
    desc = desc.replace(/\(4TH\s*GEN(?:ERATION)?\)/g, '4')
               .replace(/\(3RD\s*GEN(?:ERATION)?\)/g, '3')
               .replace(/\(2ND\s*GEN(?:ERATION)?\)/g, '2');

    const patterns =[
        /GALAXY\s+(?:TAB\s+)?[A-Z0-9]+(?:\s+(?:ULTRA|PRO|PLUS|FE|LITE|FOLD|FLIP))*/,
        /IPHONE\s+\d+[A-Z]*(?:\s+(?:PRO\s*MAX|PRO|PLUS|MINI|SE))*/,
        /AIRPODS\s+(?:PRO\s*\d*|MAX|\d+|[A-Z0-9]+)/,
        /AIRTAG[S]?\s*\d*/,
        /(?:POCO|REDMI|XIAOMI)\s+(?:NOTE\s+)?[A-Z0-9]+(?:\s+(?:PRO\s*PLUS|PRO|ULTRA|LITE|PLUS|C))*/,
        /PIXEL\s+(?:FOLD\s+)?\d+[A-Z]*(?:\s+(?:PRO|A|XL))*/,
    ];

    for (const pat of patterns) {
        const m = desc.match(pat);
        if (m) return m[0].replace(/\s+/g, ' ').trim();
    }
    return null;
};

// ── Routes ─────────────────────────────────────────────────────────────

// GET /admin/bulk-price-update
router.get('/', (req, res) => {
    res.render('admin/products/bulk-price-input');
});

// POST /admin/bulk-price-update/parse
router.post('/parse', async (req, res) => {
    try {
        const { rawText } = req.body;
        if (!rawText) return res.redirect('/admin/bulk-price-update');

        let debugLog = `--- Bulk Price Parse Debug [${new Date().toISOString()}] ---\n`;
        const log = (msg) => { debugLog += msg + '\n'; logger.debug(msg); };

        // ── STEP 1: Parse Structure (Extraction) ───────────────────────────────
        const lines    = rawText.split('\n').map(l => l.trim()).filter(Boolean);
        const parsed   =[];
        let region     = 'Non-Eu';   
        let brand      = '';
        const priceRe  = /[€\s]*(\d+(?:[.,]\d{1,2})?)\s*[€🔥\s]*$/;

        for (const rawLine of lines) {
            const line  = cleanLine(rawLine);
            const upper = line.toUpperCase();

            if (!line || line.length < 3 || /^[\u2014\u2015\u2E3B\-—⸻]+$/.test(line) || upper.includes('UNITY TRADING') || upper.includes('WTS')) continue;

            if (rawLine.includes('🇪🇺') || (upper.includes('EU SPEC') && !upper.includes('NON-EU'))) { region = 'Eu'; continue; }
            if (rawLine.includes('🌏') || upper.includes('NON-EU SPEC')) { region = 'Non-Eu'; continue; }

            const hasPriceOnLine = priceRe.test(line);
            if (!hasPriceOnLine) {
                if (upper.includes('APPLE')) { brand = 'Apple'; continue; }
                if (upper.includes('SAMSUNG')) { brand = 'Samsung'; continue; }
                if (upper.includes('XIAOMI') || upper.includes('POCO') || upper.includes('REDMI')) { brand = 'Xiaomi'; continue; }
                if (upper.includes('GOOGLE')) { brand = 'Google'; continue; }
            }

            const priceMatch = line.match(priceRe);
            if (!priceMatch) continue;

            const price = parseFloat(priceMatch[1].replace(',', '.'));
            if (isNaN(price)) continue;

            let desc = line.replace(priceMatch[0], '').replace(/^[\u2022\u2060\s•\-–—]+/, '').replace(/[\-–—\s]+$/, '').trim();
            if (desc.length < 3) continue;

            let activeBrand = brand;
            if (/iphone|ipad|airpods|macbook/i.test(desc)) activeBrand = 'Apple';
            else if (/galaxy|samsung/i.test(desc)) activeBrand = 'Samsung';
            else if (/poco|redmi|xiaomi/i.test(desc)) activeBrand = 'Xiaomi';
            else if (/pixel|google/i.test(desc)) activeBrand = 'Google';
            if (!activeBrand) continue;

            const modelId = extractModelId(desc);

            let ramNum = null;
            let storageNum = null;
            const slashMatch = desc.match(/(\d{1,2})\s*\/\s*(\d{2,3})/);
            if (slashMatch) {
                ramNum = Number(slashMatch[1]);
                storageNum = Number(slashMatch[2]);
            } else {
                const storageMatch = desc.match(/(\d{2,3})\s*GB|1\s*TB/i);
                if (storageMatch) storageNum = /1\s*TB/i.test(storageMatch[0]) ? 1000 : Number(storageMatch[1].replace(/\D/g, ''));
                
                const ramMatch = desc.match(/(\d{1,2})\s*GB(?:\s*RAM)?/i);
                if (ramMatch && Number(ramMatch[1]) !== storageNum) ramNum = Number(ramMatch[1]);
            }

            const KNOWN_COLORS =['BLACK','WHITE','BLUE','RED','GREEN','GOLD','SILVER','PINK','PURPLE',
                'VIOLET','YELLOW','ORANGE','TEAL','SAGE','LAVENDER','TITANIUM','PHANTOM','CREAM',
                'GRAPHITE','MIDNIGHT','STARLIGHT','ULTRAMARINE','AWESOME','ICY','COBALT','CORAL',
                'BURGUNDY','LIME','MINT','NAVY','SANDY','LIGHT BLUE','LAKE GREEN','BLUE BLACK',
                'ONYX','MARBLE','GRAY','GREY','BRONZE','NATURAL','DESERT','SKY'];
            let parsedColor = null;
            const segments = desc.split(/\s*[\-–—]\s*/).map(s => s.trim()).filter(Boolean);
            if (segments.length > 1) {
                const last = segments[segments.length - 1];
                if (KNOWN_COLORS.some(c => last.toUpperCase().includes(c))) parsedColor = last;
            }
            if (!parsedColor) {
                const words = desc.split(/\s+/);
                const lastWord = words[words.length - 1];
                if (lastWord && KNOWN_COLORS.some(c => c === lastWord.toUpperCase())) parsedColor = lastWord;
            }

            parsed.push({
                rawText: rawLine, desc, brand: activeBrand, region, price, 
                modelId, ramNum, storageNum, colorUpper: parsedColor ? parsedColor.toUpperCase() : null
            });
        }

        // ── Fetch & normalize DB products ─────────────────────────────────────
        const dbProductsRaw = await prisma.product.findMany({
            where:  { status: 'active' },
            select: { id: true, title: true, variantSku: true, variantPrice: true,
                      brand: true, region: true, storage: true, color: true }
        });

        const dbProducts = dbProductsRaw.map(p => {
            const titleUpper = (p.title || '').toUpperCase();
            
            // Normalize Storage
            let storageNum = null;
            if (p.storage) {
                if (/1\s*TB/i.test(p.storage)) storageNum = 1000;
                else { const m = String(p.storage).match(/(\d{2,3})/); if (m) storageNum = Number(m[1]); }
            }
            if (!storageNum) {
                if (/1\s*TB/i.test(titleUpper)) storageNum = 1000;
                else { const m = titleUpper.match(/(\d{2,3})\s*GB/); if (m) storageNum = Number(m[1]); }
            }

            // Normalize RAM
            let ramNum = null;
            const dbRamMatch = titleUpper.match(/(\d{1,2})\s*GB\s*RAM/i);
            if (dbRamMatch) ramNum = Number(dbRamMatch[1]);
            else {
                const slashM = titleUpper.match(/(\d{1,2})(?:GB)?\s*\/\s*(?:\d{2,3})/);
                if (slashM) ramNum = Number(slashM[1]);
            }

            return {
                ...p,
                brandNorm: p.brand ? String(p.brand).toLowerCase() : '',
                regionNorm: normaliseRegion(p.region),
                titleUpper,
                modelId: extractModelId(titleUpper),
                colorUpper: p.color ? String(p.color).toUpperCase() : '',
                storageNum,
                ramNum,
                variantPriceNum: p.variantPrice ? Number(p.variantPrice) : 0,
            };
        });

        // ── STEP 2: Filter Candidates & Score ─────────────────────────────────
        const processedItems = parsed.map(item => {
            
            // Hard Deterministic Filtering
            let candidates = dbProducts.filter(p => {
                if (p.regionNorm !== item.region) return false;
                if (item.brand && p.brandNorm && item.brand.toLowerCase() !== p.brandNorm) return false;
                if (item.modelId && p.modelId) {
                    if (item.modelId !== p.modelId) return false;
                } else if (item.modelId && !p.modelId) {
                    if (!p.titleUpper.includes(item.modelId)) return false;
                }
                if (item.storageNum && p.storageNum) {
                    if (item.storageNum !== p.storageNum) return false;
                }
                if (item.ramNum && p.ramNum) {
                    if (item.ramNum !== p.ramNum) return false;
                }
                if (item.colorUpper && p.colorUpper) {
                    if (!p.colorUpper.includes(item.colorUpper) && !item.colorUpper.includes(p.colorUpper)) {
                        return false; 
                    }
                }
                return true;
            });

            candidates.forEach(c => {
                let score = 0;
                if (c.variantPriceNum > 0) score += 50; 
                const itemTokens = item.desc.toUpperCase().replace(/[•–\-\/\(\),]/g, ' ').split(/\s+/).filter(t => t.length > 1);
                for (const t of itemTokens) {
                    if (c.titleUpper.includes(t)) score += 1;
                }
                c._matchScore = score;
            });

            candidates.sort((a, b) => b._matchScore - a._matchScore);

            log(`[Match Status] "${item.desc}" -> Found ${candidates.length} strict matches. Selected: ${candidates[0] ? candidates[0].title : 'None'}`);

            return {
                ...item,
                matchedProduct: candidates.length ? candidates[0] : null,
                candidates: candidates
            };
        });


        res.render('admin/products/bulk-price-verify', {
            parsedItems: processedItems,
            allProducts: dbProductsRaw,   
            debugLog: debugLog            
        });

    } catch (err) {
        logger.error(`Bulk price parse error: ${err.message}\nStack: ${err.stack}`);
        res.render('admin/error', { error: `Failed to parse text: ${err.message}` });
    }
});

// POST /admin/bulk-price-update/confirm
router.post('/confirm', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.redirect('/admin/bulk-price-update');
        }

        const updates = [];
        let updatedCount = 0;

        for (const item of items) {
            if (item.selected === 'true' && item.productId && item.newPrice) {
                const newPrice = parseFloat(item.newPrice);
                if (!isNaN(newPrice)) {
                    updates.push(
                        prisma.product.update({
                            where: { id: item.productId },
                            data: { variantPrice: newPrice }
                        })
                    );
                    updatedCount++;
                }
            }
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
            logger.info(`Bulk manually updated prices for ${updatedCount} products`);

            await prisma.integrationLogs.create({
                data: {
                    integration: 'SYSTEM',
                    eventType: 'BULK_PRICE_UPDATE',
                    status: 'SUCCESS',
                    details: { updatedCount }
                }
            }).catch(e => logger.error(`Failed to log bulk price update: ${e.message}`));
        }

        res.redirect('/admin/products');
    } catch (err) {
        logger.error(`Bulk price confirm error: ${err.message}`);
        res.render('admin/error', { error: 'Failed to update prices.' });
    }
});

module.exports = router;
