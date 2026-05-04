import { Star, Heart, Briefcase, Activity } from 'lucide-react';

interface ProfileHoroscopeProps {
    dailyHoroscope: any;
}

export const ProfileHoroscope = ({ dailyHoroscope }: ProfileHoroscopeProps) => {
    if (!dailyHoroscope) return null;

    return (
        <div style={{ marginTop: 24, textAlign: 'left', padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <h3 style={{ fontSize: 16, color: 'var(--accent-purple)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={18} color="var(--accent-gold)" /> Günlük Yıldız Falı
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dailyHoroscope['GENERAL'] && (
                    <div>
                        <h4 style={{ fontSize: 13, color: 'white', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Star size={14} color="var(--accent-gold)" /> Genel</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{dailyHoroscope['GENERAL']}</p>
                    </div>
                )}
                {dailyHoroscope['LOVE'] && (
                    <div>
                        <h4 style={{ fontSize: 13, color: 'white', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Heart size={14} color="var(--accent-pink)" /> Aşk</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{dailyHoroscope['LOVE']}</p>
                    </div>
                )}
                {dailyHoroscope['CAREER'] && (
                    <div>
                        <h4 style={{ fontSize: 13, color: 'white', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Briefcase size={14} color="#38bdf8" /> Kariyer</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{dailyHoroscope['CAREER']}</p>
                    </div>
                )}
                {dailyHoroscope['HEALTH'] && (
                    <div>
                        <h4 style={{ fontSize: 13, color: 'white', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Activity size={14} color="#34d399" /> Sağlık</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{dailyHoroscope['HEALTH']}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
