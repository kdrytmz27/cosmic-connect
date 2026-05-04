import api from './client';

export const tarotApi = {
    getDailyStatus: () => api.get('/tarot/daily/status'),
    drawDailyCards: () => api.post('/tarot/daily/draw')
};
