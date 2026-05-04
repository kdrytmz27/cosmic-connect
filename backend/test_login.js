const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing admin login...');
    const email = 'admin@cosmic.com';
    const password = '123456';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User found:', user.email, 'Role:', user.role);
    console.log('Password Hash in DB:', user.passwordHash);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isValid);
}

main().finally(() => prisma.$disconnect());
