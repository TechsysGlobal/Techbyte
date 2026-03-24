import { run } from '../lib/asyncContext.js';

/**
 * Middleware to wrap the request in an AsyncLocalStorage context.
 * It extracts the adminId from the session and makes it available
 * to the Prisma Extension.
 */
export default function auditContext(req, res, next) {
    const adminId = req.session?.adminId;
    const store = { adminId };

    run(store, () => {
        next();
    });
}
