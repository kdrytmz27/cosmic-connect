import { prisma } from '../index';
import { getSocketIo } from '../controllers/socket.controller';
import { BadgeService } from './badge.service';
import { xpService } from './xp.service';
import { CONSTANTS } from '../config/constants';
import { notificationService } from './notification.service';

export const friendshipService = {
    checkIfFriends: async (userId1: string, userId2: string): Promise<boolean> => {
        const ab = await prisma.friendship.findFirst({ where: { user1Id: userId1, user2Id: userId2 } });
        const ba = await prisma.friendship.findFirst({ where: { user1Id: userId2, user2Id: userId1 } });
        console.log(`🔍 [checkIfFriends] userId1=${userId1}, userId2=${userId2}`);
        console.log(`🔍 [checkIfFriends] ab=`, ab ? { status: ab.status, expiresAt: ab.expiresAt } : 'NULL');
        console.log(`🔍 [checkIfFriends] ba=`, ba ? { status: (ba as any).status, expiresAt: ba.expiresAt } : 'NULL');
        if (!ab || !ba) {
            console.log(`🔍 [checkIfFriends] RESULT: false (missing record)`);
            return false;
        }
        if (ab.status === 'FRIEND' && ab.expiresAt === null) {
            console.log(`🔍 [checkIfFriends] RESULT: TRUE (status=FRIEND, expiresAt=null)`);
            return true;
        }
        console.log(`🔍 [checkIfFriends] RESULT: false (status=${ab.status}, expiresAt=${ab.expiresAt})`);
        return false;
    },

    createFriendship: async (userId1: string, userId2: string) => {
        const existingAB = await prisma.friendship.findFirst({ where: { user1Id: userId1, user2Id: userId2 } });
        const existingBA = await prisma.friendship.findFirst({ where: { user1Id: userId2, user2Id: userId1 } });

        if (existingAB) {
            await prisma.friendship.update({ where: { id: existingAB.id }, data: { expiresAt: null, status: 'FRIEND' } });
        } else {
            await prisma.friendship.create({ data: { user1Id: userId1, user2Id: userId2, status: 'FRIEND' as any } });
        }

        if (existingBA) {
            await prisma.friendship.update({ where: { id: existingBA.id }, data: { expiresAt: null, status: 'FRIEND' } });
        } else {
            await prisma.friendship.create({ data: { user1Id: userId2, user2Id: userId1, status: 'FRIEND' as any } });
        }
    },

    checkDailyFriendRequestLimit: async (userId: string): Promise<{ allowed: boolean; remaining: number }> => {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { allowed: false, remaining: 0 };
        if (user.isPremium) return { allowed: true, remaining: CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.PREMIUM };

        const todayStr = new Date().toISOString().split('T')[0];
        const lastDate = user.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;

        let currentCount = user.dailyFriendRequests;
        if (lastDate !== todayStr) {
            await prisma.user.update({ where: { id: userId }, data: { dailyFriendRequests: 0, lastFriendRequestDate: new Date() } });
            currentCount = 0;
        }

        const limit = CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT;
        return { allowed: currentCount < limit, remaining: limit - currentCount };
    },

    incrementDailyFriendRequest: async (userId: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;
        const lastDate = user.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;

        if (lastDate !== todayStr) {
            await prisma.user.update({ where: { id: userId }, data: { dailyFriendRequests: 1, lastFriendRequestDate: new Date() } });
        } else {
            await prisma.user.update({ where: { id: userId }, data: { dailyFriendRequests: { increment: 1 } } });
        }
    },

    addFriend: async (senderId: string, receiverId: string) => {
        const existingIn = await prisma.friendship.findFirst({ where: { user1Id: receiverId, user2Id: senderId } });
        const existingOut = await prisma.friendship.findFirst({ where: { user1Id: senderId, user2Id: receiverId } });

        // If BOTH sides have a MATCH record, upgrade to permanent FRIEND
        if (existingIn && existingOut) {
            const bothMatch = (existingIn.status === 'MATCH' || existingIn.status === 'SWIPE_MATCH') &&
                (existingOut.status === 'MATCH' || existingOut.status === 'SWIPE_MATCH');
            if (bothMatch) {
                await prisma.friendship.updateMany({
                    where: { OR: [{ user1Id: senderId, user2Id: receiverId }, { user1Id: receiverId, user2Id: senderId }] },
                    data: { status: 'FRIEND' as any, expiresAt: null }
                });
                await notificationService.createNotification({
                    userId: receiverId,
                    type: 'MATCH',
                    title: 'Kalıcı Arkadaş!',
                    content: 'Artık kalıcı arkadaşsınız, mesajlaşmaya devam edebilirsiniz!',
                    actionUrl: '/messages'
                });
                return { message: 'Kalıcı arkadaş oldunuz!', matched: true, permanent: true };
            }
            // Already permanent friends
            return { message: 'Zaten arkadaşsınız', matched: true };
        }

        if (existingIn) {
            if (!existingOut) {
                await prisma.friendship.create({ data: { user1Id: senderId, user2Id: receiverId, status: 'SWIPE_MATCH' as any } });
                await prisma.friendship.update({ where: { id: existingIn.id }, data: { status: 'SWIPE_MATCH' as any } });

                const io = getSocketIo();
                if (io) {
                    const receiverUser = await prisma.user.findUnique({ where: { id: receiverId }, select: { isPremium: true } });
                    const senderUser = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true, isPremium: true } });
                    io.to(receiverId).emit('matchCreated', {
                        fromUserId: senderId,
                        fromUserName: receiverUser?.isPremium ? (senderUser?.name || 'Birisi') : null,
                        isMatch: true
                    });

                    await notificationService.createNotification({
                        userId: receiverId,
                        type: 'MATCH',
                        title: 'Yeni Eşleşme!',
                        content: 'Yıldızlar hizalandı, yeni bir eşleşmen var!',
                        actionUrl: '/messages'
                    });
                }
            }
            const senderPremium = await prisma.user.findUnique({ where: { id: senderId }, select: { isPremium: true } });
            return { message: 'Eşleşme oluştu!', matched: true, isPremium: senderPremium?.isPremium };
        }

        if (existingOut) {
            return { message: 'İstek zaten gönderildi', matched: false };
        }

        await prisma.friendship.create({ data: { user1Id: senderId, user2Id: receiverId, status: 'SWIPE_MATCH' as any } });
        return { message: 'Arkadaşlık isteği gönderildi', matched: false };
    },

    getFriends: async (userId: string) => {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) return [];

        const myRequests = await prisma.friendship.findMany({ where: { user1Id: userId } });
        const requestToIds = myRequests.map(f => f.user2Id);

        const mutualFriends = await prisma.friendship.findMany({
            where: { user1Id: { in: requestToIds }, user2Id: userId },
            // VULN 75 FIX: Removed email from select - email is PII and must never be exposed to other users
            include: { user1: { select: { id: true, name: true, avatar: true, sunSign: true, stardustBalance: true, isOnline: true, lastSeen: true } } }
        });

        // Batch fetch last messages for ALL friends in ONE query (eliminates N+1)
        const friendIds = mutualFriends.map(f => f.user1.id);
        const lastMessagesRaw = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: { in: friendIds } },
                    { senderId: { in: friendIds }, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        const lastMessageMap = new Map<string, any>();
        for (const msg of lastMessagesRaw) {
            const friendId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!lastMessageMap.has(friendId)) {
                lastMessageMap.set(friendId, msg); // First hit = most recent (ordered desc)
            }
        }

        // Phase 5: Calculate unread counts
        const unreadCounts = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: userId,
                senderId: { in: friendIds },
                isRead: false
            },
            _count: {
                _all: true
            }
        });
        const unreadMap = new Map<string, number>();
        for (const item of unreadCounts) {
            unreadMap.set(item.senderId, item._count._all);
        }

        const friendsWithMessages = mutualFriends.map(f => {
            const lastMsg = lastMessageMap.get(f.user1.id) || null;

            const hasMessages = lastMsg !== null;
            const isTemporary = f.expiresAt !== null;
            const isExpired = isTemporary && f.expiresAt! <= new Date();
            const isMatch = (f as any).status === 'SWIPE_MATCH' && !hasMessages;
            const matchType = (f as any).status;
            const isBlurred = !hasMessages && (!currentUser.isPremium && isMatch);

            const unreadCount = unreadMap.get(f.user1.id) || 0;

            if (isBlurred && isMatch) {
                return {
                    id: f.user1.id, name: null, avatar: null, sunSign: f.user1.sunSign,
                    isBlurred: true, isExpired: false, isTemporary, expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null,
                    isMatch: true, matchType, status: (f as any).status, hasMessages: false, lastMessage: null, unreadCount: 0
                };
            }

            if (isBlurred) {
                return {
                    id: f.user1.id, name: f.user1.name, avatar: f.user1.avatar, sunSign: f.user1.sunSign,
                    isBlurred: true, isExpired: true, isTemporary: true, isMatch: false, matchType,
                    status: (f as any).status, hasMessages, lastMessage: lastMsg, unreadCount
                };
            }

            return {
                ...f.user1, isBlurred: false, isExpired, isTemporary, isMatch, matchType,
                status: (f as any).status, hasMessages, expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null, lastMessage: lastMsg, unreadCount
            };
        });

        const seen = new Map<string, any>();
        for (const f of friendsWithMessages) {
            const existing = seen.get(f.id);
            if (!existing) {
                seen.set(f.id, f);
            } else if (f.lastMessage && !existing.lastMessage) {
                seen.set(f.id, f);
            }
        }
        const deduplicated = Array.from(seen.values());
        deduplicated.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
        });

        return { friends: deduplicated, serverTime: Date.now() };
    },

    deleteFriend: async (userId: string, targetId: string) => {
        await prisma.friendship.deleteMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] }
        });
        await prisma.message.deleteMany({
            where: { OR: [{ senderId: userId, receiverId: targetId }, { senderId: targetId, receiverId: userId }] }
        });
    },

    acceptMatch: async (userId: string, targetId: string) => {
        // Find any existing relationship (SWIPE_MATCH created by socket matchmaking, or prior friendship)
        const existingRelation = await prisma.friendship.findFirst({
            where: {
                OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }]
            }
        });

        // If already a valid active MATCH, return success immediately (idempotent)
        if (existingRelation?.status === 'MATCH' && existingRelation?.expiresAt && new Date() < existingRelation.expiresAt) {
            return { success: true, expiresAt: existingRelation.expiresAt.toISOString(), serverTime: Date.now() };
        }

        const expiresAt = new Date(Date.now() + CONSTANTS.DURATIONS.MATCH_EXPIRY_MS);

        // Update any existing records to MATCH (No deleteMany to prevent race condition gaps)
        await prisma.friendship.updateMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] },
            data: { status: 'MATCH', expiresAt }
        });

        // Ensure bidirectional relationship exists for getFriends
        const rels = await prisma.friendship.findMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] }
        });

        if (!rels.some(r => r.user1Id === userId && r.user2Id === targetId)) {
            await prisma.friendship.create({ data: { user1Id: userId, user2Id: targetId, expiresAt, status: 'MATCH' as any } });
        }
        if (!rels.some(r => r.user1Id === targetId && r.user2Id === userId)) {
            await prisma.friendship.create({ data: { user1Id: targetId, user2Id: userId, expiresAt, status: 'MATCH' as any } });
        }

        // FEAT-08: Increment daily quest matches & FEAT-10: Karma reward
        // Prevent double rewarding in race conditions by checking idempotency above
        await prisma.user.updateMany({
            where: { id: userId },
            data: { dailyQuestMatches: { increment: 1 }, karma: { increment: 5 } }
        });

        return { success: true, expiresAt: expiresAt.toISOString(), serverTime: Date.now() };
    },

    passMatch: async (userId: string, targetId: string) => {
        await prisma.friendship.deleteMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] }
        });
        const updatedCount = await prisma.user.updateMany({
            where: { id: userId, dailyMatchPasses: { gt: 0 } },
            data: { dailyMatchPasses: { decrement: 1 } }
        });

        if (updatedCount.count === 0) {
            throw new Error('Pas geçme hakkı kalmadı veya yarış durumu engellendi.');
        }

        const freshUser = await prisma.user.findUnique({ where: { id: userId } });
        return { success: true, dailyMatchPasses: freshUser?.dailyMatchPasses };
    },

    extendMatch: async (userId: string, targetId: string) => {
        // Verify balance before deducting
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.stardustBalance < CONSTANTS.COSTS.EXTEND_MATCH) {
            throw new Error('Yetersiz Yıldız Tozu');
        }

        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + CONSTANTS.DURATIONS.MATCH_EXTENSION_HOURS);

        // VULN 54 FIX: Atomic update for balance deduction to prevent Negative Farming
        const updatedCount = await prisma.user.updateMany({
            where: { id: userId, stardustBalance: { gte: CONSTANTS.COSTS.EXTEND_MATCH } },
            data: { stardustBalance: { decrement: CONSTANTS.COSTS.EXTEND_MATCH } }
        });

        if (updatedCount.count === 0) {
            throw new Error('Yetersiz Yıldız Tozu veya Hatalı İşlem (Race Condition Engellendi)');
        }

        await prisma.friendship.updateMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] },
            data: { expiresAt: newExpiresAt }
        });

        const io = getSocketIo();
        if (io) {
            // VULN 76 FIX: Never expose email in socket events
            const extender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            const extenderName = extender?.name || 'Kozmik Yolcu';
            io.to(targetId).emit('chatExtended', {
                extendedBy: userId, extenderName, expiresAt: newExpiresAt.toISOString()
            });
        }
        return { success: true, expiresAt: newExpiresAt, serverTime: Date.now() };
    },

    makeMatchPermanent: async (userId: string, targetId: string) => {
        // Verify balance before deducting
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.stardustBalance < CONSTANTS.COSTS.MAKE_MATCH_PERMANENT) {
            throw new Error('Yetersiz Yıldız Tozu');
        }

        // VULN 54 FIX: Atomic update for balance deduction to prevent Negative Farming
        const updatedCount = await prisma.user.updateMany({
            where: { id: userId, stardustBalance: { gte: CONSTANTS.COSTS.MAKE_MATCH_PERMANENT } },
            data: { stardustBalance: { decrement: CONSTANTS.COSTS.MAKE_MATCH_PERMANENT } }
        });

        if (updatedCount.count === 0) {
            throw new Error('Yetersiz Yıldız Tozu veya Hatalı İşlem (Race Condition Engellendi)');
        }

        await prisma.friendship.updateMany({
            where: { OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }] },
            data: { expiresAt: null }
        });

        return { success: true };
    },

    sendFriendRequest: async (userId: string, receiverId: string) => {
        const areFriends = await friendshipService.checkIfFriends(userId, receiverId);
        if (areFriends) throw new Error('Zaten arkadaşsınız');

        const existing = await prisma.friendRequest.findFirst({
            where: { senderId: userId, receiverId }
        });
        if (existing) {
            if (existing.status === 'PENDING') throw new Error('Zaten bekleyen bir isteğiniz var');
            if (existing.status === 'REJECTED') {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                if (existing.createdAt > oneDayAgo) throw new Error('Bu kullanıcı isteğinizi kısa süre önce reddetti. Tekrar yollamak için beklemelisiniz.');

                await prisma.friendRequest.update({ where: { id: existing.id }, data: { status: 'PENDING', createdAt: new Date() } });
                await friendshipService.incrementDailyFriendRequest(userId);
                return { success: true };
            }
        }

        const reverseRequest = await prisma.friendRequest.findFirst({
            where: { senderId: receiverId, receiverId: userId, status: 'PENDING' }
        });

        if (reverseRequest) {
            await prisma.friendRequest.update({ where: { id: reverseRequest.id }, data: { status: 'ACCEPTED' } });
            await friendshipService.createFriendship(userId, receiverId);
            await friendshipService.incrementDailyFriendRequest(userId);

            const io = getSocketIo();
            if (io) {
                const senderUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatar: true } });
                io.to(receiverId).emit('friendRequestAccepted', { fromUserId: userId, fromUserName: senderUser?.name || 'Birisi' });
            }
            return { success: true, autoAccepted: true };
        }

        const fr = await prisma.friendRequest.create({ data: { senderId: userId, receiverId } });
        await friendshipService.incrementDailyFriendRequest(userId);

        const io = getSocketIo();
        if (io) {
            const senderUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatar: true, sunSign: true } });
            io.to(receiverId).emit('newFriendRequest', {
                requestId: fr.id, fromUserId: userId, fromUserName: senderUser?.name || 'Birisi',
                fromAvatar: senderUser?.avatar, fromSunSign: senderUser?.sunSign
            });

            await notificationService.createNotification({
                userId: receiverId,
                type: 'FRIEND_REQUEST',
                title: 'Yeni Arkadaşlık İsteği',
                content: `${senderUser?.name || 'Birisi'} sana arkadaşlık isteği gönderdi.`,
                actionUrl: '/messages',
                entityId: fr.id
            });
        }
        return { success: true };
    },

    acceptFriendRequest: async (userId: string, requestId: string) => {
        const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr) throw new Error('İstek bulunamadı');
        if (fr.receiverId !== userId) throw new Error('Bu isteği kabul etme yetkiniz yok');
        if (fr.status !== 'PENDING') throw new Error('Bu istek zaten işlenmiş');

        await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
        await friendshipService.createFriendship(fr.senderId, fr.receiverId);
        await friendshipService.incrementDailyFriendRequest(userId);

        await xpService.addXp(fr.senderId, CONSTANTS.REWARDS.ACCEPT_FRIEND_REQUEST_XP);
        await xpService.addXp(fr.receiverId, CONSTANTS.REWARDS.ACCEPT_FRIEND_REQUEST_XP);
        await BadgeService.checkAndAwardBadges(fr.senderId);
        await BadgeService.checkAndAwardBadges(fr.receiverId);

        const io = getSocketIo();
        if (io) {
            const accepter = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, avatar: true } });
            io.to(fr.senderId).emit('friendRequestAccepted', { fromUserId: userId, fromUserName: accepter?.name || 'Birisi' });

            await notificationService.createNotification({
                userId: fr.senderId,
                type: 'FRIEND_REQUEST_ACCEPTED',
                title: 'İsteğin Kabul Edildi',
                content: `${accepter?.name || 'Birisi'} arkadaşlık isteğini kabul etti!`,
                actionUrl: '/messages',
                entityId: requestId
            });
        }
    },

    rejectFriendRequest: async (userId: string, requestId: string) => {
        const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr) throw new Error('İstek bulunamadı');
        if (fr.receiverId !== userId) throw new Error('Bu isteği reddetme yetkiniz yok');
        if (fr.status !== 'PENDING') throw new Error('Bu istek zaten işlenmiş');

        await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
        return { success: true };
    },

    getPendingRequests: async (userId: string) => {
        return await prisma.friendRequest.findMany({
            where: { receiverId: userId, status: 'PENDING' },
            include: { sender: { select: { id: true, name: true, avatar: true, sunSign: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },

    getFriendRequestStatus: async (userId: string, targetId: string) => {
        console.log(`🔍 [getFriendRequestStatus] userId=${userId}, targetId=${targetId}`);
        
        // VULN 35 FIX: Prevent temporary matches from appearing as permanent friends
        const matchRelation = await prisma.friendship.findFirst({
            where: {
                OR: [{ user1Id: userId, user2Id: targetId }, { user1Id: targetId, user2Id: userId }],
                status: 'MATCH'
            }
        });

        if (matchRelation && matchRelation.expiresAt && new Date() < matchRelation.expiresAt) {
            console.log(`🔍 [getFriendRequestStatus] RETURNING: MATCH`);
            return { status: 'MATCH' };
        }

        const areFriends = await friendshipService.checkIfFriends(userId, targetId);
        if (areFriends) {
            console.log(`🔍 [getFriendRequestStatus] RETURNING: friends`);
            return { status: 'friends' };
        }

        const sentRequest = await prisma.friendRequest.findFirst({
            where: { senderId: userId, receiverId: targetId, status: 'PENDING' }
        });
        if (sentRequest) {
            console.log(`🔍 [getFriendRequestStatus] RETURNING: sent`);
            return { status: 'sent', requestId: sentRequest.id };
        }

        const receivedRequest = await prisma.friendRequest.findFirst({
            where: { senderId: targetId, receiverId: userId, status: 'PENDING' }
        });
        if (receivedRequest) {
            console.log(`🔍 [getFriendRequestStatus] RETURNING: received`);
            return { status: 'received', requestId: receivedRequest.id };
        }

        console.log(`🔍 [getFriendRequestStatus] RETURNING: none`);
        return { status: 'none' };
    }
};
