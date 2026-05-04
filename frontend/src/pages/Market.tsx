import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Sparkles, Crown, Zap, Clock, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Market = () => {
    const { isPremium, stardustBalance, updateEconomy } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const buyStardust = async (amount: number) => {
        setLoading(true);
        try {
            const res = await api.post('/premium/buy-stardust', { amount });
            updateEconomy({ stardustBalance: res.data.balance });
            showToast(`${amount} Yıldız Tozu başarıyla eklendi!`, 'success');
        } catch (e) {
            // Toast will be shown by interceptor
        } finally {
            setLoading(false);
        }
    };

    const claimDailyReward = async () => {
        setLoading(true);
        try {
            const res = await api.post('/user/daily-reward/claim');
            updateEconomy({ stardustBalance: res.data.newBalance });
            showToast(`Günlük ödül alındı! +${res.data.rewardAmount} Yıldız Tozu 🌟 (${res.data.streak}. Gün Serisi)`, 'success');
        } catch (e) {
            // Toast will be shown by interceptor
        } finally {
            setLoading(false);
        }
    };

    const subscribePremium = async () => {
        setLoading(true);
        try {
            await api.post('/premium/buy-premium');
            updateEconomy({ isPremium: true });
            showToast('Premium aboneliğiniz başlatıldı! Teşekkürler.', 'success');
        } catch (e) {
            showToast('Premium alınamadı.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 16, paddingBottom: 100, minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="glow-text" style={{ fontSize: 28, margin: 0 }}>Market & Premium</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20 }}>
                    <Sparkles size={16} color="var(--accent-gold)" />
                    <span style={{ fontWeight: 'bold' }}>{stardustBalance}</span>
                </div>
            </div>

            {/* Daily Reward Section */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={claimDailyReward}
                className="glass-panel"
                style={{ padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.15))', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 12, background: 'rgba(56,189,248,0.2)', borderRadius: 12 }}>
                        <Sparkles size={24} color="#38bdf8" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, color: 'white' }}>Günlük Ödül</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Her gün gir, yıldız tozlarını topla!</p>
                    </div>
                </div>
                <button disabled={loading} style={{ background: '#38bdf8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, fontWeight: 'bold', cursor: 'pointer' }}>
                    Topla
                </button>
            </motion.div>

            {/* Premium Section */}
            <motion.div
                animate={isPremium ? {} : {
                    boxShadow: ['0 0 15px rgba(255,215,0,0)', '0 0 15px rgba(255,215,0,0.3)', '0 0 15px rgba(255,215,0,0)']
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="glass-panel shine-card"
                style={{ padding: 24, marginBottom: 24, overflow: 'hidden', position: 'relative', border: isPremium ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)', background: isPremium ? 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(0,0,0,0))' : undefined }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Crown size={32} color={isPremium ? "var(--accent-gold)" : "white"} />
                    <h2 style={{ fontSize: 22, margin: 0, color: isPremium ? 'var(--accent-gold)' : 'white' }}>Cosmic Premium</h2>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Check size={18} color="var(--accent-gold)" /> Sınırsız günlük eşleşme (Kaydırma)</motion.li>
                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Check size={18} color="var(--accent-gold)" /> Günde 5 bedava Süper Beğeni</motion.li>
                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Check size={18} color="var(--accent-gold)" /> Günde 10 defa bedava Ek Süre (Maçlarda)</motion.li>
                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Check size={18} color="var(--accent-gold)" /> 320 saniyelik uzun eşleşme süresi</motion.li>
                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Check size={18} color="var(--accent-gold)" /> Yeni kişileri bulanıklık olmadan görme</motion.li>
                </ul>

                {isPremium ? (
                    <div style={{ padding: 12, background: 'rgba(255,215,0,0.2)', borderRadius: 12, textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                        Premium Aktif ✨
                    </div>
                ) : (
                    <button
                        disabled={loading}
                        onClick={subscribePremium}
                        className="btn-primary"
                        style={{ width: '100%', background: 'linear-gradient(45deg, var(--accent-gold), #ff8c00)', color: 'white' }}>
                        Premium'a Geç (Demo: Ücretsiz)
                    </button>
                )}
            </motion.div>

            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Yıldız Tozu Al</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                    { amount: 500, price: '₺19.99', icon: <Sparkles size={24} color="var(--accent-gold)" /> },
                    { amount: 1500, price: '₺49.99', icon: <Zap size={24} color="var(--accent-pink)" /> },
                    { amount: 5000, price: '₺129.99', icon: <Crown size={24} color="var(--accent-purple)" /> },
                    { amount: 10000, price: '₺199.99', icon: <Clock size={24} color="var(--text-primary)" /> },
                ].map((pack, idx) => (
                    <motion.div key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        className="glass-panel shine-card"
                        style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}
                    >
                        {pack.icon}
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>{pack.amount}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Yıldız Tozu</div>
                        <button
                            disabled={loading}
                            onClick={() => buyStardust(pack.amount)}
                            style={{ marginTop: 8, background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px 16px', borderRadius: 20, color: 'white', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>
                            {pack.price}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Test Helper */}
            <div style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>Geliştirici Test Miktarı: Bedava</p>
                <button
                    disabled={loading}
                    onClick={() => buyStardust(10000)}
                    style={{ background: 'transparent', border: '1px dashed var(--accent-gold)', color: 'var(--accent-gold)', padding: 12, borderRadius: 12, width: '100%', marginTop: 8, cursor: 'pointer' }}>
                    +10.000 Yıldız Tozu Ekle (Demo)
                </button>
            </div>
        </div >
    );
};

export default Market;
