import { Request, Response } from 'express';
import { prisma } from '../index';

export const getPartyRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await prisma.partyRoom.findMany({
            where: { isActive: true },
            include: {
                owner: {
                    select: { name: true, avatar: true }
                }
            },
            orderBy: { currentCount: 'desc' }
        });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: 'Parti odaları getirilirken bir hata oluştu.' });
    }
};

export const createPartyRoom = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId; // from auth middleware
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { title, description, imageUrl, maxParticipants } = req.body;

        if (!title) return res.status(400).json({ error: 'Oda başlığı zorunludur.' });

        // Check if user already has an active room
        const existingRoom = await prisma.partyRoom.findFirst({
            where: { ownerId: userId, isActive: true }
        });

        if (existingRoom) {
            await prisma.partyRoom.update({
                where: { id: existingRoom.id },
                data: { isActive: false }
            });
        }

        const room = await prisma.partyRoom.create({
            data: {
                ownerId: userId,
                title,
                description,
                imageUrl: imageUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
                maxParticipants: maxParticipants || 50,
                currentCount: 1, // Kurucu odaya dahil
                isActive: true
            }
        });

        res.status(201).json(room);
    } catch (error) {
        console.error('Create party room error:', error);
        res.status(500).json({ error: 'Oda oluşturulurken bir hata oluştu.' });
    }
};

export const getPartyRoomById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!id) return res.status(400).json({ error: 'Geçersiz Oda ID' });
        
        const room = await prisma.partyRoom.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { name: true, avatar: true }
                }
            }
        });

        if (!room) return res.status(404).json({ error: 'Oda bulunamadı veya kapatılmış.' });

        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Oda bilgisi getirilemedi.' });
    }
};
