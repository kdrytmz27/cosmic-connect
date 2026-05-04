async function testLogin() {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findFirst();
        await prisma.$disconnect();

        if (!user) {
            console.log('No users in database.');
            return;
        }

        console.log('Trying to login as:', user.email);

        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: 'password123' })
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (e: any) {
        console.error('Login failed:', e.message);
    }
}
testLogin();
