"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("../controllers/group.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/:sign', auth_middleware_1.authenticate, group_controller_1.getGroupMessages);
exports.default = router;
//# sourceMappingURL=group.routes.js.map