import { motion } from 'framer-motion';
import { getGiftArtwork } from './giftArtwork';

interface GiftHeroProps {
    giftKey?: string | null;
    giftIcon?: string | null;
    giftName?: string | undefined;
    comboCount?: number | undefined;
    category?: string | undefined;
}

// Hediyenin seviyesine göre parlama rengi - arka plandaki Lottie efektinin paletiyle uyumlu
const GLOW_BY_CATEGORY: Record<string, string> = {
    BASLANGIC: '#7FD8FF',
    ORTA: '#FFC640',
    PREMIUM: '#67E8F9',
    LUKS: '#B27BFF'
};

// Süzülme ve yer gölgesi aynı ritmi paylaşır, yoksa obje havada asılı kalmış gibi durur
const FLOAT_DURATION = 3.2;
const FLOAT_DELAY = 0.6;

// Obje uçup yerine oturduktan hemen sonra "patlar" - giriş yayının oturma anına denk gelir
const ARRIVAL_IMPACT_AT = 0.38;

/**
 * Objenin kendisinin patlaması: silüetinin beyaz parlaması + dışa doğru genişleyip
 * sönen kopyaları. Tek bir görselden şok dalgası hissi çıkarır, ek varlık gerektirmez.
 *
 * Blur kullanılmıyor - hızlı combo'da her dokunuşta yeniden tetiklendiği için
 * düşük donanımlı telefonlarda pahalıya patlıyordu.
 */
const ImpactBurst: React.FC<{ node: React.ReactNode; delay: number }> = ({ node, delay }) => (
    <>
        {[0, 1].map(i => (
            <motion.div
                key={`echo-${i}`}
                aria-hidden
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ filter: 'brightness(1.45)' }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 1.55 + i * 0.35], opacity: [0.45 - i * 0.18, 0] }}
                transition={{ duration: 0.75 + i * 0.1, delay: delay + i * 0.08, ease: 'easeOut' }}
            >
                {node}
            </motion.div>
        ))}
        {/* Silüet parlaması - hem çizimde hem emojide çalışır */}
        <motion.div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ filter: 'brightness(0) invert(1)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.4, delay, times: [0, 0.18, 1], ease: 'easeOut' }}
        >
            {node}
        </motion.div>
    </>
);

/**
 * Hediyenin kendisini "sahneye çıkaran" katman: uçarak giriş, iniş anında patlama,
 * sürekli süzülme ve nefes alma, arkada parlama, altında gölge, çizim varsa
 * üzerinden geçen ışık ve her combo vuruşunda yeniden patlama.
 *
 * Görselden bağımsız çalışır - emoji ile de, gerçek çizimle de aynı sahne.
 */
