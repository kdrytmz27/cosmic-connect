import React from 'react';
import { motion } from 'framer-motion';

interface NatalChartProps {
    sunSign?: string;
    moonSign?: string;
    risingSign?: string;
}

const ZODIAC_SIGNS = [
    { name: 'Aries', emoji: '♈', color: '#ef4444' },     // Fire
    { name: 'Taurus', emoji: '♉', color: '#84cc16' },    // Earth
    { name: 'Gemini', emoji: '♊', color: '#0ea5e9' },    // Air
    { name: 'Cancer', emoji: '♋', color: '#3b82f6' },    // Water
    { name: 'Leo', emoji: '♌', color: '#f97316' },       // Fire
    { name: 'Virgo', emoji: '♍', color: '#22c55e' },     // Earth
    { name: 'Libra', emoji: '♎', color: '#38bdf8' },    // Air
    { name: 'Scorpio', emoji: '♏', color: '#6366f1' },   // Water
    { name: 'Sagittarius', emoji: '♐', color: '#f59e0b' },// Fire
    { name: 'Capricorn', emoji: '♑', color: '#16a34a' }, // Earth
    { name: 'Aquarius', emoji: '♒', color: '#06b6d4' },  // Air
    { name: 'Pisces', emoji: '♓', color: '#8b5cf6' }     // Water
];

const PLANETS = [
    { id: 'sun', symbol: '☀️', type: 'sunSign', label: 'Güneş' },
    { id: 'moon', symbol: '🌙', type: 'moonSign', label: 'Ay' },
    { id: 'rising', symbol: '⬆️', type: 'risingSign', label: 'Yükselen' }
];

export const NatalChart: React.FC<NatalChartProps> = ({ sunSign, moonSign, risingSign }) => {
    const size = 280;
    const center = size / 2;
    const radius = size * 0.4;
    const innerRadius = size * 0.25;

    const getSignIndex = (signName?: string) => {
        if (!signName) return -1;
        return ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === signName.toLowerCase());
    };

    const getAngle = (index: number) => {
        // -90 to start from top
        return (index * 30) - 90;
    };

    const userPlacements = {
        sunSign: getSignIndex(sunSign),
        moonSign: getSignIndex(moonSign),
        risingSign: getSignIndex(risingSign)
    };

    return (
        <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
            {/* Background Glow */}
            <div style={{
                position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                filter: 'blur(20px)', zIndex: 0
            }} />

            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ zIndex: 1, position: 'relative' }}>
                <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Outer Ring */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="1" />
                <circle cx={center} cy={center} r={radius + 20} fill="none" stroke="rgba(255, 215, 0, 0.1)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Inner Ring */}
                <circle cx={center} cy={center} r={innerRadius} fill="url(#centerGlow)" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1.5" />

                {/* Zodiac Sections */}
                {ZODIAC_SIGNS.map((sign, i) => {
                    const currentAngle = getAngle(i);
                    const startAngle = currentAngle - 15;

                    // Convert polar to cartesian
                    const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
                    const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);

                    // Sign Icon Position
                    const iconX = center + (radius + 10) * Math.cos((currentAngle * Math.PI) / 180);
                    const iconY = center + (radius + 10) * Math.sin((currentAngle * Math.PI) / 180);

                    return (
                        <g key={sign.name}>
                            {/* Dividers */}
                            <line
                                x1={center + innerRadius * Math.cos((startAngle * Math.PI) / 180)}
                                y1={center + innerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                x2={startX}
                                y2={startY}
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth="1"
                            />

                            {/* Sign Icon */}
                            <text
                                x={iconX}
                                y={iconY}
                                fill="white"
                                fontSize="14"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ textShadow: `0 0 8px ${sign.color}` }}
                            >
                                {sign.emoji}
                            </text>
                        </g>
                    );
                })}

                {/* User Planets */}
                {PLANETS.map((planet, i) => {
                    const placementIndex = userPlacements[planet.type as keyof typeof userPlacements];
                    if (placementIndex === -1) return null;

                    // Calculate position along the inner ring or slightly outside
                    const offsetIndex = i === 0 ? 0 : i === 1 ? -6 : 6; // slightly separate if in same sign
                    const angle = getAngle(placementIndex) + offsetIndex;

                    const pX = center + (innerRadius + 20) * Math.cos((angle * Math.PI) / 180);
                    const pY = center + (innerRadius + 20) * Math.sin((angle * Math.PI) / 180);

                    // Line from center
                    const lineStartX = center + 10 * Math.cos((angle * Math.PI) / 180);
                    const lineStartY = center + 10 * Math.sin((angle * Math.PI) / 180);

                    return (
                        <g key={planet.id}>
                            <motion.line
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: i * 0.3 }}
                                x1={lineStartX} y1={lineStartY} x2={pX} y2={pY}
                                stroke={i === 0 ? "rgba(255, 215, 0, 0.6)" : i === 1 ? "rgba(200, 200, 255, 0.6)" : "rgba(139, 92, 246, 0.6)"}
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                            />
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: i * 0.3 + 0.5 }}
                                cx={pX} cy={pY} r="12"
                                fill="#1c1c24"
                                stroke={i === 0 ? "#fbbf24" : i === 1 ? "#93c5fd" : "#c084fc"}
                                strokeWidth="2"
                            />
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.3 + 0.8 }}
                                x={pX} y={pY + 1}
                                fontSize="12"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {planet.symbol}
                            </motion.text>
                        </g>
                    );
                })}

                {/* Center Star */}
                <circle cx={center} cy={center} r="4" fill="var(--accent-gold)" />
            </svg>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                {PLANETS.map((p) => {
                    if (userPlacements[p.type as keyof typeof userPlacements] === -1) return null;
                    return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: 14 }}>{p.symbol}</span>
                            <span>{p.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
