import prisma from './prisma.js';

/**
 * Manually logs an activity to the audit trail.
 * @param {string} adminId - The ID of the admin performing the action
 * @param {string} action - The action name (e.g., 'MANUAL_DEAL', 'LOGIN')
 * @param {string} entity - The entity affected (e.g., 'Discount', 'System')
 * @param {string} entityId - The ID of the entity
 * @param {object} details - JSON details
 */
export async function logActivity(adminId, action, entity, entityId, details) {
    try {
        await prisma.activityLog.create({
            data: {
                adminId,
                action,
                entity,
                entityId,
                details,
            },
        });
        console.log(`[Audit] Manual log: ${action} on ${entity} ${entityId}`);
    } catch (err) {
        console.error('[Audit] Failed to log manual activity:', err);
    }
}
