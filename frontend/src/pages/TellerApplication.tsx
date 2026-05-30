import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { Sparkles, ArrowLeft, Loader, Check, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';

const FORTUNE_TYPES = [
    { code: 'TAROT', label: '🃏 Tarot Falı' },
    { code: 'KAHVE', label: '☕ Kahve Falı' },
    { code: 'EL', label: '🤚 El Falı' },
    { code: 'YILDIZNAME', label: '⭐ Yıldızname' },
    { code: 'RUNE', label: '🪨 Rune Falı' },
];

const EXPERIENCE_OPTIONS = [
    { value: 'Hobi / Amatör', label: 'Hobi / Amatör' },
    { value: '1-3 Yıl', label: '1-3 Yıl Deneyim' },
    { value: '3-5 Yıl', label: '3-5 Yıl Deneyim' },
    { value: '5+ Yıl (Profesyonel)', label: '5+ Yıl Profesyonel' },
];

const TellerApplication = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [appStatus, setAppStatus] = useState<string | null>(null);

    const [experience, setExperience] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    // Test mode - DISABLED for production. Only admins can approve via Admin Dashboard.
    const [isTestAdmin] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/teller/application-status');
                if (res.data.application) {
                    setAppStatus(res.data.application.status);
                }
            } catch (e) {
                console.error('Error fetching application status:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const toggleType = (code: string) => {
        setSelectedTypes(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const handleSubmit = async () => {
        if (!experience) {
            showToast('Lütfen deneyim sürenizi seçin.', 'error');
            return;
        }
        if (selectedTypes.length === 0) {
            showToast('Lütfen en az bir fal türü seçin.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/teller/apply', { experience, fortuneTypes: selectedTypes });
            showToast('Başvurunuz başarıyla alındı!', 'success');
            setAppStatus('PENDING');
        } catch (e: any) {
            showToast(e.response?.data?.error || 'Başvuru yapılamadı.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdminApprove = async () => {
        try {
            const res = await api.get('/teller/application-status');
            const appId = res.data.application?.id;
            if (!appId) return;

            await api.post('/teller/approve-application', { applicationId: appId, status: 'APPROVED' });
            await refreshUser();
            showToast('Başvuru onaylandı! Falcı paneliniz aktif.', 'success');
            setAppStatus('APPROVED');
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (e) {
            showToast('Onaylama hatası', 'error');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
                <Loader className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    if (user?.role === 'FORTUNE_TELLER' || appStatus === 'APPROVED') {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 24, paddingBottom: 100, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: 40, marginTop: 40 }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Check size={40} />
                    </div>
                    <h1 className="glow-text" style={{ fontSize: 24, marginBottom: 12 }}>Başlangıç Tamamlandı</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Zaten onaylanmış bir falcısın! Yıldızların rehberliği seninle olsun.</p>
                    <button onClick={() => navigate('/profile')} className="primary-btn w-full">Profilime Dön</button>
                </div>
            </motion.div>
        );
    }

    if (appStatus === 'PENDING') {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 24, paddingBottom: 100, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: 40, marginTop: 40 }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Clock size={40} />
                    </div>
                    <h1 className="glow-text" style={{ fontSize: 24, marginBottom: 12 }}>Başvurunuz İnceleniyor</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                        Falcı başvurunuz ekibimize ulaştı. Deneyimlerinizi detaylıca inceliyoruz. Lütfen beklemede kalın.
                    </p>
                    <button onClick={() => navigate('/profile')} className="secondary-btn w-full flex items-center justify-center gap-2">
                        <ArrowLeft size={18} /> Profilime Dön
                    </button>

                    {isTestAdmin && (
                        <div style={{ marginTop: 40, padding: 16, border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 }}>
                            <p style={{ fontSize: 12, color: '#fca5a5', marginBottom: 12 }}>(Test Modu) Başvuruyu anında onaylamak için tıklayın:</p>
                            <button onClick={handleAdminApprove} style={{ width: '100%', padding: '12px', background: '#dc2626', color: 'white', borderRadius: 8, fontWeight: 'bold' }}>
                                BAŞVURUYU ONAYLA
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    if (appStatus === 'REJECTED') {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 24, paddingBottom: 100, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: 40, marginTop: 40 }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <X size={40} />
                    </div>
                    <h1 className="glow-text" style={{ fontSize: 24, marginBottom: 12 }}>Başvuru Reddedildi</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Üzgünüz, başvurunuz mevcut kriterlerimize uymadığı için kabul edilemedi.</p>
                    <button onClick={() => navigate('/profile')} className="secondary-btn w-full flex items-center justify-center gap-2">
                        <ArrowLeft size={18} /> Profilime Dön
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'var(--card-border)', padding: 8, borderRadius: '50%', color: 'white' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="glow-text" style={{ fontSize: 24, margin: 0 }}>Falcı Başvurusu</h1>
            </div>

            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass-panel" style={{ padding: 32 }}>
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={20} color="var(--accent-purple)" /> Aramıza Katıl
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Kozmik yeteneklerini paylaşmak ister misin? Aşağıdaki bilgileri doldurarak başvurunu tamamlayabilirsin.
                    </p>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Deneyim Süreniz</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {EXPERIENCE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setExperience(opt.value)}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    fontSize: 15,
                                    textAlign: 'left',
                                    background: experience === opt.value ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                                    border: experience === opt.value ? '2px solid var(--accent-purple)' : '2px solid transparent',
                                    color: 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Bakabildiğiniz Fal Türleri (Çoklu Seçim)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {FORTUNE_TYPES.map(type => (
                            <button
                                key={type.code}
                                onClick={() => toggleType(type.code)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    background: selectedTypes.includes(type.code) ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                                    border: selectedTypes.includes(type.code) ? '2px solid var(--accent-purple)' : '2px solid transparent',
                                    color: 'white',
                                    transition: 'all 0.2s',
                                    flex: '1 1 auto',
                                    minWidth: '45%',
                                    textAlign: 'center'
                                }}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="primary-btn w-full flex justify-center items-center gap-2"
                >
                    {submitting ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    {submitting ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
                </button>
            </motion.div>
        </motion.div>
    );
};

export default TellerApplication;
