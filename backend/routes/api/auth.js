import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import supabase from '../../lib/supabase.js';
import { encrypt } from '../../lib/encryption.js';
import { notifyAdminNewRegistration, sendApprovalEmail, sendDeclineEmail } from '../../lib/email.js';
import { registrationSchema, loginSchema, passwordSchema, setPasswordSchema } from '../../lib/validators.js';

const router = express.Router();

// POST /api/auth/register — Business registration
router.post('/register', async (req, res) => {
    try {
        const parsed = registrationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Validation failed', fields: parsed.error.format() });
        }

        const {
            email, companyName, companyPhone, companyAddr, country, zipCode, taxId,
            tinNumber, vatNumber,
            bankName, bankAddress, bankCountry, bankIban,
            ceoName, ceoPhone, ceoEmail,
            salesName, salesEmail, salesPhone,
            purchaseName, purchaseEmail, purchasePhone,
            logisticName, logisticPhone,
            personalName, personalPhone,
            marketingOptIn
        } = parsed.data;

        // Check if email exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const customer = await prisma.user.create({
            data: {
                email, companyName, companyPhone, companyAddr, country, zipCode, taxId,
                tinNumber, vatNumber,
                bankName, bankAddress, bankCountry,
                bankIban: encrypt(bankIban), // Encrypt PII
                ceoName, ceoPhone, ceoEmail,
                salesName, salesEmail, salesPhone,
                purchaseName, purchaseEmail, purchasePhone,
                logisticName, logisticPhone,
                personalName, personalPhone,
                marketingOptIn,
                status: 'pending',
            },
        });

        // Notify admin
        try {
            await notifyAdminNewRegistration(customer);
        } catch (emailErr) {
            console.error('Admin notification email failed:', emailErr.message);
        }

        res.status(201).json({
            message: 'Registration submitted. You will receive an email once your account is approved.',
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
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        if (user.status !== 'approved') {
            return res.status(403).json({
                error: user.status === 'pending'
                    ? 'Your registration is pending approval.'
                    : 'Your registration was declined. Please check your email for details.',
            });
        }
        if (!user.passwordHash) return res.status(403).json({ error: 'Please set your password first using the link sent to your email.' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

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
            return res.status(400).json({ error: 'Validation failed', fields: parsed.error.format() });
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

        const user = await prisma.user.findUnique({ where: { email } });
        // Always return success (don't reveal if email exists)
        if (!user || user.status !== 'approved') {
            return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            email,
            { redirectTo: `${frontendUrl}/reset-password` }
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
            return res.status(400).json({ error: 'Validation failed', fields: parsed.error.format() });
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
        const user = await prisma.user.findUnique({
            where: { email: authUser.email },
        });

        if (!user) return res.status(404).json({ error: 'User not found in database' });

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
