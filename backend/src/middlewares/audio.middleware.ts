import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAudio = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for audio
    fileFilter: (req, file, cb) => {
        const filetypes = /webm|mp3|wav|ogg|m4a|aac/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        // For mobile/browser recordings, mimetype might be audio/webm, audio/mp4 etc.
        // We broadly allow 'audio/' type as well for safety
        if (mimetype || extname || file.mimetype.startsWith('audio/')) {
            return cb(null, true);
        }
        cb(new Error('Sadece ses formatları desteklenir (webm, mp3, wav, vb.)'));
    }
});

export default uploadAudio;
