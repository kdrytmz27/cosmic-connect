import { useEffect, useState, useRef } from 'react';
import api, { BACKEND_URL } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { BrandLoader } from '../components/BrandLoader';

const Fortune = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tellers, setTellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fal İsteği Formu State
    const [selectedCategory, setSelectedCategory] = useState<string>('Aşk & İlişki');
    const [question, setQuestion] = useState('');
    const falcilarRef = useRef<HTMLDivElement>(null);

    // Başvuru Formu State
    const [applyName, setApplyName] = useState('');
    const [applySpecialty, setApplySpecialty] = useState('Kahve Falı');
    const [applyExperience, setApplyExperience] = useState('');
    const [applyLoading, setApplyLoading] = useState(false);

    useEffect(() => {
        api.get('/teller')
            .then(res => {
                setTellers(res.data.data || res.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSendFortuneClick = () => {
        if (!question.trim()) {
            showToast('Lütfen önce evrene sormak istediğiniz soruyu yazın.', 'error');
            return;
        }
        showToast('Lütfen sorunuzu iletmek istediğiniz falcıyı seçin!', 'info');
        falcilarRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleTellerClick = (tellerId: string) => {
        // Eğer soru yazıldıysa state üzerinden falcı profiline aktarabiliriz
        navigate(`/teller/${tellerId}`, { state: { prefilledQuestion: question, prefilledCategory: selectedCategory } });
    };

    const handleApplyTeller = async () => {
        if (!applyName || !applyExperience) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }
        setApplyLoading(true);
        try {
            await api.post('/teller/apply', {
                experience: applyExperience,
                fortuneTypes: applySpecialty
            });
            showToast('Başvurunuz başarıyla alındı! Evren sizi bekliyor.', 'success');
            setApplyName('');
            setApplyExperience('');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Başvuru sırasında bir hata oluştu.', 'error');
        } finally {
            setApplyLoading(false);
        }
    };

    if (loading) {
        return <BrandLoader message="Kozmik Falcılar Yükleniyor..." />;
    }

    const categories = ['Aşk & İlişki', 'Kariyer', 'Genel Bakış', 'Rüya Yorumu'];

    return (
        <div className="flex-grow pt-8 px-container-margin w-full max-w-5xl mx-auto space-y-section-gap pb-24">
            
            {/* Section 1: Fal Gönderimi */}
            <section className="space-y-6">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Fal İsteği Oluştur</h2>
                
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-6">
                    {/* Kategori Seçimi */}
                    <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Fal Kategorisi</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`rounded-lg py-2 font-label-md text-label-md transition-colors ${
                                        selectedCategory === cat 
                                        ? 'bg-primary-container/20 border border-primary-container text-primary'
                                        : 'bg-surface-container-high border border-white/10 text-on-surface-variant hover:bg-white/10'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Soru Alanı */}
                    <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Sorunuz</label>
                        <div className="relative">
                            <textarea 
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full bg-surface-container-low border border-white/10 rounded-lg p-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all h-32 resize-none placeholder:text-on-surface-variant/50" 
                                placeholder="Evrenin size fısıldamasını istediğiniz soruyu buraya yazın..."
                            />
                            <button className="absolute bottom-4 right-4 bg-primary-container/20 p-2 rounded-full text-primary hover:bg-primary-container/40 transition-colors flex items-center justify-center group" title="Sesli Soru Ekle (Çok Yakında)">
                                <span className="material-symbols-outlined group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                            </button>
                        </div>
                    </div>

                    {/* Gönder Butonu */}
                    <button 
                        onClick={handleSendFortuneClick}
                        className="w-full bg-primary-container text-on-primary-container font-headline-md text-label-md py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-inverse-primary transition-all shadow-[0_0_15px_rgba(147,51,234,0.5)] relative overflow-hidden group"
                    >
                        <span className="relative z-10">Falı Gönder</span>
                        <span className="relative z-10 font-label-sm text-label-sm bg-black/20 px-2 py-1 rounded-full ml-2">Adım 1</span>
                        <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                </div>
            </section>

            {/* Section 2: Popüler Falcılar */}
            <section className="space-y-4" ref={falcilarRef}>
                <div className="flex justify-between items-end">
                    <h2 className="font-headline-md text-headline-md-mobile md:text-headline-md text-secondary">Popüler Falcılar</h2>
                </div>
                
                <div className="flex overflow-x-auto gap-4 pb-4 -mx-container-margin px-container-margin md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {tellers.map((t, index) => (
                        <div 
                            key={t.id}
                            onClick={() => handleTellerClick(t.id)}
                            className="bg-white/5 backdrop-blur-md border border-secondary/20 rounded-xl p-4 min-w-[240px] flex-shrink-0 flex flex-col items-center text-center space-y-3 cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden"
                        >
                            {index === 0 && (
                                <div className="absolute top-0 right-0 bg-secondary text-on-secondary text-[10px] font-bold px-2 py-1 rounded-bl-lg">TOP</div>
                            )}
                            
                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${index === 0 ? 'border-secondary' : 'border-white/20'} p-0.5`}>
                                <img 
                                    src={t.user?.avatar ? `${BACKEND_URL}${t.user.avatar}` : `https://ui-avatars.com/api/?name=${t.user?.name || t.name}&background=9333ea&color=fff&bold=true`} 
                                    alt={t.user?.name || 'Falcı'} 
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                            
                            <div>
                                <h3 className="font-label-md text-label-md text-on-surface truncate max-w-[200px]">
                                    {t.fortuneTypes ? t.fortuneTypes.split(',')[0] : 'Fal Uzmanı'}
                                </h3>
                                <p className="font-label-sm text-label-sm text-primary">{t.user?.name || t.name}</p>
                            </div>
                            
                            <div className="flex items-center gap-1 text-secondary">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="font-label-sm text-label-sm font-bold">
                                    {typeof t.rating === 'number' ? t.rating.toFixed(1) : t.rating || '5.0'}
                                </span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant/50 ml-1">
                                    ({t.reviewCount || 0})
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {tellers.length === 0 && (
                        <div className="text-on-surface-variant font-body-md py-4">Şu an aktif falcı bulunmuyor.</div>
                    )}
                </div>
            </section>

            {/* Section 3: Falcı Başvuru Formu */}
            {user?.role !== 'FORTUNE_TELLER' && (
                <section className="space-y-6 pb-8">
                    <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-primary-container/30 relative overflow-hidden">
                        {/* Decorative element */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Yeteneklerini Evrenle Paylaş</h2>
                                <p className="font-body-md text-body-md text-on-surface-variant">Cosmic Connect ağına katılarak rehberlik arayan ruhlara ışık tut.</p>
                            </div>
                            
                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleApplyTeller(); }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Ad Soyad / Mahlas</label>
                                        <input 
                                            value={applyName}
                                            onChange={(e) => setApplyName(e.target.value)}
                                            className="w-full bg-surface-container-highest border border-white/10 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all" 
                                            placeholder="Görünmesini istediğiniz isim" 
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Uzmanlık Alanı</label>
                                        <select 
                                            value={applySpecialty}
                                            onChange={(e) => setApplySpecialty(e.target.value)}
                                            className="w-full bg-surface-container-highest border border-white/10 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all [&>option]:bg-surface-container-highest"
                                        >
                                            <option value="TAROT">Tarot Okuyucusu</option>
                                            <option value="KAHVE">Kahve Falı</option>
                                            <option value="ASTROLOJİ">Astroloji & Doğum Haritası</option>
                                            <option value="RÜYA">Rüya Yorumu</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-1">Deneyiminiz & Kendinizi Anlatın</label>
                                    <textarea 
                                        value={applyExperience}
                                        onChange={(e) => setApplyExperience(e.target.value)}
                                        className="w-full bg-surface-container-highest border border-white/10 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all h-24 resize-none" 
                                        placeholder="Ne zamandır bu alanla ilgileniyorsunuz? Yaklaşımınız nedir?"
                                    />
                                </div>
                                
                                <button 
                                    disabled={applyLoading}
                                    type="submit"
                                    className="w-full md:w-auto mt-4 px-8 py-3 bg-transparent border border-tertiary text-tertiary rounded-xl font-label-md text-label-md hover:bg-tertiary/10 transition-colors mx-auto block disabled:opacity-50"
                                >
                                    {applyLoading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Fortune;
