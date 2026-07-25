import api from './client';

export const economyApi = {
    claimDailyReward: () => api.post('/user/daily-reward/claim'),
    getDailyRewardStatus: () => api.get('/user/daily-reward/status'),
    getLeaderboard: () => api.get('/user/leaderboard')
};
