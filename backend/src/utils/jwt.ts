import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET: string = secret;
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
    userId: string;
    role: string;
}

export function signToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (err) {
        return null;
    }
}
