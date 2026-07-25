"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.getFriendRequestStatus = exports.getPendingRequests = exports.rejectFriendRequest = exports.acceptFriendRequest = exports.sendFriendRequest = exports.makeMatchPermanent = exports.extendMatch = exports.passMatch = exports.acceptMatch = exports.deleteFriend = exports.getFriends = exports.addFriend = exports.getSynastry = exports.reportUser = exports.updateCosmicStatus = exports.claimDailyReward = exports.getDailyRewardStatus = exports.getLeaderboard = exports.getDailyMatch = exports.updateProfile = exports.getProfile = void 0;
const index_1 = require("../index");
const user_service_1 = require("../services/user.service");
const friendship_service_1 = require("../services/friendship.service");
const message_service_1 = require("../services/message.service");
const synastry_service_1 = require("../services/synastry.service");
const constants_1 = require("../config/constants");
const errors_1 = require("../utils/errors");
// ------------------------
// USER PROFILE & DISCOVERY
// ------------------------
const getProfile = async (req, res) => {
    const currentUserId = req.user?.userId;
    const targetUserId = (req.params.id === 'me' ? currentUserId : req.params.id);
    const result = await user_service_1.UserService.getProfile(currentUserId, targetUserId);
    res.json(result);
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await user_service_1.UserService.updateProfile(userId, req.body);
    res.json(result);
};
exports.updateProfile = updateProfile;
const getDailyMatch = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await user_service_1.UserService.getDailyMatch(userId, req.query);
    res.json(result);
};
exports.getDailyMatch = getDailyMatch;
const getLeaderboard = async (req, res) => {
    const result = await user_service_1.UserService.getLeaderboard();
    res.json(result);
};
exports.getLeaderboard = getLeaderboard;
// ------------------------
// DAILY REWARDS & STATUS
// ------------------------
const getDailyRewardStatus = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await user_service_1.UserService.getDailyRewardStatus(userId);
    res.json(result);
};
exports.getDailyRewardStatus = getDailyRewardStatus;
const claimDailyReward = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await user_service_1.UserService.claimDailyReward(userId);
    res.json(result);
};
exports.claimDailyReward = claimDailyReward;
const updateCosmicStatus = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await user_service_1.UserService.updateCosmicStatus(userId, req.body.cosmicStatus);
    res.json(result);
};
exports.updateCosmicStatus = updateCosmicStatus;
const reportUser = async (req, res) => {
    // Placeholder implementation
    res.json({ success: true });
};
exports.reportUser = reportUser;
// ------------------------
// SYNASTRY REPORT (Astrology compatibility between two exact users)
// ------------------------
const getSynastry = async (req, res) => {
    const currentUserId = req.user?.userId;
    const targetUserId = req.params.id;
    if (!currentUserId || !targetUserId)
        throw new errors_1.BadRequestError('Missing user IDs');
    const [currentUser, targetUser] = await Promise.all([
        index_1.prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, name: true, email: true, avatar: true, birthDate: true, birthTime: true, sunSign: true, moonSign: true, risingSign: true } }),
        index_1.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, email: true, avatar: true, birthDate: true, birthTime: true, sunSign: true, moonSign: true, risingSign: true } })
    ]);
    if (!currentUser || !targetUser)
        throw new errors_1.BadRequestError('User not found');
    const report = (0, synastry_service_1.calculateSynastryReport)({ birthDate: currentUser.birthDate, birthTime: currentUser.birthTime, name: currentUser.name || currentUser.email?.split('@')[0] || 'Kullanıcı' }, { birthDate: targetUser.birthDate, birthTime: targetUser.birthTime, name: targetUser.name || targetUser.email?.split('@')[0] || 'Kullanıcı' });
    // SECURITY: Do NOT include birthDate or birthTime in the res.json payload.
    // They are sensitive PII (Personally Identifiable Information). Always cherry-pick fields!
    res.json({
        report,
        user1: { id: currentUser.id, name: currentUser.name || currentUser.email?.split('@')[0], avatar: currentUser.avatar, sunSign: currentUser.sunSign, moonSign: currentUser.moonSign, risingSign: currentUser.risingSign },
        user2: { id: targetUser.id, name: targetUser.name || targetUser.email?.split('@')[0], avatar: targetUser.avatar, sunSign: targetUser.sunSign, moonSign: targetUser.moonSign, risingSign: targetUser.risingSign }
    });
};
exports.getSynastry = getSynastry;
// ------------------------
// FRIENDSHIP & MATCHING
// ------------------------
const addFriend = async (req, res) => {
    const senderId = req.user?.userId;
    const receiverId = req.body.receiverId;
    if (!senderId || !receiverId)
        throw new errors_1.BadRequestError('Missing parameters');
    const result = await friendship_service_1.friendshipService.addFriend(senderId, receiverId);
    res.json(result);
};
exports.addFriend = addFriend;
const getFriends = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await friendship_service_1.friendshipService.getFriends(userId);
    res.json(result);
};
exports.getFriends = getFriends;
const deleteFriend = async (req, res) => {
    const userId = req.user?.userId;
    const targetId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await friendship_service_1.friendshipService.deleteFriend(userId, targetId);
    res.json({ success: true });
};
exports.deleteFriend = deleteFriend;
const acceptMatch = async (req, res) => {
    const userId = req.user?.userId;
    const targetId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await friendship_service_1.friendshipService.acceptMatch(userId, targetId);
    res.json(result);
};
exports.acceptMatch = acceptMatch;
const passMatch = async (req, res) => {
    const userId = req.user?.userId;
    const targetId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.dailyMatchPasses <= 0) {
        throw new errors_1.ForbiddenError(`Yetersiz Pas Geçme Hakkı (Günde ${constants_1.CONSTANTS.DAILY_LIMITS.MATCH_PASSES.DEFAULT} Limit)`);
    }
    if (!user.isPremium)
        throw new errors_1.ForbiddenError('Premium required to pass matches');
    const result = await friendship_service_1.friendshipService.passMatch(userId, targetId);
    res.json(result);
};
exports.passMatch = passMatch;
const extendMatch = async (req, res) => {
    const userId = req.user?.userId;
    const targetId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.stardustBalance < constants_1.CONSTANTS.COSTS.EXTEND_MATCH)
        throw new errors_1.ForbiddenError('Insufficient Stardust');
    const result = await friendship_service_1.friendshipService.extendMatch(userId, targetId);
    res.json(result);
};
exports.extendMatch = extendMatch;
const makeMatchPermanent = async (req, res) => {
    const userId = req.user?.userId;
    const targetId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.stardustBalance < constants_1.CONSTANTS.COSTS.MAKE_MATCH_PERMANENT)
        throw new errors_1.ForbiddenError('Insufficient Stardust');
    const result = await friendship_service_1.friendshipService.makeMatchPermanent(userId, targetId);
    res.json(result);
};
exports.makeMatchPermanent = makeMatchPermanent;
// ------------------------
// FRIEND REQUESTS
// ------------------------
const sendFriendRequest = async (req, res) => {
    const userId = req.user?.userId;
    const { receiverId } = req.body;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    if (!receiverId)
        throw new errors_1.BadRequestError('receiverId gerekli');
    if (userId === receiverId)
        throw new errors_1.BadRequestError('Kendinize istek gönderemezsiniz');
    const { allowed, remaining } = await friendship_service_1.friendshipService.checkDailyFriendRequestLimit(userId);
    if (!allowed)
        throw new errors_1.BadRequestError(`Günlük arkadaşlık isteği limitinize ulaştınız (${constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT}/gün)`);
    const result = await friendship_service_1.friendshipService.sendFriendRequest(userId, receiverId);
    res.json({ ...result, remaining: remaining - 1 });
};
exports.sendFriendRequest = sendFriendRequest;
const acceptFriendRequest = async (req, res) => {
    const userId = req.user?.userId;
    const requestId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const { allowed, remaining } = await friendship_service_1.friendshipService.checkDailyFriendRequestLimit(userId);
    if (!allowed)
        throw new errors_1.BadRequestError(`Günlük arkadaşlık isteği limitinize ulaştınız (${constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT}/gün)`);
    await friendship_service_1.friendshipService.acceptFriendRequest(userId, requestId);
    res.json({ success: true, remaining: remaining - 1 });
};
exports.acceptFriendRequest = acceptFriendRequest;
const rejectFriendRequest = async (req, res) => {
    const userId = req.user?.userId;
    const requestId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await friendship_service_1.friendshipService.rejectFriendRequest(userId, requestId);
    res.json(result);
};
exports.rejectFriendRequest = rejectFriendRequest;
const getPendingRequests = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const requests = await friendship_service_1.friendshipService.getPendingRequests(userId);
    const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = user?.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;
    const currentCount = lastDate === todayStr ? (user?.dailyFriendRequests || 0) : 0;
    const remaining = user?.isPremium ? constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.PREMIUM : Math.max(0, constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT - currentCount);
    res.json({ requests, remaining });
};
exports.getPendingRequests = getPendingRequests;
const getFriendRequestStatus = async (req, res) => {
    const userId = req.user?.userId;
    const targetId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await friendship_service_1.friendshipService.getFriendRequestStatus(userId, targetId);
    const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = user?.lastFriendRequestDate ? new Date(user.lastFriendRequestDate).toISOString().split('T')[0] : null;
    const currentCount = lastDate === todayStr ? (user?.dailyFriendRequests || 0) : 0;
    const remaining = user?.isPremium ? constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.PREMIUM : Math.max(0, constants_1.CONSTANTS.DAILY_LIMITS.FRIEND_REQUESTS.DEFAULT - currentCount);
    res.json({ ...result, remaining });
};
exports.getFriendRequestStatus = getFriendRequestStatus;
// ------------------------
// DIRECT MESSAGES
// ------------------------
const getMessages = async (req, res) => {
    const userId = req.user?.userId;
    const friendId = req.params.id;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const messages = await message_service_1.messageService.getMessages(userId, friendId);
    res.json({ messages });
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    const userId = req.user?.userId;
    const { receiverId, content, imageUrl, audioUrl } = req.body;
    if (!userId || !receiverId)
        throw new errors_1.BadRequestError('Missing parameters');
    const msg = await message_service_1.messageService.sendMessage(userId, receiverId, content, imageUrl, audioUrl);
    res.json({ message: msg });
};
exports.sendMessage = sendMessage;
//# sourceMappingURL=user.controller.js.map