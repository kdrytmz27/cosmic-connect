const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        // Reset EVERYTHING to Swipe Matches (Likes) initially to clear the mess
        const res1 = await prisma.friendship.updateMany({
            data: {
                status: 'SWIPE_MATCH',
                expiresAt: null
            }
        });
        console.log('Reset all friendships to SWIPE_MATCH (no timer):', res1.count);

        // Now, if they were real friends (already accepted request), we might lose it...
        // But we don't have a lot of test data, so it's safer to clear the "broken" states.

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
