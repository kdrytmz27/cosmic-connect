import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { BACKEND_URL } from '../api/client';
import { SynastryChart } from '../components/SynastryChart';
import { BrandLoader } from '../components/BrandLoader';
import { useAuth } from '../context/AuthContext';

const ZODIAC_TR: Record<string, string> = {
    'Aries': 'Koç', 'Taurus': 'Boğa', 'Gemini': 'İkizler', 'Cancer': 'Yengeç',
    'Leo': 'Aslan', 'Virgo': 'Başak', 'Libra': 'Terazi', 'Scorpio': 'Akrep',
    'Sagittarius': 'Yay', 'Capricorn': 'Oğlak', 'Aquarius': 'Kova', 'Pisces': 'Balık'
};

const PLANET_TR: Record<string, string> = {
    'Sun': 'Güneş', 'Moon': 'Ay', 'Mercury': 'Merkür',
    'Venus': 'Venüs', 'Mars': 'Mars', 'Jupiter': 'Jüpiter', 'Saturn': 'Satürn'
};

const ASPECT_ICON: Record<string, string> = {
    'conjunction': 'radio_button_unchecked',
    'sextile': 'star_half',
    'square': 'crop_square',
    'trine': 'change_history',
    'opposition': 'compare_arrows'
};

const SynastryAnalysis = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chart' | 'categories' | 'aspects'>('chart');
    const { isPremium } = useAuth();
    const [isLimitReached, setIsLimitReached] = useState(false);

    useEffect(() => {
        if (!isPremium && id) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const cacheKey = `synastry_history_${today}`;
                const history = JSON.parse(localStorage.getItem(cacheKey) || '[]');
                
                if (!history.includes(id)) {
                    if (history.length >= 1) {
                        setIsLimitReached(true);
                    } else {
                        history.push(id);
                        localStorage.setItem(cacheKey, JSON.stringify(history));
                    }
                }
            } catch (err) {
                console.error("Localstorage limit check error", err);
            }
        }
    }, [isPremium, id]);

    useEffect(() => {
        if (id) {
            api.get(`/user/synastry/${id}`).then(res => {
                setData(res.data);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return <BrandLoader message="Synastri haritanız hesaplanıyor..." />;
    }

    if (!data || !data.report || !data.user1 || !data.user2) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">error_outline</span>
                </div>
                <p className="font-body-md text-on-surface-variant">Synastri verisi bulunamadı veya henüz hazır değil.</p>
                <button onClick={() => navigate(-1)} className="bg-primary-container text-on-primary-container font-label-md px-6 py-2 rounded-full hover:bg-inverse-primary transition-colors">
                    Geri Dön
                </button>
            </div>
        );
    }

    const { report, user1, user2 } = data;
    const score = report.overallScore || 0;
    const scoreColor = score >= 75 ? 'text-tertiary' : score >= 50 ? 'text-secondary' : 'text-error';
    const scoreHex = score >= 75 ? '#3cddc7' : score >= 50 ? '#ffc640' : '#ffb4ab';

    const tabs = [
        { key: 'chart' as const, label: 'Harita' },
        { key: 'categories' as const, label: 'Kategoriler' },
        { key: 'aspects' as const, label: 'Açılar' }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-10 pb-8 relative">
            
            {isLimitReached && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050510]/80 backdrop-blur-xl rounded-3xl p-8 text-center border border-[var(--accent-gold)] mt-20" style={{ height: 'max-content', paddingBottom: '100px' }}>
                    <div className="w-20 h-20 bg-[var(--accent-gold)]/20 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-[var(--accent-gold)]">workspace_premium</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-4">Günlük Analiz Limitine Ulaştınız</h2>
                    <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                        Standart kullanıcılar günde 1 kez harita uyum analizi yapabilir. Kozmik VIP ayrıcalıklarına geçerek istediğiniz kadar kişiyle sınırsız analiz yapabilirsiniz.
                    </p>
                    <button onClick={() => navigate('/vip')} className="w-full md:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-pink)] text-black font-extrabold text-lg shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transition-all">
                        Kozmik VIP Ol
                    </button>
                    <button onClick={() => navigate(-1)} className="mt-6 font-bold text-white/50 hover:text-white transition-colors">
                        Geri Dön
                    </button>
                </div>
            )}

            <div className={`flex flex-col gap-10 transition-all w-full ${isLimitReached ? 'blur-xl opacity-40 pointer-events-none' : ''}`}>
            
            {/* Synastry Header & Visuals */}
            <section className="flex flex-col items-center justify-center relative">
                <div className="text-center mb-10">
                    <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Burç Uyumu</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Synastry Analizi</p>
                </div>

                <div className="flex items-center justify-center gap-4 w-full relative">
                    {/* User 1 Avatar */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-primary-container z-10 shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                        <img 
                            className="w-full h-full object-cover" 
                            src={user1.avatar ? (user1.avatar.startsWith('http') ? user1.avatar : `${BACKEND_URL}${user1.avatar}`) : `https://ui-avatars.com/api/?name=${user1.name}&background=9333ea&color=fff&bold=true`} 
                            alt={user1.name} 
                        />
                    </div>

                    {/* Circular Progress (Uyum Oranı) */}
                    <div className="z-20 -mx-6 md:-mx-8">
                        <div 
                            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(255,198,64,0.3)]"
                            style={{ background: `conic-gradient(${scoreHex} ${score * 3.6}deg, rgba(255,255,255,0.1) 0deg)` }}
                        >
                            <div className="absolute w-[104px] h-[104px] rounded-full bg-background"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className={`font-headline-lg text-headline-lg ${scoreColor}`}>%{score}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Uyum</span>
                            </div>
                        </div>
                    </div>

                    {/* User 2 Avatar */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-secondary z-10 shadow-[0_0_20px_rgba(255,198,64,0.4)]">
                        <img 
                            className="w-full h-full object-cover" 
                            src={user2.avatar ? (user2.avatar.startsWith('http') ? user2.avatar : `${BACKEND_URL}${user2.avatar}`) : `https://ui-avatars.com/api/?name=${user2.name}&background=e3aa00&color=fff&bold=true`} 
                            alt={user2.name} 
                        />
                    </div>

                    {/* Decorative Connection Line */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1 bg-gradient-to-r from-primary-container via-secondary to-primary-container opacity-30 blur-sm rounded-full -z-10"></div>
                </div>

                {/* Names under avatars */}
                <div className="flex items-center justify-between w-full max-w-sm mt-4">
                    <div className="flex flex-col items-center flex-1">
                        <span className="font-label-md text-primary capitalize truncate max-w-[100px]">{user1.name}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{ZODIAC_TR[user1.sunSign] || user1.sunSign}</span>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="font-label-md text-secondary capitalize truncate max-w-[100px]">{user2.name}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{ZODIAC_TR[user2.sunSign] || user2.sunSign}</span>
                    </div>
                </div>

                <div className="mt-8 text-center max-w-md">
                    <p className="font-body-md text-body-md text-on-surface">{report.summary}</p>
                </div>
            </section>

            {/* Tabs */}
            <div className="flex justify-between items-center border-b border-white/10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2">
                {tabs.map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`font-label-md text-label-md py-2 px-4 flex-1 text-center transition-all rounded-lg relative ${
                            activeTab === tab.key 
                            ? 'text-primary bg-white/5' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></div>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* Chart Tab */}
                {activeTab === 'chart' && (
                    <motion.section
                        key="chart"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-10 w-full"
                    >
                        {/* Synastry Wheel */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center w-full relative pt-8">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-container/10 via-transparent to-transparent opacity-50 pointer-events-none rounded-2xl"></div>
                            
                            <div className="relative w-full max-w-[320px] md:max-w-[400px] aspect-square flex items-center justify-center z-10">
                                <SynastryChart
                                    user1Planets={report.user1Planets}
                                    user2Planets={report.user2Planets}
                                    user1Name={user1.name}
                                    user2Name={user2.name}
                                />
                            </div>
                        </div>

                        {/* Chart Info Banner */}
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary shrink-0">info</span>
                            <p className="font-body-sm text-on-surface-variant">
                                <strong className="text-primary">İç çember sizi</strong>, <strong className="text-secondary">dış çember partnerinizi</strong> temsil eder. Gezegenlerin birbirine olan açıları potansiyel uyumunuzu belirler.
                            </p>
                        </div>

                        {/* Planet positions table */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-primary-container/5 border border-primary-container/15 rounded-xl p-4">
                                <h5 className="font-label-md text-primary mb-3 text-center capitalize">{user1.name}</h5>
                                {report.user1Planets.map((p: any) => (
                                    <div key={p.planet} className="flex justify-between items-center font-label-sm text-on-surface-variant py-1">
                                        <span>{PLANET_TR[p.planet]}</span>
                                        <span className="text-on-surface font-medium">{ZODIAC_TR[p.sign]} {Math.round(p.degree)}°</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-secondary-container/5 border border-secondary-container/15 rounded-xl p-4">
                                <h5 className="font-label-md text-secondary mb-3 text-center capitalize">{user2.name}</h5>
                                {report.user2Planets.map((p: any) => (
                                    <div key={p.planet} className="flex justify-between items-center font-label-sm text-on-surface-variant py-1">
                                        <span>{PLANET_TR[p.planet]}</span>
                                        <span className="text-on-surface font-medium">{ZODIAC_TR[p.sign]} {Math.round(p.degree)}°</span>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </motion.section>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <motion.section
                        key="categories"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-4 w-full"
                    >
                        {report.categories.map((cat: any, i: number) => {
                            const catColor = cat.score >= 75 ? '#3cddc7' : cat.score >= 50 ? '#ffc640' : '#ffb4ab';
                            return (
                                <motion.div
                                    key={cat.nameEn}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{cat.emoji}</span>
                                            <h3 className="font-label-md text-on-surface">{cat.name}</h3>
                                        </div>
                                        <span className="font-headline-md text-headline-md" style={{ color: catColor }}>{cat.score}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cat.score}%` }}
                                            transition={{ duration: 1, delay: i * 0.08 + 0.3 }}
                                            className="h-full rounded-full"
                                            style={{ background: `linear-gradient(90deg, ${catColor}80, ${catColor})` }}
                                        />
                                    </div>
                                    <p className="font-body-md text-body-md text-on-surface-variant">{cat.description}</p>
                                </motion.div>
                            );
                        })}
                    </motion.section>
                )}

                {/* Aspects Tab */}
                {activeTab === 'aspects' && (
                    <motion.section
                        key="aspects"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-3 w-full"
                    >
                        <p className="font-label-sm text-label-sm text-on-surface-variant text-center mb-2">
                            Toplam {report.aspects.length} açı tespit edildi
                        </p>
                        {report.aspects.map((asp: any, i: number) => {
                            const isHarmonious = asp.nature === 'harmonious';
                            const isChallenging = asp.nature === 'challenging';
                            const color = isHarmonious ? '#3cddc7' : isChallenging ? '#ffb4ab' : '#ffc640';
                            const label = isHarmonious ? 'Uyumlu' : isChallenging ? 'Zorlayıcı' : 'Nötr';
                            return (
                                <motion.div
                                    key={`${asp.planet1}-${asp.planet2}-${asp.type}-${i}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                                    style={{ borderLeft: `3px solid ${color}` }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]" style={{ color }}>{ASPECT_ICON[asp.type] || 'circle'}</span>
                                            <span className="font-label-md text-on-surface">
                                                {PLANET_TR[asp.planet1]} — {PLANET_TR[asp.planet2]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-label-sm text-on-surface-variant">{asp.angle}°</span>
                                            <span className="font-label-sm px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{label}</span>
                                        </div>
                                    </div>
                                    <p className="font-body-md text-body-md text-on-surface-variant">{asp.interpretation}</p>
                                </motion.div>
                            );
                        })}
                    </motion.section>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};

export default SynastryAnalysis;
