"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const photo_controller_1 = require("../controllers/photo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload.middleware"));
const router = (0, express_1.Router)();
// Endpoint for avatar upload (single image)
router.post('/avatar', auth_middleware_1.authenticate, upload_middleware_1.default.single('image'), photo_controller_1.uploadAvatar);
// Endpoint for gallery photo upload (single image)
router.post('/gallery', auth_middleware_1.authenticate, upload_middleware_1.default.single('image'), photo_controller_1.uploadGalleryPhoto);
// Endpoint to delete a gallery photo by ID
router.delete('/gallery/:id', auth_middleware_1.authenticate, photo_controller_1.deleteGalleryPhoto);
// Endpoint for chat photo upload (single image)
router.post('/chat', auth_middleware_1.authenticate, upload_middleware_1.default.single('image'), photo_controller_1.uploadChatPhoto);
exports.default = router;
//# sourceMappingURL=photo.routes.js.map