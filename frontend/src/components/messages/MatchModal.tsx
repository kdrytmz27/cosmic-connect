import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import type { IFriend } from '../../types';
import '../../styles/messages.css';

interface MatchModalProps {
    friend: IFriend | null;
    onClose: () => void;
    onStartChat: (friend: IFriend) => void;
}

const MatchModal: React.FC<MatchModalProps> = ({ friend, onClose, onStartChat }) => {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {friend && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="modal-overlay modal-overlay-premium"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        onClick={e => e.stopPropagation()}
                        className="glass-panel modal-content-premium"
                    >
                        <div className="premium-glow-bg" />
                        <div className="relative z-10">
                            <div className="premium-match-header">✨ Yeni Eşleşme ✨</div>

                            <div className="premium-avatar-container">
                                <img
                                    src={friend.avatar ? `${BACKEND_URL}${friend.avatar}` : `https://ui-avatars.com/api/?name=${friend.name || 'U'}&background=random`}
                                    alt="Match"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>

                            <h2 className="text-[22px] text-white mb-1 capitalize">
                                {friend.name || (friend.email ? friend.email.split('@')[0] : 'Gizemli Yabancı')}
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] mb-6">
                                {friend.sunSign || ''}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => onStartChat(friend)}
                                    className="btn-primary py-3.5 flex items-center justify-center gap-2 text-[15px]"
                                >
                                    <Send size={18} /> Sohbet Et
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate(`/profile/${friend.id}`);
                                    }}
                                    className="btn-secondary-gold"
                                >
                                    <Sparkles size={18} /> Profile Git
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MatchModal;
