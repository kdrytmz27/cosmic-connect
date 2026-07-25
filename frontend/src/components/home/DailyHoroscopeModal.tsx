import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyHoroscopeWidget } from './DailyHoroscopeWidget';

interface DailyHoroscopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    dailyHoroscope: any;
}

export const DailyHoroscopeModal: React.FC<DailyHoroscopeModalProps> = ({ isOpen, onClose, dailyHoroscope }) => {
    if (!isOpen || !dailyHoroscope) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg z-10"
                >
                    <button 
                        onClick={onClose}
                        className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors z-20 bg-white/10 rounded-full p-2 backdrop-blur-md"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    
                    <div className="max-h-[85vh] overflow-y-auto rounded-3xl hide-scrollbar">
                        <DailyHoroscopeWidget dailyHoroscope={dailyHoroscope} />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
