import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const signs = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const templates = [
    {
        category: 'GENERAL', contents: [
            'Bugün yıldızlar sizin için parlak! İç güdülerinize güvenin ve karşılaştığınız fırsatları değerlendirin.',
            'Kozmik enerjiler bugün değişim ve yenilik getiriyor. Alışılmadık yolları denemekten korkmayın.',
            'Bugün sabırlı olmanız gereken bir gün. Acele kararlar vermekten kaçının, zaman her şeyi yerli yerine oturtacak.',
            'Sosyal bağlarınız bugün güçleniyor. Yeni tanışıklıklar sizi şaşırtabilir.',
            'İçsel sesinizi dinleyin; bugün sezgileriniz sizi doğru yöne götürecek.'
        ]
    },
    {
        category: 'LOVE', contents: [
            'Aşk hayatınızda bugün beklenmedik sürprizler olabilir. Açık fikirli olun!',
            'Duygusal bağlarınızı güçlendirmek için mükemmel bir gün. Sevdiklerinize zaman ayırın.',
            'Geçmişten gelen bir mesaj kalbinizi hızlandırabilir. Hazırlıklı olun.',
            'Venüs bugün sizden yana; romantik girişimleriniz karşılık bulacak.',
            'Partnerinizle dürüst bir konuşma yapın; bu hafta ilişkinizi derinleştirebilirsiniz.'
        ]
    },
    {
        category: 'CAREER', contents: [
            'İş yerinde fırsat kapıdan bakıyor. Cesur adımlar atmaktan çekinmeyin!',
            'Bugün finansal konulara odaklanmak için iyi bir zaman. Bütçenizi gözden geçirin.',
            'Kariyerinizle ilgili yeni bir dönüm noktasındasınız. Hazırlıksız yakalanmayın.',
            'Ekip çalışması bugün ön plana çıkıyor. İş birliği yapın ve liderlik fırsatlarını değerlendirin.',
            'Yaratıcı fikirleriniz bugün takdir görecek. Projelerinizde cesur hamleler yapın.'
        ]
    },
    {
        category: 'HEALTH', contents: [
            'Fiziksel sağlığınıza bugün ekstra özen göstermelisiniz. Düzenli su içmeyi unutmayın.',
            'Enerjiniz bugün çok yüksek! Bu enerjiyi egzersize yönlendirmek için harika bir gün.',
            'Vücudunuzun dinlenmeye ihtiyacı var. Erken yatmayı ve rahatlamayı ihmal etmeyin.',
            'Sağlıklı beslenmek için bugün ideal bir gün. Doğal ve taze gıdalara yönelin.',
            'Zihinsel sağlığınıza da dikkat edin; kısa bir meditasyon günün geri kalanını iyileştirebilir.'
        ]
    }
];

async function main() {
    console.log('Clearing existing templates...');
    await prisma.horoscopeTemplate.deleteMany({});

    console.log('Seeding Horoscope Templates...');
    for (const sign of signs) {
        for (const temp of templates) {
            for (const content of temp.contents) {
                await prisma.horoscopeTemplate.create({
                    data: {
                        sign,
                        category: temp.category,
                        content
                    }
                });
            }
        }
    }

    console.log('Seeding Default Fortune Teller...');
    let tellerUser = await prisma.user.findUnique({ where: { email: 'madamzoya@cosmic.com' } });
    if (!tellerUser) {
        tellerUser = await prisma.user.create({
            data: {
                email: 'madamzoya@cosmic.com',
                passwordHash: 'hashed_pass_placeholder',
                role: 'FORTUNE_TELLER',
                birthDate: new Date('1980-01-01'),
                birthTime: '00:00',
                latitude: 0,
                longitude: 0,
                sunSign: 'Scorpio',
                moonSign: 'Cancer',
                risingSign: 'Pisces'
            }
        });

        await prisma.fortuneTeller.create({
            data: {
                userId: tellerUser.id,
                skills: 'Tarot, Astroloji, Kahve Falı',
                bio: 'Yıldızların ve kartların gizemini çözerek sana rehberlik edeceğim.',
                rating: 5.0,
                reviewCount: 142
            }
        });
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
