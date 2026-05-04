import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface DailyTarotProps {
    tarotStatus: { canDraw: boolean, lastDraw?: string };
    drawnCard: any;
    isFlipping: boolean;
    drawTarot: () => void;
}

export const DailyTarot = ({ tarotStatus, drawnCard, isFlipping, drawTarot }: DailyTarotProps) => {
    return (
        <div className="glass-panel" style={{ padding: 24, border: '1px solid var(--accent-purple)', marginBottom: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <Sparkles color="var(--accent-purple)" />
                <h2 style={{ color: 'var(--accent-purple)', fontSize: 20 }}>Günün Kozmik Tarot Kartı</h2>
            </div>

            <div style={{ perspective: 1000, margin: '0 auto', width: 200, height: 300, cursor: tarotStatus.canDraw ? 'pointer' : 'default' }} onClick={drawTarot}>
                <motion.div
                    animate={{ rotateY: drawnCard ? 180 : (isFlipping ? 90 : 0) }}
                    transition={{ duration: 0.6 }}
                    style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                >
                    {/* Front (Closed Card) */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #2d1b69, #1a1040)', borderRadius: 16, border: '2px dashed var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        {tarotStatus.canDraw ? (
                            <>
                                <Sparkles size={32} color="var(--accent-gold)" />
                                <span style={{ color: 'white', fontWeight: 'bold' }}>Kartını Seç</span>
                            </>
                        ) : (
                            <>
                                <span style={{ color: 'var(--text-secondary)' }}>Bugün kartını çektin.</span>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Yarın tekrar gel!</span>
                            </>
                        )}
                    </div>

                    {/* Back (Opened Card) */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #4c1d95, #2e1065)', borderRadius: 16, border: '2px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 16, transform: 'rotateY(180deg)' }}>
                        {drawnCard && (
                            <>
                                <div style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>{drawnCard.emoji}</div>
                                <h3 style={{ color: 'var(--accent-gold)', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>{drawnCard.name}</h3>
                                <p style={{ color: 'white', fontSize: 12, textAlign: 'center', lineHeight: 1.4 }}>{drawnCard.meaning}</p>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
