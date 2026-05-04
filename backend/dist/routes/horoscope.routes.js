"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const horoscope_controller_1 = require("../controllers/horoscope.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/today', auth_middleware_1.authenticate, horoscope_controller_1.getToday);
exports.default = router;
//# sourceMappingURL=horoscope.routes.js.map