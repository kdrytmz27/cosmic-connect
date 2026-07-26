import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { LottiePlayer } from './lottie/LottiePlayer';
import { AlphaVideoPlayer, isVideoAnimation } from './AlphaVideoPlayer';
import { GiftHero } from './GiftHero';
import { GiftStreakBanner } from './GiftStreakBanner';

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

// Bant, son dokunuştan bu kadar sonra kaybolur. Referans uygulamada ölçülen aralık
// ~3.4 saniyenin altındaydı; sunucudaki streak penceresiyle (2500ms) uyumlu tutuluyor.
const BANNER_DWELL_MS = 3000;
// Aynı anda ekranda duracak en fazla bant - fazlası odayı okunmaz hale getiriyor
const MAX_BANNERS = 3;
// Arka plan sahnesinin varlığı yoksa (sadece ikon) kendiliğinden bitmez, sabit süre verilir
const SCENE_DWELL_MS = 2600;
// Oynatıcı "bitti" demezse (bozuk dosya, takılan çözücü) sahne arkada asılı kalır
const MAX_ANIMATION_MS = 10000;

/**
 * Hediye gönderiminin oda üstündeki gösterimi. İki ayrı katman:
 *
 * 1. Streak bantları (z-55) - HER hediye için, üst üste yığılır, ekranı kaplamaz ve
 *    tıklamayı engellemez. Oda, koltuklar, sohbet ve hediye paneli görünür kalır.
 * 2. Arka plan sahnesi (z-5) - yalnızca FULLSCREEN seviyesindeki pahalı hediyeler için,
 *    arka plan görselinin üstünde ama içeriğin ALTINDA oynar. Sohbeti kapatmaz.
 *
 * Daha önce her FULLSCREEN hediye ekranın önünü tamamen kapatıyordu; hızlı combo
 * atarken oda tamamen görünmez oluyordu.
 */
