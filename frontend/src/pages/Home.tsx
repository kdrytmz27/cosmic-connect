import { useEffect, useState, useCallback, useRef } from 'react';
import api, { BACKEND_URL } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLoader } from '../components/BrandLoader';
import { PremiumModal } from '../components/common/PremiumModal';

import { HomeFilters } from '../components/home/HomeFilters';
import { MatchDetailModal } from '../components/home/MatchDetailModal';
import { DailyRewardModal } from '../components/home/DailyRewardModal';
import { DailyTarotModal } from '../components/home/DailyTarotModal';
import { VenusRetroModal } from '../components/home/VenusRetroModal';
import { DailyHoroscopeModal } from '../components/home/DailyHoroscopeModal';
import { translateZodiac } from '../utils/zodiac';
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
    const [, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [showDailyReward, setShowDailyReward] = useState(false);
    const [dailyStreak, setDailyStreak] = useState(0);
    const [claimingReward, setClaimingReward] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    // New Modals State
    const [showHoroscopeModal, setShowHoroscopeModal] = useState(false);
    const [showTarotModal, setShowTarotModal] = useState(false);
    const [showVenusModal, setShowVenusModal] = useState(false);

    const [filters, setFilters] = useState({
        minAge: '', maxAge: '', gender: 'ALL', minScore: ''
    });

    const loadMatches = useCallback(async (pageNum: number, isNew: boolean) => {
        if (isNew) {
            setLoading(true);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params: any = { page: pageNum, limit: 12 };
            if (filters.minAge) params.minAge = filters.minAge;
            if (filters.maxAge) params.maxAge = filters.maxAge;
            if (filters.gender !== 'ALL') params.gender = filters.gender;
            if (filters.minScore) params.minScore = filters.minScore;

            const res = await api.get('/user/daily-match', { params });

            if (res.data) {
                if (res.data.matches) {
                    if (res.data.matches.length < 12) setHasMore(false);
                    if (isNew) setMatches(res.data.matches);
                    else {
                        setMatches(prev => {
                            const newMatches = res.data.matches.filter(
                                (m: any) => !prev.some((p: any) => p.match.id === m.match.id)
                            );
                            return [...prev, ...newMatches];
                        });
                    }
                } else {
                    setHasMore(false);
                }

                updateEconomy({
                    stardustBalance: res.data.stardustBalance,
                    isPremium: res.data.isPremium,
                    dailySwipes: res.data.dailySwipes
                });

            } else if (res.data?.message && isNew) {
                setMatches([]);
                setHasMore(false);
            }
        } catch (err) {
            if (isNew) showToast('Bağlantı hatası.', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filters, updateEconomy, showToast]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
                    setPage(prev => {
                        const next = prev + 1;
                        loadMatches(next, false);
                        return next;
                    });
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loadMoreAnchorRef.current) {
            observer.observe(loadMoreAnchorRef.current);
        }

        return () => observer.disconnect();
    }, [loading, loadingMore, hasMore, loadMatches]);

    useEffect(() => {
        api.get('/horoscope/today').then(res => setDailyHoroscope(res.data)).catch(console.error);
        loadMatches(1, true);

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
        setPage(1);
        loadMatches(1, true);
    };

    const handleRefresh = () => {
        setPage(1);
        loadMatches(1, true);
        showToast('Yıldızlar yeniden diziliyor...', 'success');
    };

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

    const handleSendLike = async (targetId: string) => {
        setActionLoading(true);
        try {
            const res = await api.post('/user/friend', { receiverId: targetId });
            showToast(res.data.matched ? 'Eşleşme oluştu! 💛' : 'Beğeni gönderildi 💫', 'success');
            setMatches(matches.filter(m => m.match.id !== targetId));
            setSelectedUser(null);
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Beğeni gönderilemedi', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return { hex: '#3cddc7', tw: 'text-tertiary', offset: 25.12 }; // %90
        if (score >= 80) return { hex: '#ddb8ff', tw: 'text-primary', offset: 50.24 }; // %80
        if (score >= 60) return { hex: '#ffc640', tw: 'text-secondary', offset: 100.48 }; // %60
        return { hex: '#ffb4ab', tw: 'text-error', offset: 150 }; // low
    };

    return (
        <div className="w-full">
            {/* Action Bar */}
            <div className="flex justify-end mb-4 gap-2">
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
                </button>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined">tune</span>
                </button>
            </div>

            <HomeFilters
                showFilters={showFilters}
                filters={filters}
                setFilters={setFilters}
                applyFilters={applyFilters}
            />

            {/* Quick Actions Grid */}
            <section className="grid grid-cols-4 gap-2 md:gap-4 mb-8 mt-4">
                <button onClick={() => setShowHoroscopeModal(true)} className="glass-card flex flex-col items-center justify-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all glow-hover group bg-white/5 border border-white/10">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant text-center leading-tight">Günlük<br/>Yorum</span>
                </button>
                <button onClick={() => setShowTarotModal(true)} className="glass-card flex flex-col items-center justify-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all glow-hover group bg-white/5 border border-white/10">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-tertiary text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cards</span>
                    </div>
                    <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant text-center leading-tight">Tarot<br/>Açılımı</span>
                </button>
                <button onClick={() => navigate('/match')} className="glass-card flex flex-col items-center justify-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all glow-hover group bg-white/5 border border-white/10">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-error-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-error text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                    <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant text-center leading-tight">Aşk<br/>Uyumu</span>
                </button>
                <button onClick={() => setShowVenusModal(true)} className="glass-card flex flex-col items-center justify-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all glow-hover group bg-white/5 border border-white/10">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-secondary text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                    </div>
                    <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant text-center leading-tight">Venüs<br/>Retrosu</span>
                </button>
            </section>

            {/* Profile Discovery Grid */}
            {loading ? (
                <BrandLoader message="Yıldızlar hizalanıyor..." />
            ) : matches.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center mt-6">
                    <span className="material-symbols-outlined text-secondary text-5xl mb-4">stars</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Sonuç Yok</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Filtrelerine uygun kozmik bağ bulunamadı.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {matches.map((item, index) => {
                            const userName = item.match.name || item.match.email?.split('@')[0] || 'Yabancı';
                            const avatar = item.match.avatar ? (item.match.avatar.startsWith('http') ? item.match.avatar : `${BACKEND_URL}${item.match.avatar}`) : `https://ui-avatars.com/api/?name=${userName}&background=6d28d9&color=fff&bold=true`;
                            const score = item.score || 0;
                            const scoreObj = getScoreColor(score);
                            const dashoffset = 251.2 - (251.2 * (score / 100)); // Calculate exact offset for circle

                            return (
                                <motion.div
                                    key={item.match.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="glass-card rounded-2xl overflow-hidden relative group aspect-[3/4] bg-white/5 border border-white/10 cursor-pointer"
                                    onClick={() => setSelectedUser(item)}
                                >
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-screen transition-transform duration-700 group-hover:scale-105" 
                                        style={{ backgroundImage: `url(${avatar})` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                                    
                                    <div className="relative z-10 p-3 md:p-4 h-full flex flex-col justify-between pointer-events-none">
                                        <div className="flex justify-end">
                                            <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-background/60 rounded-full backdrop-blur-md border border-white/10">
                                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" fill="none" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8"></circle>
                                                    <circle 
                                                        className={`progress-ring__circle ${scoreObj.tw} transition-all duration-1000`} 
                                                        cx="50" cy="50" fill="none" r="40" 
                                                        stroke={scoreObj.hex} 
                                                        strokeDasharray="251.2" 
                                                        strokeDashoffset={dashoffset} 
                                                        strokeWidth="8"
                                                    ></circle>
                                                </svg>
                                                <span className={`font-label-sm text-[10px] md:text-label-sm ${scoreObj.tw} font-bold`}>%{score}</span>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 className="font-headline-md text-lg md:text-headline-md text-on-surface mb-1 drop-shadow-md truncate">{userName}</h3>
                                            <div className="flex items-center gap-1 text-primary mb-2">
                                                <span className="material-symbols-outlined text-[14px] md:text-[16px]">stars</span>
                                                <p className="font-label-sm text-[10px] md:text-label-sm">{translateZodiac(item.match.sunSign) || 'Bilinmiyor'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Like Action */}
                                    <button 
                                        className="absolute bottom-3 md:bottom-4 right-3 md:right-4 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-primary/20 transition-all duration-300 group/heart shadow-[0_0_10px_rgba(147,51,234,0.2)] hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] z-20 pointer-events-auto"
                                        onClick={(e) => { e.stopPropagation(); handleSendLike(item.match.id); }}
                                    >
                                        <span className="material-symbols-outlined text-on-surface group-hover/heart:text-primary transition-colors text-[18px] md:text-[24px]">favorite</span>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <div ref={loadMoreAnchorRef} className="h-5 mt-5">
                {loadingMore && <div className="text-center text-on-surface-variant font-label-sm">Daha fazla yıldız aranıyor...</div>}
                {!hasMore && !loading && matches.length > 0 && <div className="text-center text-on-surface-variant font-label-sm mt-2">Gösterilecek başka ruh eşi kalmadı.</div>}
            </div>

            <MatchDetailModal
                selectedUser={selectedUser}
                onClose={() => setSelectedUser(null)}
                onSuperLike={sendSuperLike}
                onLike={handleSendLike}
                actionLoading={actionLoading}
                navigate={navigate}
                user={user}
            />

            <DailyHoroscopeModal
                isOpen={showHoroscopeModal}
                onClose={() => setShowHoroscopeModal(false)}
                dailyHoroscope={dailyHoroscope}
            />

            <DailyRewardModal
                showDailyReward={showDailyReward}
                onClose={() => setShowDailyReward(false)}
                dailyStreak={dailyStreak}
                handleClaimReward={handleClaimReward}
                claimingReward={claimingReward}
            />

            <DailyTarotModal
                isOpen={showTarotModal}
                onClose={() => setShowTarotModal(false)}
            />

            <VenusRetroModal
                isOpen={showVenusModal}
                onClose={() => setShowVenusModal(false)}
                sunSign={user?.sunSign}
            />

            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                title="Premium'a Yükselt"
                description="Sınırsız beğeni ve daha fazlası için Premium'a geçin!"
            />

            <div ref={loadMoreAnchorRef} className="h-20 w-full" />
        </div>
    );
};

export default Home;
