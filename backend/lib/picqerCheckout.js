/**
 * Picqer Checkout Orchestrator
 * 
 * Synchronously pushes customer + order to Picqer after checkout.
 * Full try/catch — errors are logged to IntegrationLogs, never thrown.
 * 
 * Flow:
 *   Phase A: Customer Sync (create in Picqer if not linked)
 *   Phase B Pre-Check: Smart Warehouse Selection
 *   Phase B: Order Push + Process (concept → processing)
 *   Phase C: B2B Order Fields (optional PO number / shipping notes)
 */
import prisma from './prisma.js';
import logger from './logger.js';
import * as picqer from './picqerClient.js';

// Allowed warehouse IDs from env (same list the webhook processor uses)
const ALLOWED_WAREHOUSE_IDS = (process.env.PICQER_ALLOWED_WAREHOUSE_IDS || '')
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

/**
 * Record an integration log entry (same pattern as picqerQueueProcessor).
 */
async function logIntegration(status, sku, details) {
  try {
    await prisma.integrationLogs.create({
      data: { status, sku: sku || 'ORDER_SYNC', details }
    });
  } catch (err) {
    logger.error('Failed to write to IntegrationLogs:', err);
  }
}

// ─── Phase A: Customer Sync ─────────────────────────────────────────────────

/**
 * Ensure the user has a Picqer customer record.
 * If picqerCustomerId is null, creates one and saves the ID.
 * 
 * @param {Object} user - Full user record from Prisma
 * @returns {number} Picqer idcustomer
 */
async function ensurePicqerCustomer(user) {
  // Already linked — return existing ID
  if (user.picqerCustomerId) {
    return user.picqerCustomerId;
  }

  // Build Picqer customer payload from billing details
  const customerData = {
    name: user.companyName,
    contactname: user.ceoName || user.personalName || '',
    telephone: user.companyPhone || '',
    emailaddress: user.email,
    vatnumber: user.vatNumber || '',
    addresses: [
      {
        name: user.companyName,
        contactname: user.ceoName || user.personalName || '',
        address: user.companyAddr || '',
        zipcode: user.zipCode || '',
        country: user.country || '',
        defaultinvoice: true,
        defaultdelivery: true,
      }
    ]
  };

  const picqerCustomer = await picqer.createCustomer(customerData);
  const idcustomer = picqerCustomer.idcustomer;

  // Save immediately (synchronous response — no webhook needed)
  await prisma.user.update({
    where: { id: user.id },
    data: { picqerCustomerId: idcustomer }
  });

  logger.info(`Picqer customer created: idcustomer=${idcustomer} for user=${user.id}`);
  return idcustomer;
}

// ─── Phase B Pre-Check: Smart Warehouse Selection ───────────────────────────

/**
 * Determine which allowed warehouse has the most stock for the requested items.
 * 
 * Strategy: For each warehouse, sum min(freestock, requestedQty) across all SKUs.
 * The warehouse with the highest "fulfillment score" wins.
 * 
 * @param {Array} orderItems - Array of { variantSku, quantity }
 * @returns {number|null} Best warehouse ID, or null if none configured
 */
async function selectBestWarehouse(orderItems) {
  if (ALLOWED_WAREHOUSE_IDS.length === 0) {
    logger.warn('No PICQER_ALLOWED_WAREHOUSE_IDS configured — skipping warehouse selection');
    return null;
  }

  // Build a lookup of requested SKUs → quantity
  const skuDemand = {};
  for (const item of orderItems) {
    if (!skuDemand[item.variantSku]) {
      skuDemand[item.variantSku] = 0;
    }
    skuDemand[item.variantSku] += item.quantity;
  }

  let bestWarehouseId = ALLOWED_WAREHOUSE_IDS[0]; // Default to first warehouse
  let bestScore = -1;

  // Query each warehouse's stock in parallel
  const stockResults = await Promise.allSettled(
    ALLOWED_WAREHOUSE_IDS.map(async (whId) => {
      const stockData = await picqer.getWarehouseStock(whId);
      return { warehouseId: whId, stock: stockData };
    })
  );

  for (const result of stockResults) {
    if (result.status !== 'fulfilled') {
      logger.warn(`Failed to fetch stock for warehouse: ${result.reason?.message}`);
      continue;
    }

    const { warehouseId, stock } = result.value;

    // Build a productcode → freestock lookup for this warehouse
    const stockByCode = {};
    if (Array.isArray(stock)) {
      for (const entry of stock) {
        if (entry.productcode) {
          stockByCode[entry.productcode] = entry.freestock || 0;
        }
      }
    }

    // Score: sum of min(freestock, demand) for each requested SKU
    let score = 0;
    for (const [sku, demand] of Object.entries(skuDemand)) {
      const available = stockByCode[sku] || 0;
      score += Math.min(available, demand);
    }

    if (score > bestScore) {
      bestScore = score;
      bestWarehouseId = warehouseId;
    }
  }

  logger.info(`Smart warehouse selection: chose warehouse ${bestWarehouseId} (score: ${bestScore})`);
  return bestWarehouseId;
}

// ─── Phase B: Order Push ────────────────────────────────────────────────────

/**
 * Create the order in Picqer and move it to processing.
 * 
 * @param {Object} order - Our DB order with items and product details
 * @param {number} idcustomer - Picqer customer ID from Phase A
 * @param {number|null} idwarehouse - Winning warehouse from Phase B Pre-Check
 * @param {Object} user - Full user record for address mapping
 * @returns {Object} { idorder, orderid } from Picqer
 */
