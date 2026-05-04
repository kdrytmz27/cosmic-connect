import api from './client';

export const premiumApi = {
    buyPremium: () => api.post('/premium/buy-premium'),
    buyStardust: (amount: number) => api.post('/premium/buy-stardust', { amount }),
    superLike: (targetUserId: string) => api.post('/premium/super-like', { targetUserId }),
    swipe: (targetUserId: string, action: 'LIKE' | 'PASS') => api.post('/premium/swipe', { targetUserId, action }),
    addExtraTime: (targetUserId: string) => api.post('/premium/add-extra-time', { targetUserId })
};
