import { useState, useEffect } from 'react';
import api, { BACKEND_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FortuneRequest {
    id: string;
    appointmentDate: string;
    stardustPrice: number;
    question: string | null;
    fortuneType: string | null;
    imageUrl: string | null;
    user: {
        id: string;
        name: string;
        avatar: string | null;
        sunSign: string;
        moonSign: string;
        risingSign: string;
    }
}

interface TellerStats {
    totalReadings: number;
    rating: number;
    earnedStardust: number;
}

const TellerDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [fortunes, setFortunes] = useState<FortuneRequest[]>([]);
    const [stats, setStats] = useState<TellerStats>({ totalReadings: 0, rating: 0, earnedStardust: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedFortune, setSelectedFortune] = useState<FortuneRequest | null>(null);
    const [interpretation, setInterpretation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const fortunesRes = await api.get('/teller/fortunes/pending');
            setFortunes(fortunesRes.data);
        } catch (err) {
            console.error('Error fetching fortunes:', err);
        }

        try {
            const profileRes = await api.get('/user/profile/me');
            const tellerProfile = profileRes.data.profile?.fortuneTellerProfile;
            if (tellerProfile) {
                setStats({
                    totalReadings: tellerProfile.totalReadings || 0,
                    rating: tellerProfile.rating || 0,
                    earnedStardust: tellerProfile.earnedStardust || 0
                });
            }
        } catch (err) {
            console.error('Error fetching teller profile stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitInterpretation = async () => {
        if (!selectedFortune || !interpretation.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/teller/fortunes/interpret', {
                appointmentId: selectedFortune.id,
                interpretation
            });
            setInterpretation('');
            setSelectedFortune(null);
            showToast('Fal başarıyla yorumlandı! 🌟', 'success');
            fetchDashboardData();
        } catch (err) {
            console.error('Error submitting interpretation:', err);
            showToast('Fal gönderilirken bir hata oluştu.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (user?.role !== 'FORTUNE_TELLER') {
        return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Bu sayfaya sadece falcılar erişebilir.</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: 24, paddingBottom: 100, maxWidth: 600, margin: '0 auto', width: '100%' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <h1 className="glow-text" style={{ fontSize: 32, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Sparkles color="var(--accent-gold)" /> Kozmik Panelim
                </h1>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles color="var(--accent-gold)" size={20} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>{stats.totalReadings}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Toplam Fal</div>
                </motion.div>
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Star color="#facc15" size={20} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>{stats.rating.toFixed(1)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Ortalama Puan</div>
                </motion.div>
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 8, filter: 'drop-shadow(0 0 5px rgba(139,92,246,0.8))' }}>⭐</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.earnedStardust}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Kazanılan Toz</div>
                </motion.div>
            </div>

            <h2 style={{ fontSize: 20, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={20} color="var(--accent-pink)" /> Bekleyen İstekler
            </h2>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>Yıldızlar okunuyor...</div>
            ) : fortunes.length === 0 ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Sparkles size={40} style={{ margin: '0 auto 16px', color: 'rgba(255,255,255,0.2)' }} />
                    Şu an bekleyen fal isteği yok.<br />Yeni enerjiler yolda!
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {fortunes.map((fortune, idx) => (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={fortune.id}
                            className="glass-panel"
                            style={{ padding: 20, position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(139, 92, 246, 0.2)', padding: '6px 12px', borderBottomLeftRadius: 16, color: 'var(--accent-purple)', fontWeight: 'bold', fontSize: 13 }}>
                                +{fortune.stardustPrice} ⭐
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                <img loading="lazy" src={fortune.user.avatar ? `${BACKEND_URL}${fortune.user.avatar}` : `https://ui-avatars.com/api/?name=${fortune.user.name}&background=random`} alt="Avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139, 92, 246, 0.4)' }} />
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>{fortune.user.name || 'Gizemli Yabancı'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 8 }}>
                                        <span style={{ padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 12 }}>☀️ {fortune.user.sunSign}</span>
                                        <span style={{ padding: '2px 8px', background: 'rgba(139, 92, 246, 0.1)', color: '#a855f7', borderRadius: 12 }}>🌙 {fortune.user.moonSign}</span>
                                        <span style={{ padding: '2px 8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: 12 }}>⬆️ {fortune.user.risingSign}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                {fortune.fortuneType && (
                                    <div style={{ marginBottom: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent-pink)', background: 'rgba(236, 72, 153, 0.1)', padding: '4px 12px', borderRadius: 16 }}>
                                            {fortune.fortuneType === 'TAROT' ? '🃏 Tarot' :
                                                fortune.fortuneType === 'KAHVE' ? '☕ Kahve Falı' :
                                                    fortune.fortuneType === 'YILDIZNAME' ? '⭐ Yıldızname' : fortune.fortuneType}
                                        </span>
                                    </div>
                                )}
                                {fortune.question && (
                                    <div style={{ marginBottom: fortune.imageUrl ? 12 : 0 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Soru & Niyet:</span>
                                        <p style={{ color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.5 }}>"{fortune.question}"</p>
                                    </div>
                                )}
                                {fortune.imageUrl && (
                                    <div style={{ marginTop: 12 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Fincan / Görsel:</span>
                                        <img loading="lazy" src={`${BACKEND_URL}${fortune.imageUrl}`} alt="Fortune Image" style={{ height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => window.open(`${BACKEND_URL}${fortune.imageUrl}`, '_blank')} />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button
                                    className="primary-btn"
                                    style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    onClick={() => setSelectedFortune(fortune)}
                                >
                                    <Sparkles size={16} /> Falı Yorumla
                                </button>
                                <button
                                    className="secondary-btn"
                                    style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => navigate('/messages', { state: { openChatId: fortune.user.id } })}
                                    title="Mesaj Gönder"
                                >
                                    <MessageCircle size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal for Interpretation */}
            <AnimatePresence>
                {selectedFortune && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', padding: 16, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', padding: 24, display: 'flex', flexDirection: 'column', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}
                        >
                            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <Sparkles color="var(--accent-gold)" /> Yıldızların Mesajı
                            </h2>

                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                    <span style={{ color: 'white', fontWeight: 600 }}>{selectedFortune.user.name || 'Gizemli Yabancı'}</span> için yorumlanıyor
                                </div>
                                {selectedFortune.question && (
                                    <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid var(--accent-purple)', paddingLeft: 12, marginTop: 12 }}>
                                        "{selectedFortune.question}"
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
                                <textarea
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 12,
                                        padding: 16,
                                        color: 'white',
                                        outline: 'none',
                                        resize: 'none',
                                        flex: 1,
                                        minHeight: 200,
                                        fontSize: 14
                                    }}
                                    placeholder="Yıldızların mesajını buraya yaz... Gözden kaçan detayları vurgula, geleceğe ışık tut."
                                    value={interpretation}
                                    onChange={(e) => setInterpretation(e.target.value)}
                                // Removed tailwind className focus-ring, rely on traditional focus or existing global classes
                                />
                                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                                    {interpretation.length} karakter
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                                <button className="secondary-btn" style={{ flex: 1, padding: '12px 0' }} onClick={() => setSelectedFortune(null)}>İptal</button>
                                <button
                                    className="primary-btn"
                                    style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    onClick={handleSubmitInterpretation}
                                    disabled={submitting || interpretation.trim().length < 20}
                                >
                                    {submitting ? (
                                        <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%' }} />
                                    ) : (
                                        <><CheckCircle size={16} /> Gönder</>
                                    )}
                                </button>
                            </div>
                            {interpretation.trim().length > 0 && interpretation.trim().length < 20 && (
                                <p style={{ textAlign: 'center', color: 'var(--accent-pink)', fontSize: 12, marginTop: 12 }}>Yorumunuz en az 20 karakter olmalıdır.</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TellerDashboard;
