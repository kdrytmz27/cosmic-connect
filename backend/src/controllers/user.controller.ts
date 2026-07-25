import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserService } from '../services/user.service';
import { friendshipService } from '../services/friendship.service';
import { messageService } from '../services/message.service';
import { calculateSynastryReport } from '../services/synastry.service';
import { CONSTANTS } from '../config/constants';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../utils/errors';

// ------------------------
// USER PROFILE & DISCOVERY
// ------------------------

export const getProfile = async (req: Request, res: Response) => {
    const currentUserId = req.user?.userId;
    const targetUserId = (req.params.id === 'me' ? currentUserId : req.params.id) as string;
    const result = await UserService.getProfile(currentUserId, targetUserId);
    res.json(result);
};

export const updateProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await UserService.updateProfile(userId, req.body);
    res.json(result);
};

export const getDailyMatch = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await UserService.getDailyMatch(userId, req.query);
    res.json(result);
};

export const getLeaderboard = async (req: Request, res: Response) => {
    const result = await UserService.getLeaderboard();
    res.json(result);
};

// ------------------------
// DAILY REWARDS & STATUS
// ------------------------

export const getDailyRewardStatus = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await UserService.getDailyRewardStatus(userId);
    res.json(result);
};

export const claimDailyReward = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await UserService.claimDailyReward(userId);
    res.json(result);
};

export const updateCosmicStatus = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await UserService.updateCosmicStatus(userId, req.body.cosmicStatus);
    res.json(result);
};

// ------------------------
// SYNASTRY REPORT (Astrology compatibility between two exact users)
// ------------------------

export const getSynastry = async (req: Request, res: Response) => {
    const currentUserId = req.user?.userId;
    const targetUserId = req.params.id as string;
    if (!currentUserId || !targetUserId) throw new BadRequestError('Missing user IDs');

    const [currentUser, targetUser] = await Promise.all([
        prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, name: true, email: true, avatar: true, birthDate: true, birthTime: true, sunSign: true, moonSign: true, risingSign: true } }),
        prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, email: true, avatar: true, birthDate: true, birthTime: true, sunSign: true, moonSign: true, risingSign: true } })
    ]);

    if (!currentUser || !targetUser) throw new BadRequestError('User not found');

    const report = calculateSynastryReport(
        { birthDate: currentUser.birthDate, birthTime: currentUser.birthTime, name: currentUser.name || currentUser.email?.split('@')[0] || 'Kullanıcı' },
        { birthDate: targetUser.birthDate, birthTime: targetUser.birthTime, name: targetUser.name || targetUser.email?.split('@')[0] || 'Kullanıcı' }
    );

    // SECURITY: Do NOT include birthDate or birthTime in the res.json payload.
    // They are sensitive PII (Personally Identifiable Information). Always cherry-pick fields!
    res.json({
        report,
        user1: { id: currentUser.id, name: currentUser.name || currentUser.email?.split('@')[0], avatar: currentUser.avatar, sunSign: currentUser.sunSign, moonSign: currentUser.moonSign, risingSign: currentUser.risingSign },
        user2: { id: targetUser.id, name: targetUser.name || targetUser.email?.split('@')[0], avatar: targetUser.avatar, sunSign: targetUser.sunSign, moonSign: targetUser.moonSign, risingSign: targetUser.risingSign }
    });
};

// ------------------------
// FRIENDSHIP & MATCHING
// ------------------------

export const addFriend = async (req: Request, res: Response) => {
    const senderId = req.user?.userId;
    const receiverId = req.body.receiverId;
    if (!senderId || !receiverId) throw new BadRequestError('Missing parameters');
    const result = await friendshipService.addFriend(senderId, receiverId);
    res.json(result);
};

export const getFriends = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await friendshipService.getFriends(userId);
    res.json(result);
};

export const deleteFriend = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();
    await friendshipService.deleteFriend(userId, targetId);
    res.json({ success: true });
};

export const acceptMatch = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();
    const result = await friendshipService.acceptMatch(userId, targetId);
    res.json(result);
};

export const passMatch = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.dailyMatchPasses <= 0) {
        throw new ForbiddenError(`Yetersiz Pas Geçme Hakkı (Günde ${CONSTANTS.DAILY_LIMITS.MATCH_PASSES.DEFAULT} Limit)`);
    }
    if (!user.isPremium) throw new ForbiddenError('Premium required to pass matches');

    const result = await friendshipService.passMatch(userId, targetId);
    res.json(result);
};

export const extendMatch = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.stardustBalance < CONSTANTS.COSTS.EXTEND_MATCH) throw new ForbiddenError('Insufficient Stardust');

    const result = await friendshipService.extendMatch(userId, targetId);
    res.json(result);
};

