import { Request, Response } from 'express';

export const uploadVoiceMessage = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir ses dosyası gönderin' });
        }

        const audioUrl = `/uploads/${req.file.filename}`;
        
        res.json({ message: 'Ses dosyası yüklendi', audioUrl });
    } catch (error) {
        console.error('Upload Audio Error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};
