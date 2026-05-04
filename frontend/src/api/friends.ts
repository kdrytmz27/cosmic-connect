import api from './client';

export const friendsApi = {
    sendRequest: (receiverId: string) => api.post('/user/friend-request', { receiverId }),
    getRequests: () => api.get('/user/friend-requests'),
    acceptRequest: (requestId: string) => api.post(`/user/friend-request/${requestId}/accept`),
    getFriends: () => api.get('/user/friends'),
    removeFriend: (friendId: string) => api.delete(`/user/friend/${friendId}`),
    getRequestStatus: (targetUserId: string) => api.get(`/user/friend-request-status/${targetUserId}`),
    getSynastry: (targetUserId: string) => api.get(`/user/synastry/${targetUserId}`)
};
