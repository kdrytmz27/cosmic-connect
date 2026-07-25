import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Swords, Trophy } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import { PkBattleInviteModal } from './PkBattleInviteModal';

interface PendingInvite {
    battleId: string;
    fromRoomId: string;
    fromRoomTitle?: string;
}

interface ActiveBattle {
    battleId: string;
    roomAId: string;
    roomBId: string;
    scoreA: number;
    scoreB: number;
    endsAt: number;
}

interface BattleResult {
    scoreA: number;
    scoreB: number;
    winnerRoomId: string | null;
    roomAId: string;
    roomBId: string;
}

interface PkBattleBarProps {
    roomId: string;
    isOwner: boolean;
}

export const PkBattleBar: React.FC<PkBattleBarProps> = ({ roomId, isOwner }) => {
    const { socket } = useSocket();
    const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
    const [sentInvite, setSentInvite] = useState<{ battleId: string } | null>(null);
    const [activeBattle, setActiveBattle] = useState<ActiveBattle | null>(null);
    const [result, setResult] = useState<BattleResult | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [remainingSec, setRemainingSec] = useState(0);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handleInviteReceived = (data: PendingInvite) => setPendingInvite(data);
        const handleInviteSent = (data: { battleId: string }) => setSentInvite(data);
        const handleInviteExpired = () => { setSentInvite(null); setPendingInvite(null); };
        const handleDeclined = () => setSentInvite(null);

        const handleStart = (data: ActiveBattle) => {
            setPendingInvite(null);
            setSentInvite(null);
            setActiveBattle(data);
        };

        const handleScoreUpdate = (data: { battleId: string, scoreA: number, scoreB: number, remainingSec: number }) => {
            setActiveBattle(prev => prev && prev.battleId === data.battleId ? { ...prev, scoreA: data.scoreA, scoreB: data.scoreB } : prev);
            setRemainingSec(data.remainingSec);
        };

        const handleEnd = (data: BattleResult) => {
            setActiveBattle(null);
            setResult(data);
            setTimeout(() => setResult(null), 6000);
        };

        socket.on('pkBattleInviteReceived', handleInviteReceived);
        socket.on('pkBattleInviteSent', handleInviteSent);
        socket.on('pkBattleInviteExpired', handleInviteExpired);
        socket.on('pkBattleDeclined', handleDeclined);
        socket.on('pkBattleStart', handleStart);
        socket.on('pkBattleScoreUpdate', handleScoreUpdate);
        socket.on('pkBattleEnd', handleEnd);

        return () => {
            socket.off('pkBattleInviteReceived', handleInviteReceived);
            socket.off('pkBattleInviteSent', handleInviteSent);
            socket.off('pkBattleInviteExpired', handleInviteExpired);
            socket.off('pkBattleDeclined', handleDeclined);
            socket.off('pkBattleStart', handleStart);
            socket.off('pkBattleScoreUpdate', handleScoreUpdate);
            socket.off('pkBattleEnd', handleEnd);
        };
    }, [socket]);

    // Local countdown ticker between server score updates
    useEffect(() => {
        if (!activeBattle) {
            if (tickRef.current) clearInterval(tickRef.current);
            return;
        }
        setRemainingSec(Math.max(0, Math.round((activeBattle.endsAt - Date.now()) / 1000)));
        tickRef.current = setInterval(() => {
            setRemainingSec(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, [activeBattle?.battleId, activeBattle?.endsAt]);

    const isMyRoomA = activeBattle?.roomAId === roomId;
    const myScore = activeBattle ? (isMyRoomA ? activeBattle.scoreA : activeBattle.scoreB) : 0;
    const otherScore = activeBattle ? (isMyRoomA ? activeBattle.scoreB : activeBattle.scoreA) : 0;
    const total = myScore + otherScore;
    const myPct = total > 0 ? (myScore / total) * 100 : 50;

    return (
        <>
            {/* Owner-only entry point to start a battle */}
            {isOwner && !activeBattle && !pendingInvite && (
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="absolute top-4 right-4 z-30 bg-error/20 border border-error/40 text-error rounded-full p-2 hover:bg-error/30 transition-colors"
                    title="PK Battle Başlat"
                >
                    <Swords size={16} />
                </button>
            )}

            {showInviteModal && (
                <PkBattleInviteModal roomId={roomId} onClose={() => setShowInviteModal(false)} />
            )}

            {/* Incoming invite banner */}
            <AnimatePresence>
                {pendingInvite && isOwner && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-16 left-4 right-4 z-30 bg-error/20 backdrop-blur-md border border-error/40 rounded-2xl p-3 flex items-center gap-2"
                    >
                        <Swords size={18} className="text-error shrink-0" />
                        <span className="text-xs text-white flex-1">
                            <b>{pendingInvite.fromRoomTitle || 'Bir oda'}</b> sizi PK Battle'a davet etti!
                        </span>
                        <button
                            onClick={() => { socket?.emit('pkBattleAccept', { battleId: pendingInvite.battleId }); }}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-tertiary/80 text-on-primary"
                        >
                            Kabul Et
                        </button>
                        <button
                            onClick={() => { socket?.emit('pkBattleDecline', { battleId: pendingInvite.battleId }); setPendingInvite(null); }}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white/70"
                        >
                            Reddet
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {sentInvite && !activeBattle && (
                <div className="absolute top-16 left-4 right-4 z-30 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center text-xs text-white/70">
                    Davet gönderildi, yanıt bekleniyor...
                </div>
            )}

            {/* Live battle bar */}
            {activeBattle && (
                <div className="absolute top-16 left-4 right-4 z-30 bg-[#131b2e]/90 backdrop-blur-md border border-error/30 rounded-2xl p-3">
                    <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="text-tertiary font-bold">{myScore}</span>
                        <span className="text-white/50 flex items-center gap-1"><Swords size={12} /> {Math.floor(remainingSec / 60)}:{(remainingSec % 60).toString().padStart(2, '0')}</span>
                        <span className="text-error font-bold">{otherScore}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                        <div className="bg-tertiary h-full transition-all duration-500" style={{ width: `${myPct}%` }} />
                        <div className="bg-error h-full transition-all duration-500" style={{ width: `${100 - myPct}%` }} />
                    </div>
                </div>
            )}

            {/* Result overlay */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-16 left-4 right-4 z-30 bg-[#131b2e] border border-secondary/40 rounded-2xl p-4 text-center"
                    >
                        <Trophy size={24} className="text-secondary mx-auto mb-1" />
                        <div className="text-white font-bold text-sm">
                            {result.winnerRoomId === null
                                ? 'Berabere!'
                                : result.winnerRoomId === roomId
                                    ? 'Odanız Kazandı! 🎉'
                                    : 'Rakip Kazandı'}
                        </div>
                        <div className="text-xs text-white/50 mt-1">{result.scoreA} — {result.scoreB}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
