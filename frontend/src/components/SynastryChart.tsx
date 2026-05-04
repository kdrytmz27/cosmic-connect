import React from 'react';
import { motion } from 'framer-motion';

interface PlanetPosition {
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
}

interface SynastryChartProps {
    user1Planets: PlanetPosition[];
    user2Planets: PlanetPosition[];
    user1Name: string;
    user2Name: string;
}

const ZODIAC_SIGNS = [
    { name: 'Aries', emoji: '♈', color: '#ef4444' },
    { name: 'Taurus', emoji: '♉', color: '#84cc16' },
    { name: 'Gemini', emoji: '♊', color: '#0ea5e9' },
    { name: 'Cancer', emoji: '♋', color: '#3b82f6' },
    { name: 'Leo', emoji: '♌', color: '#f97316' },
    { name: 'Virgo', emoji: '♍', color: '#22c55e' },
    { name: 'Libra', emoji: '♎', color: '#38bdf8' },
    { name: 'Scorpio', emoji: '♏', color: '#6366f1' },
    { name: 'Sagittarius', emoji: '♐', color: '#f59e0b' },
    { name: 'Capricorn', emoji: '♑', color: '#16a34a' },
    { name: 'Aquarius', emoji: '♒', color: '#06b6d4' },
    { name: 'Pisces', emoji: '♓', color: '#8b5cf6' }
];

const PLANET_SYMBOLS: Record<string, string> = {
    'Sun': '☀', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
    'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄'
};

/**
 * Spread out overlapping planets so no two icons sit on top of each other.
 * Takes sorted planet angles and returns adjusted angles with a minimum gap.
 */
function spreadPlanets(planets: PlanetPosition[], minGap: number): number[] {
    if (planets.length === 0) return [];

    const angles = planets.map(p => p.longitude).sort((a, b) => a - b);
    const adjusted = [...angles];

    // Multiple passes to resolve overlaps
    for (let pass = 0; pass < 5; pass++) {
        for (let i = 1; i < adjusted.length; i++) {
            let diff = adjusted[i] - adjusted[i - 1];
            if (diff < 0) diff += 360;
            if (diff < minGap) {
                const shift = (minGap - diff) / 2;
                adjusted[i - 1] -= shift;
                adjusted[i] += shift;
            }
        }
        // Check wrap-around between last and first
        let wrapDiff = (adjusted[0] + 360) - adjusted[adjusted.length - 1];
        if (wrapDiff < minGap) {
            const shift = (minGap - wrapDiff) / 2;
            adjusted[adjusted.length - 1] -= shift;
            adjusted[0] += shift;
        }
    }

    // Map back by original order
    const sortedOriginal = planets.map(p => p.longitude).map((orig, idx) => ({ orig, idx })).sort((a, b) => a.orig - b.orig);
    const result: number[] = new Array(planets.length);
    sortedOriginal.forEach((item, sortedIdx) => {
        result[item.idx] = adjusted[sortedIdx];
    });

    return result;
}

