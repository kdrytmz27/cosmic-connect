import { prisma } from '../index';
import { calculateQuickSynastryScore } from './synastry.service';
import { horoscopeService } from './horoscope.service';
import { xpService } from './xp.service';
import { BadgeService } from './badge.service';
import { CONSTANTS } from '../config/constants';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class UserService {
    static async getProfile(currentUserId: string | undefined, targetUserId: string) {
        if (!targetUserId) throw new BadRequestError('User ID required');

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                // Explicitly select safe fields — never return passwordHash or twoFactorSecret
                id: true, email: true, name: true, avatar: true, bio: true,
                sunSign: true, moonSign: true, risingSign: true,
                birthDate: true, birthTime: true, latitude: true, longitude: true,
                role: true, isPremium: true, level: true, xp: true, karma: true,
                stardustBalance: true, matchScore: true, cosmicStatus: true,
                hobby: true, music: true, weekend: true,
                lookingForHobby: true, lookingForMusic: true, lookingForWeekend: true,
                dailyMatchPasses: true, createdAt: true,
                photos: true,
                fortuneTellerProfile: {
                    include: {
                        appointments: {
                            where: { status: 'COMPLETED' },
                            select: { stardustPrice: true }
                        }
                    }
                }
            }
        });

        if (!targetUser) throw new NotFoundError('User not found');

        if (targetUser.fortuneTellerProfile) {
            const completedApps = targetUser.fortuneTellerProfile.appointments || [];
            (targetUser.fortuneTellerProfile as any).totalReadings = completedApps.length;
            (targetUser.fortuneTellerProfile as any).earnedStardust = completedApps.reduce((sum, app) => sum + (app.stardustPrice || 0), 0);
            delete (targetUser.fortuneTellerProfile as any).appointments;
        }

        if (currentUserId !== targetUserId) {
            // VULN 70 FIX: Remove sensitive PII from other users' profiles
            (targetUser as any).stardustBalance = undefined;
            (targetUser as any).matchScore = undefined;
            (targetUser as any).email = undefined;       // email is PII - never expose to other users
            (targetUser as any).birthDate = undefined;    // exact birthDate is sensitive PII
            (targetUser as any).birthTime = undefined;    // birthTime is PII
            (targetUser as any).latitude = undefined;     // exact GPS coordinates are PII
            (targetUser as any).longitude = undefined;    // exact GPS coordinates are PII
        }

        const dateStr: string = new Date().toISOString().split('T')[0] ?? '2026-01-01';
        const sign = targetUser.sunSign ?? 'Aries';
        const uid = targetUser.id;
        const [generalText, loveText, careerText, healthText] = await Promise.all([
            horoscopeService.getDailyHoroscope(uid, dateStr, sign, 'GENERAL' as any),
            horoscopeService.getDailyHoroscope(uid, dateStr, sign, 'LOVE'),
            horoscopeService.getDailyHoroscope(uid, dateStr, sign, 'CAREER'),
            horoscopeService.getDailyHoroscope(uid, dateStr, sign, 'HEALTH'),
        ]);

        const dailyHoroscope = { GENERAL: generalText, LOVE: loveText, CAREER: careerText, HEALTH: healthText };

        if (currentUserId && currentUserId !== targetUserId) {
            const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
            if (currentUser) {
                const compatibility = calculateQuickSynastryScore(
                    { birthDate: currentUser.birthDate, birthTime: currentUser.birthTime },
                    { birthDate: targetUser.birthDate, birthTime: targetUser.birthTime }
                );
                const matchHighlights: string[] = [];
                if (currentUser.lookingForHobby && currentUser.lookingForHobby === targetUser.hobby) matchHighlights.push(`Aradığın Hobi: ${targetUser.hobby}`);
                if (currentUser.lookingForMusic && currentUser.lookingForMusic === targetUser.music) matchHighlights.push(`Aradığın Müzik: ${targetUser.music}`);
                if (currentUser.lookingForWeekend && currentUser.lookingForWeekend === targetUser.weekend) matchHighlights.push(`Aradığın Hafta Sonu: ${targetUser.weekend}`);
                return { profile: targetUser, compatibility, matchHighlights, dailyHoroscope };
            }
        }

        return { profile: targetUser, dailyHoroscope };
    }

    static async getDailyMatch(userId: string, filters: any) {
        let currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) throw new NotFoundError('User not found');

        const trOffset = 3 * 3600 * 1000;
        const todayStr = new Date(Date.now() + trOffset).toISOString().split('T')[0];
        const lastDate = currentUser.lastSwipeDate ? new Date(currentUser.lastSwipeDate.getTime() + trOffset).toISOString().split('T')[0] : null;
        if (lastDate !== todayStr) {
            currentUser = await prisma.user.update({
                where: { id: userId },
                data: { dailySwipes: 0, lastSwipeDate: new Date() }
            });
        }

        const { page = 1, limit = 10, minAge, maxAge, gender, minScore = 0 } = filters;
        const pageNum = parseInt(page as string);
        // VULN 71 FIX: Cap limit to prevent full-table scan via ?limit=99999
        const limitNum = Math.min(parseInt(limit as string) || 10, 50);
        const minScoreNum = parseInt(minScore as string);

        let dateFilters: any = {};
        const today = new Date();
        if (minAge) {
            const maxDate = new Date();
            maxDate.setFullYear(today.getFullYear() - parseInt(minAge as string));
            dateFilters.lte = maxDate;
        }
        if (maxAge) {
            const minDate = new Date();
            minDate.setFullYear(today.getFullYear() - parseInt(maxAge as string) - 1);
            dateFilters.gte = minDate;
        }

        const whereClause: any = { id: { not: userId }, role: { not: 'ADMIN' } };
        if (gender && gender !== 'ALL') whereClause.gender = gender as string;
        if (Object.keys(dateFilters).length > 0) whereClause.birthDate = dateFilters;

        const candidates = await prisma.user.findMany({
            where: whereClause,
            orderBy: { id: 'asc' },
            // Exclude sensitive fields from discovery results
            select: {
                id: true, email: true, name: true, avatar: true, bio: true,
                sunSign: true, moonSign: true, risingSign: true,
                birthDate: true, birthTime: true, gender: true, karma: true,
                isPremium: true, level: true, matchScore: true,
                hobby: true, music: true, weekend: true,
                lookingForHobby: true, lookingForMusic: true, lookingForWeekend: true,
                cosmicStatus: true, latitude: true, longitude: true
            }
        });

        if (candidates.length === 0) return { message: 'No matches found right now', matches: [] };

        const dateStr = new Date(Date.now() + trOffset).toISOString().split('T')[0] || '2026-01-01';

        const evaluated = await Promise.all(candidates.map(async (candidate) => {
            const comp = calculateQuickSynastryScore(
                { birthDate: currentUser!.birthDate, birthTime: currentUser!.birthTime },
                { birthDate: candidate.birthDate, birthTime: candidate.birthTime }
            );
            let finalScore = comp.score;
            let analysis = comp.message;
            let matchCount = 0;

            if (currentUser!.lookingForHobby && currentUser!.lookingForHobby === candidate.hobby) matchCount++;
            if (currentUser!.lookingForMusic && currentUser!.lookingForMusic === candidate.music) matchCount++;
            if (currentUser!.lookingForWeekend && currentUser!.lookingForWeekend === candidate.weekend) matchCount++;

            if (matchCount > 0) {
                finalScore = Math.min(100, finalScore + (matchCount * 12));
                analysis += ` Aradığın ${matchCount} özelliği taşıyor!`;
            }

            const [gen, love, car] = await Promise.all([
                horoscopeService.getDailyHoroscope(candidate.id, dateStr, candidate.sunSign, 'GENERAL' as any),
                horoscopeService.getDailyHoroscope(candidate.id, dateStr, candidate.sunSign, 'LOVE'),
                horoscopeService.getDailyHoroscope(candidate.id, dateStr, candidate.sunSign, 'CAREER')
            ]);

            const dailyHoroscope = {
                GENERAL: gen || `Bugün yıldızlar ${candidate.sunSign} burcu için oldukça parlak!`,
                LOVE: love || '',
                CAREER: car || ''
            };

            return { match: { ...candidate, isBlurred: false }, score: finalScore, analysis, dailyHoroscope };
        }));

        const filtered = evaluated.filter(c => c.score >= minScoreNum);
        filtered.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.match.id.localeCompare(b.match.id);
        });

        const startIndex = (pageNum - 1) * limitNum;
        const paginated = filtered.slice(startIndex, startIndex + limitNum);

        return {
            matches: paginated,
            total: filtered.length,
            page: pageNum,
            totalPages: Math.ceil(filtered.length / limitNum),
            dailySwipes: currentUser.dailySwipes,
            isPremium: currentUser.isPremium,
            stardustBalance: currentUser.stardustBalance
        };
    }

    static async updateProfile(userId: string, updateData: any) {
        const dataToUpdate: any = {};
        // REMOVED 'avatar' to prevent Arbitrary File Deletion / Path Traversal
        // REMOVED 'moonSign' and 'risingSign' to prevent Astrology Score Cheating!
        const allowedKeys = ['name', 'bio', 'hobby', 'music', 'weekend', 'lookingForHobby', 'lookingForMusic', 'lookingForWeekend'];
        for (const key of allowedKeys) {
            if (updateData[key] !== undefined) dataToUpdate[key] = updateData[key];
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        return { profile: updated };
    }

    static async updateCosmicStatus(userId: string, cosmicStatus: string | null) {
        // Validate status length
        if (cosmicStatus && cosmicStatus.length > 100) {
            throw new BadRequestError('Status too long (max 100 characters)');
        }
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { cosmicStatus: cosmicStatus?.trim() || null }
        });
        return { cosmicStatus: updated.cosmicStatus };
    }

    static async getDailyRewardStatus(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('User not found');

        let canClaim = false;
        const now = new Date();
        let streak = user.loginStreak || 0;

        if (!user.lastDailyReward) {
            canClaim = true;
        } else {
            const lastReward = new Date(user.lastDailyReward);
            const isSameDay =
                now.getFullYear() === lastReward.getFullYear() &&
                now.getMonth() === lastReward.getMonth() &&
                now.getDate() === lastReward.getDate();

            if (!isSameDay) canClaim = true;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday =
                yesterday.getFullYear() === lastReward.getFullYear() &&
                yesterday.getMonth() === lastReward.getMonth() &&
                yesterday.getDate() === lastReward.getDate();

            if (!isSameDay && !isYesterday) streak = 0;
        }

        return { canClaim, streak };
    }

    static async claimDailyReward(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('User not found');

        const trOffset = 3 * 3600 * 1000;
        const now = new Date();
        const trNow = new Date(now.getTime() + trOffset);
        let streak = user.loginStreak || 0;

        if (user.lastDailyReward) {
            const lr = new Date(user.lastDailyReward.getTime() + trOffset);
            const isSameDay =
                trNow.getUTCFullYear() === lr.getUTCFullYear() &&
                trNow.getUTCMonth() === lr.getUTCMonth() &&
                trNow.getUTCDate() === lr.getUTCDate();

            if (isSameDay) throw new BadRequestError('Already claimed today');

            const yesterday = new Date(trNow.getTime() - 24 * 3600 * 1000);
            const isYesterday =
                yesterday.getUTCFullYear() === lr.getUTCFullYear() &&
                yesterday.getUTCMonth() === lr.getUTCMonth() &&
                yesterday.getUTCDate() === lr.getUTCDate();

            if (!isYesterday) streak = 0;
        }

        streak += 1;
        const rewardAmount = Math.min(streak * CONSTANTS.REWARDS.DAILY_LOGIN_BASE, CONSTANTS.REWARDS.DAILY_LOGIN_MAX);

        // Optimistic Locking to prevent Race Conditions (Many claims at exact same ms)
        const updatedCount = await prisma.user.updateMany({
            where: {
                id: userId,
                lastDailyReward: user.lastDailyReward // Must exactly match the DB state we read
            },
            data: {
                lastDailyReward: now,
                loginStreak: streak,
                stardustBalance: { increment: rewardAmount }
            }
        });

        if (updatedCount.count === 0) {
            throw new BadRequestError('Reward already claimed (Race Condition Protected)');
        }

        const freshUser = await prisma.user.findUnique({ where: { id: userId } });

        await xpService.addXp(userId, CONSTANTS.REWARDS.DAILY_LOGIN_XP);
        await BadgeService.checkAndAwardBadges(userId);

        return {
            success: true,
            reward: rewardAmount,
            newStreak: streak,
            stardustBalance: freshUser?.stardustBalance
        };
    }

    static async getLeaderboard() {
        const topUsers = await prisma.user.findMany({
            // VULN 44 FIX: Ghost leaderboards (Exclude ADMIN and BANNED)
            where: {
                role: { in: ['STANDARD', 'FORTUNE_TELLER'] }
            },
            orderBy: { xp: 'desc' },
            take: 50,
            select: { id: true, name: true, avatar: true, level: true, xp: true }
        });
        return { leaderboard: topUsers };
    }
}
