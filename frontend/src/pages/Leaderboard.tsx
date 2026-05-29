import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader, Crown } from 'lucide-react';
import api, { BACKEND_URL } from '../api/client';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/user/leaderboard');
            setLeaders(res.data.leaderboard || []);
        } catch (error) {
            console.error('Failed to load leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const getCosmicTitle = (lv: number) => {
        if (lv <= 5) return 'Yıldız Tozu Çırağı';
        if (lv <= 15) return 'Gece Bekçisi';
        if (lv <= 30) return 'Astral Yolcu';
        if (lv <= 50) return 'Galaksi Rehberi';
        return 'Kozmik Efendi';
    };

    const getRankStyle = (index: number) => {
        switch (index) {
            case 0: return { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.5)', icon: <Crown size={20} color="#ffd700" /> };
            case 1: return { color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)', border: '1px solid rgba(192,192,192,0.5)', icon: <Crown size={18} color="#c0c0c0" /> };
            case 2: return { color: '#cd7f32', bg: 'rgba(205,127,50,0.15)', border: '1px solid rgba(205,127,50,0.5)', icon: <Crown size={16} color="#cd7f32" /> };
            default: return { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', icon: <span style={{ fontWeight: 'bold' }}>{index + 1}</span> };
        }
    };

    return (
        <div style={{ padding: '24px 16px', maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={fetchLeaderboard} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', padding: 8 }}>
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                    <Loader className="animate-spin text-accent" size={32} />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                    {leaders.map((user, index) => {
                        const style = getRankStyle(index);
                        return (
                            <motion.div
                                key={user.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/profile/${user.id}`)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    background: style.bg,
                                    border: style.border,
                                    padding: '12px 16px',
                                    borderRadius: 16,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ width: 30, display: 'flex', justifyContent: 'center', color: style.color }}>
                                    {style.icon}
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${style.color}` }}>
                                    <img loading="lazy" src={user.avatar ? `${BACKEND_URL}${user.avatar}` : `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {user.name || 'Gizemli Kozmik'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lvl {user.level || 1} • {getCosmicTitle(user.level || 1)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--accent-gold)' }}>{user.xp || 0} XP</div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {leaders.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                            Henüz liderlik tablosu oluşmadı. İlk sen ol!
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Leaderboard;
