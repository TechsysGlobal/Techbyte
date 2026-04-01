import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import supabase from '../../lib/supabase.js';
import { encrypt } from '../../lib/encryption.js';
import { notifyAdminNewRegistration, sendSecurityAlert } from '../../lib/email.js';
import { registrationSchema, loginSchema, setPasswordSchema } from '../../lib/validators.js';
import logger from '../../lib/logger.js';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizeEmail = (email) => email.trim().toLowerCase();
const buildValidationErrorResponse = (zodError) => {
    const issue = zodError.issues?.[0];
    const field = issue?.path?.join('.');
    const message = issue?.message || 'Validation failed';

    return {
        error: field ? `${field}: ${message}` : message,
        fields: zodError.flatten(),
    };
};

function buildRegistrationData(data) {
    return {
        email: normalizeEmail(data.email),
        companyName: data.companyName,
        companyPhone: data.companyPhone,
        companyAddr: data.companyAddr,
        country: data.country,
        zipCode: data.zipCode,
        taxId: data.taxId?.trim() || '',
        tinNumber: data.tinNumber?.trim() || null,
        vatNumber: data.vatNumber?.trim() || null,
        bankName: data.bankName,
        bankAddress: data.bankAddress,
        bankCountry: data.bankCountry,
        bankIban: encrypt(data.bankIban),
        ceoName: data.ceoName,
        ceoPhone: data.ceoPhone,
        ceoEmail: normalizeEmail(data.ceoEmail),
        salesName: data.salesName,
        salesEmail: normalizeEmail(data.salesEmail),
        salesPhone: data.salesPhone,
        purchaseName: data.purchaseName,
        purchaseEmail: normalizeEmail(data.purchaseEmail),
        purchasePhone: data.purchasePhone,
        logisticName: data.logisticName,
        logisticPhone: data.logisticPhone,
        personalName: data.personalName,
        personalPhone: data.personalPhone,
        marketingOptIn: Boolean(data.marketingOptIn),
        status: 'pending',
        declineReason: null,
        approvedAt: null,
        passwordHash: null,
        passwordResetToken: null,
        passwordResetExpires: null,
    };
}

// POST /api/auth/register — Business registration
router.post('/register', async (req, res) => {
    try {
        const parsed = registrationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Validation failed', fields: parsed.error.format() });
        }

        const normalizedEmail = normalizeEmail(parsed.data.email);
        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, status: true },
        });

        if (existing?.status === 'approved') {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const registrationData = buildRegistrationData({
            ...parsed.data,
            email: normalizedEmail,
        });

        const customer = existing
            ? await prisma.user.update({
                where: { id: existing.id },
                data: registrationData,
            })
            : await prisma.user.create({
                data: registrationData,
            });

        // Notify admin
        try {
            await notifyAdminNewRegistration(customer);
        } catch (emailErr) {
            console.error('Admin notification email failed:', emailErr.message);
        }

        res.status(existing ? 200 : 201).json({
            message: existing
                ? 'Registration updated. Your application is pending admin review.'
                : 'Registration submitted. You will receive an email once your account is approved.',
            customerId: customer.id,
        });
    } catch (err) {
        console.error('POST /api/auth/register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login — Customer login (only approved)
router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Validation failed', fields: parsed.error.format() });
        }
        const email = normalizeEmail(parsed.data.email);
        const { password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        const logFailure = async (reason) => {
            await prisma.securityLog.create({
                data: {
                    event: 'login_failure',
                    email,
                    ip: req.ip,
                    details: { reason }
                }
            });
            logger.warn(`Failed login: ${email} from ${req.ip} - ${reason}`);

            // Check for brute force (10 failures in 5 mins)
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
            const failureCount = await prisma.securityLog.count({
                where: {
                    ip: req.ip,
                    event: 'login_failure',
                    createdAt: { gte: fiveMinsAgo }
                }
            });

            if (failureCount === 10) { // Alert only on the 10th attempt to avoid spam
                await sendSecurityAlert(req.ip, failureCount, email);
            }
        };

        if (!user) {
            await logFailure('User not found');
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (user.status !== 'approved') {
            await logFailure(`Account status: ${user.status}`);
            return res.status(403).json({
                error: user.status === 'pending'
                    ? 'Your registration is pending approval.'
                    : 'Your registration was declined. Please check your email for details.',
            });
        }
        if (!user.passwordHash) {
            await logFailure('Password not set');
            return res.status(403).json({ error: 'Please set your password first using the link sent to your email.' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            await logFailure('Invalid password');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Prevent admins from accessing the customer portal
        const profile = await prisma.profile.findUnique({ where: { email: user.email } });
        if (profile && profile.role === 'admin') {
            await logFailure('Admin login attempt on customer portal');
            return res.status(403).json({ error: 'Admins cannot login to the customer portal.' });
        }

        // Regenerate session to prevent session fixation attacks
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration failed:', err);
                return res.status(500).json({ error: 'Login failed' });
            }

            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.companyName = user.companyName;

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    companyName: user.companyName,
                    personalName: user.personalName,
                },
            });
        });
    } catch (err) {
        console.error('POST /api/auth/login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out' });
    });
});

