import { Router } from 'express';
import { handleWebhook } from '../controllers/revenuecat.controller';

const router = Router();

// Endpoint for RevenueCat Webhook (Doesn't need our own JWT since it's S2S communication)
// Authentication can be checked via Authorization header matching RevenueCat configuration, but handled in controller or left open depending on token logic.
router.post('/webhook', handleWebhook);

export default router;