export const makeMatchPermanent = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.stardustBalance < CONSTANTS.COSTS.MAKE_MATCH_PERMANENT) throw new ForbiddenError('Insufficient Stardust');

    const result = await friendshipService.makeMatchPermanent(userId, targetId);
    res.json(result);
};

// ------------------------
// FRIEND REQUESTS
// ------------------------

export const sendFriendRequest = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { receiverId } = req.body;
    if (!userId) throw new UnauthorizedError();
    if (!receiverId) throw new BadRequestError('receiverId gerekli');
    if (userId === receiverId) throw new BadRequestError('Kendinize istek gönderemezsiniz');

    const { allowed, remaining } = await friendshipService.checkDailyFriendRequestLimit(userId);
    if (!allowed) throw new BadRequestError(`Günlük arkadaşlık isteği limitinize ulaştınız (${CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT}/gün)`);

    const result = await friendshipService.sendFriendRequest(userId, receiverId);
    res.json({ ...result, remaining: remaining - 1 });
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const requestId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();

    const { allowed, remaining } = await friendshipService.checkDailyFriendRequestLimit(userId);
    if (!allowed) throw new BadRequestError(`Günlük arkadaşlık isteği limitinize ulaştınız (${CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT}/gün)`);

    await friendshipService.acceptFriendRequest(userId, requestId);
    res.json({ success: true, remaining: remaining - 1 });
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const requestId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();
    const result = await friendshipService.rejectFriendRequest(userId, requestId);
    res.json(result);
};

export const getPendingRequests = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const requests = await friendshipService.getPendingRequests(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = user?.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;
    const currentCount = lastDate === todayStr ? (user?.dailyFriendRequests || 0) : 0;
    const remaining = user?.isPremium ? CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.PREMIUM : Math.max(0, CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT - currentCount);

    res.json({ requests, remaining });
};

export const getFriendRequestStatus = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();

    const result = await friendshipService.getFriendRequestStatus(userId, targetId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = user?.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;
    const currentCount = lastDate === todayStr ? (user?.dailyFriendRequests || 0) : 0;
    const remaining = user?.isPremium ? CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.PREMIUM : Math.max(0, CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT - currentCount);

    res.json({ ...result, remaining });
};

// ------------------------
// DIRECT MESSAGES
// ------------------------

export const getMessages = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const friendId = req.params.id as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    if (!userId) throw new UnauthorizedError();

    const result = await messageService.getMessages(userId, friendId, cursor, limit);
    res.json(result);
};

export const sendMessage = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { receiverId, content, imageUrl, audioUrl } = req.body;
    if (!userId || !receiverId) throw new BadRequestError('Missing parameters');

    const cleanContent = content ? content.replace(/</g, "&lt;").replace(/>/g, "&gt;") : content;

    const msg = await messageService.sendMessage(userId, receiverId, cleanContent, imageUrl, audioUrl);
    res.json({ message: msg });
};

// ------------------------
// TRANSACTIONS & ECONOMY
// ------------------------

export const getTransactions = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const transactions = await prisma.gift.findMany({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: {
            sender: { select: { name: true, avatar: true } },
            receiver: { select: { name: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const formattedTransactions: any[] = [];
    
    transactions.forEach(t => {
        if (t.senderId === userId && t.receiverId === userId) {
            // Kendine hediye atma: İki ayrı kayıt göster (Hem harcama hem gelir)
            formattedTransactions.push({
                id: t.id + '-expense',
                type: 'expense',
                amount: t.stardustCost,
                originalCost: t.stardustCost,
                currency: 'stardust',
                from: 'Kendinize',
                to: 'Kendinize',
                gift: t.giftType,
                date: t.createdAt.toISOString()
            });
            formattedTransactions.push({
                id: t.id + '-income',
                type: 'income',
                amount: Math.floor(t.stardustCost * 0.3),
                originalCost: t.stardustCost,
                currency: 'diamond',
                from: 'Kendinizden',
                to: 'Kendinize',
                gift: t.giftType,
                date: t.createdAt.toISOString()
            });
        } else {
            const type = t.receiverId === userId ? 'income' : 'expense';
            const amount = t.stardustCost;
            const earned = type === 'income' ? Math.floor(amount * 0.3) : amount;
            
            formattedTransactions.push({
                id: t.id,
                type,
                amount: earned,
                originalCost: amount,
                currency: type === 'income' ? 'diamond' : 'stardust',
                from: t.sender?.name || 'Bilinmeyen Kullanıcı',
                to: t.receiver?.name || 'Bilinmeyen Kullanıcı',
                gift: t.giftType,
                date: t.createdAt.toISOString()
            });
        }
    });

    res.json({ transactions: formattedTransactions });
};