// GET /api/auth/me — Current user
router.get('/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: {
                id: true, email: true, companyName: true, personalName: true,
                country: true, companyAddr: true, status: true,
            },
        });
        if (!user) return res.status(401).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        console.error('GET /api/auth/me error:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST /api/auth/set-password — Customer sets password using secure token
router.post('/set-password', async (req, res) => {
    try {
        const parsed = setPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            const validationError = buildValidationErrorResponse(parsed.error);
            logger.warn({
                route: 'POST /api/auth/set-password',
                validation: validationError.fields,
            }, 'Password setup validation failed');
            return res.status(400).json(validationError);
        }
        const { token, password } = parsed.data;

        // Find user by secure crypto token (not UUID)
        const user = await prisma.user.findFirst({
            where: { passwordResetToken: token },
        });
        if (!user) return res.status(404).json({ error: 'Invalid or expired token' });
        if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
            return res.status(400).json({ error: 'Token has expired. Please request a new one.' });
        }
        if (user.status !== 'approved') return res.status(403).json({ error: 'Account not approved' });

        const passwordHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        res.json({ message: 'Password set successfully. You can now login.' });
    } catch (err) {
        console.error('POST /api/auth/set-password error:', err);
        res.status(500).json({ error: 'Failed to set password' });
    }
});

// POST /api/auth/forgot-password — Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const normalizedEmail = normalizeEmail(email);
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        // Always return success (don't reveal if email exists)
        if (!user || user.status !== 'approved') {
            return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            normalizedEmail,
            { redirectTo: `${FRONTEND_URL}/reset-password` }
        );

        if (resetError) {
            console.error('Supabase reset error:', resetError);
            if (resetError.code === 'unexpected_failure') {
                // SMTP is likely not configured or failing
                return res.status(500).json({ error: 'Failed to send recovery email. The server SMTP might not be configured correctly.' });
            }
        }

        res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (err) {
        console.error('POST /api/auth/forgot-password error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// POST /api/auth/reset-password — Reset password using token or code
router.post('/reset-password', async (req, res) => {
    try {
        const parsed = setPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            const validationError = buildValidationErrorResponse(parsed.error);
            logger.warn({
                route: 'POST /api/auth/reset-password',
                validation: validationError.fields,
            }, 'Password reset validation failed');
            return res.status(400).json(validationError);
        }
        const { token, code, password } = parsed.data;

        let authUser = null;

        if (code) {
            // PKCE Flow
            const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
            if (codeError || !data?.user) {
                return res.status(404).json({ error: 'Invalid or expired reset code' });
            }
            authUser = data.user;
        } else {
            // Implicit Flow
            const { data: { user }, error: userError } = await supabase.auth.getUser(token);
            if (userError || !user) {
                return res.status(404).json({ error: 'Invalid or expired token' });
            }
            authUser = user;
        }

        // Find the user in Prisma by email
        const normalizedEmail = normalizeEmail(authUser.email || '');
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) return res.status(404).json({ error: 'User not found in database' });
        if (user.status !== 'approved') {
            return res.status(403).json({ error: 'Account not approved' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Update password in Prisma
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        // Sync password to Supabase Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            authUser.id,
            { password }
        );

        if (updateError) {
            console.error('Failed to update Supabase password:', updateError);
            // Non-fatal, as login currently relies on Prisma
        }

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        console.error('POST /api/auth/reset-password error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
