import { z } from 'zod';
import xss from 'xss';

// Sanitize helper to prevent XSS in string inputs
const sanitizeString = z.string().transform((val) => xss(val.trim()));

// Base reusable fields
const emailSchema = z.string().email('Invalid email address').max(255);
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Registration Schema
const registrationSchema = z.object({
    email: emailSchema.describe('Account email'),
    companyName: sanitizeString.pipe(z.string().min(2, 'Company name is required').max(200)),
    companyPhone: z.string().min(5, 'Valid phone required').max(20).regex(/^[+0-9\s-]+$/, 'Invalid phone format'),
    companyAddr: sanitizeString.pipe(z.string().min(5, 'Address required').max(500)),
    country: z.string().min(2, 'Country required').max(100),
    zipCode: z.string().min(2, 'Zip code required').max(20).regex(/^[0-9a-zA-Z\s-]+$/, 'Invalid zip code format'),

    // Tax Info
    taxId: z.string().max(50).optional(), // Legacy support
    tinNumber: z.string().min(5, 'TIN Number is required').max(30).regex(/^[A-Z0-9-]+$/, 'Invalid TIN format').optional(),
    vatNumber: z.string().min(5, 'VAT Number is required').max(20).regex(/^[A-Z]{2}[0-9A-Z]{2,15}$/, 'Invalid EU VAT format (e.g. DE123456789)').optional(),

    bankName: sanitizeString.pipe(z.string().min(2, 'Bank name required').max(150)),
    bankAddress: sanitizeString.pipe(z.string().min(2, 'Bank address required').max(300)),
    bankCountry: z.string().min(2, 'Bank country required').max(100),
    bankIban: z.string().min(10, 'Valid IBAN required').max(34).regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Invalid IBAN format'),

    ceoName: sanitizeString.pipe(z.string().min(2, 'CEO name required').max(100)),
    ceoPhone: z.string().min(5).max(20).regex(/^[+0-9\s-]+$/, 'Invalid phone format'),
    ceoEmail: emailSchema,

    salesName: sanitizeString.pipe(z.string().min(2, 'Sales contact name required').max(100)),
    salesEmail: emailSchema,
    salesPhone: z.string().min(5).max(20).regex(/^[+0-9\s-]+$/, 'Invalid phone format'),

    purchaseName: sanitizeString.pipe(z.string().min(2, 'Purchase contact name required').max(100)),
    purchaseEmail: emailSchema,
    purchasePhone: z.string().min(5).max(20).regex(/^[+0-9\s-]+$/, 'Invalid phone format'),

    logisticName: sanitizeString.pipe(z.string().min(2, 'Logistics contact name required').max(100)),
    logisticPhone: z.string().min(5).max(20).regex(/^[+0-9\s-]+$/, 'Invalid phone format'),

    personalName: sanitizeString.pipe(z.string().min(2, 'Your name required').max(100)),
    personalPhone: z.string().min(5).max(20).regex(/^[+0-9\s-]+$/, 'Invalid phone format'),

    marketingOptIn: z.boolean().default(false)
});

// Login Schema
const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
});

// Set / Reset Password Schema
const setPasswordSchema = z.object({
    password: passwordSchema,
    token: z.string().optional(),
    code: z.string().optional()
}).refine(data => data.token || data.code, {
    message: "Either token or code must be provided",
    path: ["token"]
});

export {
    registrationSchema,
    loginSchema,
    setPasswordSchema,
    passwordSchema
};
