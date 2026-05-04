"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Strict rate limiter for authentication (Prevent Brute-Force / Credential Stuffing)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
});
router.post('/register', authLimiter, auth_controller_1.register);
router.post('/login', authLimiter, auth_controller_1.login);
// 2FA Endpoints
router.post('/2fa/setup', auth_middleware_1.authenticate, auth_controller_1.setup2FA);
router.post('/2fa/verify', auth_middleware_1.authenticate, auth_controller_1.verify2FA);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map