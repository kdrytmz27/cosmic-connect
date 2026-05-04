import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Loader } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';

interface PastFortunesModalProps {
    showFortunesModal: boolean;
    setShowFortunesModal: (val: boolean) => void;
    myFortunes: any[];
    rateTellerResult: (id: string, rating: number) => void;
}

export const PastFortunesModal = ({ showFortunesModal, setShowFortunesModal, myFortunes, rateTellerResult }: PastFortunesModalProps) => {
    return (
        <AnimatePresence>
            {showFortunesModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', padding: 16, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: 500, maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.15)', overflow: 'hidden' }}
                    >
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                                <Sparkles color="var(--accent-gold)" size={20} /> Kozmik Kayıtlar
                            </h2>
                            <button onClick={() => setShowFortunesModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                                X
                            </button>
                        </div>

                        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {myFortunes.length === 0 ? (
                                <div className="text-secondary text-sm text-center py-8">Henüz bir fal baktırmadın. 100 Toz ile fal isteyebilirsin!</div>
                            ) : (
                                myFortunes.map(f => (
                                    <div key={f.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 }}>
                                        <div className="flex justify-between items-center mb-3">
                                            <strong className="text-primary text-lg" style={{ color: 'white' }}>{f.teller?.user?.name || f.teller?.name || 'Gizemli Falcı'}</strong>
                                            <span className="text-xs text-secondary" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 12 }}>{new Date(f.appointmentDate).toLocaleDateString()}</span>
                                        </div>
                                        {f.question && (
                                            <div style={{ marginBottom: 12 }}>
                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Sorun:</span>
                                                <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.8)' }}>"{f.question}"</p>
                                            </div>
                                        )}
                                        {f.imageUrl && (
                                            <div style={{ marginBottom: 12 }}>
                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Fincan / Görsel:</span>
                                                <img src={`${BACKEND_URL}${f.imageUrl}`} alt="Fortune Image" style={{ height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => window.open(`${BACKEND_URL}${f.imageUrl}`, '_blank')} />
                                            </div>
                                        )}
                                        {f.status === 'COMPLETED' ? (
                                            <div style={{ marginTop: 16 }}>
                                                <span style={{ fontSize: 11, color: 'var(--accent-pink)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Yıldızların Cevabı:</span>
                                                <div className="text-sm text-white p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))', border: '1px solid rgba(139,92,246,0.2)', lineHeight: 1.6 }}>
                                                    {f.interpretation}
                                                </div>
                                                {!f.userRating && (
                                                    <div className="flex gap-2 mt-4 items-center justify-start bg-black/20 p-3 rounded-lg border border-white/5">
                                                        <span className="text-sm text-secondary mr-2">Falcıyı Oyla:</span>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} size={22} className="cursor-pointer text-gray-500 hover:text-accent-gold transition-colors" onClick={() => rateTellerResult(f.id, star)} />
                                                        ))}
                                                    </div>
                                                )}
                                                {f.userRating && (
                                                    <div className="text-sm mt-4 flex items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                                                        <Star size={16} fill="currentColor" /> verdiğin puan: <strong>{f.userRating}</strong> / 5
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm mt-3 flex items-center gap-2" style={{ color: 'var(--accent-purple)', background: 'rgba(139,92,246,0.1)', padding: '8px 12px', borderRadius: 8, display: 'inline-flex' }}>
                                                <Loader size={14} className="animate-spin" /> Falcı yanıtı bekleniyor...
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                            <button
                                className="primary-btn"
                                style={{ width: '100%', padding: '12px 0' }}
                                onClick={() => setShowFortunesModal(false)}
                            >
                                Kapat
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
