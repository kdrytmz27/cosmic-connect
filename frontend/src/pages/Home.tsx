import { useEffect, useState, useCallback, useRef } from 'react';
import './Home.css';
import { Sparkles, SlidersHorizontal, UserPlus } from 'lucide-react';
import api, { BACKEND_URL } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLoader } from '../components/BrandLoader';
import { PremiumModal } from '../components/common/PremiumModal';
import { DailyHoroscopeWidget } from '../components/home/DailyHoroscopeWidget';
import { HomeFilters } from '../components/home/HomeFilters';
import { MatchDetailModal } from '../components/home/MatchDetailModal';
import { DailyRewardModal } from '../components/home/DailyRewardModal';


const Home = () => {
    const navigate = useNavigate();
    const { user, updateEconomy } = useAuth();
    const { showToast } = useToast();
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [dailyHoroscope, setDailyHoroscope] = useState<any>(null);
    const loadMoreAnchorRef = useRef<HTMLDivElement>(null);

    const [showDailyReward, setShowDailyReward] = useState(false);
    const [dailyStreak, setDailyStreak] = useState(0);
    const [claimingReward, setClaimingReward] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const [filters, setFilters] = useState({
        minAge: '', maxAge: '', gender: 'ALL', minScore: ''
    });

    const loadMatches = useCallback(async (pageNum: number, isNew: boolean) => {
        if (isNew) setLoading(true);

        try {
            const params: any = { page: pageNum, limit: 12 };
            if (filters.minAge) params.minAge = filters.minAge;
            if (filters.maxAge) params.maxAge = filters.maxAge;
            if (filters.gender !== 'ALL') params.gender = filters.gender;
            if (filters.minScore) params.minScore = filters.minScore;

            const res = await api.get('/user/daily-match', { params });

            if (res.data) {
                if (res.data.matches) {
                    if (isNew) setMatches(res.data.matches);
                    else {
                        setMatches(prev => {
                            const newMatches = res.data.matches.filter(
                                (m: any) => !prev.some(p => p.match.id === m.match.id)
                            );
                            return [...prev, ...newMatches];
                        });
                    }
                }

                updateEconomy({
                    stardustBalance: res.data.stardustBalance,
                    isPremium: res.data.isPremium,
                    dailySwipes: res.data.dailySwipes
                });

            } else if (res.data?.message && isNew) {
                setMatches([]);
            }
        } catch (err) {
            if (isNew) showToast('Bağlantı hatası.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        api.get('/horoscope/today').then(res => setDailyHoroscope(res.data)).catch(console.error);
        loadMatches(1, true);

        // Daily Reward Check
        api.get('/user/daily-reward/status').then(res => {
            if (res.data.canClaim) {
                setDailyStreak(res.data.streak);
                setShowDailyReward(true);
            }
        }).catch(console.error);
    }, [loadMatches]);

    const handleClaimReward = async () => {
        setClaimingReward(true);
        try {
            const res = await api.post('/user/daily-reward/claim');
            updateEconomy({
                stardustBalance: res.data.stardustBalance
            });
            showToast(`Tebrikler! ${res.data.reward} Yıldız Tozu kazandın. (Seri: ${res.data.newStreak})`, 'success');
            setShowDailyReward(false);
        } catch (err) {
            showToast('Ödül alınamadı.', 'error');
        } finally {
            setClaimingReward(false);
        }
    };

    const applyFilters = () => {
        setShowFilters(false);
        loadMatches(1, true);
    };

    /* Swipe (Kaydırma) artık kullanılmıyor. Kullanıcı doğrudan "Arkadaşlık İsteği Gönderir" */

    const sendSuperLike = async (targetId: string) => {
        setActionLoading(true);
        try {
            await api.post('/premium/super-like', { targetId });
            setMatches(prev => prev.filter(m => m.match.id !== targetId));
            setSelectedUser(null);
            showToast('Süper Beğeni gönderildi! 🌟', 'success');
        } catch (e: any) {
            if (e.response?.status === 403) {
                showToast('Yeterli Yıldız Tozun yok.', 'error');
                navigate('/market');
            } else {
                showToast('Süper beğeni gönderilemedi.', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendFriendRequest = async (targetId: string) => {
        setActionLoading(true);
        try {
            const res = await api.post('/user/friend-request', { receiverId: targetId });
            showToast(res.data.autoAccepted ? 'Arkadaş oldunuz! ✨' : 'İstek gönderildi 💫', 'success');
            setMatches(matches.filter(m => m.match.id !== targetId));
            setSelectedUser(null);
        } catch (err: any) {
            if (err.response?.status === 403 && err.response?.data?.error?.includes('limit')) {
                showToast('Günlük arkadaşlık isteği limitine ulaştınız (5/5).', 'error');
            } else {
                showToast(err.response?.data?.error || 'İstek gönderilemedi', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ padding: 16, paddingBottom: 100, minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Sadece filtre butonu (başlık kaldırıldı) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: '50%', border: 'none', color: 'white' }}
                >
                    <SlidersHorizontal size={20} />
                </button>
            </div>

            <DailyHoroscopeWidget dailyHoroscope={dailyHoroscope} />

            <HomeFilters
                showFilters={showFilters}
                filters={filters}
                setFilters={setFilters}
                applyFilters={applyFilters}
            />

            {/* Kullanıcı Listesi */}
            {loading ? (
                <BrandLoader message="Yıldızlar hizalanıyor..." />
            ) : matches.length === 0 ? (
                <div className="glass-panel" style={{ padding: 32, textAlign: 'center', marginTop: 20 }}>
                    <Sparkles color="var(--accent-gold)" size={48} style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ marginBottom: 16 }}>Sonuç Yok</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Filtrelerine uygun ruh eşi bulunamadı.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <AnimatePresence>
                        {matches.map((item, index) => {
                            const userName = item.match.name || item.match.email?.split('@')[0] || 'Kozmik Yabancı';
                            const avatar = item.match.avatar ? `${BACKEND_URL}${item.match.avatar}` : `https://ui-avatars.com/api/?name=${userName}&background=6d28d9&color=fff&bold=true`;
                            const score = item.score || 0;
                            const scoreColor = score >= 80 ? '#34d399' : score >= 60 ? 'var(--accent-gold)' : '#a855f7';
                            return (
                                <motion.div
                                    key={item.match.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 280, damping: 22, delay: index * 0.04 }}
                                    style={{
                                        borderRadius: 18, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                                        border: `1px solid rgba(139, 92, 246, 0.2)`,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                        background: 'rgba(15, 8, 30, 0.9)',
                                    }}
                                    onClick={() => setSelectedUser(item)}
                                >
                                    {/* Fotoğraf */}
                                    <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                                        <img
                                            src={avatar}
                                            alt={userName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            loading="lazy"
                                        />
                                        {/* Üst gradient */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)'
                                        }} />
                                        {/* Alt gradient (bilgi alanı) */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                                            padding: '32px 10px 10px',
                                        }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', textTransform: 'capitalize', lineHeight: 1.2 }}>
                                                {userName}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                                                {item.match.sunSign}
                                            </div>
                                        </div>
                                        {/* Uyum Skoru badge */}
                                        <div style={{
                                            position: 'absolute', top: 8, left: 8,
                                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                            color: scoreColor, padding: '3px 7px', borderRadius: 10,
                                            fontSize: 10, fontWeight: 800,
                                            border: `1px solid ${scoreColor}44`,
                                        }}>
                                            %{score}
                                        </div>
                                        {/* Aksiyon butonları */}
                                        <div style={{
                                            position: 'absolute', top: 8, right: 8,
                                            display: 'flex', flexDirection: 'column', gap: 6
                                        }}>
                                            <motion.button
                                                whileTap={{ scale: 0.85 }}
                                                onClick={(e) => { e.stopPropagation(); sendSuperLike(item.match.id); }}
                                                disabled={actionLoading}
                                                style={{
                                                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                                                    border: '1px solid rgba(255,215,0,0.4)', borderRadius: '50%',
                                                    color: 'var(--accent-gold)', cursor: 'pointer', padding: 7,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Sparkles size={14} />
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.85 }}
                                                onClick={(e) => { e.stopPropagation(); handleSendFriendRequest(item.match.id); }}
                                                disabled={actionLoading}
                                                style={{
                                                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                                                    border: '1px solid rgba(52,211,153,0.4)', borderRadius: '50%',
                                                    color: '#34d399', cursor: 'pointer', padding: 7,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <UserPlus size={14} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

            )}

            <div ref={loadMoreAnchorRef} />

            <MatchDetailModal
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                user={user}
                actionLoading={actionLoading}
                sendSuperLike={sendSuperLike}
                handleSendFriendRequest={handleSendFriendRequest}
                navigate={navigate}
            />

            <DailyRewardModal
                showDailyReward={showDailyReward}
                dailyStreak={dailyStreak}
                claimingReward={claimingReward}
                handleClaimReward={handleClaimReward}
                onClose={() => setShowDailyReward(false)}
            />

            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                title="Premium'a Yükselt"
                description="Ücretsiz hakkınız bitti. Sıradaki her kaydırma 20 Yıldız Tozu alacaktır. Sınırsız kaydırma için Premium'a geçin!"
            />
        </div>
    );
};
export default Home;
