import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Loader, Sparkles } from 'lucide-react';

interface DailyRewardModalProps {
    showDailyReward: boolean;
    dailyStreak: number;
    claimingReward: boolean;
    handleClaimReward: () => void;
    onClose: () => void;
}

export const DailyRewardModal = ({
    showDailyReward,
    dailyStreak,
    claimingReward,
    handleClaimReward,
    onClose
}: DailyRewardModalProps) => {
    return (
        <AnimatePresence>
            {showDailyReward && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10, 5, 20, 0.85)', backdropFilter: 'blur(10px)',
                    zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
                }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: 360, padding: 32, textAlign: 'center', position: 'relative', overflow: 'hidden', border: '2px solid var(--accent-gold)' }}
                    >
                        <div style={{ position: 'absolute', top: -50, left: -50, right: -50, bottom: -50, background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)', zIndex: 0, animation: 'pulse 3s infinite' }} />

                        <div style={{ zIndex: 1, position: 'relative' }}>
                            <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: 'linear-gradient(135deg, var(--accent-gold), #ff8c00)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(255,215,0,0.3)', animation: 'bounce 2s infinite' }}>
                                <Gift size={40} color="white" />
                            </div>

                            <h2 style={{ fontSize: 28, marginBottom: 8, color: 'var(--accent-gold)' }}>Günlük Ödül!</h2>

                            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
                                Yıldızlar bugün senin için parlıyor! Ödülünü al ve keşfetmeye devam et.
                            </p>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Sonraki Ödül Serisi</div>
                                    <div style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{dailyStreak + 1}. Gün 🔥</div>
                                </div>
                            </div>

                            <button
                                onClick={handleClaimReward}
                                disabled={claimingReward}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '30px', border: 'none',
                                    background: 'linear-gradient(135deg, var(--accent-gold), #ff8c00)', color: 'white',
                                    fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {claimingReward ? <Loader className="animate-spin" size={24} /> : (
                                    <>
                                        <Sparkles size={20} /> Ödülü Al
                                    </>
                                )}
                            </button>
                            <div style={{ marginTop: 16 }}>
                                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                                    Şimdilik Geç
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
