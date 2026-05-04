"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teller_controller_1 = require("../controllers/teller.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload.middleware"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, teller_controller_1.listTellers);
router.post('/book', auth_middleware_1.authenticate, upload_middleware_1.default.single('image'), teller_controller_1.bookAppointment);
router.post('/claim', auth_middleware_1.authenticate, teller_controller_1.claimDailyStardust);
router.post('/slot', auth_middleware_1.authenticate, teller_controller_1.playSlot);
router.get('/slot/state', auth_middleware_1.authenticate, teller_controller_1.getSlotState);
router.get('/fortunes/pending', auth_middleware_1.authenticate, teller_controller_1.getPendingFortunes);
router.post('/fortunes/interpret', auth_middleware_1.authenticate, teller_controller_1.interpretFortune);
router.get('/fortunes/my', auth_middleware_1.authenticate, teller_controller_1.getMyFortunes);
router.post('/fortunes/rate', auth_middleware_1.authenticate, teller_controller_1.rateTeller);
router.post('/fortune-image', auth_middleware_1.authenticate, upload_middleware_1.default.single('image'), teller_controller_1.uploadFortuneImage);
router.post('/apply', auth_middleware_1.authenticate, teller_controller_1.applyTeller);
router.get('/application-status', auth_middleware_1.authenticate, teller_controller_1.checkApplicationStatus);
router.post('/approve-application', auth_middleware_1.authenticate, teller_controller_1.approveApplication);
router.get('/profile/:id', auth_middleware_1.authenticate, teller_controller_1.getTellerProfile);
router.post('/comment', auth_middleware_1.authenticate, teller_controller_1.addTellerComment);
router.get('/comments/:id', auth_middleware_1.authenticate, teller_controller_1.getTellerComments);
exports.default = router;
//# sourceMappingURL=teller.routes.js.map