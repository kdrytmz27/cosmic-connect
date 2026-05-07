import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    text?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 32, text = 'Yükleniyor...', fullScreen = false }) => {
    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'relative',
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                }}
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Sparkles size={size * 0.8} color="var(--accent-gold)" />
                </motion.div>

                {/* Orbit ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        inset: -8,
                        border: '2px solid rgba(236, 72, 153, 0.4)',
                        borderRadius: '50%',
                        borderTopColor: 'var(--accent-pink)',
                        borderRightColor: 'transparent',
                        borderBottomColor: 'transparent',
                        filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))'
                    }}
                />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        inset: -16,
                        border: '2px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: '50%',
                        borderTopColor: 'var(--accent-purple)',
                        borderLeftColor: 'transparent',
                        borderBottomColor: 'transparent',
                        filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
                    }}
                />
            </motion.div>

            {text && (
                <motion.p
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                    style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: 1 }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div style={{
                position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10, 5, 20, 0.9)', zIndex: 9999
            }}>
                {content}
            </div>
        );
    }

    return (
        <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
            {content}
        </div>
    );
};
