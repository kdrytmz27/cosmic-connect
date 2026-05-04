"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tarot_controller_1 = require("../controllers/tarot.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/daily/status', auth_middleware_1.authenticate, tarot_controller_1.getDailyTarotStatus);
router.post('/daily/draw', auth_middleware_1.authenticate, tarot_controller_1.drawDailyTarot);
exports.default = router;
//# sourceMappingURL=tarot.routes.js.map