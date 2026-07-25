import React, { useMemo, useState } from 'react';
import { getDailyTransit } from '../../utils/transitCalculator';
import { Sparkles, AlertTriangle, Heart, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransitRadarProps {
    userSign?: string;
    partnerSign?: string;
}

export const TransitRadar: React.FC<TransitRadarProps> = ({ userSign = 'Aries', partnerSign = 'Taurus' }) => {
    const [isVisible, setIsVisible] = useState(true);

    const transit = useMemo(() => {
        return getDailyTransit(userSign, partnerSign);
    }, [userSign, partnerSign]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (transit.type) {
            case 'ROMANCE': return <Heart className="w-5 h-5 text-pink-500" />;
            case 'COMMUNICATION': return <Sparkles className="w-5 h-5 text-blue-500" />;
            case 'CONFLICT': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'LUCK': return <Zap className="w-5 h-5 text-yellow-500" />;
            default: return <Sparkles className="w-5 h-5 text-purple-500" />;
        }
    };

    const getBgColor = () => {
        switch (transit.energyLevel) {
            case 'HIGH': return 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20';
            case 'MEDIUM': return 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20';
            case 'LOW': return 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20';
            default: return 'bg-white/5 border-white/10';
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative mx-4 mt-4 p-4 rounded-2xl border backdrop-blur-md ${getBgColor()}`}
            >
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4 text-white/50" />
                </button>
                
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white/10 rounded-xl shadow-inner">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">GÜNLÜK TRANSİT RADARI</span>
                            <span className="text-sm">{transit.icon}</span>
                        </div>
                        <h4 className="text-white font-semibold mt-1">{transit.title}</h4>
                        <p className="text-white/70 text-sm mt-1 leading-relaxed">
                            {transit.message}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
