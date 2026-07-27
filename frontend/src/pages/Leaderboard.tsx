import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/client';
import { BrandLoader } from '../components/BrandLoader';

interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string;
    score: number;
    rank: number;
    subtitle?: string;
    isPremium?: boolean;
}

const Leaderboard = () => {
    const { user } = useAuth();
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/user/leaderboard');
                if (res.data && res.data.leaderboard) {
                    const mappedLeaders = res.data.leaderboard.map((u: any, index: number) => ({
                        id: u.id,
                        name: u.name || 'Kozmik Yolcu',
                        avatar: u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BACKEND_URL}${u.avatar}`) : `https://ui-avatars.com/api/?name=${u.name || 'Kozmik'}&background=ddb8ff&color=000`,
                        score: u.xp, // We use XP for leaderboard ranking as returned by backend
                        rank: index + 1,
                        subtitle: `Seviye ${u.level || 1}`,
                        isPremium: !!u.isPremium
                    }));
                    setLeaders(mappedLeaders);
                }
            } catch (err) {
                console.error("Leaderboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const myRank = leaders.find(l => l.id === user?.id)?.rank || '+50';
    const myXp = leaders.find(l => l.id === user?.id)?.score || user?.xp || 0;

    // Split into top 3 and the rest
    const top3 = leaders.slice(0, 3);
    const rest = leaders.slice(3);

    // Reorder Top 3 for Podium (2nd, 1st, 3rd)
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

    if (loading) return <BrandLoader message="Evrensel sıralama yükleniyor..." />;

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-5xl mx-auto w-full pb-24 flex flex-col gap-section-gap h-full relative">
            {/* Header */}
            <header className="flex flex-col items-center text-center">
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center justify-center gap-3 mb-2">
                    <Trophy className="text-secondary" size={32} />
                    Kozmik Liderlik Tablosu
                </h1>
                <p className="font-body-md text-on-surface-variant">Evrenin en çok deneyim puanına (XP) sahip yolcuları</p>
            </header>

            <AnimatePresence mode="wait">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-10"
                >
                    {/* PODIUM SECTION */}
                    {podiumOrder.length > 0 && (
                        <div className="flex justify-center items-end h-[280px] gap-2 md:gap-6 mt-8">
                            {podiumOrder.map((leader, index) => {
                                // Default ordering when we have 3 items: [2nd, 1st, 3rd]
                                // If fewer than 3, we just display them.
                                // Üçüncülük ayrı bir bayrak istemiyor - birinci ve ikinci
                                // değilse stiller zaten bronza düşüyor.
                                let isFirst = false, isSecond = false;
                                if (podiumOrder.length === 3) {
                                    isFirst = index === 1;
                                    isSecond = index === 0;
                                } else {
                                    isFirst = index === 0;
                                    isSecond = index === 1;
                                }
                                
                                const height = isFirst ? 'h-[160px]' : isSecond ? 'h-[120px]' : 'h-[100px]';
                                const bgColor = isFirst ? 'bg-gradient-to-t from-secondary/40 to-secondary/10 border-secondary/50' : 
                                            isSecond ? 'bg-gradient-to-t from-zinc-300/40 to-zinc-300/10 border-zinc-300/50' : 
                                            'bg-gradient-to-t from-amber-700/40 to-amber-700/10 border-amber-700/50';
                                            
                                const rankColor = isFirst ? 'text-secondary drop-shadow-[0_0_10px_rgba(255,198,64,0.8)]' : 
                                                isSecond ? 'text-zinc-200 drop-shadow-[0_0_8px_rgba(228,228,231,0.6)]' : 
                                                'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]';

                                return (
                                    <Link key={leader.id} to={`/profile/${leader.id}`}>
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 + 0.2 }}
                                            className="flex flex-col items-center w-[100px] md:w-[140px] relative cursor-pointer hover:scale-105 transition-transform"
                                        >
                                            {/* Avatar & Crown */}
                                            <div className="relative mb-4 flex flex-col items-center">
                                                {isFirst && (
                                                    <motion.div 
                                                        initial={{ y: -10, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.8, type: 'spring' }}
                                                        className="absolute -top-10 z-20 text-secondary"
                                                    >
                                                        <Crown size={32} className="drop-shadow-[0_0_15px_rgba(255,198,64,0.8)]" />
                                                    </motion.div>
                                                )}
                                                <div className={`relative rounded-full p-1 ${isFirst ? 'bg-secondary' : isSecond ? 'bg-zinc-300' : 'bg-amber-600'} shadow-lg z-10`}>
                                                    <img src={leader.avatar} alt={leader.name} className={`rounded-full object-cover ${isFirst ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20'} border-4 border-background`} />
                                                </div>
                                                <div className={`absolute -bottom-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-background ${isFirst ? 'bg-secondary' : isSecond ? 'bg-zinc-300' : 'bg-amber-600'}`}>
                                                    {leader.rank}
                                                </div>
                                            </div>
                                            
                                            {/* Podium Block */}
                                            <div className={`w-full rounded-t-2xl border-t border-l border-r backdrop-blur-sm flex flex-col items-center justify-start pt-6 px-2 ${height} ${bgColor}`}>
                                                <h3 className="font-headline-sm text-center text-white truncate w-full px-1 flex items-center justify-center gap-1">
                                                    {leader.name} {leader.isPremium && <Crown size={14} className="text-[var(--accent-gold)]" />}
                                                </h3>
                                                <p className={`font-headline-md font-bold mt-1 ${rankColor}`}>
                                                    {leader.score} XP
                                                </p>
                                                {leader.isPremium && <span className="text-[8px] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] px-1.5 py-0.5 rounded-full mt-1 border border-[var(--accent-gold)]/30">2x Aktif</span>}
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* LIST SECTION */}
                    <div className="flex flex-col gap-3">
                        {rest.map((leader, i) => (
                            <Link key={leader.id} to={`/profile/${leader.id}`}>
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 + 0.5 }}
                                    className="bg-surface-container hover:bg-surface-container-highest border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-colors cursor-pointer"
                                >
                                    <div className="w-8 font-headline-md text-on-surface-variant font-bold text-center">
                                        #{leader.rank}
                                    </div>
                                    <img src={leader.avatar} alt={leader.name} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-headline-sm text-on-surface truncate flex items-center gap-2">
                                            {leader.name} {leader.isPremium && <Crown size={16} className="text-[var(--accent-gold)]" />}
                                        </h4>
                                        <p className="font-label-sm text-on-surface-variant truncate">{leader.subtitle}</p>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end">
                                        <p className="font-headline-sm text-primary font-bold">
                                            {leader.score} XP
                                        </p>
                                        {leader.isPremium && <span className="text-[10px] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] px-2 py-0.5 rounded-full mt-0.5 border border-[var(--accent-gold)]/30">2x Aktif</span>}
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                        {leaders.length === 0 && !loading && (
                            <p className="text-center text-on-surface-variant my-8">Henüz sıralamaya giren kimse yok.</p>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Sticky Current User Rank */}
            {user && (
                <div className="fixed bottom-[80px] md:bottom-6 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto md:min-w-[400px] z-40 p-4 md:p-0">
                    <Link to="/profile">
                        <div className="bg-primary/20 backdrop-blur-xl border border-primary/40 rounded-2xl p-4 flex items-center gap-4 shadow-[0_-10px_30px_rgba(147,51,234,0.2)] md:shadow-[0_10px_30px_rgba(147,51,234,0.3)] cursor-pointer hover:bg-primary/30 transition-colors">
                            <div className="w-8 font-headline-md text-primary font-bold text-center">
                                #{myRank}
                            </div>
                            <img src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`) : `https://ui-avatars.com/api/?name=${user?.name || 'Sen'}&background=ddb8ff&color=000`} alt="Sen" className="w-12 h-12 rounded-full border-2 border-primary object-cover" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-headline-sm text-white truncate">Sıralamanız (Siz)</h4>
                                <p className="font-label-sm text-primary/80 truncate">Seviye {user.level || 1}</p>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end">
                                <p className="font-headline-sm text-primary font-bold">
                                    {myXp} XP
                                </p>
                                {user.isPremium && <span className="text-[10px] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] px-2 py-0.5 rounded-full mt-0.5 border border-[var(--accent-gold)]/50">2x XP Aktif</span>}
                            </div>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
