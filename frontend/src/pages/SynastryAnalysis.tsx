import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { BACKEND_URL } from '../api/client';
import { SynastryChart } from '../components/SynastryChart';

const ZODIAC_TR: Record<string, string> = {
    'Aries': 'Koç', 'Taurus': 'Boğa', 'Gemini': 'İkizler', 'Cancer': 'Yengeç',
    'Leo': 'Aslan', 'Virgo': 'Başak', 'Libra': 'Terazi', 'Scorpio': 'Akrep',
    'Sagittarius': 'Yay', 'Capricorn': 'Oğlak', 'Aquarius': 'Kova', 'Pisces': 'Balık'
};

const PLANET_TR: Record<string, string> = {
    'Sun': 'Güneş', 'Moon': 'Ay', 'Mercury': 'Merkür',
    'Venus': 'Venüs', 'Mars': 'Mars', 'Jupiter': 'Jüpiter', 'Saturn': 'Satürn'
};

const ASPECT_COLOR: Record<string, string> = {
    'harmonious': '#22c55e',
    'challenging': '#ef4444',
    'neutral': '#fbbf24'
};

const ASPECT_ICON: Record<string, string> = {
    'conjunction': '☌',
    'sextile': '⚹',
    'square': '□',
    'trine': '△',
    'opposition': '☍'
};

