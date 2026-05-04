import { motion } from 'framer-motion';

const BADGE_MAP: any = {
    'STAR_EXPLORER': { name: 'Yıldız Kaşifi', icon: '🚀', color: '#38bdf8' },
    'GENEROUS_SOUL': { name: 'Cömert Ruh', icon: '🎁', color: '#f472b6' },
    'DAILY_PILGRIM': { name: 'Günlük Yolcu', icon: '📅', color: '#4ade80' },
    'SOCIAL_BUTTERFLY': { name: 'Sosyal Kelebek', icon: '🦋', color: '#8b5cf6' }
};

const getCosmicTitle = (lv: number) => {
    if (lv <= 5) return 'Yıldız Tozu Çırağı';
    if (lv <= 15) return 'Gece Bekçisi';
    if (lv <= 30) return 'Astral Yolcu';
    if (lv <= 50) return 'Galaksi Rehberi';
    return 'Kozmik Efendi';
};

const calculateXpProgress = (lv: number, currentXp: number) => {
    const xpReq = lv * 100;
    const pct = Math.min(100, Math.max(0, (currentXp / xpReq) * 100));
    return { percentage: pct, xpRequirement: xpReq };
};

interface ProfileGamificationProps {
    level?: number;
    xp?: number;
    badges?: string;
    karma?: number;
}

export const ProfileGamification = ({ level = 1, xp = 0, badges, karma = 100 }: ProfileGamificationProps) => {
    const progress = calculateXpProgress(level, xp);

    // FEAT-10 UI Visualization
    let auraColor = '#94a3b8'; // Neutral
    let auraName = 'Dengeli Aura';
    let auraIcon = '✨';

    if (karma > 150) {
        auraColor = '#38bdf8'; // Glowing Blue/White
        auraName = 'Yıldız Tozu Aura';
        auraIcon = '🌟';
    } else if (karma < 50) {
        auraColor = '#ef4444'; // Red/Dark
        auraName = 'Kara Delik Aura';
        auraIcon = '🌑';
    }

    return (
        <div style={{ margin: '16px auto', width: '100%', maxWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--accent-gold), #ff8c00)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: 'black' }}>
                        {level}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)' }}>{getCosmicTitle(level)}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{xp} / {progress.xpRequirement} XP</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), #ff8c00)', borderRadius: 3 }}
                />
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: `1px solid ${auraColor}44` }}>
                <span style={{ fontSize: 16 }}>{auraIcon}</span>
                <span style={{ color: auraColor, fontSize: 12, fontWeight: 600 }}>{auraName} (Karma: {karma})</span>
            </div>

            {badges && JSON.parse(badges).length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24, marginTop: 8 }}>
                    {JSON.parse(badges).map((badgeId: string) => {
                        const badge = BADGE_MAP[badgeId];
                        if (!badge) return null;
                        return (
                            <motion.div
                                key={badgeId}
                                whileHover={{ scale: 1.1 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '8px 12px',
                                    borderRadius: 16,
                                    border: `1px solid ${badge.color}44`,
                                    minWidth: 80,
                                    boxShadow: `0 4px 12px ${badge.color}11`
                                }}
                            >
                                <span style={{ fontSize: 24, marginBottom: 4 }}>{badge.icon}</span>
                                <span style={{ fontSize: 10, color: 'white', fontWeight: 600, textAlign: 'center' }}>{badge.name}</span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
