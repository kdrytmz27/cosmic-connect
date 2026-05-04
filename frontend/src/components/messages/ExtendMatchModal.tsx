import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { IFriend } from '../../types';
import '../../styles/messages.css';

interface ExtendMatchModalProps {
    isOpen: boolean;
    friend: IFriend | null;
    actionLoading: boolean;
    onClose: () => void;
    onConfirm: (friendId: string) => void;
}

const ExtendMatchModal: React.FC<ExtendMatchModalProps> = ({ isOpen, friend, actionLoading, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && friend && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="modal-overlay"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-panel modal-content"
                    >
                        <div className="text-5xl mb-4">⏳</div>
                        <h3 className="modal-title">Süreyi Uzat</h3>
                        <p className="modal-text">
                            <span className="text-white font-bold capitalize">{friend.name || 'Gizemli Ruh'}</span> ile sohbetinizin süresini uzatmak istiyor musunuz?
                        </p>
                        <div className="cost-badge">
                            <Sparkles size={16} color="var(--accent-gold)" />
                            <span className="cost-text">100 Yıldız Tozu</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn-cancel"
                            >
                                İptal
                            </button>
                            <button
                                disabled={actionLoading}
                                onClick={() => onConfirm(friend.id)}
                                className="btn-primary"
                            >
                                {actionLoading ? 'Uzatılıyor...' : 'Onayla'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ExtendMatchModal;
