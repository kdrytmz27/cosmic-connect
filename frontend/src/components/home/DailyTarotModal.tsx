import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { BrandLoader } from '../BrandLoader';

interface TarotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DailyTarotModal: React.FC<TarotModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null); // { canDraw: boolean, lastDraw: date }
    const [card, setCard] = useState<any>(null); // The drawn card
    const [drawing, setDrawing] = useState(false);
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        } else {
            // reset state when closed
            setCard(null);
            setFlipped(false);
        }
    }, [isOpen]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tarot/daily/status');
            setStatus(res.data);
            if (!res.data.canDraw) {
                // If user already drew today, we don't have the card saved in backend currently.
                // We'll just show they already drew.
                // Normally you'd save the specific drawn card to DB. For now, it's just a boolean.
            }
        } catch (error) {
            console.error("Tarot status error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDraw = async () => {
        setDrawing(true);
        try {
            const res = await api.post('/tarot/daily/draw');
            if (res.data.success && res.data.card) {
                setCard(res.data.card);
                setStatus({ ...status, canDraw: false });
            }
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Kart çekilemedi.', 'error');
        } finally {
            setDrawing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-surface-container border border-primary/30 rounded-3xl p-6 md:p-10 w-full max-w-md shadow-[0_0_50px_rgba(147,51,234,0.3)] z-10 flex flex-col items-center text-center overflow-hidden"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cards</span>
                    </div>

                    <h2 className="font-headline-md text-white mb-2">Günlük Tarot Açılımı</h2>

                    {loading ? (
                        <div className="py-12"><BrandLoader message="Deste karıştırılıyor..." /></div>
                    ) : status?.canDraw && !card ? (
                        <div className="flex flex-col items-center">
                            <p className="text-on-surface-variant text-sm mb-8 mt-2">
                                Evrenin bugün senin için bir mesajı var. Zihnini boşalt, niyetine odaklan ve günün kartını çek. (Günde sadece 1 kart çekebilirsin).
                            </p>

                            {/* Deck Illustration */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }} 
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="relative w-32 h-48 bg-gradient-to-br from-primary to-secondary rounded-xl border-2 border-white/20 shadow-xl flex items-center justify-center cursor-pointer mb-8 overflow-hidden group"
                                onClick={!drawing ? handleDraw : undefined}
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                                <span className="material-symbols-outlined text-white/50 text-5xl group-hover:scale-110 transition-transform">star</span>
                            </motion.div>

                            <button 
                                onClick={handleDraw}
                                disabled={drawing}
                                className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-50"
                            >
                                {drawing ? 'Kart Çekiliyor...' : 'Günün Kartını Çek ✨'}
                            </button>
                        </div>
                    ) : card ? (
                        <div className="flex flex-col items-center w-full">
                            <p className="text-primary font-bold mb-6 mt-2">Evrenin Mesajı Geldi</p>
                            
                            <div 
                                className="perspective-1000 w-48 h-72 mb-8 cursor-pointer"
                                onClick={() => setFlipped(true)}
                            >
                                <motion.div 
                                    className="w-full h-full relative preserve-3d"
                                    animate={{ rotateY: flipped ? 180 : 0 }}
                                    transition={{ duration: 0.8, type: "spring" }}
                                >
                                    {/* Front (Back of card before flip) */}
                                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary to-secondary rounded-2xl border-2 border-white/20 shadow-2xl flex items-center justify-center">
                                        <div className="text-center px-4">
                                            <span className="material-symbols-outlined text-white text-4xl mb-2 animate-pulse">touch_app</span>
                                            <p className="text-white font-bold text-sm">Açmak için tıkla</p>
                                        </div>
                                    </div>
                                    
                                    {/* Back (Actual Card Face) */}
                                    <div className="absolute inset-0 backface-hidden bg-surface-container-highest rounded-2xl border border-primary/50 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex flex-col items-center justify-center p-4" style={{ transform: 'rotateY(180deg)' }}>
                                        <div className="-scale-x-100 flex flex-col items-center">
                                            <span className="text-6xl mb-4 drop-shadow-lg">{card.emoji}</span>
                                            <h3 className="font-headline-sm text-white text-center">{card.name}</h3>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <AnimatePresence>
                                {flipped && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-background/50 p-4 rounded-xl border border-white/5 w-full text-left"
                                    >
                                        <h4 className="text-primary font-bold text-sm mb-1">Kartın Anlamı:</h4>
                                        <p className="text-on-surface text-sm leading-relaxed">{card.meaning}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-secondary text-4xl">hourglass_empty</span>
                            </div>
                            <h3 className="font-headline-sm text-white mb-2">Bugünkü Kartını Çektin</h3>
                            <p className="text-on-surface-variant text-sm px-4">
                                Yıldızların mesajını aldın. Bir sonraki kartını çekmek için yarını beklemelisin. Kozmos her gün yeni bir hikaye anlatır.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
