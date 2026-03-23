const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');

/**
 * Middleware to require either the user themselves or an admin
 */
function requireSelfOrAdmin(req, res, next) {
    const { id } = req.params;
    const { userId, adminId } = req.session;

    if (adminId || (userId && userId === id)) {
        return next();
    }

    return res.status(403).json({ error: 'Access denied. You can only anonymize your own account or must be an admin.' });
}

/**
 * POST /api/users/:id/anonymize
 * GDPR Right to be Forgotten: Anonymizes all PII while keeping the record for order history.
 */
router.post('/:id/anonymize', requireSelfOrAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 1. Prepare anonymized data
        const anonymizedEmail = `deleted_${id.substring(0, 8)}@techbyte.internal`;
        const placeholder = 'Anonymized';

        // 2. Perform anonymization in a transaction
        await prisma.user.update({
            where: { id },
            data: {
                email: anonymizedEmail,
                companyName: placeholder,
                companyPhone: '0000000000',
                companyAddr: placeholder,
                zipCode: '00000',
                taxId: placeholder,
                tinNumber: null,
                vatNumber: null,
                regCertUrl: null,
                bankName: placeholder,
                bankAddress: placeholder,
                bankCountry: placeholder,
                bankIban: placeholder, // Overwrite encrypted IBAN with placeholder
                ceoName: placeholder,
                ceoPhone: '0000000000',
                ceoEmail: anonymizedEmail,
                salesName: placeholder,
                salesEmail: anonymizedEmail,
                salesPhone: '0000000000',
                purchaseName: placeholder,
                purchaseEmail: anonymizedEmail,
                purchasePhone: '0000000000',
                logisticName: placeholder,
                logisticPhone: '0000000000',
                personalName: placeholder,
                personalPhone: '0000000000',
                passwordHash: null, // Disable login
                passwordResetToken: null,
                passwordResetExpires: null,
                status: 'anonymized',
                marketingOptIn: false
            }
        });

        logger.info(`User ${id} has been anonymized (GDPR request).`);

        // 3. Clear session if the user is anonymizing themselves
        if (req.session.userId === id) {
            req.session.destroy();
        }

        res.json({ message: 'User record has been successfully anonymized. All PII has been removed.' });

    } catch (err) {
        logger.error(`Failed to anonymize user ${id}:`, err);
        res.status(500).json({ error: 'Anonymization failed. Please contact support.' });
    }
});

module.exports = router;
