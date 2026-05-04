import cron from 'node-cron';
import { prisma } from '../index';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

// Burçlara göre günlük ilham metinleri
const HOROSCOPE_MESSAGES: Record<string, string[]> = {
    Aries: [
        'Bugün cesaretiniz yıldızlar tarafından destekleniyor. Yeni başlangıçlar için mükemmel bir gün!',
        'Mars enerjisi ile bugün kendiniz olun; hiçbir şey sizi durduramaz.',
        'Koç burcunun ateşi bugün parlıyor — harekete geçin!'
    ],
    Taurus: [
        'Venüs sizi koruma altına aldı. Güzelliği ve konforu takip edin bugün.',
        'Sabırlı olun; bugün yavaş ilerleyen fırsatlar kalıcı sonuçlar getirir.',
        'Boğa enerjisi tutarlılığı seviyor. Planlarına sadık kal.'
    ],
    Gemini: [
        'Zeka ve iletişim bugün zirveye çıkıyor. Fikirlerinizi paylaşın!',
        'İkizler burcunun çift doğası bugün denge arıyor — her iki yanı da dinleyin.',
        'Yeni bağlantılar kurmanın zamanı; evren sizi doğru insanlara yönlendiriyor.'
    ],
    Cancer: [
        'Ay enerjisi içinizi aydınlatıyor. Sezgilerinize güvenin bugün.',
        'Sevdiklerinizle zaman geçirmek bugün size güç verecek.',
        'Duygusal zekânız bugün en büyük kılavuzunuz olacak.'
    ],
    Leo: [
        'Güneş size parlıyor! Liderlik etme zamanı geldi.',
        'Yaratıcılığınız zirveye ulaştı — bugün sahneye çıkın.',
        'Aslan burcunun gururlu kalbi bugün büyük şeyler başarabilir.'
    ],
    Virgo: [
        'Detaylara olan dikkatiniz bugün sizi öne çıkaracak.',
        'Pratik çözümler bugün kolaylıkla kapınıza gelecek.',
        'Başak enerjisi düzeni ve analizi seviyor — bugün planlayın.'
    ],
    Libra: [
        'Venüs etkisi altında ilişkileriniz bugün çiçek açıyor.',
        'Denge ve adalet duygunuz bugün güçlü — doğru kararlar alırsınız.',
        'Terazi burcunun zarafeti bugün sizi aydınlatıyor.'
    ],
    Scorpio: [
        'Dönüşüm enerjisi yoğun bugün. Derinlere dalın.',
        'Sezgileriniz bugün güçlü — içgüdülerinize kulak verin.',
        'Akrep\'in gücü yeniden doğuşu çağırıyor. Değişime açık olun.'
    ],
    Sagittarius: [
        'Yupiter şansınızı artırıyor bugün. Maceraya hazır olun!',
        'Büyük resme odaklanın — bugün vizyonunuz genişliyor.',
        'Yay burcunun özgürlük aşkı bugün sizi yeni ufuklara taşıyor.'
    ],
    Capricorn: [
        'Disiplin ve kararlılığınız bugün meyvelerini veriyor.',
        'Satürn\'ün gücüyle bugün uzun vadeli hedeflerinize odaklanın.',
        'Oğlak enerjisi sabır ve azim istiyor — pes etmeyin.'
    ],
    Aquarius: [
        'Yenilikçi fikirlerin günü! Sıra dışı düşünce sizi öne çıkaracak.',
        'İnsanlığa olan sevginiz bugün etrafınızdakileri etkiliyor.',
        'Kova burcunun devrimi bugün başlıyor — değişimin öncüsü olun.'
    ],
    Pisces: [
        'Hayal gücünüz sınır tanımıyor bugün. Sanata ve sezgiye güvenin.',
        'Neptün\'ün mistik enerjisi sizi derin sulara çağırıyor.',
        'Balık burcunun şefkati bugün hem size hem etrafınızdakilere şifa getiriyor.'
    ]
};

function getRandomMessage(sign: string): string {
    const messages = HOROSCOPE_MESSAGES[sign] || ['Bugün yıldızlar size güzel sürprizler hazırlıyor! ⭐'];
    return messages[Math.floor(Math.random() * messages.length)]!;
}

export function startHoroscopeCron() {
    // Her gün 08:00'de tetiklenecek (Türkiye saati UTC+3 için 05:00 UTC)
    // Lokal test için her dakika: '* * * * *'
    cron.schedule('0 5 * * *', async () => {
        logger.info('[HoroscopeCron] Sending daily horoscope notifications...');
        try {
            // Yalnızca gerçek kullanıcıları çek (Falcı olmayanlar)
            const users = await prisma.user.findMany({
                where: { role: 'STANDARD' },
                select: { id: true, sunSign: true, name: true }
            });

            logger.info(`[HoroscopeCron] Sending to ${users.length} users...`);

            for (const user of users) {
                const sign = user.sunSign ?? 'Aries';
                const message = getRandomMessage(sign);
                await notificationService.createNotification({
                    userId: user.id,
                    type: 'DAILY_HOROSCOPE',
                    title: `✨ Günlük ${sign} Yorumunuz`,
                    content: message,
                    actionUrl: '/fortune'
                });
            }
            logger.info('[HoroscopeCron] Done sending daily horoscopes.');
        } catch (err) {
            logger.error('[HoroscopeCron] Error:', err);
        }
    });

    logger.info('[HoroscopeCron] Cron job scheduled (daily at 08:00 Turkish time).');
}
