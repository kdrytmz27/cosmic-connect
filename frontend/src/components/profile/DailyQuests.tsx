import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, CheckCircle2, Gift } from 'lucide-react';

export const DailyQuests = () => {
    const { showToast } = useToast();
    const { updateEconomy, stardustBalance } = useAuth();
    const [quests, setQuests] = useState<any>(null);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        fetchQuests();
    }, []);

    const fetchQuests = async () => {
        try {
            const res = await api.get('/quests');
            setQuests(res.data);
        } catch (err) {
            console.error('Failed to load quests', err);
        }
    };

    const handleClaim = async () => {
        if (claiming || !quests || quests.claimed) return;
        setClaiming(true);
        try {
            const res = await api.post('/quests/claim');
            showToast(`Görevler tamamlandı! +${quests.reward} Yıldız Tozu kazandın. 💫`, 'success');
            setQuests({ ...quests, claimed: true });
            if (res.data.remainingStardust !== undefined) {
                updateEconomy({ stardustBalance: res.data.remainingStardust });
            }
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Ödül alınamadı', 'error');
        } finally {
            setClaiming(false);
        }
    };

    if (!quests) return null;

    const matchesDone = quests.matches.current >= quests.matches.required;
    const messagesDone = quests.messages.current >= quests.messages.required;
    const allDone = matchesDone && messagesDone;

    return (
        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h3 style={{ fontSize: 16, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--accent-gold)" /> Günlük Kozmik Görevler
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {/* Quest 1 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={16} color={matchesDone ? 'var(--accent-gold)' : 'var(--text-secondary)'} />
                        <span style={{ fontSize: 13, color: matchesDone ? 'white' : 'var(--text-secondary)' }}>
                            1 Yeni Kullanıcıyla Eşleş
                        </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: matchesDone ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                        {quests.matches.current}/{quests.matches.required}
                    </span>
                </div>

                {/* Quest 2 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={16} color={messagesDone ? 'var(--accent-gold)' : 'var(--text-secondary)'} />
                        <span style={{ fontSize: 13, color: messagesDone ? 'white' : 'var(--text-secondary)' }}>
                            5 Mesaj Gönder
                        </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: messagesDone ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                        {quests.messages.current}/{quests.messages.required}
                    </span>
                </div>
            </div>

            <motion.button
                whileHover={allDone && !quests.claimed ? { scale: 1.02 } : {}}
                whileTap={allDone && !quests.claimed ? { scale: 0.98 } : {}}
                onClick={handleClaim}
                disabled={!allDone || quests.claimed || claiming}
                style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 16,
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: (!allDone || quests.claimed) ? 'not-allowed' : 'pointer',
                    background: quests.claimed ? 'rgba(74, 222, 128, 0.15)' : allDone ? 'linear-gradient(135deg, var(--accent-gold), #ff8c00)' : 'rgba(255,255,255,0.05)',
                    color: quests.claimed ? '#4ade80' : allDone ? 'black' : 'var(--text-secondary)',
                    transition: 'all 0.3s'
                }}
            >
                <Gift size={18} />
                {quests.claimed ? 'Görevler Tamamlandı' : allDone ? `${quests.reward} Toz Ödülünü Al` : 'Ödülü Almak İçin Görevleri Tamamla'}
            </motion.button>
        </div>
    );
};
