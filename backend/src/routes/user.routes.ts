import { Router } from 'express';
import {
    getProfile, getDailyMatch, addFriend, getFriends, getMessages, sendMessage,
    updateProfile, reportUser, updateCosmicStatus, getDailyRewardStatus,
    claimDailyReward, getLeaderboard, passMatch, extendMatch, makeMatchPermanent,
    acceptMatch, deleteFriend, getSynastry,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getPendingRequests, getFriendRequestStatus
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/daily-match', authenticate as any, getDailyMatch as any);
router.get('/profile/:id', authenticate as any, getProfile as any);
router.get('/synastry/:id', authenticate as any, getSynastry as any);

// Match & Friend Endpoints
router.post('/friend', authenticate as any, addFriend as any);
router.post('/friend/:id/accept-match', authenticate as any, acceptMatch as any);
router.post('/friend/:id/pass', authenticate as any, passMatch as any);
router.post('/friend/:id/extend', authenticate as any, extendMatch as any);
router.post('/friend/:id/permanent', authenticate as any, makeMatchPermanent as any);
router.delete('/friend/:id', authenticate as any, deleteFriend as any);
router.get('/friends', authenticate as any, getFriends as any);

// Friend Request System
router.post('/friend-request', authenticate as any, sendFriendRequest as any);
router.post('/friend-request/:id/accept', authenticate as any, acceptFriendRequest as any);
router.post('/friend-request/:id/reject', authenticate as any, rejectFriendRequest as any);
router.get('/friend-requests', authenticate as any, getPendingRequests as any);
router.get('/friend-request-status/:id', authenticate as any, getFriendRequestStatus as any);

// Chat & Profile etc.
router.get('/messages/:id', authenticate as any, getMessages as any);
router.post('/messages', authenticate as any, sendMessage as any);
router.put('/profile', authenticate as any, updateProfile as any);
router.put('/status', authenticate as any, updateCosmicStatus as any);

import { submitReport } from '../controllers/admin.report.controller';
router.post('/report', authenticate as any, submitReport as any);

// Block & Report System (FEAT-04)
import { blockUser, unblockUser, getBlockedList, reportUser as reportUserBlock } from '../controllers/block.controller';
router.post('/block/:targetId', authenticate as any, blockUser as any);
router.delete('/block/:targetId', authenticate as any, unblockUser as any);
router.get('/blocked', authenticate as any, getBlockedList as any);
router.post('/report/:targetId', authenticate as any, reportUserBlock as any);

router.get('/daily-reward/status', authenticate as any, getDailyRewardStatus as any);
router.post('/daily-reward/claim', authenticate as any, claimDailyReward as any);
router.get('/leaderboard', authenticate as any, getLeaderboard as any);

export default router;
