import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Gift, Clock, Image as ImageIcon, Loader } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { IFriend, IMessage, IGift } from '../../types';
import '../../styles/messages.css';
import ExtendMatchModal from './ExtendMatchModal';
import { majorArcana } from '../../data/tarot';
import VoiceRecorder from '../common/VoiceRecorder';

const GIFTS: IGift[] = [
    { id: 'CRYSTAL', emoji: '💎', cost: 50, name: 'Kristal' },
    { id: 'MOON', emoji: '🌙', cost: 100, name: 'Ay Işığı' },
    { id: 'TAROT', emoji: '🃏', cost: 150, name: 'Tarot Kartı' },
    { id: 'STAR', emoji: '✨', cost: 200, name: 'Kader Yıldızı' }
];

interface ChatViewProps {
    activeChat: IFriend;
    setActiveChat: (chat: IFriend | null) => void;
    userSunSign: string;
    messages: IMessage[];
    userId: string;
    friendStatus: string | null;
    setFriendStatus: (status: string | null) => void;
    friendReqRemaining: number;
    setFriendReqRemaining: (n: number) => void;
    chatTimeLeft: number | null;
    typingUsers: Set<string>;
    isPremium: boolean;
    actionLoading: boolean;
    setActionLoading: (v: boolean) => void;
    setFriends: React.Dispatch<React.SetStateAction<IFriend[]>>;
    socket: any;
    handleSendMessage: (e: React.FormEvent) => void;
    handleMessageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    messageInput: string;
    handleExtendMatch: (targetId?: string) => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    updateEconomy: (data: any) => void;
}