export const GiftHero: React.FC<GiftHeroProps> = ({ giftKey, giftIcon, giftName, comboCount, category }) => {
    const artwork = getGiftArtwork(giftKey);
    const glow = GLOW_BY_CATEGORY[category || ''] || '#FFC640';
    const combo = comboCount ?? 1;

    const maskStyle = artwork
        ? {
              WebkitMaskImage: `url(${artwork})`,
              maskImage: `url(${artwork})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center'
          }
        : undefined;

    // Patlama kopyaları ve parlama bunun aynısını kullanır, o yüzden tek yerden tanımlı
    const objectNode = artwork ? (
        <img
            src={artwork}
            alt={giftName || ''}
            className="w-full h-full object-contain select-none"
            draggable={false}
        />
    ) : (
        <span className="text-[7rem] leading-none select-none">{giftIcon || '🎁'}</span>
    );

    return (
        <div className="relative flex flex-col items-center justify-center gap-2" style={{ perspective: 900 }}>
            {/* Arka parlama - objenin arkasından vuran ışık, iniş anında bir kez şişer */}
            <motion.div
                aria-hidden
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{
                    width: 360,
                    height: 360,
                    background: `radial-gradient(circle, ${glow}55 0%, ${glow}1f 45%, transparent 70%)`
                }}
                initial={{ scale: 0.35, opacity: 0 }}
                animate={{ scale: [0.35, 1.25, 1, 1.06, 1], opacity: [0, 1, 0.85, 0.95, 0.85] }}
                transition={{ duration: 2.4, times: [0, 0.16, 0.3, 0.6, 1], ease: 'easeOut' }}
            />

            {/* Giriş: uzaktan, hafif yan açıyla uçarak gelir ve yay gibi yerine oturur */}
            <motion.div
                initial={{ opacity: 0, scale: 0.22, y: 100, rotateY: -30, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.9 }}
                className="relative"
            >
                {/* Poz: yerine oturunca süzülür ve nefes alır */}
                <motion.div
                    animate={{ y: [0, -11, 0], rotate: [0, 2.5, 0, -2.5, 0], scale: [1, 1.035, 1, 1.02, 1] }}
                    transition={{ duration: FLOAT_DURATION, repeat: Infinity, ease: 'easeInOut', delay: FLOAT_DELAY }}
                >
                    {/* İniş darbesi - obje yere çakılırmış gibi ezilip toparlanır */}
                    <motion.div
                        animate={{ scale: [1, 1.18, 0.95, 1] }}
                        transition={{ duration: 0.55, delay: ARRIVAL_IMPACT_AT, times: [0, 0.28, 0.6, 1], ease: 'easeOut' }}
                    >
                        {/* Combo her arttığında obje yeniden vurur ve sarsılır */}
                        <motion.div
                            key={combo}
                            initial={{ scale: 1.28 }}
                            animate={{ scale: 1, x: [0, -7, 6, -4, 0] }}
                            transition={{
                                scale: { type: 'spring', stiffness: 420, damping: 14 },
                                x: { duration: 0.3, ease: 'easeOut' }
                            }}
                            className="relative flex items-center justify-center w-[min(58vw,260px)] h-[min(58vw,260px)]"
                        >
                            {/* Patlama kopyaları objenin ARKASINDA kalmalı */}
                            <ImpactBurst node={objectNode} delay={ARRIVAL_IMPACT_AT} />
                            {combo > 1 && <ImpactBurst key={`combo-${combo}`} node={objectNode} delay={0} />}

                            <div
                                className="relative w-full h-full flex items-center justify-center"
                                style={{ filter: `drop-shadow(0 14px 26px rgba(0,0,0,0.55)) drop-shadow(0 0 28px ${glow}99)` }}
                            >
                                {objectNode}
                            </div>

                            {/* Işık süpürmesi - çizimin silüetine maskelenir, dikdörtgen taşma olmaz */}
                            {artwork && (
                                <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={maskStyle}>
                                    <motion.div
                                        className="absolute top-[-20%] bottom-[-20%] w-1/3"
                                        style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent)' }}
                                        initial={{ x: '-180%' }}
                                        animate={{ x: '320%' }}
                                        transition={{ duration: 1.1, delay: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.7 }}
                                    />
                                </div>
                            )}

                            {combo > 1 && (
                                <span className="absolute bottom-1 -right-2 bg-secondary text-on-secondary text-2xl font-black px-3 py-0.5 rounded-full border-2 border-[#0b1326] shadow-[0_0_20px_rgba(255,198,64,0.8)]">
                                    x{combo}
                                </span>
                            )}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Yer gölgesi - süzülmeyle aynı ritimde nefes alır */}
            <motion.div
                aria-hidden
                className="rounded-[50%] bg-black/45 blur-md pointer-events-none"
                style={{ width: 150, height: 20 }}
                initial={{ opacity: 0, scaleX: 0.4 }}
                animate={{ opacity: [0, 0.5, 0.35, 0.5], scaleX: [0.4, 1, 0.86, 1] }}
                transition={{
                    opacity: { duration: FLOAT_DURATION, repeat: Infinity, ease: 'easeInOut', delay: FLOAT_DELAY },
                    scaleX: { duration: FLOAT_DURATION, repeat: Infinity, ease: 'easeInOut', delay: FLOAT_DELAY }
                }}
            />

            <motion.span
                className="text-lg font-bold text-white drop-shadow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                {giftName}
            </motion.span>
        </div>
    );
};
