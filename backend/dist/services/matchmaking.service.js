"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchmakingService = void 0;
const logger_1 = require("../utils/logger");
const queue = [];
const rooms = new Map();
exports.matchmakingService = {
    async joinQueue(player) {
        // Remove existing entry for this user (prevent duplicates)
        const existingIdx = queue.findIndex(p => p.userId === player.userId);
        if (existingIdx !== -1) {
            queue.splice(existingIdx, 1);
        }
        // Additional safety check: Ensure user is not a teller
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../index')));
        const user = await prisma.user.findUnique({ where: { id: player.userId } });
        if (user?.role === 'FORTUNE_TELLER') {
            logger_1.logger.debug(`[Matchmaking] User ${player.userId} is a teller. Rejecting queue entry.`);
            return;
        }
        queue.push(player);
        logger_1.logger.debug(`[Matchmaking] User ${player.userId} joined queue. Queue size: ${queue.length}`);
    },
    removeFromQueue(userId) {
        const idx = queue.findIndex(p => p.userId === userId);
        if (idx !== -1) {
            queue.splice(idx, 1);
            logger_1.logger.debug(`[Matchmaking] User ${userId} removed from queue. Queue size: ${queue.length}`);
        }
    },
    async tryMatch() {
        logger_1.logger.debug(`[Matchmaking] tryMatch called. Queue size: ${queue.length}`, { queue: queue.map(p => ({ userId: p.userId, score: p.matchScore })) });
        if (queue.length >= 2) {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../index')));
            for (let i = 0; i < queue.length; i++) {
                for (let j = i + 1; j < queue.length; j++) {
                    const p1 = queue[i];
                    const p2 = queue[j];
                    if (!p1 || !p2)
                        continue;
                    const scoreDiff = Math.abs(p1.matchScore - p2.matchScore);
                    logger_1.logger.debug(`[Matchmaking] Comparing ${p1.userId} (score:${p1.matchScore}) vs ${p2.userId} (score:${p2.matchScore}) diff:${scoreDiff}`);
                    if (scoreDiff <= 20) {
                        // Check if these two users already have a relationship (friend, match, or swipe match)
                        const existingRelation = await prisma.friendship.findFirst({
                            where: {
                                OR: [
                                    { user1Id: p1.userId, user2Id: p2.userId },
                                    { user1Id: p2.userId, user2Id: p1.userId }
                                ]
                            }
                        });
                        if (existingRelation) {
                            logger_1.logger.debug(`[Matchmaking] SKIP: ${p1.userId} <-> ${p2.userId} already have relationship (${existingRelation.status})`);
                            continue; // Skip this pair, try others
                        }
                        queue.splice(j, 1);
                        queue.splice(i, 1);
                        logger_1.logger.info(`[Matchmaking] MATCH FOUND! ${p1.userId} <-> ${p2.userId}`);
                        return [p1, p2];
                    }
                }
            }
            // If queue length is large but no strict matches, could relax constraint here
        }
        return null;
    },
    async createRoom(p1, p2, timeoutCallback) {
        const roomId = `room_${Date.now()}_${p1.userId}_${p2.userId}`;
        const isPremiumMatch = p1.isPremium || p2.isPremium;
        const duration = isPremiumMatch ? 320000 : 160000;
        const expiresAt = Date.now() + duration;
        const timeoutId = setTimeout(() => timeoutCallback(roomId), duration);
        rooms.set(`room:${roomId}`, {
            p1: p1.userId,
            p2: p2.userId,
            createdAt: Date.now(),
            expiresAt,
            timeoutId,
            extraTimeRequests: new Set(),
            timeoutCallback
        });
        return { roomId, duration };
    },
    getRoom(roomId) {
        return rooms.get(`room:${roomId}`);
    },
    extendRoomTime(roomId, extraMs) {
        const room = rooms.get(`room:${roomId}`);
        if (!room)
            return false;
        const now = Date.now();
        const currentRemaining = Math.max(0, room.expiresAt - now);
        const newRemaining = currentRemaining + extraMs;
        room.expiresAt = now + newRemaining;
        clearTimeout(room.timeoutId);
        room.timeoutId = setTimeout(() => room.timeoutCallback(roomId), newRemaining);
        room.extraTimeRequests.clear();
        return true;
    },
    async removeRoom(roomId) {
        const room = rooms.get(`room:${roomId}`);
        if (room && room.timeoutId)
            clearTimeout(room.timeoutId);
        rooms.delete(`room:${roomId}`);
    }
};
//# sourceMappingURL=matchmaking.service.js.map