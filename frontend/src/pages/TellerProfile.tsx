import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Send, Sparkles } from 'lucide-react';
import api, { BACKEND_URL } from '../api/client';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const FORTUNE_TYPES = [
    { code: 'TAROT', label: '🃏 Tarot' },
    { code: 'KAHVE', label: '☕ Kahve Falı' },
    { code: 'EL', label: '🤚 El Falı' },
    { code: 'YILDIZNAME', label: '⭐ Yıldızname' },
    { code: 'RUNE', label: '🪨 Rune Falı' },
];


const TellerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
    }, [id]);

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
            showToast('Fal isteğin gönderildi! 300 Yıldız Tozu düşüldü.', 'success');
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
        } catch (err: any) {
            showToast('Yorum gönderilemedi', 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><div className="glow-text text-xl">Yükleniyor...</div></div>;
    if (!teller) return <div className="flex-1 flex items-center justify-center text-secondary">Falcı bulunamadı.</div>;

    const availableTypes = teller.parsedTypes || [];
    const avatarSrc = teller.user?.avatar ? `${BACKEND_URL}${teller.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(teller.user?.name || 'Falcı')}&background=8b5cf6&color=fff&size=120`;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'var(--card-border)', padding: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'white' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="glow-text" style={{ fontSize: 32, margin: 0 }}>Falcı Profili</h1>
                </div>

                {/* Avatar + Info card */}
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass-panel" style={{ padding: 32, textAlign: 'center', position: 'relative', marginBottom: 24 }}>
                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--accent-purple)' }}>
                            <img loading="lazy" src={avatarSrc} alt="Falcı" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                    <h2 style={{ marginBottom: 4, fontSize: 24, textTransform: 'capitalize' }}>{teller.user?.name || 'Gizemli Falcı'}</h2>
                    {teller.user?.sunSign && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, padding: '0 16px' }}>☀️ Güneş: {teller.user.sunSign}</p>
                    )}

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={16} fill={s <= Math.round(teller.rating) ? 'var(--accent-gold)' : 'none'} color="var(--accent-gold)" />
                        ))}
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>{teller.rating ? teller.rating.toFixed(1) : '0.0'} ({teller.reviewCount} değerlendirme)</span>
                    </div>

                    {/* Bio */}
                    {teller.bio && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, padding: '0 16px', fontStyle: 'italic' }}>"{teller.bio}"</p>}

                    {/* Fortune types */}
                    {availableTypes.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                            {availableTypes.map((t: any) => (
                                <span key={t.code} style={{ padding: '4px 12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c4b5fd', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
                                    {FORTUNE_TYPES.find(ft => ft.code === t.code)?.label || t.label}
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                            className="primary-btn flex items-center justify-center gap-2"
                            style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' }}
                            onClick={() => setShowFortuneModal(true)}
                        >
                            <Sparkles size={16} /> Fal İste (300 ★ Toz)
                        </button>
                    </div>
                </motion.div>

                {/* Comments Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: 32 }}>
                    <h2 style={{ fontSize: 20, marginBottom: 24 }}>Yorumlar</h2>

                    {/* Add comment */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        <input
                            type="text"
                            placeholder="Yorum yaz..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none' }}
                        />
                        <button onClick={handleAddComment} disabled={submittingComment || !comment.trim()} className="primary-btn flex items-center justify-center" style={{ padding: '0 16px' }}>
                            <Send size={16} />
                        </button>
                    </div>

                    {/* Comment list */}
                    {teller.comments && teller.comments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {teller.comments.map((c: any) => (
                                <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <img
                                        src={c.user?.avatar ? `${BACKEND_URL}${c.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'K')}&background=random&size=40`}
                                        alt="avatar"
                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--card-border)' }}
                                    />
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{c.user?.name || 'Bilinmeyen'}</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{c.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>Henüz yorum yok. İlk yorumu sen yap!</p>
                    )}
                </motion.div>
            </div>

            {/* Fortune Request Modal */}
            {showFortuneModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', padding: 16, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel" style={{ padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}>
                        <h2 style={{ fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <Sparkles color="var(--accent-gold)" /> Fal İsteği Gönder
                        </h2>

                        {/* Fortune Type */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Fal Türü Seç</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(availableTypes.length > 0 ? availableTypes : FORTUNE_TYPES).map((t: any) => {
                                    const ft = FORTUNE_TYPES.find(x => x.code === t.code) || t;
                                    return (
                                        <button
                                            key={ft.code}
                                            onClick={() => setFortuneType(ft.code)}
                                            style={{
                                                fontSize: 13,
                                                padding: '8px 16px',
                                                borderRadius: 16,
                                                transition: 'all 0.2s',
                                                background: fortuneType === ft.code ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                                                border: fortuneType === ft.code ? '1px solid var(--accent-pink)' : '1px solid var(--card-border)',
                                                color: fortuneType === ft.code ? 'white' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {ft.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Question */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Soru veya Bağlam (isteğe bağlı)</label>
                            <textarea
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    padding: 16,
                                    color: 'white',
                                    outline: 'none',
                                    resize: 'none',
                                    minHeight: 100,
                                    fontSize: 14,
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="Falcıya sormak istediğin soru..."
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                            />
                        </div>

                        {/* Image Upload */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Görsel Ekle (isteğe bağlı — kahve fincanı vb.)</label>
                            {fortuneImagePreview ? (
                                <div style={{ position: 'relative' }}>
                                    <img loading="lazy" src={fortuneImagePreview} alt="Preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12 }} />
                                    <button
                                        onClick={() => { setFortuneImage(null); setFortuneImagePreview(''); }}
                                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: 'none', cursor: 'pointer' }}
                                    >✕</button>
                                </div>
                            ) : (
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', border: '1px dashed var(--card-border)', borderRadius: 12, padding: '24px 0', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}>
                                    <span style={{ fontSize: 24 }}>📷</span>
                                    <span>Fotoğraf Seç</span>
                                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--accent-gold)', textAlign: 'center', marginBottom: 16 }}>Bu işlem 300 Yıldız Tozu tutarındadır.</div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="secondary-btn" style={{ flex: 1, padding: '12px 0' }} onClick={() => setShowFortuneModal(false)}>İptal</button>
                            <button className="primary-btn" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSubmitFortune} disabled={submittingFortune}>
                                {submittingFortune ? (
                                    <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%' }} />
                                ) : (
                                    <>Gönder <Sparkles size={16} /></>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default TellerProfile;
