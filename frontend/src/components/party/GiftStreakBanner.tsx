import { motion } from 'framer-motion';
import { getGiftArtwork } from './giftArtwork';

interface GiftStreakBannerProps {
    senderName?: string | undefined;
    senderAvatar?: string | undefined;
    receiverName?: string | undefined;
    giftKey?: string | undefined;
    giftIcon?: string | null;
    comboCount?: number | undefined;
}

/**
 * Combo sayısı büyüdükçe rakam da büyür - ×3 ile ×500 aynı boyutta durursa
 * combo'nun heyecanı kaybolur.
 */
const comboFontSize = (n: number): number => {
    if (n < 10) return 34;
    if (n < 100) return 46;
    return 56;
};

/**
 * Hediye gönderiminin oda üstünde görünen bandı.
 *
 * Ekranı kaplamaz - oda, koltuklar ve sohbet görünür kalır. Aynı anda birden fazla
 * bant alt alta yığılabilir. Tıklamayı engellemez (üst katmanda pointer-events-none).
 */
export const GiftStreakBanner: React.FC<GiftStreakBannerProps> = ({
    senderName,
    senderAvatar,
    receiverName,
    giftKey,
    giftIcon,
    comboCount
}) => {
    const artwork = getGiftArtwork(giftKey);
    const combo = comboCount ?? 1;

    return (
        <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex items-center"
        >
            <div className="relative flex items-center">
                <img
                    src={senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || '?')}`}
                    alt=""
                    className="relative z-10 w-11 h-11 rounded-full object-cover border-2 border-primary shrink-0 shadow-lg"
                />

                {/* Kapsül avatarın altından çıkar ve sağa doğru saydamlaşır */}
                <div
                    className="-ml-5 pl-8 pr-14 py-1.5 rounded-full min-w-[170px] max-w-[230px]"
                    style={{ background: 'linear-gradient(90deg, #FF8A2B 0%, #FFB43D 55%, rgba(255,216,107,0) 100%)' }}
                >
                    <div className="text-[11px] font-black text-white leading-tight truncate drop-shadow">
                        {senderName}
                    </div>
                    <div className="text-[10px] font-bold text-white/95 leading-tight truncate drop-shadow">
                        » {receiverName}
                    </div>
                </div>

                {/* Hediye kapsülün üst kenarından taşar - bandın imzası bu taşma */}
                <motion.div
                    key={combo}
                    initial={{ scale: 1.25, rotate: -6 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 13 }}
                    className="absolute right-0 -top-5 translate-x-1/4 w-16 h-16 flex items-center justify-center"
                >
                    {artwork ? (
                        <img
                            src={artwork}
                            alt=""
                            className="w-full h-full object-contain"
                            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                        />
                    ) : (
                        <span className="text-[2.6rem] leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                            {giftIcon || '🎁'}
                        </span>
                    )}
                </motion.div>
            </div>

            {/* Combo sayısı - küçük çarpı, devasa rakam */}
            {combo > 1 && (
                <motion.div
                    key={combo}
                    initial={{ scale: 1.45 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 12 }}
                    className="flex items-end ml-6 font-black italic select-none"
                    style={{
                        backgroundImage: 'linear-gradient(180deg, #FFF6C4 0%, #FFCE4A 52%, #FF9500 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        // Şeffaf dolgulu yazıda drop-shadow harf siluetini izler, böylece
                        // kontur ve parlama tek seferde çıkar
                        filter: 'drop-shadow(0 2px 0 rgba(105,45,0,0.95)) drop-shadow(0 0 14px rgba(255,180,40,0.65))'
                    }}
                >
                    <span className="text-xl leading-none mb-1">×</span>
                    <span style={{ fontSize: comboFontSize(combo), lineHeight: 0.85 }}>{combo}</span>
                </motion.div>
            )}
        </motion.div>
    );
};
