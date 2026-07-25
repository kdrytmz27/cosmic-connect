import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import fs from 'fs';
import path from 'path';

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir resim seçin' });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        // Securely delete old avatar using path.basename to prevent Directory Traversal
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.avatar && user.avatar.startsWith('/uploads/')) {
            const fileName = path.basename(user.avatar);
            const oldPath = path.join(__dirname, '../../uploads', fileName);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: { id: true, avatar: true }
        });

        res.json({ message: 'Profil fotoğrafı güncellendi', avatar: updatedUser.avatar });
    } catch (error) {
        next(error);
    }
};

export const uploadGalleryPhoto = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir resim seçin' });
        }

        // Fix 31: Storage Exhaustion Limit
        const userPhotosCount = await prisma.photo.count({ where: { userId } });
        if (userPhotosCount >= 9) {
            const filePath = path.join(__dirname, '../../uploads', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Delete freshly uploaded file to save disk
            }
            return res.status(400).json({ message: 'Galeri limitine (9 fotoğraf) ulaştınız. Lütfen önce mevcut fotoğraflarınızı silin.' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;

        const photo = await prisma.photo.create({
            data: {
                userId,
                url: photoUrl
            }
        });

        res.json({ message: 'Galeriye resim eklendi', photo });
    } catch (error) {
        next(error);
    }
};

export const deleteGalleryPhoto = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const photoId = req.params.id as string;

        const photo = await prisma.photo.findUnique({ where: { id: photoId } });

        if (!photo) {
            return res.status(404).json({ message: 'Fotoğraf bulunamadı' });
        }

        if (photo.userId !== userId) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Delete from filesystem securely
        if (photo.url && photo.url.startsWith('/uploads/')) {
            const fileName = path.basename(photo.url);
            const filePath = path.join(__dirname, '../../uploads', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete from database
        await prisma.photo.delete({ where: { id: photoId } });

        res.json({ message: 'Fotoğraf silindi', success: true });
    } catch (error) {
        next(error);
    }
};

export const uploadChatPhoto = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir resim seçin' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;
        
        // Chat fotoğrafları Photo (Galeri) tablosuna kaydedilmez, doğrudan mesajla birlikte kullanılmak üzere link döndürülür
        res.json({ message: 'Sohbet resmi yüklendi', imageUrl: photoUrl });
    } catch (error) {
        next(error);
    }
};
