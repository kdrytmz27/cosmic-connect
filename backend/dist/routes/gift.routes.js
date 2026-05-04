"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gift_controller_1 = require("../controllers/gift.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/send', auth_middleware_1.authenticate, gift_controller_1.sendGift);
exports.default = router;
//# sourceMappingURL=gift.routes.js.map