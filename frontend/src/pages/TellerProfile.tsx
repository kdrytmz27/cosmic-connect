import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Star, ArrowLeft, Send, Sparkles } from 'lucide-react';
import api, { BACKEND_URL } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { BrandLoader } from '../components/BrandLoader';

const FORTUNE_TYPES = [
    { code: 'TAROT', label: '🃏 Tarot' },
    { code: 'KAHVE', label: '☕ Kahve Falı' },
    { code: 'EL', label: '🤚 El Falı' },
    { code: 'YILDIZNAME', label: '⭐ Yıldızname' },
    { code: 'RUNE', label: '🪨 Rune Falı' },
    { code: 'ASTROLOJİ', label: '🔭 Astroloji & Doğum Haritası' },
    { code: 'RÜYA', label: '🌙 Rüya Yorumu' }
];

const CATEGORY_TO_TYPE_MAP: Record<string, string> = {
    'Aşk & İlişki': 'TAROT',
    'Kariyer': 'KAHVE',
    'Genel Bakış': 'TAROT',
    'Rüya Yorumu': 'RÜYA'
};

const TellerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    
    const [teller, setTeller] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Fortune request modal state
    const [showFortuneModal, setShowFortuneModal] = useState(false);
    const [fortuneType, setFortuneType] = useState('TAROT');
    const [question, setQuestion] = useState('');
    const [fortuneImage, setFortuneImage] = useState<File | null>(null);
    const [fortuneImagePreview, setFortuneImagePreview] = useState('');
    const [submittingFortune, setSubmittingFortune] = useState(false);

    useEffect(() => {
        if (id) {
            api.get(`/teller/profile/${id}`)
                .then(res => setTeller(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }

        // Handle prefilled data from Fortune main page
        if (location.state?.prefilledQuestion) {
            setQuestion(location.state.prefilledQuestion);
            setShowFortuneModal(true);
        }
        if (location.state?.prefilledCategory) {
            const mappedType = CATEGORY_TO_TYPE_MAP[location.state.prefilledCategory];
            if (mappedType) setFortuneType(mappedType);
        }
    }, [id, location.state]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFortuneImage(file);
        setFortuneImagePreview(URL.createObjectURL(file));
    };

    const handleSubmitFortune = async () => {
        if (!teller) return;
        setSubmittingFortune(true);
        try {
            const formData = new FormData();
            formData.append('tellerId', teller.id);
            formData.append('fortuneType', fortuneType);
            if (question) formData.append('question', question);
            if (fortuneImage) formData.append('image', fortuneImage);

            await api.post('/teller/book', formData);
            setShowFortuneModal(false);
            setFortuneImage(null);
            setFortuneImagePreview('');
            showToast('Fal isteğin gönderildi! Evrenin yanıtını bekle. (300 Yıldız Tozu kullanıldı)', 'success');
            setQuestion('');
        } catch (err: any) {
            // Error managed by global interceptor
        } finally {
            setSubmittingFortune(false);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim() || !teller) return;
        setSubmittingComment(true);
        try {
            const res = await api.post('/teller/comment', { tellerId: teller.id, comment });
            setTeller({ ...teller, comments: [res.data, ...(teller.comments || [])] });
            setComment('');
            showToast('Yorumun eklendi!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Yorum gönderilemedi', 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) return <BrandLoader message="Falcı Profili Yükleniyor..." />;
    if (!teller) return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
            <div className="text-secondary font-label-md">Aradığınız falcı kozmik boşlukta kaybolmuş olabilir.</div>
            <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">Geri Dön</button>
        </div>
    );

    const availableTypes = teller.parsedTypes || [];
    const avatarSrc = teller.user?.avatar ? `${BACKEND_URL}${teller.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(teller.user?.name || 'Falcı')}&background=8b5cf6&color=fff&size=200&bold=true`;
    const ratingValue = teller.rating ? (typeof teller.rating === 'number' ? teller.rating.toFixed(1) : teller.rating) : '5.0';
    const reviewCount = teller.reviewCount || 0;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 pt-8 px-container-margin max-w-3xl mx-auto w-full pb-24">
            {/* Header / Back */}
            <header className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-on-surface"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-headline-lg text-headline-lg text-primary">Kozmik Rehber</h1>
            </header>

            {/* Profile Hero Section */}
            <section className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-section-gap">
                {/* Avatar */}
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative shrink-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-primary-container to-secondary shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                        <img 
                            className="w-full h-full rounded-full object-cover border-4 border-surface" 
                            src={avatarSrc} 
                            alt={teller.user?.name || 'Falcı'} 
                        />
                    </div>
                </motion.div>

                {/* Basic Info & Actions */}
                <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                    <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2 capitalize">{teller.user?.name || 'Gizemli Falcı'}</h2>
                    
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={18} fill={s <= Math.round(teller.rating || 5) ? 'var(--accent-gold)' : 'none'} className={s <= Math.round(teller.rating || 5) ? 'text-secondary' : 'text-on-surface-variant/30'} />
                            ))}
                        </div>
                        <span className="font-label-md text-label-md text-secondary">{ratingValue}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">({reviewCount} yorum)</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                        {teller.user?.sunSign && (
                            <span className="font-label-md text-label-md px-3 py-1 bg-white/5 border border-white/10 rounded-full text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
                                Güneş {teller.user.sunSign}
                            </span>
                        )}
                        <span className="font-label-md text-label-md px-3 py-1 bg-white/5 border border-white/10 rounded-full text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            {teller.totalReadings || 0} Fal Baktı
                        </span>
                    </div>

                    <div className="flex justify-center md:justify-start">
                        <button 
                            onClick={() => setShowFortuneModal(true)}
                            className="bg-primary-container text-on-primary-container px-8 py-3 rounded-full font-label-md text-label-md hover:bg-inverse-primary transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.5)] active:scale-95"
                        >
                            <Sparkles size={18} />
                            Hemen Fal İste (300 ✨)
                        </button>
                    </div>
                </div>
            </section>

            {/* About & Specialties Section */}
            <section className="mb-section-gap grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                    <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        Rehber Hakkında
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        {teller.bio || 'Yıldızların mesajlarını okur. Ruhunuza dokunacak derin içgörüler sunar.'}
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-secondary">category</span>
                        Uzmanlık Alanları
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {availableTypes.length > 0 ? availableTypes.map((t: any) => (
                            <span key={t.code} className="px-4 py-2 bg-primary-container/20 border border-primary-container/40 text-primary rounded-xl font-label-md text-label-md">
                                {FORTUNE_TYPES.find(ft => ft.code === t.code)?.label || t.label}
                            </span>
                        )) : (
                            <span className="text-on-surface-variant text-sm">Belirtilmemiş</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Comments Section */}
            <section className="mb-section-gap">
                <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/10">
                    <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-tertiary">forum</span>
                        Danışan Yorumları
                    </h3>

                    {/* Add Comment */}
                    <div className="flex gap-3 mb-8">
                        <input
                            type="text"
                            placeholder="Bu falcıyla deneyiminizi paylaşın..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                            className="flex-1 bg-surface-container-highest border border-white/10 text-on-surface font-body-md px-4 py-3 rounded-xl focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all"
                        />
                        <button 
                            onClick={handleAddComment} 
                            disabled={submittingComment || !comment.trim()} 
                            className="bg-tertiary/20 text-tertiary border border-tertiary/50 hover:bg-tertiary/30 disabled:opacity-50 px-6 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>

                    {/* Comment List */}
                    {teller.comments && teller.comments.length > 0 ? (
                        <div className="space-y-6">
                            {teller.comments.map((c: any) => (
                                <div key={c.id} className="flex gap-4">
                                    <img
                                        src={c.user?.avatar ? `${BACKEND_URL}${c.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'K')}&background=131b2e&color=fff&size=40`}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                                    />
                                    <div className="flex-1 bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-label-md text-label-md text-on-surface capitalize">{c.user?.name || 'Gizli Danışan'}</span>
                                            <span className="font-label-sm text-label-sm text-on-surface-variant/70">{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-body-md text-body-md text-on-surface-variant">{c.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">chat_bubble_outline</span>
                            <p className="text-on-surface-variant font-body-md">Henüz yorum yapılmamış. Fal baktırdıktan sonra ilk yorumu sen yap!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Fortune Request Modal */}
            <AnimatePresence>
                {showFortuneModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                            className="bg-surface border border-primary/30 shadow-[0_0_40px_rgba(147,51,234,0.15)] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                                    <Sparkles size={20} className="text-secondary" /> 
                                    Fal İsteği Gönder
                                </h2>
                                <button onClick={() => setShowFortuneModal(false)} className="text-on-surface-variant hover:text-on-surface">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Fortune Type */}
                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface-variant mb-3">Fal Türü Seç</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(availableTypes.length > 0 ? availableTypes : FORTUNE_TYPES).map((t: any) => {
                                            const ft = FORTUNE_TYPES.find(x => x.code === t.code) || t;
                                            const isActive = fortuneType === ft.code;
                                            return (
                                                <button
                                                    key={ft.code}
                                                    onClick={() => setFortuneType(ft.code)}
                                                    className={`px-4 py-2 rounded-xl font-label-sm text-label-sm transition-all border ${
                                                        isActive 
                                                        ? 'bg-primary-container text-on-primary-container border-primary-container shadow-[0_0_10px_rgba(147,51,234,0.3)]' 
                                                        : 'bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {ft.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Question */}
                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface-variant mb-3">Sorunuz (İsteğe Bağlı)</label>
                                    <textarea
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        placeholder="Falcıya özel olarak sormak veya danışmak istediğin konu..."
                                        className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all h-32 resize-none placeholder:text-on-surface-variant/50"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface-variant mb-3">Kahve Fincanı veya Görsel (İsteğe Bağlı)</label>
                                    {fortuneImagePreview ? (
                                        <div className="relative inline-block w-full">
                                            <img src={fortuneImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-white/20" />
                                            <button
                                                onClick={() => { setFortuneImage(null); setFortuneImagePreview(''); }}
                                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-error/80 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                            <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-colors">add_photo_alternate</span>
                                            <span className="font-label-md text-on-surface-variant group-hover:text-primary transition-colors">Fotoğraf Yükle</span>
                                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                
                                <div className="text-center font-label-sm text-secondary bg-secondary/10 py-2 rounded-lg border border-secondary/20">
                                    Bu işlem <strong>300 Yıldız Tozu</strong> tutarındadır.
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
                                <button 
                                    onClick={() => setShowFortuneModal(false)} 
                                    className="flex-1 py-3 font-label-md text-label-md text-on-surface-variant hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleSubmitFortune} 
                                    disabled={submittingFortune}
                                    className="flex-[2] bg-primary-container text-on-primary-container font-label-md text-label-md rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:bg-inverse-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submittingFortune ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Gönder <Send size={18} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TellerProfile;