export const GiftAnimationOverlay: React.FC = () => {
    const { socket } = useSocket();

    const [banners, setBanners] = useState<GiftEvent[]>([]);
    const bannerTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const [scene, setScene] = useState<GiftEvent | null>(null);
    const sceneRef = useRef<GiftEvent | null>(null);
    const sceneQueueRef = useRef<GiftEvent[]>([]);
    const scenePlayingRef = useRef(false);
    const sceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setSceneBoth = (gift: GiftEvent | null) => {
        sceneRef.current = gift;
        setScene(gift);
    };

    const playNextScene = () => {
        if (scenePlayingRef.current) return;
        const next = sceneQueueRef.current.shift();
        if (!next) return;
        scenePlayingRef.current = true;
        setSceneBoth(next);
    };

    const handleSceneDone = () => {
        if (sceneTimerRef.current) {
            clearTimeout(sceneTimerRef.current);
            sceneTimerRef.current = null;
        }
        scenePlayingRef.current = false;
        setSceneBoth(null);
        // Arka arkaya gelen sahneler arasında küçük bir boşluk, yoksa sert görünüyor
        setTimeout(playNextScene, 150);
    };

    const scheduleSceneDismiss = (ms: number) => {
        if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
        sceneTimerRef.current = setTimeout(handleSceneDone, ms);
    };

    // Stable across renders (only touches refs/setState) so it can be shared by both the real
    // socket listener and the sender's own optimistic local event without resubscribing either.
    const handleGift = useCallback((data: GiftEvent) => {
        // The optimistic local tap can race ahead of the server (e.g. 5 rapid taps fire before
        // the first echo returns) - if a same-id update ever arrives with a LOWER comboCount than
        // what's already shown, it's a stale/out-of-order echo, not a regression. Never go backwards.
        const merge = (existing: GiftEvent): GiftEvent =>
            (data.comboCount ?? 1) >= (existing.comboCount ?? 1) ? data : existing;

        // --- 1. Bant: her hediye için, aynı streak yerinde güncellenir
        setBanners(prev => {
            const idx = prev.findIndex(b => b.id === data.id);
            if (idx !== -1) {
                const next = [...prev];
                next[idx] = merge(prev[idx]);
                return next;
            }
            return [...prev.slice(-(MAX_BANNERS - 1)), data];
        });
        if (bannerTimersRef.current[data.id]) clearTimeout(bannerTimersRef.current[data.id]);
        bannerTimersRef.current[data.id] = setTimeout(() => {
            setBanners(prev => prev.filter(b => b.id !== data.id));
            delete bannerTimersRef.current[data.id];
        }, BANNER_DWELL_MS);

        // --- 2. Arka plan sahnesi: yalnızca pahalı hediyeler, sırayla tek tek
        if (data.animationTier !== 'FULLSCREEN') return;

        if (sceneRef.current && sceneRef.current.id === data.id) {
            // Aynı streak zaten oynuyor - baştan başlatmak yerine yerinde güncelle
            const merged = merge(sceneRef.current);
            setSceneBoth(merged);
            if (!merged.animationUrl) scheduleSceneDismiss(SCENE_DWELL_MS);
            return;
        }
        const queuedIndex = sceneQueueRef.current.findIndex(g => g.id === data.id);
        if (queuedIndex !== -1) {
            sceneQueueRef.current[queuedIndex] = merge(sceneQueueRef.current[queuedIndex]);
            return;
        }
        sceneQueueRef.current.push(data);
        playNextScene();
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

    // Varlığı olmayan sahnenin doğal bir sonu yok, sabit süre verilir. Varlığı olanda
    // oynatıcı bitişi bildirir; uzun süre yalnızca emniyet ağıdır.
    useEffect(() => {
        if (!scene) return;
        scheduleSceneDismiss(scene.animationUrl ? MAX_ANIMATION_MS : SCENE_DWELL_MS);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene?.id]);

    // Bileşen sökülürken sarkan zamanlayıcı bırakma
    useEffect(() => {
        const bannerTimers = bannerTimersRef.current;
        return () => {
            Object.values(bannerTimers).forEach(clearTimeout);
            if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
        };
    }, []);

    return (
        <>
            {/* Arka plan sahnesi - içeriğin ALTINDA (z-5), sohbeti ve kontrolleri kapatmaz */}
            <AnimatePresence>
                {scene && (
                    <div
                        key={scene.id}
                        className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none"
                    >
                        {isVideoAnimation(scene.animationUrl) ? (
                            <AlphaVideoPlayer
                                url={scene.animationUrl!}
                                className="w-full h-full"
                                onComplete={handleSceneDone}
                            />
                        ) : scene.animationUrl ? (
                            <div className="relative w-full h-full max-w-md flex items-center justify-center">
                                <LottiePlayer
                                    url={scene.animationUrl}
                                    className="absolute inset-0 w-full h-full"
                                    onComplete={handleSceneDone}
                                />
                                <div className="relative">
                                    <GiftHero
                                        giftKey={scene.giftKey ?? scene.giftId}
                                        giftIcon={scene.giftIcon}
                                        giftName={scene.giftName}
                                        comboCount={scene.comboCount}
                                        category={scene.category}
                                    />
                                </div>
                            </div>
                        ) : (
                            <GiftHero
                                giftKey={scene.giftKey ?? scene.giftId}
                                giftIcon={scene.giftIcon}
                                giftName={scene.giftName}
                                comboCount={scene.comboCount}
                                category={scene.category}
                            />
                        )}
                    </div>
                )}
            </AnimatePresence>

            {/* Streak bantları - içeriğin ve panellerin üstünde ama tıklamayı geçirir */}
            <div className="fixed left-3 top-[26%] z-[55] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence initial={false}>
                    {banners.map(b => (
                        <GiftStreakBanner
                            key={b.id}
                            senderName={b.sender?.name}
                            senderAvatar={b.sender?.avatar}
                            receiverName={b.receiverName}
                            giftKey={b.giftKey ?? b.giftId}
                            giftIcon={b.giftIcon}
                            comboCount={b.comboCount}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
};
