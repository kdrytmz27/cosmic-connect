"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/daily-match', auth_middleware_1.authenticate, user_controller_1.getDailyMatch);
router.get('/profile/:id', auth_middleware_1.authenticate, user_controller_1.getProfile);
router.get('/synastry/:id', auth_middleware_1.authenticate, user_controller_1.getSynastry);
// Match & Friend Endpoints
router.post('/friend', auth_middleware_1.authenticate, user_controller_1.addFriend);
router.post('/friend/:id/accept-match', auth_middleware_1.authenticate, user_controller_1.acceptMatch);
router.post('/friend/:id/pass', auth_middleware_1.authenticate, user_controller_1.passMatch);
router.post('/friend/:id/extend', auth_middleware_1.authenticate, user_controller_1.extendMatch);
router.post('/friend/:id/permanent', auth_middleware_1.authenticate, user_controller_1.makeMatchPermanent);
router.delete('/friend/:id', auth_middleware_1.authenticate, user_controller_1.deleteFriend);
router.get('/friends', auth_middleware_1.authenticate, user_controller_1.getFriends);
// Friend Request System
router.post('/friend-request', auth_middleware_1.authenticate, user_controller_1.sendFriendRequest);
router.post('/friend-request/:id/accept', auth_middleware_1.authenticate, user_controller_1.acceptFriendRequest);
router.post('/friend-request/:id/reject', auth_middleware_1.authenticate, user_controller_1.rejectFriendRequest);
router.get('/friend-requests', auth_middleware_1.authenticate, user_controller_1.getPendingRequests);
router.get('/friend-request-status/:id', auth_middleware_1.authenticate, user_controller_1.getFriendRequestStatus);
// Chat & Profile etc.
router.get('/messages/:id', auth_middleware_1.authenticate, user_controller_1.getMessages);
router.post('/messages', auth_middleware_1.authenticate, user_controller_1.sendMessage);
router.put('/profile', auth_middleware_1.authenticate, user_controller_1.updateProfile);
router.put('/status', auth_middleware_1.authenticate, user_controller_1.updateCosmicStatus);
const admin_report_controller_1 = require("../controllers/admin.report.controller");
router.post('/report', auth_middleware_1.authenticate, admin_report_controller_1.submitReport);
// Block & Report System (FEAT-04)
const block_controller_1 = require("../controllers/block.controller");
router.post('/block/:targetId', auth_middleware_1.authenticate, block_controller_1.blockUser);
router.delete('/block/:targetId', auth_middleware_1.authenticate, block_controller_1.unblockUser);
router.get('/blocked', auth_middleware_1.authenticate, block_controller_1.getBlockedList);
router.post('/report/:targetId', auth_middleware_1.authenticate, block_controller_1.reportUser);
router.get('/daily-reward/status', auth_middleware_1.authenticate, user_controller_1.getDailyRewardStatus);
router.post('/daily-reward/claim', auth_middleware_1.authenticate, user_controller_1.claimDailyReward);
router.get('/leaderboard', auth_middleware_1.authenticate, user_controller_1.getLeaderboard);
exports.default = router;
//# sourceMappingURL=user.routes.js.map