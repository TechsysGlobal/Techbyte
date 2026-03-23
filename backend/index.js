require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const multer = require('multer');
const logger = require('./lib/logger');
const errorHandler = require('./middleware/errorHandler');

// Rate limiting (graceful fallback if not installed)
let rateLimit;
try {
    rateLimit = require('express-rate-limit');
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
// NOTE (Scaling): Session store is already Postgres (multi-instance ready).
// Before horizontal scaling, replace:
// - node-cache → Redis (for shared cache across instances)
// - multer memoryStorage → Supabase Storage (for persistent file uploads)

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Routes ──────────────────────────────────────────────────────────────────

// API routes (JSON)
app.use('/api/webhooks', require('./routes/api/webhooks'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/categories', require('./routes/api/categories'));
app.use('/api/brands', require('./routes/api/brands'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/orders', require('./routes/api/orders'));
app.use('/api/cart', require('./routes/api/cart'));
app.use('/api/contact', require('./routes/api/contact'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/health', require('./routes/api/health'));

// Admin routes (EJS SSR)
app.use('/admin', require('./routes/admin'));

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
    const { startWorker } = require('./workers/picqerQueueProcessor');
    startWorker();
});
