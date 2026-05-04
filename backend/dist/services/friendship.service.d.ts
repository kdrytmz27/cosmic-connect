export declare const friendshipService: {
    checkIfFriends: (userId1: string, userId2: string) => Promise<boolean>;
    createFriendship: (userId1: string, userId2: string) => Promise<void>;
    checkDailyFriendRequestLimit: (userId: string) => Promise<{
        allowed: boolean;
        remaining: number;
    }>;
    incrementDailyFriendRequest: (userId: string) => Promise<void>;
    addFriend: (senderId: string, receiverId: string) => Promise<{
        message: string;
        matched: boolean;
        isPremium: boolean | undefined;
    } | {
        message: string;
        matched: boolean;
        isPremium?: never;
    }>;
    getFriends: (userId: string) => Promise<never[] | {
        friends: any[];
        serverTime: number;
    }>;
    deleteFriend: (userId: string, targetId: string) => Promise<void>;
    acceptMatch: (userId: string, targetId: string) => Promise<{
        success: boolean;
        expiresAt: string;
        serverTime: number;
    }>;
    passMatch: (userId: string, targetId: string) => Promise<{
        success: boolean;
        dailyMatchPasses: number;
    }>;
    extendMatch: (userId: string, targetId: string) => Promise<{
        success: boolean;
        expiresAt: Date;
        serverTime: number;
    }>;
    makeMatchPermanent: (userId: string, targetId: string) => Promise<{
        success: boolean;
    }>;
    sendFriendRequest: (userId: string, receiverId: string) => Promise<{
        success: boolean;
        autoAccepted: boolean;
    } | {
        success: boolean;
        autoAccepted?: never;
    }>;
    acceptFriendRequest: (userId: string, requestId: string) => Promise<void>;
    rejectFriendRequest: (userId: string, requestId: string) => Promise<{
        success: boolean;
    }>;
    getPendingRequests: (userId: string) => Promise<({
        sender: {
            id: string;
            name: string | null;
            avatar: string | null;
            sunSign: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        senderId: string;
        receiverId: string;
    })[]>;
    getFriendRequestStatus: (userId: string, targetId: string) => Promise<{
        status: string;
        requestId?: never;
    } | {
        status: string;
        requestId: string;
    }>;
};
//# sourceMappingURL=friendship.service.d.ts.map