import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const users = await prisma.user.findMany({ select: { id: true, name: true, matchScore: true, role: true }});
    console.dir(users, { depth: null });
    const rels = await prisma.friendship.findMany();
    console.dir(rels, { depth: null });
}
run().finally(() => prisma.$disconnect());
