import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '../enums/UserRole';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../index';
import { calculateSunSign, calculateMoonSign, calculateRisingSign } from '../utils/astrology';
import { signToken } from '../utils/jwt';
import { calculatePlanetaryPositions } from '../services/synastry.service';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, birthDate, birthTime, latitude, longitude } = req.body;

        if (!email || !password || !birthDate || !birthTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' });
        }

        const normalizedEmail = email.toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const bDate = new Date(birthDate);
        if (isNaN(bDate.getTime())) {
            return res.status(400).json({ error: 'Invalid birthDate' });
        }

        // VULN 49 FIX: COPPA / Dating Rules Minimum Age (18) Validation Bypass
        const today = new Date();
        let age = today.getFullYear() - bDate.getFullYear();
        const m = today.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
            age--;
        }

        if (age < 18) {
            return res.status(403).json({ error: 'Güvenlik İhlali: Uygulamaya kayıt olmak için reşit (>18) olmalısınız. (Uluslararası sözleşme koruması)' });
        }

        const year = bDate.getUTCFullYear();
        const month = bDate.getUTCMonth() + 1;
        const day = bDate.getUTCDate();

        const sunSign = calculateSunSign(day, month);
        const moonSign = calculateMoonSign(year, month, day);
        const risingSign = calculateRisingSign(birthTime, sunSign);

        const planetPositions = calculatePlanetaryPositions(bDate, birthTime || '12:00');

        const passwordHash = await bcrypt.hash(password, 10);

        const role = UserRole.STANDARD; // Enforce STANDARD role for all new users to prevent Privilege Escalation

        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                birthDate: bDate,
                birthTime,
                latitude: latitude || 0,
                longitude: longitude || 0,
                role,
                sunSign,
                moonSign,
                risingSign,
                planetPositions: planetPositions as any
            }
        });

        const token = signToken(newUser.id, newUser.role);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                sunSign: newUser.sunSign,
                moonSign: newUser.moonSign,
                risingSign: newUser.risingSign,
                stardustBalance: newUser.stardustBalance,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, twoFactorToken } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const normalizedEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.isTwoFactorEnabled && user.twoFactorSecret) {
            if (!twoFactorToken) {
                return res.status(200).json({ requires2FA: true, message: '2FA token required' });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken
            });

            if (!verified) {
                return res.status(401).json({ error: 'Invalid 2FA token' });
            }
        }

        const token = signToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                sunSign: user.sunSign,
                moonSign: user.moonSign,
                risingSign: user.risingSign,
                stardustBalance: user.stardustBalance,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isTwoFactorEnabled) {
            return res.status(403).json({ error: 'Güvenlik İhlali (2FA Overwrite): Mevcut olan korumayı silip yenisini kuramazsınız!' });
        }

        const secret = speakeasy.generateSecret({ name: `CosmicConnect (${user.email})` });

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32, isTwoFactorEnabled: false }
        });

        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

        res.json({
            secret: secret.base32,
            qrCode: qrCodeDataUrl
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verify2FA = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { token } = req.body;

        if (!userId || !token) return res.status(400).json({ error: 'Missing required fields' });

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA setup not initiated' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFactorEnabled: true }
            });
            res.json({ message: '2FA verified and enabled successfully' });
        } else {
            res.status(400).json({ error: 'Invalid 2FA token' });
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/mailer';

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            // Güvenlik: Kullanıcı var mı yok mu belli etmiyoruz
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: resetTokenHash,
                resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 saat geçerli
            }
        });

        await sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'Password must contain uppercase, lowercase, a number, and be at least 8 characters.' });
        }

        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetToken: resetTokenHash,
                resetTokenExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
