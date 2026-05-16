import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const toastManager = {
    showToast: (message: string, _type: ToastType = 'info') => {
        console.warn('Toast not initialized:', message);
    }
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000); // Show toast for 4s
    }, []);

    // Attach to global manager
    React.useEffect(() => {
        toastManager.showToast = showToast;
    }, [showToast]);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'center',
                pointerEvents: 'none',
                width: '100%',
                maxWidth: 400,
                padding: '0 16px'
            }}>
                <AnimatePresence>
                    {toasts.map(toast => {
                        const isError = toast.type === 'error';
                        const isSuccess = toast.type === 'success';

                        return (
                            <motion.div
                                key={toast.id}

                                initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)', transition: { duration: 0.2 } }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                drag="y"
                                dragConstraints={{ top: -20, bottom: 20 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 20 || info.offset.y < -20) {
                                        removeToast(toast.id);
                                    }
                                }}
                                style={{
                                    background: isError ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(10,5,20,0.9))' :
                                        isSuccess ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(10,5,20,0.9))' :
                                            'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(10,5,20,0.9))',
                                    color: 'white',
                                    padding: '12px 16px',
                                    borderRadius: 16,
                                    fontSize: 14,
                                    fontWeight: '500',
                                    border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' :
                                        isSuccess ? 'rgba(34,197,94,0.3)' :
                                            'rgba(139, 92, 246, 0.3)'
                                        }`,
                                    boxShadow: `0 8px 32px ${isError ? 'rgba(239, 68, 68, 0.2)' :
                                        isSuccess ? 'rgba(34, 197, 94, 0.2)' :
                                            'rgba(139, 92, 246, 0.2)'
                                        }`,
                                    pointerEvents: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    width: '100%',
                                    cursor: 'grab'
                                }}
                                whileTap={{ cursor: 'grabbing' }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isError ? '#ef4444' : isSuccess ? '#22c55e' : '#a855f7'
                                }}>
                                    {isError ? <AlertTriangle size={20} /> :
                                        isSuccess ? <CheckCircle2 size={20} /> :
                                            <Info size={20} />}
                                </div>

                                <div style={{ flex: 1, lineHeight: 1.4 }}>
                                    {toast.message}
                                </div>

                                <button
                                    onClick={() => removeToast(toast.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: 4
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
