"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify2FA = exports.setup2FA = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserRole_1 = require("../enums/UserRole");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const index_1 = require("../index");
const astrology_1 = require("../utils/astrology");
const jwt_1 = require("../utils/jwt");
const register = async (req, res) => {
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
        const existingUser = await index_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
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
        const sunSign = (0, astrology_1.calculateSunSign)(day, month);
        const moonSign = (0, astrology_1.calculateMoonSign)(year, month, day);
        const risingSign = (0, astrology_1.calculateRisingSign)(birthTime, sunSign);
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const role = UserRole_1.UserRole.STANDARD; // Enforce STANDARD role for all new users to prevent Privilege Escalation
        const newUser = await index_1.prisma.user.create({
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
                risingSign
            }
        });
        const token = (0, jwt_1.signToken)(newUser.id, newUser.role);
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password, twoFactorToken } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const normalizedEmail = email.toLowerCase();
        const user = await index_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (user.isTwoFactorEnabled && user.twoFactorSecret) {
            if (!twoFactorToken) {
                return res.status(200).json({ requires2FA: true, message: '2FA token required' });
            }
            const verified = speakeasy_1.default.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid 2FA token' });
            }
        }
        const token = (0, jwt_1.signToken)(user.id, user.role);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const setup2FA = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        if (user.isTwoFactorEnabled) {
            return res.status(403).json({ error: 'Güvenlik İhlali (2FA Overwrite): Mevcut olan korumayı silip yenisini kuramazsınız!' });
        }
        const secret = speakeasy_1.default.generateSecret({ name: `CosmicConnect (${user.email})` });
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32, isTwoFactorEnabled: false }
        });
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(secret.otpauth_url || '');
        res.json({
            secret: secret.base32,
            qrCode: qrCodeDataUrl
        });
    }
    catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.setup2FA = setup2FA;
const verify2FA = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { token } = req.body;
        if (!userId || !token)
            return res.status(400).json({ error: 'Missing required fields' });
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA setup not initiated' });
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });
        if (verified) {
            await index_1.prisma.user.update({
                where: { id: userId },
                data: { isTwoFactorEnabled: true }
            });
            res.json({ message: '2FA verified and enabled successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid 2FA token' });
        }
    }
    catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verify2FA = verify2FA;
//# sourceMappingURL=auth.controller.js.map