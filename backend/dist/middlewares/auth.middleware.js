"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    req.user = decoded;
    next();
};
exports.authenticate = authenticate;
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user attached' });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth.middleware.js.map