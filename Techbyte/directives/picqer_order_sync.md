# Picqer Order Sync

## Purpose
Synchronously push checkout orders to Picqer's WMS when a customer completes checkout on TechByte.

## Architecture
- **Layer 2 (Orchestration):** `lib/picqerCheckout.js` — reads user/order data, calls Picqer API in sequence
- **Layer 3 (Execution):** `lib/picqerClient.js` — deterministic HTTP client with 5s timeout

## Flow
1. **Phase A — Customer Sync:** Check `User.picqerCustomerId`. If null → `POST /customers` → save `idcustomer`.
2. **Phase B Pre-Check — Smart Warehouse:** Query stock per allowed warehouse, pick highest fulfillment score.
3. **Phase B — Order Push:** `POST /orders` with customer, products (SKU → productcode), warehouse. Then `POST /orders/{id}/process` to trigger picklist.
4. **Phase C — B2B Fields (Optional):** If `poNumber` or `shippingNotes` → `PUT /orders/{id}/orderfields`.

## Error Handling
- All Picqer errors are caught and logged to `IntegrationLogs` (status: `Error`).
- The checkout always returns `201 OK` — Picqer failure is non-blocking.
- Admins can retry failed syncs via `POST /admin/orders/:id/retry-picqer-sync`.

## Stock Deduction
We do **NOT** manually deduct Picqer stock. Once Picqer processes the order, it natively allocates inventory. Manual deduction via `/api/product-stock` would cause double-deductions.

If ordered quantity exceeds a warehouse's freestock, Picqer natively creates backorders. No cart splitting is needed.

## Environment Variables
```
PICQER_BASE_URL=https://unity-trading.picqer.com/api/v1
PICQER_API_KEY=<api_key>
PICQER_ALLOWED_WAREHOUSE_IDS=7634,7695,8205
PICQER_ORDERFIELD_PO_NUMBER=<id>        # Optional: Picqer orderfield ID for PO number
PICQER_ORDERFIELD_SHIPPING_NOTES=<id>   # Optional: Picqer orderfield ID for shipping notes
```

## Files
- `lib/picqerClient.js` — HTTP client (Basic Auth, 5s AbortController timeout)
- `lib/picqerCheckout.js` — Checkout orchestrator (Phases A–C)
- `routes/api/orders.js` — Calls `syncOrderToPicqer()` after DB commit
- `routes/admin/orders.js` — Admin retry endpoint
- `views/admin/orders/detail.ejs` — Picqer Sync card with retry button

## Edge Cases Learned
- Picqer orders are created as `concept`, must call `/process` to move to `processing`
- HTTP Basic Auth: API key as username, empty password
- `warehouses` array in order payload locks the order to specific warehouse(s)
- Picqer's response to `POST /orders` includes `orderid` (human-readable number) and `idorder` (internal ID)
