/**
 * Picqer REST API v1 Client
 * 
 * Uses Node 18+ native fetch with HTTP Basic Auth.
 * Every request enforces a strict 5-second timeout via AbortController
 * to prevent hanging the checkout flow if Picqer's API degrades.
 */
const logger = require('./logger');

const PICQER_BASE_URL = process.env.PICQER_BASE_URL; // e.g. https://unity-trading.picqer.com/api/v1
const PICQER_API_KEY = process.env.PICQER_API_KEY;
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds

// Pre-compute the Basic Auth header (API key as username, empty password)
const AUTH_HEADER = PICQER_API_KEY
  ? 'Basic ' + Buffer.from(`${PICQER_API_KEY}:`).toString('base64')
  : null;

/**
 * Core request helper. All Picqer calls go through here.
 * Throws on non-2xx responses or timeout.
 */
async function picqerRequest(method, path, body = null) {
  if (!PICQER_BASE_URL || !AUTH_HEADER) {
    throw new Error('Picqer API is not configured. Set PICQER_BASE_URL and PICQER_API_KEY in .env');
  }

  const url = `${PICQER_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const options = {
      method,
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Handle non-2xx responses
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No response body');
      throw new Error(`Picqer API ${method} ${path} returned ${response.status}: ${errorBody}`);
    }

    // Some endpoints (like process) may return 204 No Content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Picqer API ${method} ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API Methods ─────────────────────────────────────────────────────

/**
 * Create a customer in Picqer.
 * @param {Object} data - Customer data matching Picqer's /customers schema
 * @returns {Object} Picqer customer object with idcustomer
 */
async function createCustomer(data) {
  return picqerRequest('POST', '/customers', data);
}

/**
 * Create an order in Picqer (will be in 'concept' status).
 * @param {Object} data - Order data matching Picqer's /orders schema
 * @returns {Object} Picqer order object with idorder, orderid
 */
async function createOrder(data) {
  return picqerRequest('POST', '/orders', data);
}

/**
 * Process a concept order → moves it to 'processing' status.
 * This triggers picklist generation and native stock deduction.
 * @param {number} idorder - Picqer order ID
 */
async function processOrder(idorder) {
  return picqerRequest('POST', `/orders/${idorder}/process`);
}

/**
 * Get all product stock for a specific warehouse.
 * @param {number} idwarehouse - Picqer warehouse ID
 * @returns {Array} Array of product stock entries
 */
async function getWarehouseStock(idwarehouse) {
  return picqerRequest('GET', `/warehouses/${idwarehouse}/stock`);
}

/**
 * Update custom order fields for an order.
 * @param {number} idorder - Picqer order ID
 * @param {Array} fields - Array of { idorderfield, value } objects
 */
async function updateOrderFields(idorder, fields) {
  return picqerRequest('PUT', `/orders/${idorder}/orderfields`, fields);
}

/**
 * Get all products.
 * @param {number} offset - Pagination offset
 * @returns {Array} Array of products
 */
async function getProducts(offset = 0) {
  return picqerRequest('GET', `/products?offset=${offset}`);
}

module.exports = {
  createCustomer,
  createOrder,
  processOrder,
  getWarehouseStock,
  updateOrderFields,
  getProducts,
};
