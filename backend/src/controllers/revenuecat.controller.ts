import { Request, Response } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';

// https://www.revenuecat.com/docs/webhooks
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const { event } = req.body;

        if (!event) {
            return res.status(400).send('No event provided');
        }

        const { type, app_user_id, product_id } = event;
        logger.info(`[RevenueCat Webhook] Received Event: ${type} for User: ${app_user_id} - Product: ${product_id}`);

        // Security: Verify Webhook Auth Token (Configured in RevenueCat Dashboard)
        const REVENUECAT_AUTH_TOKEN = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
        const authHeader = req.headers.authorization;

        if (REVENUECAT_AUTH_TOKEN && authHeader !== `Bearer ${REVENUECAT_AUTH_TOKEN}`) {
            logger.error('[RevenueCat Webhook] Unauthorized Webhook Access Attempt');
            return res.status(401).send('Unauthorized');
        }

        // Veritabanında Kullanıcıyı bul
        const user = await prisma.user.findUnique({ where: { id: app_user_id } });
        if (!user) {
            logger.warn(`[RevenueCat Webhook] User not found: ${app_user_id}`);
            return res.status(200).send('User not found but acknowledged'); // Returning 200 so RevenueCat doesn't keep retrying
        }

        // Webhook Idempotency Check (Replay Attack ve Duplicate Bug Cözümü)
        const eventId = event.id; // RevenueCat event.id is unique
        if (eventId) {
            const existingEvent = await prisma.processedWebhook.findUnique({ where: { eventId } });
            if (existingEvent) {
                logger.warn(`[RevenueCat Webhook] Duplicate Webhook Event Ignored: ${eventId}`);
                return res.status(200).send('Already Processed');
            }
            // Mark as processed
            await prisma.processedWebhook.create({ data: { eventId } });
        }

        // Event tipleri: INITIAL_PURCHASE (abonelik), NON_RENEWING_PURCHASE (tek seferlik ürün), RENEWAL (abonelik yenilendi)
        if (type === 'INITIAL_PURCHASE' || type === 'NON_RENEWING_PURCHASE' || type === 'RENEWAL') {

            // Eğer paket ismi 'premium' içeriyorsa aboneliktir
            if (product_id.toLowerCase().includes('premium')) {
                await prisma.user.update({
                    where: { id: app_user_id },
                    data: { isPremium: true }
                });
                logger.info(`[RevenueCat Webhook] User ${app_user_id} upgraded to Premium.`);
            }

            // Stardust (Yıldız tozu) ürünleri - Örneğin 'stardust_500' veya doğrudan yıldız tozu içeren paketler
            else {
                // VULN 47 FIX: Whitelist stardust products against dynamic injection
                const validPackages: { [key: string]: number } = {
                    'stardust_100': 100,
                    'stardust_500': 500,
                    'stardust_1000': 1000,
                    'stardust_5000': 5000
                };

                let addedAmount = 0;
                if (validPackages[product_id]) {
                    addedAmount = validPackages[product_id];
                }

                if (addedAmount > 0) {
                    await prisma.user.update({
                        where: { id: app_user_id },
                        data: { stardustBalance: { increment: addedAmount } }
                    });
                    logger.info(`[RevenueCat Webhook] User ${app_user_id} purchased ${addedAmount} Stardust.`);
                }
            }
        }

        else if (type === 'CANCELLATION' || type === 'EXPIRATION') {
            if (product_id.toLowerCase().includes('premium')) {
                await prisma.user.update({
                    where: { id: app_user_id },
                    data: { isPremium: false }
                });
                logger.info(`[RevenueCat Webhook] User ${app_user_id} Premium expired/cancelled.`);
            }
        }

        return res.status(200).send('Success');
    } catch (e: any) {
        logger.error(`[RevenueCat Webhook Error] ${e.message}`, { stack: e.stack });
        // Send 200 anyway so RevenueCat stops polling unless it's a critical infrastructure issue
        return res.status(200).send('Error Processed');
    }
};
