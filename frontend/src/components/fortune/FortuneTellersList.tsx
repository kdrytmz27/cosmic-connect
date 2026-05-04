import { Star, Sparkles } from 'lucide-react';

interface FortuneTellersListProps {
    tellers: any[];
    navigate: any;
    myFortunesCount: number;
    setShowFortunesModal: (val: boolean) => void;
}

export const FortuneTellersList = ({ tellers, navigate, myFortunesCount, setShowFortunesModal }: FortuneTellersListProps) => {
    return (
        <>
            <h3 style={{ marginBottom: 16 }}>Popüler Falcılar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tellers.map(t => (
                    <div key={t.id} className="glass-panel" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Star color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 16, marginBottom: 4 }}>{t.user?.name || t.name || 'Gizemli Falcı'}</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.bio || t.specialty || 'Yıldızların mesajlarını okur'}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Star size={12} className="text-accent-gold" fill="currentColor" />
                                <span className="text-xs text-secondary">
                                    {t.rating ? typeof t.rating === 'number' ? t.rating.toFixed(1) : t.rating : '0.0'} ({t.reviewCount || 0} Değerlendirme)
                                </span>
                            </div>
                        </div>
                        <button className="primary-btn text-sm py-1 px-3" onClick={() => navigate(`/teller/${t.id}`)}>Profili Gör</button>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 16 }}>
                <button
                    className="secondary-btn"
                    style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => setShowFortunesModal(true)}
                >
                    <Sparkles size={18} /> Geçmiş Fallarım ({myFortunesCount})
                </button>
            </div>
        </>
    );
};
