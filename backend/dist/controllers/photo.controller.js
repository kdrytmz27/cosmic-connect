"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGalleryPhoto = exports.uploadGalleryPhoto = exports.uploadAvatar = void 0;
const index_1 = require("../index");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir resim seçin' });
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        // Securely delete old avatar using path.basename to prevent Directory Traversal
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (user?.avatar && user.avatar.startsWith('/uploads/')) {
            const fileName = path_1.default.basename(user.avatar);
            const oldPath = path_1.default.join(__dirname, '../../uploads', fileName);
            if (fs_1.default.existsSync(oldPath)) {
                fs_1.default.unlinkSync(oldPath);
            }
        }
        const updatedUser = await index_1.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: { id: true, avatar: true }
        });
        res.json({ message: 'Profil fotoğrafı güncellendi', avatar: updatedUser.avatar });
    }
    catch (error) {
        console.error('Upload Avatar Error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};
exports.uploadAvatar = uploadAvatar;
const uploadGalleryPhoto = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir resim seçin' });
        }
        const photoUrl = `/uploads/${req.file.filename}`;
        const photo = await index_1.prisma.photo.create({
            data: {
                userId,
                url: photoUrl
            }
        });
        res.json({ message: 'Galeriye resim eklendi', photo });
    }
    catch (error) {
        console.error('Upload Gallery Error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};
exports.uploadGalleryPhoto = uploadGalleryPhoto;
const deleteGalleryPhoto = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const photoId = req.params.id;
        const photo = await index_1.prisma.photo.findUnique({ where: { id: photoId } });
        if (!photo) {
            return res.status(404).json({ message: 'Fotoğraf bulunamadı' });
        }
        if (photo.userId !== userId) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }
        // Delete from filesystem
        if (photo.url && photo.url.startsWith('/uploads/')) {
            const filePath = path_1.default.join(__dirname, '../../', photo.url);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Delete from database
        await index_1.prisma.photo.delete({ where: { id: photoId } });
        res.json({ message: 'Fotoğraf silindi', success: true });
    }
    catch (error) {
        console.error('Delete Gallery Photo Error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};
exports.deleteGalleryPhoto = deleteGalleryPhoto;
//# sourceMappingURL=photo.controller.js.map