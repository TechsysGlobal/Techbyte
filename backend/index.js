import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import multer from 'multer';
import logger from './lib/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

// Route imports
import webhookRoutes from './routes/api/webhooks.js';
import productRoutes from './routes/api/products.js';
import categoryRoutes from './routes/api/categories.js';
import brandRoutes from './routes/api/brands.js';
import authRoutes from './routes/api/auth.js';
import orderRoutes from './routes/api/orders.js';
import cartRoutes from './routes/api/cart.js';
import contactRoutes from './routes/api/contact.js';
import userRoutes from './routes/api/users.js';
import healthRoutes from './routes/api/health.js';
import adminRoutes from './routes/admin/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PgSession = connectPgSimple(session);

// Rate limiting (graceful fallback if not installed)
let rateLimit;
try {
    const { rateLimit: rl } = await import('express-rate-limit');
    rateLimit = rl;
} catch {
    rateLimit = null;
    logger.warn('express-rate-limit not installed — rate limiting disabled. Run: npm install express-rate-limit');
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
});

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true
}));

// Upload handling
const upload = multer({ storage: multer.memoryStorage() });
app.locals.upload = upload;

// Session
app.use(session({
    store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours — admin must re-login daily
        httpOnly: true,
        // Secure in production (requires HTTPS), false in dev
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    },
}));

// ─── Audit Context Middleware ────────────────────────────────────────────────
// Attaches userId to request context for audit logging
app.use((req, res, next) => {
    if (req.session && req.session.userId) {
        req.auditUserId = req.session.userId;
    }
    next();
});

// ─── View Engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Routes ──────────────────────────────────────────────────────────────────

// API routes (JSON)
app.use('/api/webhooks', webhookRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);

// Admin routes (EJS SSR)
app.use('/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rate Limiting ───────────────────────────────────────────────────────────

if (rateLimit) {
    // Login: 5 attempts per 15 minutes per IP
    app.use('/api/auth/login', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
        standardHeaders: true,
        legacyHeaders: false,
    }));

    // Orders: 10 per minute per IP
    app.use('/api/orders', rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: { error: 'Too many requests. Please slow down.' },
        standardHeaders: true,
        legacyHeaders: false,
    }));
}

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    logger.info(`TechByte Backend Server started on port ${PORT}`);
    logger.info(`API:   http://localhost:${PORT}/api`);
    logger.info(`Admin: http://localhost:${PORT}/admin`);

    // Start background workers
    const workerFiles = [
        'picqerQueueProcessor.js'
    ];

    for (const file of workerFiles) {
        const workerPath = path.join(__dirname, 'workers', file);
        import(pathToFileURL(workerPath).href)
            .then(worker => {
                if (worker.startWorker) {
                    worker.startWorker();
                    logger.info(`[Worker] Started ${file}`);
                } else {
                    logger.warn(`[Worker] ${file} does not export startWorker()`);
                }
            })
            .catch(err => logger.error(`[Worker] Failed to load ${file}: ${err.message}`));
    }
});
