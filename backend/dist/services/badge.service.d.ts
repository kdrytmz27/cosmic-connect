export declare const BADGE_DEFINITIONS: {
    STAR_EXPLORER: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
    GENEROUS_SOUL: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
    DAILY_PILGRIM: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
    SOCIAL_BUTTERFLY: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
};
export declare class BadgeService {
    static checkAndAwardBadges(userId: string): Promise<string[]>;
}
//# sourceMappingURL=badge.service.d.ts.map