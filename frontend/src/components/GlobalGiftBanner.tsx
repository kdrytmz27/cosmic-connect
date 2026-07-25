import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

interface BannerEvent {
    senderName: string;
    receiverName: string;
    giftName: string;
    giftIcon: string | null;
    comboCount?: number;
    isLucky?: boolean;
    multiplier?: number;
}

const DWELL_MS = 5000;

// App-wide, shown regardless of which page the user is on (mounted in Layout.tsx) - unlike
// the party room's own gift animations, this is only for LUKS-tier gifts or big lucky wins.
export const GlobalGiftBanner: React.FC = () => {
    const { socket } = useSocket();
    const [banner, setBanner] = useState<BannerEvent | null>(null);

    useEffect(() => {
        if (!socket) return;
        const handleBanner = (data: BannerEvent) => {
            setBanner(data);
            const timer = setTimeout(() => setBanner(null), DWELL_MS);
            return () => clearTimeout(timer);
        };
        socket.on('globalGiftBanner', handleBanner);
        return () => {
            socket.off('globalGiftBanner', handleBanner);
        };
    }, [socket]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none w-full max-w-md px-4">
            <AnimatePresence>
                {banner && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-md rounded-full px-4 py-2 shadow-[0_4px_20px_rgba(147,51,234,0.5)] border border-white/20"
                    >
                        <span className="text-2xl">{banner.giftIcon || '🎁'}</span>
                        <span className="text-sm font-bold text-white truncate">
                            {banner.senderName} → {banner.receiverName}'a {banner.giftName} gönderdi!
                            {(banner.comboCount ?? 1) > 1 && ` x${banner.comboCount}`}
                            {banner.isLucky && banner.multiplier && banner.multiplier >= 100 && ' 🎉 ŞANSLI!'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
