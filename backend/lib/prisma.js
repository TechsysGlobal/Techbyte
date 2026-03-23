const { PrismaClient } = require('@prisma/client');
const auditLogExtension = require('./prismaExtension');

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends(auditLogExtension);

module.exports = prisma;
