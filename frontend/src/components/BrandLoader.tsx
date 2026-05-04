import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';

export const BrandLoader = ({ message = "Kozmik Sırlar Çözülüyor..." }: { message?: string }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            width: '100%'
        }}>
            <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
                {/* Center Star */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180],
                        filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2
                    }}
                >
                    <Sparkles size={40} color="var(--accent-gold)" />
                </motion.div>

                {/* Orbiting Elements */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        border: '2px dashed rgba(236,72,153, 0.3)'
                    }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            top: -6, left: '50%', transform: 'translateX(-50%)'
                        }}
                    >
                        <Star size={16} color="var(--accent-pink)" fill="var(--accent-pink)" />
                    </motion.div>
                </motion.div>

                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        right: -10,
                        bottom: -10,
                        borderRadius: '50%',
                        border: '1px solid rgba(139,92,246, 0.2)'
                    }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        style={{
                            position: 'absolute',
                            bottom: -4, right: '20%',
                            boxShadow: '0 0 10px var(--accent-purple)'
                        }}
                    >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)' }} />
                    </motion.div>
                </motion.div>
            </div>

            <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: 1
                }}
            >
                {message}
            </motion.p>
        </div>
    );
};
