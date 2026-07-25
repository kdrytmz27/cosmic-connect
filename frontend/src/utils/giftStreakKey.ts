// Must match buildGiftStreakKey in backend/src/controllers/socket.controller.ts exactly -
// this is what lets the sender's optimistic local animation and the server's real echo
// merge into the same visual instance instead of showing as two separate gifts.
export const buildGiftStreakKey = (roomId: string, senderId: string, targetUserId: string, giftId: string) =>
    `giftstreak:${roomId}:${senderId}:${targetUserId}:${giftId}`;
