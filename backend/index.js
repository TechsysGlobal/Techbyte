import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import crypto from 'crypto';
import flash from 'connect-flash';
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

// ─── Environment Validation ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
        logger.error('FATAL: ENCRYPTION_KEY must be a 64-char hex string (32 bytes) in production');
        process.exit(1);
    }
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'skyisthelimitunitytrading') {
        logger.warn('WARNING: Weak or default SESSION_SECRET detected in production');
    }
}


// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cookieParser(process.env.SESSION_SECRET || 'dev-secret'));
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) 
        // OR localhost/127.0.0.1 origins
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('http://192.168.')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const isAllowed = allowedTypes.test(file.mimetype) || allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (isAllowed) return cb(null, true);
        cb(new Error('Invalid file type. Only images (JPG, PNG, WEBP, GIF) are allowed.'));
    }
});
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

app.use(flash());

// Expose flash messages to all EJS views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


// CSRF Protection (Double CSRF Pattern)
const {
    invalidCsrfTokenError,
    generateCsrfToken,
    doubleCsrfProtection,
} = doubleCsrf({
    getSecret: (req) => process.env.CSRF_SECRET || req.session.csrfSecret || (req.session.csrfSecret = crypto.randomBytes(32).toString('hex')),
    getSessionIdentifier: (req) => req.session.id, // Tie token to session
    cookieName: 'x-csrf-token',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req) => req.body._csrf || req.headers['x-csrf-token'],
});

// ─── Audit & CSRF Context Middleware ──────────────────────────────────────────
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.path} - Session ID: ${req.session ? req.session.id : 'NONE'}`);
    
    // Audit context
    if (req.session && req.session.userId) {
        req.auditUserId = req.session.userId;
    }
    
    // Inject CSRF token into EJS views for admin (only on GET)
    if (req.path.startsWith('/admin') && req.method === 'GET') {
        req.session.csrfInit = true; // Force session to save to DB so ID doesn't change on POST
        res.locals.csrfToken = generateCsrfToken(req, res);
    }
    next();
});

// Apply CSRF protection to all /admin POST/PUT/DELETE routes
app.use('/admin', doubleCsrfProtection);


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

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN' || err === invalidCsrfTokenError) {
        logger.warn(`CSRF Validation Failed: ${req.method} ${req.path} from ${req.ip}`);
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }
    next(err);
});

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