export const SynastryChart: React.FC<SynastryChartProps> = ({ user1Planets, user2Planets, user1Name, user2Name }) => {
    const size = 360;
    const center = size / 2;
    const zodiacRingOuter = size * 0.46;
    const zodiacRingInner = size * 0.38;
    const user2Ring = size * 0.30;    // Outer user ring (gold)
    const user1Ring = size * 0.20;    // Inner user ring (pink)
    const centerRadius = size * 0.10;

    // Spread planets to avoid overlaps (min 14° gap)
    const u1Angles = spreadPlanets(user1Planets, 14);
    const u2Angles = spreadPlanets(user2Planets, 14);

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const polarToXY = (angleDeg: number, r: number) => ({
        x: center + r * Math.cos(toRad(angleDeg - 90)),
        y: center + r * Math.sin(toRad(angleDeg - 90))
    });

    // Build arc path for zodiac sections
    const arcPath = (startAngle: number, endAngle: number, r1: number, r2: number) => {
        const a1 = toRad(startAngle - 90);
        const a2 = toRad(endAngle - 90);
        const x1o = center + r2 * Math.cos(a1);
        const y1o = center + r2 * Math.sin(a1);
        const x2o = center + r2 * Math.cos(a2);
        const y2o = center + r2 * Math.sin(a2);
        const x2i = center + r1 * Math.cos(a2);
        const y2i = center + r1 * Math.sin(a2);
        const x1i = center + r1 * Math.cos(a1);
        const y1i = center + r1 * Math.sin(a1);
        return `M${x1o},${y1o} A${r2},${r2} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${r1},${r1} 0 0,0 ${x1i},${y1i} Z`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: 20, left: 20, right: 20, bottom: 20,
                    background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.06) 50%, transparent 80%)',
                    filter: 'blur(30px)', zIndex: 0
                }} />

                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ zIndex: 1, position: 'relative' }}>
                    <defs>
                        <radialGradient id="synCenterGlow2" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Zodiac band — colored arc segments */}
                    {ZODIAC_SIGNS.map((sign, i) => {
                        const startAngle = i * 30;
                        const endAngle = (i + 1) * 30;
                        const midAngle = startAngle + 15;
                        const labelPos = polarToXY(midAngle, (zodiacRingOuter + zodiacRingInner) / 2);

                        return (
                            <g key={sign.name}>
                                <path
                                    d={arcPath(startAngle, endAngle, zodiacRingInner, zodiacRingOuter)}
                                    fill={`${sign.color}12`}
                                    stroke={`${sign.color}30`}
                                    strokeWidth="0.5"
                                />
                                <text
                                    x={labelPos.x} y={labelPos.y}
                                    fill="white" fontSize="13"
                                    textAnchor="middle" dominantBaseline="middle"
                                    opacity="0.9"
                                    style={{ textShadow: `0 0 8px ${sign.color}` }}
                                >
                                    {sign.emoji}
                                </text>
                            </g>
                        );
                    })}

                    {/* Guiding rings */}
                    <circle cx={center} cy={center} r={user2Ring} fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="0.5" strokeDasharray="3 6" />
                    <circle cx={center} cy={center} r={user1Ring} fill="none" stroke="rgba(236,72,153,0.12)" strokeWidth="0.5" strokeDasharray="3 6" />

                    {/* Center glow */}
                    <circle cx={center} cy={center} r={centerRadius} fill="url(#synCenterGlow2)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />

                    {/* Divider lines from center to zodiac ring */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const angle = i * 30;
                        const inner = polarToXY(angle, centerRadius);
                        const outer = polarToXY(angle, zodiacRingInner);
                        return (
                            <line key={`div-${i}`}
                                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                                stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"
                            />
                        );
                    })}

                    {/* User 1 planets — inner ring (pink) */}
                    {user1Planets.map((planet, i) => {
                        const displayAngle = u1Angles[i];
                        const pos = polarToXY(displayAngle, user1Ring);
                        const color = '#ec4899';

                        return (
                            <g key={`u1-${planet.planet}`}>
                                {/* Thin line from center area to planet */}
                                <motion.line
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.3 }}
                                    transition={{ delay: i * 0.08 + 0.1 }}
                                    x1={center} y1={center} x2={pos.x} y2={pos.y}
                                    stroke={color} strokeWidth="0.5" strokeDasharray="2 4"
                                />
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: i * 0.08 + 0.15 }}
                                    cx={pos.x} cy={pos.y} r="13"
                                    fill="rgba(28,28,36,0.95)"
                                    stroke={color}
                                    strokeWidth="1.5"
                                />
                                <motion.text
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.08 + 0.4 }}
                                    x={pos.x} y={pos.y + 1}
                                    fontSize="13"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={color}
                                    fontWeight="bold"
                                >
                                    {PLANET_SYMBOLS[planet.planet] || '?'}
                                </motion.text>
                            </g>
                        );
                    })}

                    {/* User 2 planets — outer ring (gold) */}
                    {user2Planets.map((planet, i) => {
                        const displayAngle = u2Angles[i];
                        const pos = polarToXY(displayAngle, user2Ring);
                        const color = '#fbbf24';

                        return (
                            <g key={`u2-${planet.planet}`}>
                                <motion.line
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.3 }}
                                    transition={{ delay: i * 0.08 + 0.4 }}
                                    x1={center} y1={center} x2={pos.x} y2={pos.y}
                                    stroke={color} strokeWidth="0.5" strokeDasharray="2 4"
                                />
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: i * 0.08 + 0.45 }}
                                    cx={pos.x} cy={pos.y} r="13"
                                    fill="rgba(28,28,36,0.95)"
                                    stroke={color}
                                    strokeWidth="1.5"
                                />
                                <motion.text
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.08 + 0.7 }}
                                    x={pos.x} y={pos.y + 1}
                                    fontSize="13"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={color}
                                    fontWeight="bold"
                                >
                                    {PLANET_SYMBOLS[planet.planet] || '?'}
                                </motion.text>
                            </g>
                        );
                    })}

                    {/* Center star */}
                    <circle cx={center} cy={center} r="5" fill="#fbbf24" opacity="0.8" />
                    <circle cx={center} cy={center} r="2" fill="white" opacity="0.9" />
                </svg>
            </div>

            {/* Legend below chart */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #ec4899', background: 'rgba(236,72,153,0.15)' }} />
                    <span style={{ color: '#ec4899', fontWeight: 600, textTransform: 'capitalize' }}>{user1Name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fbbf24', background: 'rgba(251,191,36,0.15)' }} />
                    <span style={{ color: '#fbbf24', fontWeight: 600, textTransform: 'capitalize' }}>{user2Name}</span>
                </div>
            </div>
        </div>
    );
};
