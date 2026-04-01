import prisma, { Prisma } from '../lib/prisma.js';
import logger from '../lib/logger.js';

const QUEUE_NAME = 'picqer_webhook_queue';
const MIN_POLL_INTERVAL_MS = 2000; // 2 seconds
const MAX_POLL_INTERVAL_MS = 60000; // 1 minute maximum wait
const BACKOFF_MULTIPLIER = 1.5;

let currentPollInterval = MIN_POLL_INTERVAL_MS;

// Allowed warehouse IDs (fetched from env or default to providing IDs)
const ALLOWED_WAREHOUSE_IDS = (process.env.PICQER_ALLOWED_WAREHOUSE_IDS || '')
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

/**
 * Helper to record the action into IntegrationLogs
 */
async function recordIntegrationLog(status, sku, details) {
  try {
    await prisma.integrationLogs.create({
      data: {
        status, // 'Success', 'Ignored', 'Error'
        sku: sku || 'UNKNOWN',
        details
      }
    });
  } catch (err) {
    logger.error("Failed to write to IntegrationLogs:", err);
  }
}

/**
 * Processes a single webhook message strictly FIFO.
 */
async function processMessage(msg) {
  const msgId = msg.msg_id;
  const payload = msg.message;

  try {
    const productCode = payload?.data?.productcode; // e.g., "IP-16E-128-WHT"
    const allWarehouses = payload?.data?.stock; // The array from the webhook

    if (!productCode || !Array.isArray(allWarehouses)) {
      await recordIntegrationLog('Error', 'UNKNOWN', 'Invalid payload structure missing productcode or stock array');
      return;
    }

    // Filter the array and sum the freestock
    const relevantWarehouses = allWarehouses.filter(location => ALLOWED_WAREHOUSE_IDS.includes(location.idwarehouse));
    
    if (relevantWarehouses.length === 0) {
      await recordIntegrationLog(
        'Ignored',
        productCode,
        `Ignored: Stock change was in ignored warehouse(s)`
      );
      return;
    }

    const calculatedFreeStock = relevantWarehouses.reduce((sum, location) => sum + location.freestock, 0);

    // Find all products having this SKU
    const existingProducts = await prisma.product.findMany({
      where: { variantSku: productCode },
      select: { id: true, variantInventoryQty: true }
    });

    if (existingProducts.length === 0) {
      await recordIntegrationLog(
        'Ignored',
        productCode,
        `Ignored: SKU not found in storefront`
      );
      return;
    }

    const needsUpdate = existingProducts.some(p => p.variantInventoryQty !== calculatedFreeStock);

    if (!needsUpdate) {
      const currentStock = existingProducts[0].variantInventoryQty;
      await recordIntegrationLog(
        'Success',
        productCode,
        `Synced: No change (Stock remains ${currentStock})`
      );
      return;
    }

    // Execute the database update
    await prisma.product.updateMany({
      where: { variantSku: productCode },
      data: { variantInventoryQty: calculatedFreeStock }
    });

    const previousStock = existingProducts[0].variantInventoryQty;
    await recordIntegrationLog(
      'Success',
      productCode,
      `Stock updated: ${previousStock} → ${calculatedFreeStock}`
    );

  } catch (error) {
    logger.error("Queue Processing Error for msg", msgId, error);
    await recordIntegrationLog('Error', payload?.data?.productcode || 'UNKNOWN', `Processing exception: ${error.message}`);
  }
}

/**
 * Main loop for the worker.
 */
async function pollQueue() {
  try {
    // 1. Read the oldest pending message and lock it for 30 seconds
    const result = await prisma.$queryRaw(
      Prisma.sql`SELECT * FROM pgmq.read(${QUEUE_NAME}, 30, 1)`
    );

    if (result && result.length > 0) {
      const msg = result[0]; // { msg_id, read_ct, enqueued_at, vt, message }
      
      // 2. Process message
      await processMessage(msg);

      // 3. Delete message from queue upon completion (even if it was 'Ignored' or 'Error' logic)
      // This prevents poison pills from endlessly looping since we log the outcome to IntegrationLogs instead.
      await prisma.$executeRaw(
        Prisma.sql`SELECT pgmq.delete(${QUEUE_NAME}, ${BigInt(msg.msg_id)})`
      );

      // We found a message, there might be more right behind it.
      // Reset the backoff and poll again immediately to drain the queue fast.
      currentPollInterval = MIN_POLL_INTERVAL_MS;
      setTimeout(pollQueue, 0);
      return;
    } else {
      // Queue is empty, increase the interval (Exponential Backoff)
      currentPollInterval = Math.min(currentPollInterval * BACKOFF_MULTIPLIER, MAX_POLL_INTERVAL_MS);
    }
  } catch (err) {
    // Normally this catches DB connection issues while polling
    logger.error('Error polling pgmq:', err);
    // On DB connection errors, also back off to prevent spamming
    currentPollInterval = Math.min(currentPollInterval * BACKOFF_MULTIPLIER, MAX_POLL_INTERVAL_MS);
  }

  // Schedule the next poll delay
  setTimeout(pollQueue, currentPollInterval);
}

async function startWorker() {
  logger.info(`Started Picqer Webhook Queue Processor for pgmq queue: ${QUEUE_NAME} (with Exponential Backoff)`);
  pollQueue();
}

export {
  startWorker
};
