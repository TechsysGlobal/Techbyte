import express from 'express';
import { sendEmail } from '../../lib/email.js';

const router = express.Router();

// POST /api/contact — Send contact form email
router.post('/', async (req, res) => {
    try {
        const { name, email, countryCode, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Name, email, subject, and message are required' });
        }

        const fullPhoneNumber = phone ? `${countryCode} ${phone}` : 'Not provided';

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; color: #36b084;">New Contact Form Submission</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${fullPhoneNumber}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            </div>
        `;

        // Send to admin email
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'shopify@techsysglobal.ae';
        await sendEmail(adminEmail, `Website Contact Form: ${subject}`, html);

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
