import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

interface LuckyResult {
    giftId: string;
    giftName: string;
    multiplier: number;
    wonAmount: number;
    totalCost: number;
}

const getTier = (multiplier: number) => {
    if (multiplier >= 1000) return { label: 'JACKPOT!', color: '#ffc640', emoji: '🎉' };
    if (multiplier >= 100) return { label: 'BÜYÜK KAZANÇ!', color: '#ffc640', emoji: '🤑' };
    if (multiplier >= 10) return { label: 'İyi kazanç!', color: '#3cddc7', emoji: '✨' };
    if (multiplier >= 2) return { label: 'Küçük kazanç', color: '#3cddc7', emoji: '🍀' };
    if (multiplier > 0) return { label: 'Kısmi iade', color: '#ddb8ff', emoji: '🔹' };
    return { label: 'Kayıp', color: '#988ca0', emoji: '💨' };
};

export const LuckyGiftResultModal: React.FC = () => {
    const { socket } = useSocket();
    const [result, setResult] = useState<LuckyResult | null>(null);

    useEffect(() => {
        if (!socket) return;
        const handleResult = (data: LuckyResult) => {
            setResult(data);
            setTimeout(() => setResult(null), 3500);
        };
        socket.on('partyLuckyGiftResult', handleResult);
        return () => {
            socket.off('partyLuckyGiftResult', handleResult);
        };
    }, [socket]);

    const tier = result ? getTier(result.multiplier) : null;

    return (
        <AnimatePresence>
            {result && tier && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 px-8 py-6 rounded-3xl border-2 pointer-events-none"
                    style={{
                        background: 'rgba(11,19,38,0.9)',
                        borderColor: tier.color,
                        boxShadow: `0 0 40px ${tier.color}66`
                    }}
                >
                    <span className="text-5xl">{tier.emoji}</span>
                    <span className="text-sm font-bold uppercase tracking-wide" style={{ color: tier.color }}>
                        {tier.label}
                    </span>
                    <span className="text-white/70 text-xs">{result.giftName} — x{result.multiplier}</span>
                    <span className="text-2xl font-black text-white">
                        {result.wonAmount > 0 ? `+${result.wonAmount}` : '0'} <span className="text-sm font-normal text-white/50">Yıldız Tozu</span>
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