const SynastryAnalysis = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'chart' | 'categories' | 'aspects'>('chart');

    useEffect(() => {
        if (id) {
            api.get(`/user/synastry/${id}`).then(res => {
                setData(res.data);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                    <Sparkles size={40} color="var(--accent-gold)" />
                </motion.div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Synastri haritanız hesaplanıyor...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Synastri verisi bulunamadı.</p>
                <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 24px', borderRadius: 12, background: 'var(--accent-purple)', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Geri Dön
                </button>
            </div>
        );
    }

    const { report, user1, user2 } = data;
    const scoreColor = report.overallScore >= 75 ? '#22c55e' : report.overallScore >= 50 ? '#fbbf24' : '#ef4444';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: 16, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'var(--card-border)', padding: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'white' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="glow-text" style={{ fontSize: 24 }}>Synastri Analizi</h1>
            </div>

            {/* Users comparison header */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-panel"
                style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
                    {/* User 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid #ec4899' }}>
                            <img
                                src={user1.avatar ? `${BACKEND_URL}${user1.avatar}` : `https://ui-avatars.com/api/?name=${user1.name}&background=random`}
                                alt={user1.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ fontSize: 13, color: '#ec4899', fontWeight: 600, textTransform: 'capitalize' }}>{user1.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ZODIAC_TR[user1.sunSign] || user1.sunSign}</span>
                    </div>

                    {/* Overall score */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: `conic-gradient(${scoreColor} ${report.overallScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'var(--bg-color)', display: 'flex',
                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: 22, fontWeight: 'bold', color: scoreColor }}>{report.overallScore}</span>
                            <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>UYUMLULUK</span>
                        </div>
                    </motion.div>

                    {/* User 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid #fbbf24' }}>
                            <img
                                src={user2.avatar ? `${BACKEND_URL}${user2.avatar}` : `https://ui-avatars.com/api/?name=${user2.name}&background=random`}
                                alt={user2.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, textTransform: 'capitalize' }}>{user2.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ZODIAC_TR[user2.sunSign] || user2.sunSign}</span>
                    </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{report.summary}</p>
            </motion.div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                {[
                    { key: 'chart' as const, label: '🌌 Harita' },
                    { key: 'categories' as const, label: '📊 Kategoriler' },
                    { key: 'aspects' as const, label: '🔗 Açılar' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveSection(tab.key)}
                        style={{
                            flex: 1, padding: '10px 8px', border: 'none', background: 'transparent',
                            cursor: 'pointer', fontSize: 13, fontWeight: activeSection === tab.key ? 'bold' : 'normal',
                            color: activeSection === tab.key ? 'white' : 'var(--text-secondary)',
                            borderBottom: activeSection === tab.key ? '2px solid var(--accent-pink)' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* Chart Tab */}
                {activeSection === 'chart' && (
                    <motion.div
                        key="chart"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel"
                        style={{ padding: 24, marginBottom: 20 }}
                    >
                        <h3 style={{ fontSize: 16, color: 'white', marginBottom: 4, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Sparkles size={16} color="var(--accent-gold)" /> Synastri Çarkı
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20 }}>
                            İki haritanın gezegen konumları
                        </p>
                        <SynastryChart
                            user1Planets={report.user1Planets}
                            user2Planets={report.user2Planets}
                            user1Name={user1.name}
                            user2Name={user2.name}
                        />

                        {/* Planet positions table */}
                        <div style={{ marginTop: 24 }}>
                            <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>Gezegen Konumları</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {/* User 1 */}
                                <div style={{ background: 'rgba(236,72,153,0.08)', borderRadius: 12, padding: 12, border: '1px solid rgba(236,72,153,0.15)' }}>
                                    <h5 style={{ fontSize: 12, color: '#ec4899', marginBottom: 8, textAlign: 'center', textTransform: 'capitalize' }}>{user1.name}</h5>
                                    {report.user1Planets.map((p: any) => (
                                        <div key={p.planet} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)', padding: '3px 0' }}>
                                            <span>{PLANET_TR[p.planet]}</span>
                                            <span style={{ color: 'white', fontWeight: 500 }}>{ZODIAC_TR[p.sign]} {Math.round(p.degree)}°</span>
                                        </div>
                                    ))}
                                </div>
                                {/* User 2 */}
                                <div style={{ background: 'rgba(251,191,36,0.08)', borderRadius: 12, padding: 12, border: '1px solid rgba(251,191,36,0.15)' }}>
                                    <h5 style={{ fontSize: 12, color: '#fbbf24', marginBottom: 8, textAlign: 'center', textTransform: 'capitalize' }}>{user2.name}</h5>
                                    {report.user2Planets.map((p: any) => (
                                        <div key={p.planet} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)', padding: '3px 0' }}>
                                            <span>{PLANET_TR[p.planet]}</span>
                                            <span style={{ color: 'white', fontWeight: 500 }}>{ZODIAC_TR[p.sign]} {Math.round(p.degree)}°</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Categories Tab */}
                {activeSection === 'categories' && (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                        {report.categories.map((cat: any, i: number) => {
                            const catColor = cat.score >= 75 ? '#22c55e' : cat.score >= 50 ? '#fbbf24' : '#ef4444';
                            return (
                                <motion.div
                                    key={cat.nameEn}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-panel"
                                    style={{ padding: 20 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                                            <h3 style={{ fontSize: 15, color: 'white', fontWeight: 600 }}>{cat.name}</h3>
                                        </div>
                                        <span style={{ fontSize: 20, fontWeight: 'bold', color: catColor }}>{cat.score}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cat.score}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                                            style={{ height: '100%', background: `linear-gradient(90deg, ${catColor}80, ${catColor})`, borderRadius: 3 }}
                                        />
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{cat.description}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Aspects Tab */}
                {activeSection === 'aspects' && (
                    <motion.div
                        key="aspects"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8 }}>
                            Toplam {report.aspects.length} açı tespit edildi
                        </p>
                        {report.aspects.map((asp: any, i: number) => {
                            const color = ASPECT_COLOR[asp.nature] || '#888';
                            return (
                                <motion.div
                                    key={`${asp.planet1}-${asp.planet2}-${asp.type}-${i}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-panel"
                                    style={{ padding: 14, borderLeft: `3px solid ${color}` }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 16, color }}>{ASPECT_ICON[asp.type] || '●'}</span>
                                            <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>
                                                {PLANET_TR[asp.planet1]} {ASPECT_ICON[asp.type]} {PLANET_TR[asp.planet2]}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                                {asp.angle}° (orb: {asp.orb}°)
                                            </span>
                                            <span style={{
                                                fontSize: 10, padding: '2px 8px', borderRadius: 8,
                                                background: `${color}20`, color: color, fontWeight: 'bold'
                                            }}>
                                                {asp.nature === 'harmonious' ? 'Uyumlu' : asp.nature === 'challenging' ? 'Zorlayıcı' : 'Nötr'}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                                        {asp.interpretation}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SynastryAnalysis;
