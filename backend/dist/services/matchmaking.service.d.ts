export interface QueuedPlayer {
    userId: string;
    socketId: string;
    matchScore: number;
    isPremium: boolean;
}
export declare const matchmakingService: {
    joinQueue(player: QueuedPlayer): Promise<void>;
    removeFromQueue(userId: string): void;
    tryMatch(): Promise<[QueuedPlayer, QueuedPlayer] | null>;
    createRoom(p1: QueuedPlayer, p2: QueuedPlayer, timeoutCallback: (roomId: string) => void): Promise<{
        roomId: string;
        duration: number;
    }>;
    getRoom(roomId: string): any;
    extendRoomTime(roomId: string, extraMs: number): boolean;
    removeRoom(roomId: string): Promise<void>;
};
//# sourceMappingURL=matchmaking.service.d.ts.map