"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTANTS = void 0;
exports.CONSTANTS = {
    DAILY_LIMITS: {
        MATCH_PASSES: {
            DEFAULT: 50,
            PREMIUM: -1 // Unlimited
        },
        FRIEND_REQUESTS: {
            DEFAULT: 5,
            PREMIUM: -1 // Unlimited
        }
    },
    COSTS: {
        EXTEND_MATCH: 100, // Stardust
        MAKE_MATCH_PERMANENT: 500 // Stardust
    },
    REWARDS: {
        DAILY_LOGIN_BASE: 10,
        DAILY_LOGIN_MAX: 100,
        DAILY_LOGIN_XP: 50,
        ACCEPT_FRIEND_REQUEST_XP: 25
    },
    DURATIONS: {
        MATCH_EXPIRY_MS: 160 * 1000, // 160 seconds
        MATCH_EXTENSION_HOURS: 24
    }
};
//# sourceMappingURL=constants.js.map