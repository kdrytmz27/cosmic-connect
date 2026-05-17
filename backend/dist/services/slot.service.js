"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotManager = void 0;
const index_1 = require("../index");
class SlotMachineManager {
    io = null;
    state = 'BETTING';
    timeLeft = 26;
    bets = [];
    lastResult = null;
    intervalId = null;
    isInitialized = false;
    initialize(io) {
        this.io = io;
        this.isInitialized = true;
        this.startLoop();
    }
    startLoop() {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.tick(), 1000);
        }
    }
    stopLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isInitialized = false;
    }
    async tick() {
        if (this.state === 'BETTING' && this.timeLeft <= 0) {
            this.state = 'ROLLING';
            this.timeLeft = 5; // 5 seconds of animation globally
            const n1 = Math.floor(Math.random() * 9) + 1;
            const n2 = Math.floor(Math.random() * 9) + 1;
            const n3 = Math.floor(Math.random() * 9) + 1;
            const sum = n1 + n2 + n3;
            this.lastResult = { n1, n2, n3, sum };
            this.io?.emit('slot:state', { state: this.state, timeLeft: this.timeLeft });
        }
        else if (this.state === 'ROLLING' && this.timeLeft <= 0) {
            this.state = 'RESULT';
            this.timeLeft = 4; // Show result for 4 seconds
            this.io?.emit('slot:state', { state: 'RESULT', timeLeft: this.timeLeft, result: this.lastResult });
            if (this.lastResult)
                await this.resolveBets(this.lastResult.sum);
        }
        else if (this.state === 'RESULT' && this.timeLeft <= 0) {
            this.state = 'BETTING';
            this.timeLeft = 26; // 26 seconds betting window
            this.bets = [];
            this.lastResult = null;
            this.io?.emit('slot:state', { state: this.state, timeLeft: this.timeLeft });
        }
        else {
            this.timeLeft--;
            this.io?.emit('slot:tick', { state: this.state, timeLeft: this.timeLeft });
        }
    }
    async resolveBets(sum) {
        if (this.bets.length === 0)
            return;
        for (const bet of this.bets) {
            let win = false;
            let push = false;
            // VULN 60 FIX: sum === 14 is a PUSH (tie) - no one wins or loses
            if (bet.betType === 'BIG' && sum > 14)
                win = true;
            if (bet.betType === 'SMALL' && sum < 14)
                win = true;
            if (sum === 14)
                push = true;
            try {
                if (win) {
                    const payout = bet.betAmount * 2;
                    const dbUser = await index_1.prisma.user.update({
                        where: { id: bet.userId },
                        data: { stardustBalance: { increment: payout } }
                    });
                    this.io?.to(bet.userId).emit('slot:result', { win: true, payout, newBalance: dbUser.stardustBalance });
                }
                else if (push) {
                    // VULN 60 FIX: Refund bet on push (tie at sum=14)
                    const dbUser = await index_1.prisma.user.update({
                        where: { id: bet.userId },
                        data: { stardustBalance: { increment: bet.betAmount } }
                    });
                    this.io?.to(bet.userId).emit('slot:result', { win: false, push: true, refund: bet.betAmount, newBalance: dbUser.stardustBalance });
                }
                else {
                    const dbUser = await index_1.prisma.user.findUnique({ where: { id: bet.userId } });
                    this.io?.to(bet.userId).emit('slot:result', { win: false, lost: bet.betAmount, newBalance: dbUser?.stardustBalance || 0 });
                }
            }
            catch (err) {
                console.error("Error resolving bet for user", bet.userId, err);
            }
        }
    }
    async placeBet(userId, betAmount, betType) {
        if (this.state !== 'BETTING')
            throw new Error('Şu an bahis alımları kapalı, zarlar dönüyor!');
        if (this.timeLeft <= 2)
            throw new Error('Bahis kapanmak üzere, lütfen sonraki turu bekleyin.');
        // Validate bet amount to prevent negative/zero/absurd bets
        if (!Number.isInteger(betAmount) || betAmount < 10 || betAmount > 1000) {
            throw new Error('Bahis miktarı 10-1000 arasında olmalıdır.');
        }
        // Check if user already bet
        if (this.bets.find(b => b.userId === userId)) {
            throw new Error('Bu tur için zaten bahis yaptınız.');
        }
        // Use atomic decrement to prevent Race Condition
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.stardustBalance < betAmount) {
            throw new Error('Yetersiz Yıldız Tozu');
        }
        const updatedCount = await index_1.prisma.user.updateMany({
            where: { id: userId, stardustBalance: { gte: betAmount } },
            data: { stardustBalance: { decrement: betAmount } }
        });
        if (updatedCount.count === 0) {
            throw new Error('Yetersiz bakiye (Race Condition Engellendi)');
        }
        // VULN 59 FIX: Double-check duplicate bet AFTER acquiring balance lock to prevent TOCTOU race
        if (this.bets.find(b => b.userId === userId)) {
            // Refund the deducted balance since we won't place the bet
            await index_1.prisma.user.updateMany({
                where: { id: userId },
                data: { stardustBalance: { increment: betAmount } }
            });
            throw new Error('Bu tur için zaten bahis yaptınız (Race Condition Guard).');
        }
        const updated = await index_1.prisma.user.findUnique({ where: { id: userId } });
        this.bets.push({ userId, betAmount, betType });
        return { success: true, newBalance: updated?.stardustBalance || 0 };
    }
    getCurrentState(userId) {
        const userBet = userId ? this.bets.find(b => b.userId === userId) : null;
        return {
            state: this.state,
            timeLeft: this.timeLeft,
            lastResult: this.lastResult,
            myBet: userBet ? { amount: userBet.betAmount, type: userBet.betType } : null
        };
    }
}
exports.slotManager = new SlotMachineManager();
//# sourceMappingURL=slot.service.js.map