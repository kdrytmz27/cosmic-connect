import { Sparkles, Loader } from 'lucide-react';

interface LoveHoroscopeProps {
    horoscope: any;
    loading: boolean;
}

export const LoveHoroscope = ({ horoscope, loading }: LoveHoroscopeProps) => {
    return (
        <div className="glass-panel" style={{ padding: 24, border: '1px solid var(--accent-gold)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Sparkles color="var(--accent-gold)" />
                <h2 style={{ color: 'var(--accent-gold)', fontSize: 20 }}>Aşk Falın</h2>
            </div>
            {loading ? <Loader className="animate-spin text-accent" /> : (
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>
                    {horoscope?.content || "Yıldızlar bugün senin için parlıyor."}
                </p>
            )}
        </div>
    );
};
