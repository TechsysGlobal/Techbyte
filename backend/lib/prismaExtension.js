const { Prisma } = require('@prisma/client');
const { getStore } = require('./asyncContext');
const cache = require('./cache'); // Import cache for invalidation

const MODELS_TO_AUDIT = ['Product', 'Order', 'User', 'Discount'];

module.exports = Prisma.defineExtension((client) => {
    return client.$extends({
        name: 'audit-log',
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Only audit specific models and write operations
                    if (!MODELS_TO_AUDIT.includes(model) || !['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'].includes(operation)) {
                        return query(args);
                    }

                    const store = getStore();
                    const adminId = store?.adminId;

                    // If no admin context (e.g. system background job or public API), skips logging
                    if (!adminId) {
                        return query(args);
                    }

                    const start = Date.now();
                    let result;
                    let action = operation.toUpperCase();
                    let entityId = 'N/A';
                    let details = {};

                    // Logic to capture diffs
                    try {
                        if (operation === 'update') {
                            // Fetch original data for diff
                            // This might vary depending on how complex we want to be.
                            // For now, let's just log the 'data' being updated.
                            // A robust diff requires an extra DB call:
                            const original = await client[model.findUnique ? model : model.toLowerCase()].findUnique({
                                where: args.where,
                            }).catch(() => null);

                            details = {
                                original,
                                changes: args.data,
                            };

                            if (original) entityId = original.id;
                        } else if (operation === 'create') {
                            details = { data: args.data };
                        } else if (operation === 'delete') {
                            const original = await client[model.findUnique ? model : model.toLowerCase()].findUnique({
                                where: args.where,
                            }).catch(() => null);
                            details = { deleted: original };
                            if (original) entityId = original.id;
                        }

                        // Execute original query
                        result = await query(args);

                        // If create, we get the ID from result
                        if (operation === 'create' && result && result.id) {
                            entityId = result.id;
                        }

                        // Asynchronously log to ActivityLog
                        // We use the raw client to avoid infinite loops if ActivityLog was audited (it's not)
                        // But since we excluded ActivityLog from check, it's fine.
                        // However, strictly speaking, better to use a non-extended client or check model name.

                        await client.activityLog.create({
                            data: {
                                adminId,
                                action,
                                entity: model,
                                entityId: String(entityId),
                                details: JSON.parse(JSON.stringify(details)), // Ensure plain object
                            },
                        });

                        // ─── CACHE INVALIDATION ─────────────────────────────────────────────
                        if (model === 'Product') {
                            // "Fast Lane": Clear the products list cache immediately
                            cache.del('products_list');
                            console.log(`[Cache] Invalidated products_list due to ${action} on Product ${entityId}`);
                        }
                        // ────────────────────────────────────────────────────────────────────

                    } catch (err) {
                        console.error(`[Audit] Failed to log activity for ${model}.${operation}:`, err);
                        // If the main query hasn't run yet, throw. If it has, we probably shouldn't fail the request?
                        // But query() awaits the result. If query() succeeds but log fails, we should decide.
                        // Usually we want to fail if audit fails for strict compliance.
                        if (!result) throw err;
                    }

                    return result;
                },
            },
        },
    });
});
