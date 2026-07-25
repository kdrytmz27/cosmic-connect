import React from 'react';
import { Crown, Infinity, Star, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CosmicVip: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        { icon: <Infinity className="text-[var(--accent-purple)]" />, text: "Sınırsız Astromatik Harita ve Uyum Analizi" },
        { icon: <Crown className="text-[var(--accent-gold)]" />, text: "Profilinde Özel 'Kozmik Taç' Rozeti" },
        { icon: <Zap className="text-[var(--accent-pink)]" />, text: "Günde 5 Kez 'Süper Beğeni' Hakkı" },
        { icon: <Star className="text-[var(--accent-gold)]" />, text: "Liderlik Tablosunda 2x XP Çarpanı" }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-[#050510] text-white overflow-y-auto w-full h-[100dvh]">
            <div className="w-full flex flex-col items-center py-8 px-4 pb-32 relative min-h-max">
            {/* Background Galactical Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent-pink)] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-4xl z-10 flex flex-col items-center">
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Crown size={28} className="text-[var(--accent-gold)]" />
                        <h1 className="text-2xl font-bold tracking-wider">KOZMİK VIP</h1>
                    </div>
                    <div className="w-10"></div> {/* Placeholder for flex balance */}
                </div>

                {/* Hero Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-gold)] via-white to-[var(--accent-pink)] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                        Evrenin Sırlarını Açığa Çıkar
                    </h2>
                    <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                        Sıradan eşleşmelerin ötesine geç. Kozmik VIP ile ruh eşini bulurken astrolojinin tüm gücünü arkana al.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                    {features.map((f, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md"
                        >
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                {f.icon}
                            </div>
                            <span className="font-medium text-sm md:text-base">{f.text}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Pricing Cards */}
                <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl justify-center items-stretch">
                    {/* Monthly Card */}
                    <motion.div 
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="flex-1 bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 flex flex-col relative overflow-hidden"
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-[var(--text-secondary)] mb-1">Aylık Döngü</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">₺149</span>
                                <span className="text-[var(--text-secondary)]">/ay</span>
                            </div>
                        </div>
                        <ul className="flex-1 flex flex-col gap-3 mb-6">
                            <li className="flex gap-2 items-start"><CheckCircle2 size={18} className="text-[var(--accent-purple)] shrink-0" /><span className="text-sm">Tüm VIP Özellikler</span></li>
                            <li className="flex gap-2 items-start"><CheckCircle2 size={18} className="text-[var(--accent-purple)] shrink-0" /><span className="text-sm">İstediğin an iptal et</span></li>
                        </ul>
                        <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold transition-all">
                            Aylık Başla
                        </button>
                    </motion.div>

                    {/* Annual Card (Popular) */}
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex-[1.2] bg-gradient-to-b from-[#2d1b4e] to-black border-2 border-[var(--accent-gold)] backdrop-blur-xl rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(255,215,0,0.15)] transform md:-translate-y-4"
                    >
                        <div className="absolute top-0 right-0 bg-[var(--accent-gold)] text-black font-bold text-xs px-4 py-1 rounded-bl-xl">EN ÇOK TERCİH EDİLEN</div>
                        <div className="mb-4 pt-2">
                            <h3 className="text-xl font-bold text-[var(--accent-gold)] mb-1">Yıllık Döngü</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-white">₺79</span>
                                <span className="text-[var(--text-secondary)]">/ay</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">Yıllık ₺948 tek çekim. %47 tasarruf et.</p>
                        </div>
                        <ul className="flex-1 flex flex-col gap-3 mb-6">
                            <li className="flex gap-2 items-start"><CheckCircle2 size={18} className="text-[var(--accent-gold)] shrink-0" /><span className="text-sm text-white">Tüm VIP Özellikler</span></li>
                            <li className="flex gap-2 items-start"><CheckCircle2 size={18} className="text-[var(--accent-gold)] shrink-0" /><span className="text-sm text-white">Öncelikli Müşteri Desteği</span></li>
                            <li className="flex gap-2 items-start"><CheckCircle2 size={18} className="text-[var(--accent-gold)] shrink-0" /><span className="text-sm text-white">Profiline +1000 Yıldız Tozu Hediyesi</span></li>
                        </ul>
                        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-pink)] text-black font-extrabold text-lg shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transition-all">
                            Kozmik VIP Ol
                        </button>
                    </motion.div>
                </div>
                
                <p className="text-center text-[10px] text-gray-500 mt-8 max-w-md">
                    Otomatik yenilenen abonelik, iTunes veya Google Play hesabınızdan tahsil edilecektir. Aboneliğinizi döngü bitiminden 24 saat öncesine kadar hesap ayarlarınızdan iptal edebilirsiniz.
                </p>
            </div>
        </div>
        </div>
    );
};

export default CosmicVip;
