import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart, Star, Loader, UserPlus } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';

interface MatchDetailModalProps {
    selectedUser: any;
    setSelectedUser: (user: any | null) => void;
    user: any;
    actionLoading: boolean;
    sendSuperLike: (id: string) => void;
    handleSendFriendRequest: (id: string) => void;
    navigate: (path: string) => void;
}

export const MatchDetailModal = ({
    selectedUser,
    setSelectedUser,
    user,
    actionLoading,
    sendSuperLike,
    handleSendFriendRequest,
    navigate
}: MatchDetailModalProps) => {
    const [showDetailedCompatibility, setShowDetailedCompatibility] = useState(false);

    if (!selectedUser) return null;

    const getElement = (sign: string | undefined) => {
        if (!sign) return { name: 'Bilinmiyor', color: 'gray' };
        const fire = ['Aries', 'Leo', 'Sagittarius', 'Koç', 'Aslan', 'Yay'];
        const earth = ['Taurus', 'Virgo', 'Capricorn', 'Boğa', 'Başak', 'Oğlak'];
        const air = ['Gemini', 'Libra', 'Aquarius', 'İkizler', 'Terazi', 'Kova'];
        const water = ['Cancer', 'Scorpio', 'Pisces', 'Yengeç', 'Akrep', 'Balık'];

        if (fire.includes(sign)) return { name: 'Ateş 🔥', color: '#f97316' };
        if (earth.includes(sign)) return { name: 'Toprak 🌍', color: '#84cc16' };
        if (air.includes(sign)) return { name: 'Hava 💨', color: '#0ea5e9' };
        if (water.includes(sign)) return { name: 'Su 💧', color: '#3b82f6' };
        return { name: 'Bilinmiyor', color: 'gray' };
    };

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(10, 5, 20, 0.92)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
            }}
            onClick={() => { setSelectedUser(null); setShowDetailedCompatibility(false); }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: 400, padding: 32, position: 'relative', textAlign: 'center', maxHeight: '80vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={() => setSelectedUser(null)}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                >
                    <X size={18} />
                </button>

                <div
                    onClick={() => navigate(`/profile/${selectedUser.match.id}`)}
                    style={{ width: 100, height: 100, margin: '0 auto 16px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-purple)', padding: 2, cursor: 'pointer' }}
                >
                    <img
                        src={selectedUser.match.avatar ? `${BACKEND_URL}${selectedUser.match.avatar}` : `https://ui-avatars.com/api/?name=${selectedUser.match.name || selectedUser.match.email?.split('@')[0] || 'G'}&background=random`}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                </div>

                <h2 style={{ fontSize: 24, marginBottom: 8, textTransform: 'capitalize' }}>
                    {selectedUser.match.name || selectedUser.match.email?.split('@')[0]}
                </h2>

                {selectedUser.match.bio && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 16 }}>"{selectedUser.match.bio}"</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Güneş: {selectedUser.match.sunSign}</span>
                    <span style={{ padding: '4px 12px', background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Ay: {selectedUser.match.moonSign || '?'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    <span style={{ padding: '4px 12px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Yükselen: {selectedUser.match.risingSign || '?'}</span>
                </div>

                {selectedUser.match.karma !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <span style={{
                            padding: '4px 12px',
                            background: selectedUser.match.karma > 150 ? 'rgba(56, 189, 248, 0.1)' : selectedUser.match.karma < 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: selectedUser.match.karma > 150 ? '#38bdf8' : selectedUser.match.karma < 50 ? '#ef4444' : 'var(--text-secondary)',
                            border: `1px solid ${selectedUser.match.karma > 150 ? '#38bdf8' : selectedUser.match.karma < 50 ? '#ef4444' : 'var(--card-border)'}`,
                            borderRadius: 16, fontSize: 12, fontWeight: 600
                        }}>
                            {selectedUser.match.karma > 150 ? '🌟 Yıldız Tozu Aura' : selectedUser.match.karma < 50 ? '🌑 Kara Delik Aura' : '✨ Dengeli Aura'}
                        </span>
                    </div>
                )}

                <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 215, 0, 0.3)', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowDetailedCompatibility(!showDetailedCompatibility)}>
                        <h3 style={{ color: 'var(--accent-gold)', fontSize: 18, margin: 0 }}>%{selectedUser.score} Astromatik Uyum</h3>
                        <div style={{ color: 'var(--accent-gold)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'bold' }}>
                            {showDetailedCompatibility ? 'Kapat' : 'Detaylı Analiz'}
                        </div>
                    </div>

                    <AnimatePresence>
                        {showDetailedCompatibility ? (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255, 215, 0, 0.2)', textAlign: 'left' }}>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{selectedUser.analysis}</p>

                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                                        <h4 style={{ fontSize: 12, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={12} color="var(--accent-gold)" /> Element Uyumu</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                            <span style={{ color: getElement(user?.sunSign).color, fontWeight: 'bold' }}>Sen ({getElement(user?.sunSign).name})</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontStyle: 'italic' }}>ile</span>
                                            <span style={{ color: getElement(selectedUser.match.sunSign).color, fontWeight: 'bold' }}>O ({getElement(selectedUser.match.sunSign).name})</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                                        <h4 style={{ fontSize: 12, color: 'white', marginBottom: 4 }}>İletişim (Merkür)</h4>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Zihinsel uyumunuz pratik ve çözüm odaklı yönlere yatkın. Birbirinizi anlayabilirsiniz.</p>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
                                        <h4 style={{ fontSize: 12, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} color="var(--accent-pink)" /> Çekim (Venüs / Mars)</h4>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Farklı enerjiler aranızda doğal bir manyetizma ve çekim oluşturma potansiyeli taşıyor.</p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 12 }}>{selectedUser.analysis}</p>
                        )}
                    </AnimatePresence>
                </div>

                {selectedUser.dailyHoroscope && (
                    <div style={{ textAlign: 'left', background: 'rgba(139, 92, 246, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: 24 }}>
                        <h3 style={{ color: 'var(--accent-purple)', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Star size={16} color="var(--accent-gold)" /> Günlük Fal ({selectedUser.match.sunSign})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {selectedUser.dailyHoroscope['GENERAL'] && (
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    <strong style={{ color: 'white' }}>Genel:</strong> {selectedUser.dailyHoroscope['GENERAL']}
                                </p>
                            )}
                            {selectedUser.dailyHoroscope['LOVE'] && (
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    <strong style={{ color: 'white' }}>Aşk:</strong> {selectedUser.dailyHoroscope['LOVE']}
                                </p>
                            )}
                            {selectedUser.dailyHoroscope['CAREER'] && (
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    <strong style={{ color: 'white' }}>Kariyer:</strong> {selectedUser.dailyHoroscope['CAREER']}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button
                        onClick={() => handleSendFriendRequest(selectedUser.match.id)}
                        disabled={actionLoading}
                        style={{
                            flex: 1, padding: '10px 12px', borderRadius: 12,
                            background: 'rgba(56,189,248,0.12)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s'
                        }}
                    >
                        <UserPlus size={14} color="#38bdf8" />
                        Arkadaş Ekle
                    </button>

                    <button
                        onClick={() => sendSuperLike(selectedUser.match.id)}
                        disabled={actionLoading}
                        style={{
                            flex: 1, padding: '10px 12px', borderRadius: 12,
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.15))',
                            border: '1px solid rgba(255,215,0,0.35)',
                            color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(255,215,0,0.2)'
                        }}
                    >
                        {actionLoading ? <Loader className="animate-spin" size={13} /> : <Sparkles size={13} fill="var(--accent-gold)" color="var(--accent-gold)" />}
                        Süper Beğeni
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
