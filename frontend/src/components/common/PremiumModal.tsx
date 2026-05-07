import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
    isOpen,
    onClose,
    title = 'Gizemli Ruhları Keşfet',
    description = 'Seni beğenen gizli hayranlarını görmek ve onlarla anında eşleşmek için Premium\'a geç.'
}) => {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(10, 5, 20, 0.92)',
                        zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        onClick={e => e.stopPropagation()}
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: 360, padding: 32, textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 24 }}
                    >
                        <div style={{ position: 'absolute', top: -50, left: -50, right: -50, bottom: -50, background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 60%)', zIndex: 0, animation: 'pulse 3s infinite' }} />

                        <div style={{ zIndex: 1, position: 'relative' }}>
                            <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,215,0,0.3)' }}>
                                <Crown size={40} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />
                            </div>

                            <h2 style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 12 }}>
                                {title.split(' ')[0]} <span style={{ color: 'var(--accent-gold)' }}>{title.substring(title.indexOf(' ') + 1)}</span>
                            </h2>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                                {description}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'white' }}>
                                    <div style={{ background: 'rgba(255,215,0,0.2)', padding: 4, borderRadius: '50%', color: 'var(--accent-gold)' }}><Check size={14} /></div>
                                    Seni beğenenleri gör
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'white' }}>
                                    <div style={{ background: 'rgba(255,215,0,0.2)', padding: 4, borderRadius: '50%', color: 'var(--accent-gold)' }}><Check size={14} /></div>
                                    Sınırsız mesajlaşma & pas geçme
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'white' }}>
                                    <div style={{ background: 'rgba(255,215,0,0.2)', padding: 4, borderRadius: '50%', color: 'var(--accent-gold)' }}><Check size={14} /></div>
                                    Profilinde Premium ikonu
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/market')}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                                    background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                                    color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(255,215,0,0.4)', transition: 'all 0.2s'
                                }}
                            >
                                Premium'a Yükselt
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%', marginTop: 12, padding: '12px', background: 'transparent',
                                    border: 'none', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer'
                                }}
                            >
                                Belki Daha Sonra
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
