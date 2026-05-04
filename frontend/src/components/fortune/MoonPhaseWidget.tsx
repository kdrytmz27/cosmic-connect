interface MoonPhaseWidgetProps {
    moonPhase: { phase: string; emoji: string; text: string };
}

export const MoonPhaseWidget = ({ moonPhase }: MoonPhaseWidgetProps) => {
    return (
        <div className="glass-panel" style={{ padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>
                {moonPhase.emoji}
            </div>
            <div>
                <h3 style={{ fontSize: 16, color: 'white', marginBottom: 4 }}>Ayın Şu Anki Evresi: <span style={{ color: 'var(--accent-gold)' }}>{moonPhase.phase}</span></h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{moonPhase.text}</p>
            </div>
        </div>
    );
};