async function pushOrderToPicqer(order, idcustomer, idwarehouse, user) {
  // Map cart items to Picqer's products array
  const products = order.items.map(item => ({
    productcode: item.product.variantSku, // Match Picqer's productcode
    amount: item.quantity,
    price: parseFloat(item.priceAtSale),
  }));

  // Build the order payload
  const orderData = {
    idcustomer,
    reference: order.id, // Our internal order ID for cross-reference
    emailaddress: user.email,
    telephone: user.companyPhone || '',
    // Delivery address
    deliveryname: user.companyName,
    deliverycontactname: user.ceoName || user.personalName || '',
    deliveryaddress: user.companyAddr || '',
    deliveryzipcode: user.zipCode || '',
    deliverycountry: user.country || '',
    // Invoice address (same as billing)
    invoicename: user.companyName,
    invoicecontactname: user.ceoName || user.personalName || '',
    invoiceaddress: user.companyAddr || '',
    invoicezipcode: user.zipCode || '',
    invoicecountry: user.country || '',
    // Products
    products,
  };

  // Lock to specific warehouse if selected
  if (idwarehouse) {
    orderData.warehouses = [{ idwarehouse }];
  }

  // Step 1: Create the order (arrives as 'concept')
  const picqerOrder = await picqer.createOrder(orderData);
  const idorder = picqerOrder.idorder;
  const orderNumber = picqerOrder.orderid; // Human-readable per-account order number

  // Save Picqer IDs to our database immediately
  await prisma.order.update({
    where: { id: order.id },
    data: {
      picqerOrderId: idorder,
      picqerOrderNumber: String(orderNumber),
    }
  });

  logger.info(`Picqer order created: idorder=${idorder}, orderid=${orderNumber} for order=${order.id}`);

  // Step 2: Process the order (concept → processing)
  // This triggers picklist generation and native stock deduction in Picqer
  await picqer.processOrder(idorder);
  logger.info(`Picqer order ${idorder} moved to processing`);

  return { idorder, orderNumber };
}

// ─── Phase C: B2B Order Fields ──────────────────────────────────────────────

/**
 * Optionally set custom order fields (PO number, shipping notes).
 * These must be configured as orderfields in Picqer's settings beforehand.
 * If the field IDs aren't set in env, this phase is silently skipped.
 * 
 * @param {number} idorder - Picqer order ID
 * @param {Object} meta - { poNumber, shippingNotes }
 */
async function setB2BOrderFields(idorder, meta = {}) {
  const { poNumber, shippingNotes } = meta;
  if (!poNumber && !shippingNotes) return; // Nothing to set

  // Map to Picqer's orderfield format
  // These IDs must be configured in Picqer's settings and stored in env
  const fields = [];

  if (poNumber && process.env.PICQER_ORDERFIELD_PO_NUMBER) {
    fields.push({
      idorderfield: parseInt(process.env.PICQER_ORDERFIELD_PO_NUMBER),
      value: poNumber,
    });
  }

  if (shippingNotes && process.env.PICQER_ORDERFIELD_SHIPPING_NOTES) {
    fields.push({
      idorderfield: parseInt(process.env.PICQER_ORDERFIELD_SHIPPING_NOTES),
      value: shippingNotes,
    });
  }

  if (fields.length > 0) {
    await picqer.updateOrderFields(idorder, fields);
    logger.info(`Picqer order ${idorder}: B2B fields updated (${fields.length} fields)`);
  }
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Full Picqer sync for a checkout order.
 * 
 * IMPORTANT: This function NEVER throws. All errors are caught and logged
 * to IntegrationLogs. The checkout returns 201 regardless of Picqer success.
 * 
 * @param {Object} order - Order with items + items.product (includes variantSku)
 * @param {string} userId - User UUID
 * @param {Object} meta - Optional { poNumber, shippingNotes }
 */
async function syncOrderToPicqer(order, userId, meta = {}) {
  try {
    // Skip if Picqer is not configured
    if (!process.env.PICQER_BASE_URL || !process.env.PICQER_API_KEY) {
      logger.warn('Picqer API not configured — skipping order sync');
      return;
    }

    // Load full user record for address mapping
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Ensure order has items with product details
    let orderWithProducts = order;
    if (!order.items || !order.items[0]?.product) {
      orderWithProducts = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: { product: { select: { variantSku: true, title: true } } }
          }
        }
      });
    }

    // Phase A: Customer Sync
    const idcustomer = await ensurePicqerCustomer(user);

    // Phase B Pre-Check: Smart Warehouse Selection
    const skuItems = orderWithProducts.items.map(item => ({
      variantSku: item.product.variantSku,
      quantity: item.quantity,
    }));
    const idwarehouse = await selectBestWarehouse(skuItems);

    // Phase B: Order Push + Process
    const { idorder } = await pushOrderToPicqer(orderWithProducts, idcustomer, idwarehouse, user);

    // Phase C: B2B Order Fields (optional)
    await setB2BOrderFields(idorder, meta);

    // Log success
    await logIntegration(
      'Success',
      'ORDER_SYNC',
      `Order ${order.id} synced to Picqer: idorder=${idorder}`
    );

  } catch (err) {
    // Log failure — DO NOT throw. The order is already saved in our DB.
    logger.error(`Picqer order sync failed for order ${order.id}:`, err);
    await logIntegration(
      'Error',
      'ORDER_SYNC',
      `Order ${order.id} failed to sync: ${err.message}`
    );
  }
}

export {
  syncOrderToPicqer,
};
