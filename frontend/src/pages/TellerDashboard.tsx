import { useState, useEffect } from 'react';
import api, { BACKEND_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from '../components/common/VoiceRecorder';
import { BrandLoader } from '../components/BrandLoader';

interface FortuneRequest {
    id: string;
    appointmentDate: string;
    stardustPrice: number;
    question: string | null;
    fortuneType: string | null;
    imageUrl: string | null;
    user: {
        id: string;
        name: string;
        avatar: string | null;
        sunSign: string;
        moonSign: string;
        risingSign: string;
    }
}

interface TellerStats {
    totalReadings: number;
    rating: number;
    earnedStardust: number;
}

const FORTUNE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    'TAROT': { label: 'Tarot', icon: 'style', color: 'text-primary', bg: 'bg-primary/10' },
    'KAHVE': { label: 'Kahve Falı', icon: 'coffee', color: 'text-secondary', bg: 'bg-secondary/10' },
    'ASTROLOJİ': { label: 'Astroloji', icon: 'auto_awesome', color: 'text-tertiary', bg: 'bg-tertiary/10' },
    'RÜYA': { label: 'Rüya Yorumu', icon: 'nights_stay', color: 'text-error', bg: 'bg-error/10' }
};

const getFortuneTypeDisplay = (type: string | null) => {
    if (!type) return { label: 'Bilinmeyen', icon: 'help', color: 'text-on-surface-variant', bg: 'bg-surface-variant' };
    return FORTUNE_TYPE_LABELS[type] || { label: type, icon: 'auto_awesome', color: 'text-primary', bg: 'bg-primary/10' };
};

const TellerDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    const [fortunes, setFortunes] = useState<FortuneRequest[]>([]);
    const [stats, setStats] = useState<TellerStats>({ totalReadings: 0, rating: 0, earnedStardust: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedFortune, setSelectedFortune] = useState<FortuneRequest | null>(null);
    const [interpretation, setInterpretation] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [fortunesRes, profileRes] = await Promise.all([
                api.get('/teller/fortunes/pending'),
                api.get('/user/profile/me')
            ]);
            
            setFortunes(fortunesRes.data);
            
            const tellerProfile = profileRes.data.profile?.fortuneTellerProfile;
            if (tellerProfile) {
                setStats({
                    totalReadings: tellerProfile.totalReadings || 0,
                    rating: tellerProfile.rating || 0,
                    earnedStardust: tellerProfile.earnedStardust || 0
                });
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitInterpretation = async () => {
        if (!selectedFortune) return;
        if (!interpretation.trim() && !audioUrl) return;

        setSubmitting(true);
        try {
            await api.post('/teller/fortunes/interpret', {
                appointmentId: selectedFortune.id,
                interpretation,
                audioUrl
            });
            setInterpretation('');
            setAudioUrl(null);
            setSelectedFortune(null);
            showToast('Fal başarıyla yorumlandı! 🌟', 'success');
            fetchDashboardData();
        } catch (err: any) {
            console.error('Error submitting interpretation:', err);
            showToast(err.response?.data?.error || 'Fal gönderilirken bir hata oluştu.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAudioUpload = async (blob: Blob) => {
        setUploadingAudio(true);
        const formData = new FormData();
        formData.append('audio', blob, 'fortune_interpretation.webm');

        try {
            const uploadRes = await api.post('/audio/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAudioUrl(uploadRes.data.audioUrl);
            showToast('Ses kaydı yüklendi!', 'success');
        } catch (err) {
            console.error('Audio upload error:', err);
            showToast('Ses kaydı yüklenemedi', 'error');
        } finally {
            setUploadingAudio(false);
        }
    };

    if (user?.role !== 'FORTUNE_TELLER') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-[50vh]">
                <span className="material-symbols-outlined text-6xl text-error mb-4">lock</span>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Erişim Reddedildi</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Bu sayfaya sadece onaylı kozmik rehberler (Falcılar) erişebilir. Lütfen önce yeteneklerinizi evrenle paylaşarak başvuru yapın.
                </p>
                <button onClick={() => navigate('/fortune')} className="mt-6 px-6 py-2 bg-primary-container text-on-primary-container rounded-full hover:bg-inverse-primary transition-colors">
                    Falcılara Katıl
                </button>
            </div>
        );
    }

    if (loading) return <BrandLoader message="Kozmik Panel Yükleniyor..." />;

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-5xl mx-auto w-full pb-24">
            {/* Header Section */}
            <header className="mb-section-gap">
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl">dashboard</span>
                    Panel
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                    Hoş geldin rehber. Yıldızlar bugün senin için ne söylüyor?
                </p>
            </header>

            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-section-gap">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors"></div>
                    <span className="material-symbols-outlined text-primary text-3xl mb-2">visibility</span>
                    <div className="font-headline-lg text-headline-lg text-on-surface font-bold">{stats.totalReadings}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Toplam Fal</div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/20 rounded-full blur-2xl group-hover:bg-secondary/30 transition-colors"></div>
                    <span className="material-symbols-outlined text-secondary text-3xl mb-2">star</span>
                    <div className="font-headline-lg text-headline-lg text-on-surface font-bold">{stats.rating.toFixed(1)}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Ortalama Puan</div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-tertiary/20 rounded-full blur-2xl group-hover:bg-tertiary/30 transition-colors"></div>
                    <span className="material-symbols-outlined text-tertiary text-3xl mb-2">auto_awesome</span>
                    <div className="font-headline-lg text-headline-lg text-on-surface font-bold text-tertiary">{stats.earnedStardust}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Kazanılan Toz</div>
                </div>
            </section>

            {/* Pending Fortunes */}
            <section className="space-y-6">
                <div className="flex justify-between items-end">
                    <h2 className="font-headline-md text-headline-md text-on-surface">Bekleyen Fallar</h2>
                    <span className="font-label-sm text-label-sm text-tertiary px-3 py-1 bg-tertiary/10 rounded-full border border-tertiary/20">
                        {fortunes.length} İstek
                    </span>
                </div>

                {fortunes.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">self_improvement</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Şu an her şey sakin</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant">Yeni fal istekleri geldiğinde burada görünecek.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {fortunes.map((fortune, idx) => {
                            const typeDisplay = getFortuneTypeDisplay(fortune.fortuneType);
                            // Fake waiting time for display aesthetics (based on ID length or random if preferred, using a static '12 dk' for now as per design)
                            const waitTime = `${Math.max(1, (idx + 1) * 12)} dk`;
                            const userAvatar = fortune.user.avatar ? `${BACKEND_URL}${fortune.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(fortune.user.name)}&background=2d3449&color=fff`;

                            return (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={fortune.id}
                                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/50 transition-colors duration-300 relative overflow-hidden group cursor-default"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
                                    
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 rounded-full border border-white/20 overflow-hidden bg-surface-container-high shrink-0">
                                                <img src={userAvatar} alt="Client" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h3 className="font-label-md text-label-md text-on-surface capitalize">{fortune.user.name || 'Gizemli Ruh'}</h3>
                                                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-[16px] text-tertiary">flare</span> 
                                                    {fortune.user.sunSign} Burcu
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-label-sm text-label-sm text-error bg-error/10 px-2 py-1 rounded-md">Bekliyor ({waitTime})</span>
                                            <span className="font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 py-1 rounded-md">+{fortune.stardustPrice} ✨</span>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-lowest/50 rounded-xl p-4 relative z-10 border border-white/5 min-h-[80px]">
                                        {fortune.question ? (
                                            <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-3 italic">
                                                "{fortune.question}"
                                            </p>
                                        ) : (
                                            <p className="font-label-sm text-label-sm text-on-surface-variant/50 italic">Belirli bir soru girilmemiş. Genel bir yorum bekliyor.</p>
                                        )}
                                        {fortune.imageUrl && (
                                            <div className="mt-3 inline-block">
                                                <span className="flex items-center gap-1 font-label-sm text-label-sm text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                    <span className="material-symbols-outlined text-[14px]">image</span>
                                                    Görsel Eklendi
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined ${typeDisplay.color} text-[20px]`}>{typeDisplay.icon}</span>
                                            <span className={`font-label-md text-label-md ${typeDisplay.color}`}>{typeDisplay.label}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigate('/messages', { state: { openChatId: fortune.user.id } })}
                                                className="p-2 rounded-full border border-white/10 text-on-surface hover:bg-white/10 transition-colors"
                                                title="Danışana Mesaj Gönder"
                                            >
                                                <span className="material-symbols-outlined">chat</span>
                                            </button>
                                            <button 
                                                onClick={() => setSelectedFortune(fortune)}
                                                className="bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-2 rounded-full hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                Fal Bak
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Interpretation Modal */}
            <AnimatePresence>
                {selectedFortune && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                            className="bg-surface border border-primary/30 shadow-[0_0_40px_rgba(147,51,234,0.15)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                                <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined">auto_awesome</span> 
                                    Yıldızların Mesajı
                                </h2>
                                <button onClick={() => { setSelectedFortune(null); setAudioUrl(null); setInterpretation(''); }} className="text-on-surface-variant hover:text-on-surface">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                                {/* Context Box */}
                                <div className="bg-surface-container-highest rounded-xl p-4 border border-white/5 flex gap-4">
                                    <img 
                                        src={selectedFortune.user.avatar ? `${BACKEND_URL}${selectedFortune.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFortune.user.name)}&background=2d3449&color=fff`} 
                                        alt="Client" 
                                        className="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0" 
                                    />
                                    <div>
                                        <div className="font-label-md text-label-md text-on-surface mb-1 capitalize">
                                            {selectedFortune.user.name} <span className="text-on-surface-variant font-normal">için yorumlanıyor</span>
                                        </div>
                                        {selectedFortune.question && (
                                            <div className="font-body-sm text-sm text-on-surface-variant italic border-l-2 border-primary/50 pl-3 py-1">
                                                "{selectedFortune.question}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Image Attachment */}
                                {selectedFortune.imageUrl && (
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Danışanın Görseli (Tıklayarak büyütün)</label>
                                        <div 
                                            className="h-32 w-48 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => window.open(`${BACKEND_URL}${selectedFortune.imageUrl}`, '_blank')}
                                        >
                                            <img src={`${BACKEND_URL}${selectedFortune.imageUrl}`} alt="Attachment" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                        </div>
                                    </div>
                                )}

                                {/* Interpretation Input */}
                                <div className="relative">
                                    <label className="block font-label-md text-label-md text-on-surface-variant mb-3">Yazılı Yorum (Zorunlu veya Sesli)</label>
                                    <textarea
                                        value={interpretation}
                                        onChange={(e) => setInterpretation(e.target.value)}
                                        placeholder="Gözden kaçan detayları vurgula, geleceğe ışık tut..."
                                        className="w-full bg-surface-container-lowest border border-white/10 rounded-xl p-4 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all min-h-[200px] resize-y placeholder:text-on-surface-variant/40"
                                    />
                                    <div className={`absolute bottom-4 right-4 font-label-sm text-xs ${interpretation.length < 20 ? 'text-error' : 'text-tertiary'}`}>
                                        {interpretation.length} / 20 karakter
                                    </div>
                                </div>

                                {/* Audio Input */}
                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface-variant mb-3">Sesli Yorum (Alternatif veya Ek)</label>
                                    {audioUrl ? (
                                        <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 p-3 rounded-xl">
                                            <audio controls src={`${BACKEND_URL}${audioUrl}`} className="flex-1 h-10" />
                                            <button 
                                                onClick={() => setAudioUrl(null)}
                                                className="p-2 text-error hover:bg-error/20 rounded-full transition-colors shrink-0"
                                                title="Ses Kaydını Sil"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <VoiceRecorder 
                                            onRecordingComplete={handleAudioUpload} 
                                            isUploading={uploadingAudio} 
                                            maxDurationMs={180000} 
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0">
                                <button 
                                    onClick={() => { setSelectedFortune(null); setAudioUrl(null); setInterpretation(''); }} 
                                    className="flex-1 py-3 font-label-md text-label-md text-on-surface-variant hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleSubmitInterpretation} 
                                    disabled={submitting || (interpretation.trim().length < 20 && !audioUrl)}
                                    className="flex-[2] bg-primary-container text-on-primary-container font-label-md text-label-md rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:bg-inverse-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Gönder ve Kazan <span className="material-symbols-outlined">send</span></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TellerDashboard;
