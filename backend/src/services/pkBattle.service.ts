import { Server } from 'socket.io';
import { prisma } from '../index';
import { logger } from '../utils/logger';

interface ActiveBattle {
    battleId: string;
    roomAId: string;
    roomBId: string;
    scoreA: number;
    scoreB: number;
    endsAt: number;
    timeout: NodeJS.Timeout;
}

interface PendingInvite {
    battleId: string;
    roomAId: string;
    roomBId: string;
    timeout: NodeJS.Timeout;
}

const INVITE_EXPIRY_MS = 30_000;

class PkBattleService {
    private io: Server | null = null;
    // Keyed by roomId (both sides of a battle point at the same object) - lets sendPartyGift
    // cheaply check "is this room currently in a battle" without a DB round trip.
    private activeByRoom = new Map<string, ActiveBattle>();
    private pendingInvites = new Map<string, PendingInvite>();

    initialize(io: Server) {
        this.io = io;
    }

    getActiveBattleForRoom(roomId: string): ActiveBattle | undefined {
        return this.activeByRoom.get(roomId);
    }

    async createInvite(roomAId: string, roomBId: string): Promise<PendingInvite> {
        const battle = await prisma.pkBattle.create({
            data: { roomAId, roomBId, status: 'PENDING' }
        });
        const timeout = setTimeout(() => this.expireInvite(battle.id), INVITE_EXPIRY_MS);
        const invite: PendingInvite = { battleId: battle.id, roomAId, roomBId, timeout };
        this.pendingInvites.set(battle.id, invite);
        return invite;
    }

    private async expireInvite(battleId: string) {
        const invite = this.pendingInvites.get(battleId);
        if (!invite) return;
        this.pendingInvites.delete(battleId);
        await prisma.pkBattle.update({ where: { id: battleId }, data: { status: 'CANCELLED' } }).catch(() => {});
        this.io?.to(`party_${invite.roomAId}`).emit('pkBattleInviteExpired', { battleId });
    }

    getPendingInvite(battleId: string): PendingInvite | undefined {
        return this.pendingInvites.get(battleId);
    }

    cancelInvite(battleId: string) {
        const invite = this.pendingInvites.get(battleId);
        if (invite) clearTimeout(invite.timeout);
        this.pendingInvites.delete(battleId);
    }

    async startBattle(battleId: string, durationSec = 300): Promise<ActiveBattle | null> {
        const invite = this.pendingInvites.get(battleId);
        if (!invite) return null;
        this.pendingInvites.delete(battleId);
        clearTimeout(invite.timeout);

        const startedAt = new Date();
        const endsAt = new Date(startedAt.getTime() + durationSec * 1000);
        await prisma.pkBattle.update({
            where: { id: battleId },
            data: { status: 'ACTIVE', startedAt, durationSec, endsAt }
        });

        const battle: ActiveBattle = {
            battleId,
            roomAId: invite.roomAId,
            roomBId: invite.roomBId,
            scoreA: 0,
            scoreB: 0,
            endsAt: endsAt.getTime(),
            timeout: setTimeout(() => this.endBattle(battleId), durationSec * 1000)
        };
        this.activeByRoom.set(invite.roomAId, battle);
        this.activeByRoom.set(invite.roomBId, battle);
        return battle;
    }

    // Called from sendPartyGift right after a gift's stardust cost is finalized.
    addScore(roomId: string, amount: number): { battle: ActiveBattle, remainingSec: number } | null {
        const battle = this.activeByRoom.get(roomId);
        if (!battle) return null;
        if (roomId === battle.roomAId) battle.scoreA += amount;
        else if (roomId === battle.roomBId) battle.scoreB += amount;
        const remainingSec = Math.max(0, Math.round((battle.endsAt - Date.now()) / 1000));
        return { battle, remainingSec };
    }

    private async endBattle(battleId: string) {
        // Find the battle by scanning (cheap, at most a couple of concurrent battles expected)
        let battle: ActiveBattle | undefined;
        for (const b of this.activeByRoom.values()) {
            if (b.battleId === battleId) { battle = b; break; }
        }
        if (!battle) return;

        this.activeByRoom.delete(battle.roomAId);
        this.activeByRoom.delete(battle.roomBId);

        try {
            const pkBattleRow = await prisma.pkBattle.findUnique({ where: { id: battleId } });
            if (!pkBattleRow || !pkBattleRow.startedAt || !pkBattleRow.endsAt) return;

            // Re-derive final scores from the Gift ledger rather than trusting only the
            // in-memory counters, so a mid-battle server restart can't lose scoring.
            const rows = await prisma.gift.groupBy({
                by: ['roomId'],
                where: {
                    roomId: { in: [battle.roomAId, battle.roomBId] },
                    createdAt: { gte: pkBattleRow.startedAt, lte: pkBattleRow.endsAt }
                },
                _sum: { stardustCost: true }
            });
            const scoreA = rows.find(r => r.roomId === battle!.roomAId)?._sum.stardustCost || 0;
            const scoreB = rows.find(r => r.roomId === battle!.roomBId)?._sum.stardustCost || 0;
            const winnerRoomId = scoreA === scoreB ? null : (scoreA > scoreB ? battle.roomAId : battle.roomBId);

            await prisma.pkBattle.update({
                where: { id: battleId },
                data: { status: 'FINISHED', scoreA, scoreB, winnerRoomId }
            });

            this.io?.to(`party_${battle.roomAId}`).to(`party_${battle.roomBId}`).emit('pkBattleEnd', {
                battleId, scoreA, scoreB, winnerRoomId, roomAId: battle.roomAId, roomBId: battle.roomBId
            });
        } catch (e) {
            logger.error('Error ending PK battle:', e);
        }
    }
}

export const pkBattleService = new PkBattleService();
