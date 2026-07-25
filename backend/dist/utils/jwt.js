"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET = secret;
const JWT_EXPIRES_IN = '30d';
function signToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (err) {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map