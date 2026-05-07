import { useEffect, useState, useCallback, useRef } from 'react';
import './Home.css';
import { Sparkles, XCircle, Heart, SlidersHorizontal } from 'lucide-react';
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
    const { user, updateEconomy, isPremium, dailySwipes } = useAuth();
    const { showToast } = useToast();
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [swipeWarning, setSwipeWarning] = useState(false);
    const [exitDirections, setExitDirections] = useState<Record<string, 'left' | 'right' | 'up'>>({});

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

    const checkSwipeLimit = async () => {
        try {
            const res = await api.post('/premium/swipe');
            updateEconomy({ stardustBalance: res.data.remaining, dailySwipes: res.data.dailySwipes });
            return true;
        } catch (e: any) {
            if (e.response?.status === 403) {
                showToast('Yeterli Yıldız Tozun yok.', 'error');
                navigate('/market');
            }
            return false;
        }
    };

    const handleMatch = async (receiverId: string) => {
        if (!isPremium && dailySwipes >= 20 && !swipeWarning) {
            setSwipeWarning(true);
            setShowPremiumModal(true);
            return;
        }
        setActionLoading(true);
        try {
            const canSwipe = await checkSwipeLimit();
            if (!canSwipe) return;

            const res = await api.post('/user/friend', { receiverId });
            const matchedUser = matches.find(m => m.match.id === receiverId);
            setMatches(matches.filter(m => m.match.id !== receiverId));
            setExitDirections(prev => ({ ...prev, [receiverId]: 'right' }));
            setSelectedUser(null);
            setSwipeWarning(false);
            if (res.data.matched) {
                if (isPremium) {
                    showToast(`${matchedUser?.match?.name || 'Kullanıcı'} seni de beğeniyor! Eşleşmeler sekmesinden görebilirsin.`, 'success');
                } else {
                    showToast('Yeni bir kozmik eşleşmen var! ✨', 'success');
                }
            }
        } catch (err) {
            showToast('Eylem gerçekleştirilemedi', 'error');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePass = async (receiverId: string) => {
        if (!isPremium && dailySwipes >= 20 && !swipeWarning) {
            setSwipeWarning(true);
            setShowPremiumModal(true);
            return;
        }
        setActionLoading(true);
        try {
            const canSwipe = await checkSwipeLimit();
            if (!canSwipe) return;

            setExitDirections(prev => ({ ...prev, [receiverId]: 'left' }));
            setTimeout(() => setMatches(prev => prev.filter(m => m.match.id !== receiverId)), 10);
            setSelectedUser(null);
            setSwipeWarning(false);
        } catch (e) {
            showToast('Hata oluştu', 'error');
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const sendSuperLike = async (targetId: string) => {
        setActionLoading(true);
        try {
            await api.post('/premium/super-like', { targetId });
            setExitDirections(prev => ({ ...prev, [targetId]: 'up' }));
            setTimeout(() => setMatches(prev => prev.filter(m => m.match.id !== targetId)), 10);
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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 className="glow-text" style={{ fontSize: 28 }}>Keşfet</h1>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <AnimatePresence>
                        {matches.map((item) => {
                            const userName = item.match.name || item.match.email.split('@')[0];
                            const avatar = item.match.avatar ? `${BACKEND_URL}${item.match.avatar}` : `https://ui-avatars.com/api/?name=${userName}&background=random`;
                            const dir = exitDirections[item.match.id];
                            const exitVariant = dir === 'right' ? { x: 300, opacity: 0, rotate: 15 }
                                : dir === 'up' ? { y: -300, opacity: 0, scale: 1.1 }
                                    : { x: -200, opacity: 0, scale: 0.7 };

                            return (
                                <motion.div
                                    key={item.match.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={exitVariant}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className="glass-panel"
                                    style={{
                                        padding: 0, overflow: 'hidden', cursor: 'pointer',
                                        border: '1px solid rgba(255, 215, 0, 0.15)', borderRadius: 16,
                                        background: 'linear-gradient(180deg, rgba(30, 20, 45, 0.9) 0%, rgba(20, 10, 30, 0.95) 100%)',
                                    }}
                                    onClick={() => setSelectedUser(item)}
                                >
                                    {/* Avatar */}
                                    <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                                        <img
                                            src={avatar}
                                            alt={userName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {/* Uyum Skoru */}
                                        <div style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(0,0,0,0.6)', color: 'var(--accent-gold)',
                                            padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 'bold',
                                            border: '1px solid rgba(255,215,0,0.3)'
                                        }}>
                                            %{item.score}
                                        </div>
                                        {/* Alt Gradyan */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                                            padding: '24px 10px 10px', textAlign: 'left'
                                        }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 'bold', color: 'white', textTransform: 'capitalize', margin: 0, lineHeight: 1.2 }}>
                                                {userName}
                                            </h3>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                                                {item.match.sunSign} • {item.match.gender === 'MALE' ? 'Erkek' : item.match.gender === 'FEMALE' ? 'Kadın' : 'Diğer'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alt Aksiyon Butonları */}
                                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.3 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); handlePass(item.match.id); }}
                                            disabled={actionLoading}
                                            title="Geç"
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 6 }}
                                        >
                                            <XCircle size={20} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.3, rotate: 15 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); sendSuperLike(item.match.id); }}
                                            disabled={actionLoading}
                                            title="Süper Beğeni"
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: 6 }}
                                        >
                                            <Sparkles size={20} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.3 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); handleMatch(item.match.id); }}
                                            disabled={actionLoading}
                                            title="Beğen"
                                            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: 6 }}
                                        >
                                            <Heart size={20} fill="#34d399" />
                                        </motion.button>
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
                swipeWarning={swipeWarning}
                handlePass={handlePass}
                sendSuperLike={sendSuperLike}
                handleMatch={handleMatch}
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
