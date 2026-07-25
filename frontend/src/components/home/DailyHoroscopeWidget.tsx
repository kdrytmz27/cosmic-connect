import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Heart } from 'lucide-react';

interface DailyHoroscopeWidgetProps {
    dailyHoroscope: any;
}

const zodiacMap: Record<string, string> = {
    'ARIES': 'Koç', 'TAURUS': 'Boğa', 'GEMINI': 'İkizler', 'CANCER': 'Yengeç',
    'LEO': 'Aslan', 'VIRGO': 'Başak', 'LIBRA': 'Terazi', 'SCORPIO': 'Akrep',
    'SAGITTARIUS': 'Yay', 'CAPRICORN': 'Oğlak', 'AQUARIUS': 'Kova', 'PISCES': 'Balık'
};

export const DailyHoroscopeWidget = ({ dailyHoroscope }: DailyHoroscopeWidgetProps) => {
    const [showHoroscope, setShowHoroscope] = useState(false);

    if (!dailyHoroscope) return null;

    const translatedSign = zodiacMap[dailyHoroscope.sign?.toUpperCase()] || dailyHoroscope.sign;

    return (
        <div className="glass-panel" style={{ padding: 16, marginBottom: 20, border: '1px solid rgba(255, 215, 0, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, transform: 'rotate(15deg)' }}>
                <Sparkles size={120} />
            </div>
            <div
                onClick={() => setShowHoroscope(!showHoroscope)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', zIndex: 1, position: 'relative' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 8, background: 'linear-gradient(135deg, var(--accent-gold), #ff8c00)', borderRadius: '50%', color: 'white' }}>
                        <Star size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 15, color: 'var(--accent-gold)', marginBottom: 2 }}>Günün Falı ({translatedSign})</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Yıldızlar bugün senin için ne diyor?</p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showHoroscope && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', zIndex: 1, position: 'relative' }}
                    >
                        <div style={{ paddingTop: 16, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {dailyHoroscope.predictions.love && (
                                <div>
                                    <h4 style={{ fontSize: 12, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Heart size={12} fill="currentColor" /> Aşk</h4>
                                    <p style={{ fontSize: 13, color: 'white', lineHeight: 1.4 }}>{dailyHoroscope.predictions.love.content || dailyHoroscope.predictions.love}</p>
                                </div>
                            )}
                            {dailyHoroscope.predictions.career && (
                                <div>
                                    <h4 style={{ fontSize: 12, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Star size={12} fill="currentColor" /> Kariyer</h4>
                                    <p style={{ fontSize: 13, color: 'white', lineHeight: 1.4 }}>{dailyHoroscope.predictions.career.content || dailyHoroscope.predictions.career}</p>
                                </div>
                            )}
                            {dailyHoroscope.predictions.health && (
                                <div>
                                    <h4 style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Sparkles size={12} fill="currentColor" /> Sağlık</h4>
                                    <p style={{ fontSize: 13, color: 'white', lineHeight: 1.4 }}>{dailyHoroscope.predictions.health.content || dailyHoroscope.predictions.health}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
