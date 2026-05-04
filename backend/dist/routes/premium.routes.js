"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const premium_controller_1 = require("../controllers/premium.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/buy-stardust', auth_middleware_1.authenticate, premium_controller_1.buyStardust);
router.post('/buy-premium', auth_middleware_1.authenticate, premium_controller_1.buyPremium);
router.post('/swipe', auth_middleware_1.authenticate, premium_controller_1.recordSwipe);
router.post('/unblur', auth_middleware_1.authenticate, premium_controller_1.unblurProfile);
router.post('/super-like', auth_middleware_1.authenticate, premium_controller_1.superLike);
router.post('/extra-time', auth_middleware_1.authenticate, premium_controller_1.addExtraTime);
exports.default = router;
//# sourceMappingURL=premium.routes.js.map