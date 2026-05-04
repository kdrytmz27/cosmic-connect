import { PrismaClient } from '@prisma/client';
const fs = require('fs');
const path = require('path');
const https = require('https');

const prisma = new PrismaClient();
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const downloadImage = (url: string, filepath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        https.get(url, (res: any) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve());
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        }).on('error', reject);
    });
};

async function main() {
    console.log('Fetching test users...');
    const users = await prisma.user.findMany({
        where: {
            role: 'USER',
            avatar: null
        }
    });

    console.log(`Found ${users.length} users needing avatars.`);
    let menCount = 50; // Random starting point
    let womenCount = 50;

    for (const user of users) {
        try {
            const genderPath = user.gender === 'MALE' ? 'men' : 'women';
            const imgId = user.gender === 'MALE' ? menCount++ : womenCount++;

            if (menCount > 99) menCount = 1;
            if (womenCount > 99) womenCount = 1;

            const url = `https://randomuser.me/api/portraits/${genderPath}/${imgId}.jpg`;
            const filename = `avatar_${user.id}.jpg`;
            const filepath = path.join(uploadsDir, filename);

            console.log(`Downloading ${url} for user ${user.email}...`);
            await downloadImage(url, filepath);

            await prisma.user.update({
                where: { id: user.id },
                data: { avatar: `/uploads/${filename}` }
            });
            console.log(`Updated ${user.email} with avatar /uploads/${filename}`);

            await new Promise(r => setTimeout(r, 200));
        } catch (err: any) {
            console.error(`Failed to update avatar for ${user.email}: ${err.message}`);
        }
    }

    console.log('Finished updating avatars.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
