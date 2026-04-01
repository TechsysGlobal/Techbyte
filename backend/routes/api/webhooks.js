import express from 'express';
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

const router = express.Router();

router.post('/picqer/stock', async (req, res) => {
  try {
    const signatureHeader = req.headers['x-picqer-signature'];
    const secret = process.env.PICQER_WEBHOOK_SECRET?.trim();

    if (!secret) {
      logger.error('PICQER_WEBHOOK_SECRET is not configured or empty in .env');
      return res.status(500).send('Server Error');
    }

    if (!signatureHeader || !req.rawBody) {
      logger.warn('Picqer webhook missing signature or raw body');
      return res.status(401).send('Missing signature');
    }

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(req.rawBody).digest('base64');

    // Compare safely using timing-safe equality
    const expectedBuffer = Buffer.from(digest);
    const actualBuffer = Buffer.from(signatureHeader);

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      logger.warn(`Invalid Picqer webhook signature tracking for IP: ${req.ip}`);
      return res.status(401).send('Invalid signature');
    }


    const payload = req.body;

    // 1. Safety Check: Ensure we only process the correct event
    if (payload.event !== 'products.free_stock_changed') {
      return res.status(200).send('Event ignored');
    }

    const productCode = payload?.data?.productcode; // e.g., "IP-16E-128-WHT"
    const allWarehouses = payload?.data?.stock; // The array from the webhook

    if (!productCode || !Array.isArray(allWarehouses)) {
      logger.warn('Invalid Picqer webhook payload structure');
      return res.status(400).send('Invalid payload');
    }

    // Insert payload into pgmq for strict FIFO processing
    // We cast to jsonb to ensure pgmq handles the JSON correctly.
    await prisma.$executeRaw`SELECT pgmq.send('picqer_webhook_queue', ${payload}::jsonb)`;

    res.status(200).send(`Webhook queued for processing`);

  } catch (error) {
    logger.error("Picqer Webhook Error:", error);
    res.status(500).send("Server Error");
  }
});

export default router;
