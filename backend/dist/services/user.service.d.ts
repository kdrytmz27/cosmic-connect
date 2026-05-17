export declare class UserService {
    static getProfile(currentUserId: string | undefined, targetUserId: string): Promise<{
        profile: {
            role: string;
            email: string;
            birthDate: Date;
            birthTime: string;
            latitude: number;
            longitude: number;
            id: string;
            name: string | null;
            bio: string | null;
            avatar: string | null;
            hobby: string | null;
            music: string | null;
            weekend: string | null;
            lookingForHobby: string | null;
            lookingForMusic: string | null;
            lookingForWeekend: string | null;
            sunSign: string;
            moonSign: string;
            risingSign: string;
            stardustBalance: number;
            matchScore: number;
            cosmicStatus: string | null;
            isPremium: boolean;
            dailyMatchPasses: number;
            xp: number;
            level: number;
            karma: number;
            createdAt: Date;
            photos: {
                userId: string;
                id: string;
                createdAt: Date;
                url: string;
            }[];
            fortuneTellerProfile: ({
                appointments: {
                    stardustPrice: number;
                }[];
            } & {
                userId: string;
                id: string;
                bio: string;
                skills: string;
                rating: number;
                reviewCount: number;
                fortuneTypes: string;
            }) | null;
        };
        compatibility: {
            score: number;
            message: string;
        };
        matchHighlights: string[];
        dailyHoroscope: {
            GENERAL: string;
            LOVE: string;
            CAREER: string;
            HEALTH: string;
        };
    } | {
        profile: {
            role: string;
            email: string;
            birthDate: Date;
            birthTime: string;
            latitude: number;
            longitude: number;
            id: string;
            name: string | null;
            bio: string | null;
            avatar: string | null;
            hobby: string | null;
            music: string | null;
            weekend: string | null;
            lookingForHobby: string | null;
            lookingForMusic: string | null;
            lookingForWeekend: string | null;
            sunSign: string;
            moonSign: string;
            risingSign: string;
            stardustBalance: number;
            matchScore: number;
            cosmicStatus: string | null;
            isPremium: boolean;
            dailyMatchPasses: number;
            xp: number;
            level: number;
            karma: number;
            createdAt: Date;
            photos: {
                userId: string;
                id: string;
                createdAt: Date;
                url: string;
            }[];
            fortuneTellerProfile: ({
                appointments: {
                    stardustPrice: number;
                }[];
            } & {
                userId: string;
                id: string;
                bio: string;
                skills: string;
                rating: number;
                reviewCount: number;
                fortuneTypes: string;
            }) | null;
        };
        dailyHoroscope: {
            GENERAL: string;
            LOVE: string;
            CAREER: string;
            HEALTH: string;
        };
        compatibility?: never;
        matchHighlights?: never;
    }>;
    static getDailyMatch(userId: string, filters: any): Promise<{
        message: string;
        matches: never[];
        total?: never;
        page?: never;
        totalPages?: never;
        dailySwipes?: never;
        isPremium?: never;
        stardustBalance?: never;
    } | {
        matches: {
            match: {
                isBlurred: boolean;
                email: string;
                birthDate: Date;
                birthTime: string;
                latitude: number;
                longitude: number;
                id: string;
                name: string | null;
                bio: string | null;
                avatar: string | null;
                hobby: string | null;
                music: string | null;
                weekend: string | null;
                lookingForHobby: string | null;
                lookingForMusic: string | null;
                lookingForWeekend: string | null;
                gender: string | null;
                sunSign: string;
                moonSign: string;
                risingSign: string;
                matchScore: number;
                cosmicStatus: string | null;
                isPremium: boolean;
                level: number;
                karma: number;
            };
            score: number;
            analysis: string;
            dailyHoroscope: {
                GENERAL: string;
                LOVE: string;
                CAREER: string;
            };
        }[];
        total: number;
        page: number;
        totalPages: number;
        dailySwipes: number;
        isPremium: boolean;
        stardustBalance: number;
        message?: never;
    }>;
    static updateProfile(userId: string, updateData: any): Promise<{
        profile: {
            role: string;
            email: string;
            birthDate: Date;
            birthTime: string;
            latitude: number;
            longitude: number;
            id: string;
            passwordHash: string;
            name: string | null;
            bio: string | null;
            avatar: string | null;
            hobby: string | null;
            music: string | null;
            weekend: string | null;
            lookingForHobby: string | null;
            lookingForMusic: string | null;
            lookingForWeekend: string | null;
            gender: string | null;
            interestedIn: string | null;
            sunSign: string;
            moonSign: string;
            risingSign: string;
            stardustBalance: number;
            matchScore: number;
            cosmicStatus: string | null;
            isPremium: boolean;
            dailySwipes: number;
            lastSwipeDate: Date | null;
            isOnline: boolean;
            lastSeen: Date | null;
            superLikesLeft: number;
            extraTimeLeft: number;
            twoFactorSecret: string | null;
            isTwoFactorEnabled: boolean;
            dailyMatchPasses: number;
            lastDailyReward: Date | null;
            loginStreak: number;
            xp: number;
            level: number;
            lastDailyTarot: Date | null;
            badges: string;
            pushToken: string | null;
            dailyQuestMatches: number;
            dailyQuestMessages: number;
            dailyQuestClaimed: boolean;
            lastQuestReset: Date | null;
            karma: number;
            createdAt: Date;
            dailyFriendRequests: number;
            lastFriendRequestDate: Date | null;
        };
    }>;
    static updateCosmicStatus(userId: string, cosmicStatus: string | null): Promise<{
        cosmicStatus: string | null;
    }>;
    static getDailyRewardStatus(userId: string): Promise<{
        canClaim: boolean;
        streak: number;
    }>;
    static claimDailyReward(userId: string): Promise<{
        success: boolean;
        reward: number;
        newStreak: number;
        stardustBalance: number | undefined;
    }>;
    static getLeaderboard(): Promise<{
        leaderboard: {
            id: string;
            name: string | null;
            avatar: string | null;
            xp: number;
            level: number;
        }[];
    }>;
}
//# sourceMappingURL=user.service.d.ts.map