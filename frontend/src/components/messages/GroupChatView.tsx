import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import type { IGroupMessage, IZodiacSign } from '../../types';
import '../../styles/messages.css';

interface GroupChatViewProps {
    activeGroup: string;
    setActiveGroup: (group: string | null) => void;
    groupMessages: IGroupMessage[];
    userId: string;
    messageInput: string;
    setMessageInput: (v: string) => void;
    handleSendGroupMessage: (e: React.FormEvent) => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    zodiacSigns: IZodiacSign[];
}

const GroupChatView: React.FC<GroupChatViewProps> = ({
    activeGroup, setActiveGroup, groupMessages, userId,
    messageInput, setMessageInput, handleSendGroupMessage,
    messagesEndRef, zodiacSigns
}) => {
    const navigate = useNavigate();
    const signInfo = zodiacSigns.find(s => s.id === activeGroup);

    return (
        <div className="chat-container">
            <div className="glass-panel chat-header">
                <button onClick={() => setActiveGroup(null)} className="chat-back-btn">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 className="chat-name" style={{ fontSize: 18 }}>{signInfo?.emoji} {signInfo?.tr} Odası</h3>
                    <p className="chat-subtitle">Canlı Astral Topluluk Forumu ✨</p>
                </div>
            </div>

            <div className="chat-messages-area">
                {groupMessages.length === 0 ? (
                    <div className="chat-empty-state">
                        <Sparkles size={32} color="var(--accent-gold)" className="mx-auto mb-3" />
                        <p>Bu odada henüz mesaj yok. İlk mesajı sen gönder!</p>
                    </div>
                ) : (
                    groupMessages.map((m, idx) => {
                        const isMine = m.senderId === userId;
                        return (
                            <motion.div key={m.id || idx} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="group-msg-row" style={{ flexDirection: isMine ? 'row-reverse' : 'row' }}>
                                {!isMine && (
                                    <div
                                        onClick={() => navigate(`/profile/${m.senderId}`)}
                                        className="group-avatar-small"
                                    >
                                        <img src={m.sender?.avatar ? `${BACKEND_URL}${m.sender.avatar}` : `https://ui-avatars.com/api/?name=${m.sender?.name || 'U'}&background=random`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="group-msg-content-wrapper" style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                                    {!isMine && <span className="group-sender-name">{m.sender?.name || 'Kullanıcı'} {m.sender?.cosmicStatus && ` • ${m.sender.cosmicStatus}`}</span>}
                                    <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`} style={{ borderBottomLeftRadius: !isMine ? 4 : 16, borderBottomRightRadius: isMine ? 4 : 16 }}>
                                        {m.content}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="glass-panel chat-input-area">
                <form onSubmit={handleSendGroupMessage} className="chat-input-form">
                    <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder={`${signInfo?.tr} odasına mesaj gönder...`} className="chat-input-field" />
                    <button type="submit" disabled={!messageInput.trim()} className="chat-send-btn" style={{ color: messageInput.trim() ? 'var(--accent-pink)' : 'var(--text-secondary)' }}>
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GroupChatView;
