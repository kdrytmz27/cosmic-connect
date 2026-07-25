import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Purchases, type PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { premiumApi } from '../api/premium';

const Market = () => {
    const { isPremium, stardustBalance, updateEconomy } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // TEST ONLY - remove this handler and its button once manual QA is done.
    const handleDevAddStardust = async () => {
        try {
            const res = await premiumApi.devAddStardust();
            updateEconomy({ stardustBalance: res.data.stardustBalance });
            showToast('+10.000 Yıldız Tozu eklendi (test)', 'success');
        } catch (e: any) {
            showToast(e?.response?.data?.error || 'Test bakiyesi eklenemedi', 'error');
        }
    };

    const [stardustPackages, setStardustPackages] = useState<PurchasesPackage[]>([]);
    const [premiumPackage, setPremiumPackage] = useState<PurchasesPackage | null>(null);

    useEffect(() => {
        const loadOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current && offerings.current.availablePackages.length > 0) {
                    const packages = offerings.current.availablePackages;
                    setPremiumPackage(packages.find(p => p.identifier.toLowerCase().includes('premium')) || null);
                    setStardustPackages(packages.filter(p => !p.identifier.toLowerCase().includes('premium')));
                }
            } catch (e) {
                console.error("Error loading revenuecat offerings:", e);
            }
        };
        loadOfferings();
    }, []);

    const purchaseRevenueCatPackage = async (pack: PurchasesPackage) => {
        setLoading(true);
        try {
            await Purchases.purchasePackage({ aPackage: pack });
            showToast('Ödeme sistem tarafından onaylandıktan sonra bakiyenize eklenecek!', 'success');
        } catch (e: any) {
            if (!e.userCancelled) {
                showToast('Ödeme işlemi iptal edildi veya başarısız.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-7xl mx-auto w-full pb-24 flex flex-col gap-section-gap">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-secondary">shopping_bag</span>
                        Market
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                        Enerjini yenilemek ve falları yanıtlamak için Yıldız Tozu topla.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 bg-white/5 border border-secondary/30 px-4 py-2 rounded-full cursor-default">
                        <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                        <span className="font-label-md text-label-md text-secondary font-bold">{stardustBalance} Toz</span>
                    </div>
                    {/* TEST ONLY button - remove once manual QA is done */}
                    <button
                        onClick={handleDevAddStardust}
                        className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-2 rounded-full text-xs font-bold hover:bg-red-500/30 transition-colors"
                        title="TEST ONLY: +10.000 Yıldız Tozu ekle"
                    >
                        🧪 Test +10k
                    </button>
                </div>
            </header>

            {/* Main Content Area (Market + Slot Machine) */}
            <div className="flex flex-col lg:flex-row gap-section-gap">
                
                {/* Market Packages */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Premium Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl p-[1px] relative overflow-hidden ${isPremium ? 'opacity-80' : ''}`}
                        style={{ background: 'linear-gradient(135deg, #9333ea, #ffc640)' }}
                    >
                        {!isPremium && <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>}
                        <div className="w-full bg-surface-container-lowest rounded-[23px] p-8 relative z-10 backdrop-blur-3xl">
                            {!isPremium && <div className="absolute top-0 right-0 bg-secondary text-on-secondary text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-[22px]">EN POPÜLER</div>}
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                {/* Visual */}
                                <div className="w-28 h-28 relative flex items-center justify-center shrink-0">
                                    <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full"></div>
                                    <span className="material-symbols-outlined text-6xl text-secondary relative z-10 drop-shadow-[0_0_20px_rgba(255,198,64,0.6)]">workspace_premium</span>
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Cosmic Premium</h2>
                                    <ul className="space-y-2 mb-6">
                                        <li className="flex items-center gap-2 text-on-surface-variant font-body-md">
                                            <span className="material-symbols-outlined text-secondary text-sm">check_circle</span> Sınırsız Mesajlaşma
                                        </li>
                                        <li className="flex items-center gap-2 text-on-surface-variant font-body-md">
                                            <span className="material-symbols-outlined text-secondary text-sm">check_circle</span> Özel Fallarda Öncelik
                                        </li>
                                        <li className="flex items-center gap-2 text-on-surface-variant font-body-md">
                                            <span className="material-symbols-outlined text-secondary text-sm">check_circle</span> Premium Profil Rozeti
                                        </li>
                                    </ul>
                                    
                                    {isPremium ? (
                                        <div className="inline-block px-6 py-2 bg-secondary/20 text-secondary border border-secondary/50 rounded-full font-label-md font-bold">
                                            Premium Aktif ✨
                                        </div>
                                    ) : (
                                        <button 
                                            disabled={loading}
                                            onClick={() => premiumPackage ? purchaseRevenueCatPackage(premiumPackage) : navigate('/vip')}
                                            className="w-full md:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary-container font-label-md text-label-md font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {premiumPackage ? `Premium Al — ${premiumPackage.product.priceString}` : 'Ayrıcalıkları İncele ✨'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stardust Packages */}
                    <div className="grid grid-cols-2 gap-4">
                        {stardustPackages.length > 0 ? stardustPackages.map((pack, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center group cursor-pointer hover:bg-white/10 transition-colors"
                            >
                                <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all"></div>
                                    <span className="material-symbols-outlined text-4xl text-primary relative z-10 drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]">auto_awesome</span>
                                </div>
                                <h3 className="font-label-md text-label-md text-on-surface mb-1">{pack.product.title.split(' ')[0]}</h3>
                                <p className="font-label-sm text-label-sm text-on-surface-variant mb-4">Yıldız Tozu</p>
                                <button 
                                    disabled={loading}
                                    onClick={() => purchaseRevenueCatPackage(pack)}
                                    className="w-full py-2 px-4 rounded-full border border-white/20 text-on-surface font-label-sm hover:bg-white/5 transition-colors mt-auto"
                                >
                                    {pack.product.priceString}
                                </button>
                            </motion.div>
                        )) : (
                            <div className="col-span-2 text-center text-on-surface-variant py-8 bg-white/5 rounded-2xl border border-white/10">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_cart</span>
                                <p>Gerçek paketler yükleniyor veya servisler kapalı...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Market;
