const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const user = await prisma.user.findUnique({ where: { email: 'user1@example.com' } });
    console.log(user);
}

checkUser().finally(() => prisma.$disconnect());
