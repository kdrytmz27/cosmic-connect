import api from './client';

export const premiumApi = {
    buyPremium: () => api.post('/premium/buy-premium'),
    buyStardust: (amount: number) => api.post('/premium/buy-stardust', { amount }),
    superLike: (targetId: string) => api.post('/premium/super-like', { targetId }),
    swipe: (targetUserId: string, action: 'LIKE' | 'PASS') => api.post('/premium/swipe', { targetUserId, action }),
    addExtraTime: (targetUserId: string) => api.post('/premium/extra-time', { targetUserId }),
    // TEST ONLY - remove once manual QA is done (backend also refuses this outside development).
    devAddStardust: () => api.post('/premium/dev-add-stardust')
};