const ChatView: React.FC<ChatViewProps> = ({
    activeChat, setActiveChat, userSunSign, messages, userId,
    friendStatus, setFriendStatus, friendReqRemaining, setFriendReqRemaining,
    chatTimeLeft, typingUsers, isPremium, actionLoading, setActionLoading,
    setFriends, socket,
    handleSendMessage, handleMessageInputChange, messageInput,
    handleExtendMatch, messagesEndRef, updateEconomy
}) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [showGiftPicker, setShowGiftPicker] = useState(false);
    const [sendingGift, setSendingGift] = useState(false);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendTargetFriend, setExtendTargetFriend] = useState<IFriend | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChat) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadRes = await api.post('/photo/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = uploadRes.data.imageUrl;

            // Now send the message with this imageUrl
            const optimisticMsg: IMessage = {
                id: Date.now().toString(),
                senderId: userId || '',
                receiverId: activeChat.id,
                content: '',
                imageUrl,
                createdAt: new Date().toISOString()
            };

            setFriends(prev => prev.map(f => f.id === activeChat.id ? { ...f, lastMessage: optimisticMsg } : f));
            // Trigger auto-scroll by forcing update
            if (messagesEndRef.current) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }

            await api.post('/user/messages', { receiverId: activeChat.id, content: '', imageUrl });
        } catch (err) {
            showToast('Fotoğraf gönderilemedi', 'error');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAudioUpload = async (blob: Blob) => {
        if (!activeChat) return;
        setUploadingAudio(true);
        const formData = new FormData();
        formData.append('audio', blob, 'voice_message.webm');

        try {
            const uploadRes = await api.post('/audio/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const audioUrl = uploadRes.data.audioUrl;

            const optimisticMsg: IMessage = {
                id: Date.now().toString(),
                senderId: userId || '',
                receiverId: activeChat.id,
                content: '',
                audioUrl,
                createdAt: new Date().toISOString()
            };

            setFriends(prev => prev.map(f => f.id === activeChat.id ? { ...f, lastMessage: optimisticMsg } : f));
            if (messagesEndRef.current) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }

            await api.post('/user/messages', { receiverId: activeChat.id, content: '', audioUrl });
        } catch (err) {
            showToast('Ses kaydı gönderilemedi', 'error');
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleSendGift = async (giftId: string) => {
        if (!activeChat) return;
        setSendingGift(true);
        try {
            await api.post('/gift/send', {
                receiverId: activeChat.id,
                giftType: giftId
            });
        } catch (e: any) {
            setSendingGift(false);
            if (e.response?.status === 403) {
                showToast('Yeterli Yıldız Tozu yok', 'error');
            } else {
                showToast('Hediye gönderilemedi', 'error');
            }
        }
    };

    // Listen for gift success to reset state
    React.useEffect(() => {
        if (!socket) return;
        const handleGiftSuccess = (data: any) => {
            updateEconomy({ stardustBalance: data.remainingStardust });
            showToast('Hediye başarıyla gönderildi!', 'success');
            setSendingGift(false);
            setShowGiftPicker(false);
        };
        socket.on('giftSentSuccess', handleGiftSuccess);
        return () => { socket.off('giftSentSuccess', handleGiftSuccess); };
    }, [socket, updateEconomy, showToast]);

    // Hide bottom nav while chatting
    React.useEffect(() => {
        document.body.classList.add('hide-nav');
        return () => document.body.classList.remove('hide-nav');
    }, []);

    // FEAT-11 Icebreaker Logic
    const getIcebreaker = (mySign: string, theirSign: string) => {
        const fire = ['Aries', 'Leo', 'Sagittarius', 'Koç', 'Aslan', 'Yay'];
        const earth = ['Taurus', 'Virgo', 'Capricorn', 'Boğa', 'Başak', 'Oğlak'];
        const air = ['Gemini', 'Libra', 'Aquarius', 'İkizler', 'Terazi', 'Kova'];
        const water = ['Cancer', 'Scorpio', 'Pisces', 'Yengeç', 'Akrep', 'Balık'];

        const getEl = (s: string) => {
            if (fire.includes(s)) return 'Ateş';
            if (earth.includes(s)) return 'Toprak';
            if (air.includes(s)) return 'Hava';
            if (water.includes(s)) return 'Su';
            return 'Bilinmiyor';
        };

        const e1 = getEl(mySign);
        const e2 = getEl(theirSign || '');

        if (e1 === 'Ateş' && e2 === 'Ateş') return "İki Ateş yan yana! Birlikte atılacağınız ilk macera ne olurdu?";
        if (e1 === 'Su' && e2 === 'Su') return "İki Su elementi... Duygusal derinlikler yüksek. En son hangi filmde ağladın?";
        if (e1 === 'Toprak' && e2 === 'Toprak') return "Sağlam ve kararlı iki Toprak. En sevdiğin konfor yemeği nedir?";
        if (e1 === 'Hava' && e2 === 'Hava') return "İki Hava, sonsuz zihinsel akış... Saatlerce tartışabileceğin o konu ne?";

        if ((e1 === 'Ateş' && e2 === 'Su') || (e1 === 'Su' && e2 === 'Ateş')) return "Ateş ve Su zıttır ama çok çeker! Onu şaşırtacak bir özelliğini paylaş.";
        if ((e1 === 'Ateş' && e2 === 'Hava') || (e1 === 'Hava' && e2 === 'Ateş')) return "Hava, Ateş'i harlandırır! Birlikte süper ikili olurdunuz, sence hangi süper gücünüz olurdu?";
        if ((e1 === 'Su' && e2 === 'Toprak') || (e1 === 'Toprak' && e2 === 'Su')) return "Su, toprağı besler. Huzurlu bir hafta sonu planı hayal et, ne yapardınız?";
        return "Yıldızlar sizi bir araya getirdi! Dikkatini çeken ilk detayı ona söylemek ister misin?";
    };

    return (
        <div className="chat-container">
            <div className="glass-panel chat-header">
                <button onClick={() => setActiveChat(null)} className="chat-back-btn">
                    <ArrowLeft size={20} />
                </button>
                <div
                    onClick={() => navigate(`/profile/${activeChat.id}`)}
                    className="chat-profile-info"
                >
                    <div className="chat-avatar-container">
                        <img src={activeChat.avatar ? `${BACKEND_URL}${activeChat.avatar}` : `https://ui-avatars.com/api/?name=${activeChat.name || (activeChat.email ? activeChat.email.split('@')[0] : 'U')}&background=random`} alt={activeChat.name || 'User'} />
                    </div>
                    <div>
                        <h3 className="chat-name">{activeChat.name || (activeChat.email ? activeChat.email.split('@')[0] : 'Gizemli Yabancı')}</h3>
                        <p className="chat-subtitle">Profili Gör</p>
                    </div>
                </div>

                <div className="chat-actions">
                    {friendStatus !== null && friendStatus !== 'friends' && (
                        <div className="flex items-center gap-2">
                            {friendStatus === 'sent' && (
                                <span className="status-badge sent">İstek Gönderildi ✓</span>
                            )}
                            {friendStatus === 'received' && (
                                <span className="status-badge received">İstek Geldi</span>
                            )}
                            {friendStatus === 'none' && (
                                <div className="flex flex-col items-end gap-0.5">
                                    <button
                                        disabled={actionLoading}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            setActionLoading(true);
                                            try {
                                                const res = await api.post('/user/friend-request', { receiverId: activeChat.id });
                                                setFriendStatus(res.data.autoAccepted ? 'friends' : 'sent');
                                                setFriendReqRemaining(res.data.remaining);
                                                showToast(res.data.autoAccepted ? 'Arkadaş oldunuz! ✨' : 'İstek gönderildi 💫', 'success');
                                                api.get('/user/friends').then(r => setFriends(r.data.friends || []));
                                            } catch (err: any) {
                                                showToast(err.response?.data?.error || 'İstek gönderilemedi', 'error');
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className="btn-action-primary"
                                    >
                                        <Sparkles size={12} /> İstek Gönder
                                    </button>
                                    {!isPremium && <span className="chat-subtitle" style={{ fontSize: 9 }}>Kalan: {friendReqRemaining}</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timer display for temporary chats */}
                    {activeChat.expiresAt && !activeChat.isExpired && chatTimeLeft !== null && chatTimeLeft > 0 && (
                        <div className="timer-badge">
                            <Clock size={14} color="var(--accent-pink)" />
                            <span className="timer-text">{Math.floor(chatTimeLeft / 60)}:{String(chatTimeLeft % 60).padStart(2, '0')}</span>
                        </div>
                    )}
                    {activeChat.isExpired && (
                        <div
                            onClick={() => { setExtendTargetFriend(activeChat); setShowExtendModal(true); }}
                            className="expired-badge"
                        >
                            <span className="expired-text">Süresi Doldu</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-messages-area">
                {messages.length === 0 ? (
                    <div className="chat-empty-state">
                        <Sparkles size={32} color="var(--accent-gold)" className="mx-auto mb-3" />
                        <p style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>İlk adımı siz atın!</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' }}>
                            <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,215,0,0.3)', maxWidth: '80%' }}>
                                <p style={{ fontSize: 13, color: 'var(--accent-gold)', fontStyle: 'italic', margin: 0 }}>
                                    💡 Kozmik Buz Kırıcı: <br /> "{getIcebreaker(userSunSign, activeChat.sunSign || '')}"
                                </p>
                            </div>

                            {(() => {
                                // Consistent hash from both IDs (order doesn't matter for commutative addition, but we can sort to be sure both users see the same card)
                                const sortedIds = [userId, activeChat.id].sort();
                                const connectionHash = (sortedIds[0] + sortedIds[1]).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                const tarotCard = majorArcana[connectionHash % 22];

                                return (
                                    <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(167, 139, 250, 0.3)', maxWidth: '80%', textAlign: 'center' }}>
                                        <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                                            Kozmik Bağ Kartınız: {tarotCard.emoji}
                                        </p>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                                            <strong>{tarotCard.name}</strong> <br />
                                            {tarotCard.meaning}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    messages.map((m, idx) => {
                        const isMine = m.senderId === userId;
                        const isGift = m.content.startsWith('GIFT:');
                        let content = m.content;
                        let giftColor = '';
                        let giftEmoji = '';

                        if (isGift) {
                            const type = m.content.replace('GIFT:', '');
                            const gift = GIFTS.find(g => g.id === type);
                            if (gift) {
                                giftEmoji = gift.emoji;
                                giftColor = gift.id === 'CRYSTAL' ? '#60a5fa' : gift.id === 'MOON' ? '#fde047' : gift.id === 'TAROT' ? '#f472b6' : '#a78bfa';
                                content = `${isMine ? 'Gönderdin:' : 'Gönderdi:'} ${gift.name} ${gift.emoji}`;
                            }
                        }

                        let bubbleClasses = `msg-bubble ${isMine ? 'mine' : 'theirs'} ${isGift ? 'gift' : ''}`;
                        const customStyles = isGift ? {
                            background: `linear-gradient(135deg, ${giftColor}40, transparent)`,
                            border: `1px solid ${giftColor}`,
                            color: giftColor,
                            boxShadow: `0 0 10px ${giftColor}40`
                        } : {};

                        return (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                                className={bubbleClasses}
                                style={customStyles}
                            >
                                {isGift && <span className="text-2xl" style={{ filter: `drop-shadow(0 0 5px ${giftColor})` }}>{giftEmoji}</span>}
                                {m.imageUrl && (
                                    <img src={`${BACKEND_URL}${m.imageUrl}`} alt="Attachment" style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer', display: 'block', marginBottom: content ? '8px' : '0' }} onClick={() => window.open(`${BACKEND_URL}${m.imageUrl}`, '_blank')} />
                                )}
                                {m.audioUrl && (
                                    <div style={{ marginBottom: content ? '8px' : '0' }}>
                                        <audio controls src={`${BACKEND_URL}${m.audioUrl}`} style={{ height: 36, maxWidth: 220 }} />
                                    </div>
                                )}
                                {content && <div>{content}</div>}
                            </motion.div>
                        )
                    })
                )}
                {typingUsers.has(activeChat.id) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="chat-typing-indicator"
                    >
                        {activeChat.name?.split(' ')[0] || 'Kullanıcı'} yazıyor...
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="glass-panel chat-input-area">
                <AnimatePresence>
                    {showGiftPicker && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="gift-picker-container"
                        >
                            <div className="gift-grid">
                                {GIFTS.map(gift => (
                                    <button
                                        key={gift.id}
                                        disabled={sendingGift}
                                        onClick={() => handleSendGift(gift.id)}
                                        className="gift-item"
                                        style={{ opacity: sendingGift ? 0.5 : 1 }}
                                    >
                                        <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.5))' }}>{gift.emoji}</span>
                                        <span className="text-[10px] text-[var(--accent-gold)]">-{gift.cost}⭐</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex gap-2 items-center">
                    {activeChat.isExpired ? (
                        <div className="w-full flex flex-col gap-2 py-2 px-1">
                            <p className="text-[var(--accent-pink)] text-[13px] text-center m-0 font-bold">Bu sohbetin süresi doldu!</p>
                            <button
                                disabled={actionLoading}
                                onClick={() => { setExtendTargetFriend(activeChat); setShowExtendModal(true); }}
                                className="btn-secondary-gold"
                            >
                                <Sparkles size={14} /> Süreyi Uzat (100⭐)
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button
                                disabled={uploadingImage}
                                onClick={() => fileInputRef.current?.click()}
                                className="gift-toggle-btn"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {uploadingImage ? <Loader size={20} className="animate-spin" /> : <ImageIcon size={24} />}
                            </button>
                            <button
                                onClick={() => setShowGiftPicker(!showGiftPicker)}
                                className="gift-toggle-btn"
                                style={{
                                    background: showGiftPicker ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                                    color: showGiftPicker ? 'var(--accent-gold)' : 'var(--text-secondary)'
                                }}
                            >
                                <Gift size={24} />
                            </button>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <form onSubmit={handleSendMessage} className="chat-input-form" style={{ flex: 1, display: messageInput.trim() ? 'flex' : 'none' }}>
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={handleMessageInputChange}
                                        placeholder="Mesaj yaz..."
                                        className="chat-input-field"
                                    />
                                    <button type="submit" disabled={!messageInput.trim()} className="chat-send-btn" style={{ color: messageInput.trim() ? 'var(--accent-pink)' : 'var(--text-secondary)' }}>
                                        <Send size={24} />
                                    </button>
                                </form>
                                {!messageInput.trim() && (
                                    <>
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={handleMessageInputChange}
                                            placeholder="Mesaj yaz..."
                                            className="chat-input-field flex-1"
                                            style={{ minWidth: 50 }}
                                        />
                                        <VoiceRecorder 
                                            onRecordingComplete={handleAudioUpload} 
                                            isUploading={uploadingAudio} 
                                            maxDurationMs={180000} 
                                        />
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Extend Match Modal (inside chat view) */}
            <ExtendMatchModal
                isOpen={showExtendModal}
                friend={extendTargetFriend}
                actionLoading={actionLoading}
                onClose={() => { setShowExtendModal(false); setExtendTargetFriend(null); }}
                onConfirm={(id) => handleExtendMatch(id)}
            />
        </div>
    );
};

export default ChatView;
