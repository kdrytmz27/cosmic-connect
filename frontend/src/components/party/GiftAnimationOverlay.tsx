import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { LottiePlayer } from './lottie/LottiePlayer';
import { GiftHero } from './GiftHero';

interface GiftEvent {
    id: string;
    giftKey?: string;
    senderId: string;
    sender: { id: string; name: string; avatar: string };
    receiverName?: string;
    receiverAvatar?: string;
    receiverId: string;
    giftId: string;
    giftPrice?: number;
    comboCount?: number;
    totalCost?: number;
    earnedDiamonds?: number;
    giftName?: string;
    giftIcon?: string | null;
    animationUrl?: string | null;
    animationTier?: string;
    category?: string;
}

const FALLBACK_DWELL_MS = 1800;
const TOAST_DWELL_MS = 4000;

export const GiftAnimationOverlay: React.FC = () => {
    const { socket } = useSocket();
    const queueRef = useRef<GiftEvent[]>([]);
    const isPlayingRef = useRef(false);
    const currentRef = useRef<GiftEvent | null>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [current, setCurrent] = useState<GiftEvent | null>(null);
    const [toasts, setToasts] = useState<GiftEvent[]>([]);

    const setCurrentBoth = (gift: GiftEvent | null) => {
        currentRef.current = gift;
        setCurrent(gift);
    };

    const playNext = () => {
        if (isPlayingRef.current) return;
        const next = queueRef.current.shift();
        if (!next) return;
        isPlayingRef.current = true;
        setCurrentBoth(next);
    };

    const handleFullscreenDone = () => {
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }
        isPlayingRef.current = false;
        setCurrentBoth(null);
        // Small gap between back-to-back fullscreen gifts so they don't feel jarring
        setTimeout(playNext, 150);
    };

    const scheduleFallbackDismiss = () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = setTimeout(handleFullscreenDone, FALLBACK_DWELL_MS);
    };

    // Stable across renders (only touches refs/setState) so it can be shared by both the real
    // socket listener and the sender's own optimistic local event without resubscribing either.
    const handleGift = useCallback((data: GiftEvent) => {
        // The optimistic local tap can race ahead of the server (e.g. 5 rapid taps fire before
        // the first echo returns) - if a same-id update ever arrives with a LOWER comboCount than
        // what's already shown, it's a stale/out-of-order echo, not a regression. Never go backwards.
        const merge = (existing: GiftEvent): GiftEvent =>
            (data.comboCount ?? 1) >= (existing.comboCount ?? 1) ? data : existing;

        if (data.animationTier === 'FULLSCREEN') {
            // Same streak already showing - update the badge in place, extend its dwell time,
            // rather than queueing a whole separate animation for every rapid tap. This is also
            // how an optimistic local tap and the server's later echo merge into one instance.
            if (currentRef.current && currentRef.current.id === data.id) {
                const merged = merge(currentRef.current);
                setCurrentBoth(merged);
                if (!merged.animationUrl) scheduleFallbackDismiss();
                return;
            }
            const queuedIndex = queueRef.current.findIndex(g => g.id === data.id);
            if (queuedIndex !== -1) {
                queueRef.current[queuedIndex] = merge(queueRef.current[queuedIndex]);
                return;
            }
            queueRef.current.push(data);
            playNext();
        } else {
            setToasts(prev => {
                const idx = prev.findIndex(t => t.id === data.id);
                if (idx !== -1) {
                    const next = [...prev];
                    next[idx] = merge(prev[idx]);
                    return next;
                }
                return [...prev.slice(-4), data];
            });
            if (toastTimersRef.current[data.id]) clearTimeout(toastTimersRef.current[data.id]);
            toastTimersRef.current[data.id] = setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== data.id));
                delete toastTimersRef.current[data.id];
            }, TOAST_DWELL_MS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('partyGiftReceived', handleGift);
        return () => {
            socket.off('partyGiftReceived', handleGift);
        };
    }, [socket, handleGift]);

    // Sender's own optimistic tap - shows instantly, merges with the server echo above once it
    // arrives (both use the same deterministic streak key as `id`).
    useEffect(() => {
        const handleLocal = (e: Event) => handleGift((e as CustomEvent<GiftEvent>).detail);
        window.addEventListener('localGiftSend', handleLocal);
        return () => window.removeEventListener('localGiftSend', handleLocal);
    }, [handleGift]);

    // Once the fullscreen slot starts showing a fallback (no Lottie asset), kick off its dwell timer
    useEffect(() => {
        if (current && !current.animationUrl) {
            scheduleFallbackDismiss();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id]);

    const senderReceiverLine = (gift: GiftEvent, size: 'lg' | 'sm') => (
        <div className={`flex items-center gap-2 ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
            <img src={gift.sender?.avatar || `https://ui-avatars.com/api/?name=${gift.sender?.name}`} className={`rounded-full object-cover border-2 border-primary ${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'}`} />
            <span className="font-bold text-white drop-shadow">{gift.sender?.name}</span>
            <span className="text-secondary font-black">→</span>
            <img src={gift.receiverAvatar || `https://ui-avatars.com/api/?name=${gift.receiverName}`} className={`rounded-full object-cover border-2 border-secondary ${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'}`} />
            <span className="font-bold text-white drop-shadow">{gift.receiverName}</span>
        </div>
    );

    // The gift itself, on its own scene layer (entrance, float, glow, shadow, shine). Composited on
    // top of the Lottie effect when the gift has one, shown alone when it doesn't - one design both ways.
    const renderIcon = (gift: GiftEvent) => (
        <GiftHero
            giftKey={gift.giftKey ?? gift.giftId}
            giftIcon={gift.giftIcon}
            giftName={gift.giftName}
            comboCount={gift.comboCount}
            category={gift.category}
        />
    );

    return (
        <>
            {/* FULLSCREEN gift overlay - one at a time, rapid taps escalate the same instance */}
            <AnimatePresence>
                {current && (
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 pointer-events-none bg-black/10"
                    >
                        {current.animationUrl ? (
                            <div className="relative w-full h-full max-w-md flex items-center justify-center">
                                <LottiePlayer url={current.animationUrl} className="absolute inset-0 w-full h-full" onComplete={handleFullscreenDone} />
                                <div className="relative">{renderIcon(current)}</div>
                            </div>
                        ) : (
                            renderIcon(current)
                        )}
                        <div className="absolute bottom-28 left-0 right-0 flex justify-center px-4">
                            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                                {senderReceiverLine(current, 'lg')}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOAST gifts - stack in a corner, never block each other */}
            <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none items-end">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="bg-black/70 backdrop-blur-md rounded-full pl-2 pr-3 py-1.5 flex items-center gap-2 border border-white/10"
                        >
                            <span className="text-xl">{t.giftIcon || '🎁'}</span>
                            {senderReceiverLine(t, 'sm')}
                            {(t.comboCount ?? 1) > 1 && (
                                <span className="text-[10px] bg-secondary text-on-secondary font-black px-1.5 py-0.5 rounded-full">x{t.comboCount}</span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
};
