"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendshipService = void 0;
const index_1 = require("../index");
const socket_controller_1 = require("../controllers/socket.controller");
const badge_service_1 = require("./badge.service");
const xp_service_1 = require("./xp.service");
const constants_1 = require("../config/constants");
exports.friendshipService = {
    checkIfFriends: async (userId1, userId2) => {
        const ab = await index_1.prisma.friendship.findFirst({ where: { user1Id: userId1, user2Id: userId2 } });
        const ba = await index_1.prisma.friendship.findFirst({ where: { user1Id: userId2, user2Id: userId1 } });
        if (!ab || !ba)
            return false;
        if (ab.expiresAt && ab.expiresAt <= new Date())
            return false;
        return true;
    },
    createFriendship: async (userId1, userId2) => {
        const existingAB = await index_1.prisma.friendship.findFirst({ where: { user1Id: userId1, user2Id: userId2 } });
        const existingBA = await index_1.prisma.friendship.findFirst({ where: { user1Id: userId2, user2Id: userId1 } });
        if (existingAB) {
            await index_1.prisma.friendship.update({ where: { id: existingAB.id }, data: { expiresAt: null, status: 'FRIEND' } });
        }
        else {
            await index_1.prisma.friendship.create({ data: { user1Id: userId1, user2Id: userId2, status: 'FRIEND' } });
        }
        if (existingBA) {
            await index_1.prisma.friendship.update({ where: { id: existingBA.id }, data: { expiresAt: null, status: 'FRIEND' } });
        }
        else {
            await index_1.prisma.friendship.create({ data: { user1Id: userId2, user2Id: userId1, status: 'FRIEND' } });
        }
    },
    checkDailyFriendRequestLimit: async (userId) => {
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { allowed: false, remaining: 0 };
        if (user.isPremium)
            return { allowed: true, remaining: constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.PREMIUM };
        const todayStr = new Date().toISOString().split('T')[0];
        const lastDate = user.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;
        let currentCount = user.dailyFriendRequests;
        if (lastDate !== todayStr) {
            await index_1.prisma.user.update({ where: { id: userId }, data: { dailyFriendRequests: 0, lastFriendRequestDate: new Date() } });
            currentCount = 0;
        }
        const limit = constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT;
        return { allowed: currentCount < limit, remaining: limit - currentCount };
    },
    incrementDailyFriendRequest: async (userId) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return;
        const lastDate = user.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;
        if (lastDate !== todayStr) {
            await index_1.prisma.user.update({ where: { id: userId }, data: { dailyFriendRequests: 1, lastFriendRequestDate: new Date() } });
        }
        else {
            await index_1.prisma.user.update({ where: { id: userId }, data: { dailyFriendRequests: { increment: 1 } } });
        }
    },
    addFriend: async (senderId, receiverId) => {
        const existingIn = await index_1.prisma.friendship.findFirst({ where: { user1Id: receiverId, user2Id: senderId } });
        const existingOut = await index_1.prisma.friendship.findFirst({ where: { user1Id: senderId, user2Id: receiverId } });
        if (existingIn) {
            if (!existingOut) {
                await index_1.prisma.friendship.create({ data: { user1Id: senderId, user2Id: receiverId, status: 'SWIPE_MATCH' } });
                await index_1.prisma.friendship.update({ where: { id: existingIn.id }, data: { status: 'SWIPE_MATCH' } });
                const io = (0, socket_controller_1.getSocketIo)();
                if (io) {
                    const receiverUser = await index_1.prisma.user.findUnique({ where: { id: receiverId }, select: { isPremium: true } });
                    const senderUser = await index_1.prisma.user.findUnique({ where: { id: senderId }, select: { name: true, isPremium: true } });
                    io.to(receiverId).emit('matchCreated', {
                        fromUserId: senderId,
                        fromUserName: receiverUser?.isPremium ? (senderUser?.name || 'Birisi') : null,
                        isMatch: true
                    });
                }
            }
            const senderPremium = await index_1.prisma.user.findUnique({ where: { id: senderId }, select: { isPremium: true } });
            return { message: 'Eşleşme oluştu!', matched: true, isPremium: senderPremium?.isPremium };
        }
        if (existingOut) {
            return { message: 'Request already sent', matched: false };
        }
        await index_1.prisma.friendship.create({ data: { user1Id: senderId, user2Id: receiverId, status: 'SWIPE_MATCH' } });
        return { message: 'Friend request sent', matched: false };
    },
    getFriends: async (userId) => {
        const currentUser = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser)
            return [];
        const myRequests = await index_1.prisma.friendship.findMany({ where: { user1Id: userId } });
        const requestToIds = myRequests.map(f => f.user2Id);
        const mutualFriends = await index_1.prisma.friendship.findMany({
            where: { user1Id: { in: requestToIds }, user2Id: userId },
            include: { user1: { select: { id: true, email: true, name: true, avatar: true, sunSign: true, stardustBalance: true } } }
        });
        // Batch fetch last messages for ALL friends in ONE query (eliminates N+1)
        const friendIds = mutualFriends.map(f => f.user1.id);
        const lastMessagesRaw = await index_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: { in: friendIds } },
                    { senderId: { in: friendIds }, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        // Build a map: friendId → most recent message
        const lastMessageMap = new Map();
        for (const msg of lastMessagesRaw) {
            const friendId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!lastMessageMap.has(friendId)) {
                lastMessageMap.set(friendId, msg); // First hit = most recent (ordered desc)
            }
        }
        const friendsWithMessages = mutualFriends.map(f => {
            const lastMsg = lastMessageMap.get(f.user1.id) || null;
            const hasMessages = lastMsg !== null;
            const isTemporary = f.expiresAt !== null;
            const isExpired = isTemporary && f.expiresAt <= new Date();
            const isMatch = f.status === 'SWIPE_MATCH' && !hasMessages;
            const matchType = f.status;
            const isBlurred = !hasMessages && ((!currentUser.isPremium && isMatch) || (isExpired && !currentUser.isPremium));
            if (isBlurred && isMatch) {
                return {
                    id: f.user1.id, name: null, avatar: null, sunSign: f.user1.sunSign,
                    isBlurred: true, isExpired: false, isTemporary, expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null,
                    isMatch: true, matchType, status: f.status, hasMessages: false, lastMessage: null
                };
            }
            if (isBlurred) {
                return {
                    id: f.user1.id, name: f.user1.name, avatar: f.user1.avatar, sunSign: f.user1.sunSign,
                    isBlurred: true, isExpired: true, isTemporary: true, isMatch: false, matchType,
                    status: f.status, hasMessages, lastMessage: lastMsg
                };
            }
            return {
                ...f.user1, isBlurred: false, isExpired, isTemporary, isMatch, matchType,
                status: f.status, hasMessages, expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null, lastMessage: lastMsg
            };
        });
        const seen = new Map();
        for (const f of friendsWithMessages) {
            const existing = seen.get(f.id);
            if (!existing) {
                seen.set(f.id, f);
            }
            else if (f.lastMessage && !existing.lastMessage) {
                seen.set(f.id, f);
            }
        }
        const deduplicated = Array.from(seen.values());
        deduplicated.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage)
                return 0;
            if (!a.lastMessage)
                return 1;
            if (!b.lastMessage)
                return -1;
            return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
        });
        return { friends: deduplicated, serverTime: Date.now() };
    },
    deleteFriend: async (userId, targetId) => {
        await index_1.prisma.friendship.deleteMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] }
        });
        await index_1.prisma.message.deleteMany({
            where: { OR: [{ senderId: userId, receiverId: targetId }, { senderId: targetId, receiverId: userId }] }
        });
    },
    acceptMatch: async (userId, targetId) => {
        const recentThreshold = new Date(Date.now() - 30 * 1000);
        const recentRecord = await index_1.prisma.friendship.findFirst({
            where: {
                OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }],
                expiresAt: { gt: new Date() },
                createdAt: { gt: recentThreshold }
            }
        });
        if (recentRecord) {
            const existingAB = await index_1.prisma.friendship.findFirst({ where: { user1Id: userId, user2Id: targetId } });
            const existingBA = await index_1.prisma.friendship.findFirst({ where: { user1Id: targetId, user2Id: userId } });
            if (!existingAB)
                await index_1.prisma.friendship.create({ data: { user1Id: userId, user2Id: targetId, expiresAt: recentRecord.expiresAt, status: 'MATCH' } });
            if (!existingBA)
                await index_1.prisma.friendship.create({ data: { user1Id: targetId, user2Id: userId, expiresAt: recentRecord.expiresAt, status: 'MATCH' } });
            return { success: true, expiresAt: recentRecord.expiresAt.toISOString(), serverTime: Date.now() };
        }
        await index_1.prisma.friendship.deleteMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] }
        });
        const expiresAt = new Date(Date.now() + constants_1.CONSTANTS.DURATIONS.MATCH_EXPIRY_MS);
        await index_1.prisma.friendship.create({ data: { user1Id: userId, user2Id: targetId, expiresAt, status: 'MATCH' } });
        await index_1.prisma.friendship.create({ data: { user1Id: targetId, user2Id: userId, expiresAt, status: 'MATCH' } });
        return { success: true, expiresAt: expiresAt.toISOString(), serverTime: Date.now() };
    },
    passMatch: async (userId, targetId) => {
        await index_1.prisma.friendship.deleteMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] }
        });
        const updated = await index_1.prisma.user.update({
            where: { id: userId },
            data: { dailyMatchPasses: { decrement: 1 } }
        });
        return { success: true, dailyMatchPasses: updated.dailyMatchPasses };
    },
    extendMatch: async (userId, targetId) => {
        // Verify balance before deducting
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.stardustBalance < constants_1.CONSTANTS.COSTS.EXTEND_MATCH) {
            throw new Error('Yetersiz Yıldız Tozu');
        }
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + constants_1.CONSTANTS.DURATIONS.MATCH_EXTENSION_HOURS);
        await index_1.prisma.friendship.updateMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] },
            data: { expiresAt: newExpiresAt }
        });
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { stardustBalance: { decrement: constants_1.CONSTANTS.COSTS.EXTEND_MATCH } }
        });
        const io = (0, socket_controller_1.getSocketIo)();
        if (io) {
            const extender = await index_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
            const extenderName = extender?.name || extender?.email?.split('@')[0] || 'Birisi';
            io.to(targetId).emit('chatExtended', {
                extendedBy: userId, extenderName, expiresAt: newExpiresAt.toISOString()
            });
        }
        return { success: true, expiresAt: newExpiresAt, serverTime: Date.now() };
    },
    makeMatchPermanent: async (userId, targetId) => {
        // Verify balance before deducting
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.stardustBalance < constants_1.CONSTANTS.COSTS.MAKE_MATCH_PERMANENT) {
            throw new Error('Yetersiz Yıldız Tozu');
        }
        await index_1.prisma.friendship.updateMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] },
            data: { expiresAt: null }
        });
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { stardustBalance: { decrement: constants_1.CONSTANTS.COSTS.MAKE_MATCH_PERMANENT } }
        });
        return { success: true };
    },
    sendFriendRequest: async (userId, receiverId) => {
        const areFriends = await exports.friendshipService.checkIfFriends(userId, receiverId);
        if (areFriends)
            throw new Error('Zaten arkadaşsınız');
        const existing = await index_1.prisma.friendRequest.findFirst({
            where: { senderId: userId, receiverId, status: 'PENDING' }
        });
        if (existing)
            throw new Error('Zaten bekleyen bir isteğiniz var');
        const reverseRequest = await index_1.prisma.friendRequest.findFirst({
            where: { senderId: receiverId, receiverId: userId, status: 'PENDING' }
        });
        if (reverseRequest) {
            await index_1.prisma.friendRequest.update({ where: { id: reverseRequest.id }, data: { status: 'ACCEPTED' } });
            await exports.friendshipService.createFriendship(userId, receiverId);
            await exports.friendshipService.incrementDailyFriendRequest(userId);
            const io = (0, socket_controller_1.getSocketIo)();
            if (io) {
                const senderUser = await index_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatar: true } });
                io.to(receiverId).emit('friendRequestAccepted', { fromUserId: userId, fromUserName: senderUser?.name || 'Birisi' });
            }
            return { success: true, autoAccepted: true };
        }
        const fr = await index_1.prisma.friendRequest.create({ data: { senderId: userId, receiverId } });
        await exports.friendshipService.incrementDailyFriendRequest(userId);
        const io = (0, socket_controller_1.getSocketIo)();
        if (io) {
            const senderUser = await index_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatar: true, sunSign: true } });
            io.to(receiverId).emit('newFriendRequest', {
                requestId: fr.id, fromUserId: userId, fromUserName: senderUser?.name || 'Birisi',
                fromAvatar: senderUser?.avatar, fromSunSign: senderUser?.sunSign
            });
        }
        return { success: true };
    },
    acceptFriendRequest: async (userId, requestId) => {
        const fr = await index_1.prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr)
            throw new Error('İstek bulunamadı');
        if (fr.receiverId !== userId)
            throw new Error('Bu isteği kabul etme yetkiniz yok');
        if (fr.status !== 'PENDING')
            throw new Error('Bu istek zaten işlenmiş');
        await index_1.prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
        await exports.friendshipService.createFriendship(fr.senderId, fr.receiverId);
        await exports.friendshipService.incrementDailyFriendRequest(userId);
        await xp_service_1.xpService.addXp(fr.senderId, constants_1.CONSTANTS.REWARDS.ACCEPT_FRIEND_REQUEST_XP);
        await xp_service_1.xpService.addXp(fr.receiverId, constants_1.CONSTANTS.REWARDS.ACCEPT_FRIEND_REQUEST_XP);
        await badge_service_1.BadgeService.checkAndAwardBadges(fr.senderId);
        await badge_service_1.BadgeService.checkAndAwardBadges(fr.receiverId);
        const io = (0, socket_controller_1.getSocketIo)();
        if (io) {
            const accepter = await index_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatar: true } });
            io.to(fr.senderId).emit('friendRequestAccepted', { fromUserId: userId, fromUserName: accepter?.name || 'Birisi' });
        }
    },
    rejectFriendRequest: async (userId, requestId) => {
        const fr = await index_1.prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr)
            throw new Error('İstek bulunamadı');
        if (fr.receiverId !== userId)
            throw new Error('Bu isteği reddetme yetkiniz yok');
        if (fr.status !== 'PENDING')
            throw new Error('Bu istek zaten işlenmiş');
        await index_1.prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
        return { success: true };
    },
    getPendingRequests: async (userId) => {
        return await index_1.prisma.friendRequest.findMany({
            where: { receiverId: userId, status: 'PENDING' },
            include: { sender: { select: { id: true, name: true, avatar: true, sunSign: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },
    getFriendRequestStatus: async (userId, targetId) => {
        const areFriends = await exports.friendshipService.checkIfFriends(userId, targetId);
        if (areFriends)
            return { status: 'friends' };
        const sentRequest = await index_1.prisma.friendRequest.findFirst({
            where: { senderId: userId, receiverId: targetId, status: 'PENDING' }
        });
        if (sentRequest)
            return { status: 'sent', requestId: sentRequest.id };
        const receivedRequest = await index_1.prisma.friendRequest.findFirst({
            where: { senderId: targetId, receiverId: userId, status: 'PENDING' }
        });
        if (receivedRequest)
            return { status: 'received', requestId: receivedRequest.id };
        return { status: 'none' };
    }
};
//# sourceMappingURL=friendship.service.js.map