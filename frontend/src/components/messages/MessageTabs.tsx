import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Trash2, Clock } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { IFriend, IFriendRequest, IZodiacSign } from '../../types';
import '../../styles/messages.css';

const getLastSeenText = (lastSeen: string | null | undefined): string => {
    if (!lastSeen) return '';
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
    if (diff < 60) return 'Son görülme: şimdi';
    if (diff < 3600) return `Son görülme: ${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `Son görülme: ${Math.floor(diff / 3600)} saat önce`;
    return `Son görülme: ${Math.floor(diff / 86400)} gün önce`;
};

// ==================== MatchesTab ====================
interface MatchesTabProps {
    newMatches: IFriend[];
    user: { isPremium?: boolean };
    setShowPremiumModal: (v: boolean) => void;
    setMatchModalFriend: (f: IFriend | null) => void;
    setActiveChat: (f: IFriend) => void;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({ newMatches, user, setShowPremiumModal, setMatchModalFriend, setActiveChat }) => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {newMatches.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center mt-8">Bekleyen yeni eşleşmeniz yok.</p>
            ) : (
                <div className="match-grid">
                    {newMatches.map((friend) => {
                        const name = friend.name || (friend.email ? friend.email.split('@')[0] : 'Gizemli Yabancı');
                        const isHidden = friend.isBlurred && friend.isMatch;
                        return (
                            <div key={friend.id} onClick={() => {
                                if (isHidden) {
                                    setShowPremiumModal(true);
                                } else if (user.isPremium) {
                                    setMatchModalFriend(friend);
                                } else {
                                    setActiveChat(friend);
                                }
                            }} className="match-item">
                                <div className={`match-avatar-outer ${isHidden ? 'view-hidden-match' : ''}`}>
                                    <div className="match-avatar-inner">
                                        {isHidden ? (
                                            <div className="hidden-match-content">
                                                <Sparkles size={28} color="var(--accent-gold)" className="animate-pulse" />
                                            </div>
                                        ) : (
                                            <img src={friend.avatar ? `${BACKEND_URL}${friend.avatar}` : `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </div>
                                <span className="match-name-label">
                                    {isHidden ? '✨ Gizemli' : name}
                                    {!isHidden && friend.isPremium && <Crown size={12} color="var(--accent-gold)" />}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

// ==================== ConversationsTab ====================
interface ConversationsTabProps {
    activeConversations: IFriend[];
    userId: string;
    swipedChatId: string | null;
    setSwipedChatId: (id: string | null) => void;
    handleDeleteChat: (friendId: string) => void;
    showToast: (msg: string, type: any) => void;
    setActiveChat: (f: IFriend) => void;
    setExtendTargetFriend: (f: IFriend | null) => void;
    setShowExtendModal: (v: boolean) => void;
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({ activeConversations, userId, swipedChatId, setSwipedChatId, handleDeleteChat, showToast, setActiveChat, setExtendTargetFriend, setShowExtendModal }) => {
    const navigate = useNavigate();
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {activeConversations.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center mt-8">Henüz hiçbir sohbete başlamadınız. Yeni Eşleşmeler sekmesinden ilk adımı atabilirsiniz!</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {activeConversations.map((friend) => {
                        const name = friend.name || (friend.email ? friend.email.split('@')[0] : 'Gizemli Yabancı');
                        const isMine = friend.lastMessage?.senderId === userId;
                        return (
                            <div key={friend.id} className="list-item">
                                {swipedChatId === friend.id && (
                                    <div className="swipe-delete-bg">
                                        <button onClick={() => handleDeleteChat(friend.id)} className="flex flex-col items-center gap-1 text-white bg-transparent border-none cursor-pointer">
                                            <Trash2 size={20} />
                                            <span className="text-[11px] font-bold">Sil</span>
                                        </button>
                                    </div>
                                )}
                                <motion.div
                                    drag="x" dragConstraints={{ left: -80, right: 0 }} dragElastic={0.1}
                                    onDragEnd={(_, info) => setSwipedChatId(info.offset.x < -60 ? friend.id : null)}
                                    animate={{ x: swipedChatId === friend.id ? -80 : 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    onClick={() => {
                                        if (swipedChatId === friend.id) { setSwipedChatId(null); return; }
                                        if (friend.isBlurred) showToast('Bu sohbeti görmek için Premium üye olmalısın.', 'error');
                                        else setActiveChat(friend);
                                    }}
                                    className="glass-panel list-item-content"
                                    style={{
                                        border: friend.status === 'SWIPE_MATCH' && friend.hasMessages ? '2px solid rgba(255, 215, 0, 0.5)' : undefined,
                                        boxShadow: friend.status === 'SWIPE_MATCH' && friend.hasMessages ? '0 0 16px rgba(255, 215, 0, 0.2), inset 0 0 12px rgba(236, 72, 153, 0.05)' : undefined,
                                        opacity: friend.isBlurred ? 0.6 : 1
                                    }}
                                >
                                    <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${friend.id}`); }} className="list-item-avatar" style={{ position: 'relative' }}>
                                        <img src={friend.avatar ? `${BACKEND_URL}${friend.avatar}` : `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} style={{ filter: friend.isBlurred ? 'blur(8px)' : 'none' }} />
                                        {friend.isOnline && !friend.isBlurred && (
                                            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f1e', display: 'block' }} />
                                        )}
                                    </div>
                                    <div className="list-item-info">
                                        <h3 className="list-item-title" style={{ filter: friend.isBlurred ? 'blur(4px)' : 'none' }}>
                                            {friend.isBlurred ? 'Gizemli Ruh' : name}
                                            {!friend.isBlurred && friend.isPremium && <Crown size={14} color="var(--accent-gold)" />}
                                        </h3>
                                        <p className="list-item-subtitle" style={{
                                            color: isMine ? 'var(--text-secondary)' : 'white',
                                            fontWeight: isMine ? 'normal' : 'bold',
                                            filter: friend.isBlurred ? 'blur(4px)' : 'none'
                                        }}>
                                            {friend.isBlurred ? '...' : friend.lastMessage ? ((isMine ? 'Sen: ' : '') + friend.lastMessage.content) : '✨ Yeni eşleşme! İlk mesajı gönder.'}
                                        </p>
                                    </div>
                                    {!friend.isBlurred && (() => {
                                        if (friend.status === 'SWIPE_MATCH') return <div className="tag-badge" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,180,0,0.15))', color: 'var(--accent-gold)', border: '1px solid rgba(255,215,0,0.3)' }}>💛 Eşleşme</div>;
                                        if (friend.status === 'FRIEND') return <div className="tag-badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>👫 Arkadaş</div>;
                                        if (friend.status === 'MATCH') return <div className="tag-badge" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.25)' }}>⏳ Süre</div>;
                                        return null;
                                    })()}
                                    {friend.isExpired && !friend.isBlurred && (
                                        <div onClick={(e) => { e.stopPropagation(); setExtendTargetFriend(friend); setShowExtendModal(true); }} className="tag-badge bg-[rgba(236,72,153,0.2)] text-[var(--accent-pink)] cursor-pointer py-1 px-2">
                                            Süresi Doldu
                                        </div>
                                    )}
                                    {friend.expiresAt && !friend.isExpired && !friend.isBlurred && (() => {
                                        const left = Math.max(0, Math.floor((new Date(friend.expiresAt).getTime() - Date.now()) / 1000));
                                        return left > 0 ? (
                                            <div className="tag-badge bg-[rgba(139,92,246,0.2)] text-[var(--accent-purple)] flex items-center gap-1 py-1 px-2">
                                                <Clock size={10} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
                                            </div>
                                        ) : null;
                                    })()}
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

// ==================== FriendsTab ====================
interface FriendsTabProps {
    actualFriends: IFriend[];
    isTeller: boolean;
    setActiveChat: (f: IFriend) => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({ actualFriends, isTeller, setActiveChat }) => {
    const navigate = useNavigate();
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {actualFriends.length === 0 ? (
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-[var(--text-secondary)] text-center mt-10">
                    <Sparkles size={32} color="var(--accent-pink)" className="mx-auto mb-3 opacity-80" />
                    <p>{isTeller ? 'Henüz bir danışanınız yok.' : 'Henüz bir arkadaşınız yok.'}</p>
                    {!isTeller && <p className="text-xs mt-2">Keşfet'ten yeni insanlarla tanışmaya başla!</p>}
                </motion.div>
            ) : (
                <div className="flex flex-col gap-3">
                    {[...actualFriends].sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || '')).map((friend) => {
                        const name = friend.name || (friend.email ? friend.email.split('@')[0] : 'Gizemli Yabancı');
                        return (
                            <div key={friend.id} onClick={() => setActiveChat(friend)} className="glass-panel list-item-content">
                                <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${friend.id}`); }} className="list-item-avatar" style={{ position: 'relative' }}>
                                    <img src={friend.avatar ? `${BACKEND_URL}${friend.avatar}` : `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} />
                                    {friend.isOnline && (
                                        <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f1e', display: 'block' }} />
                                    )}
                                </div>
                                <div className="list-item-info">
                                    <h3 className="list-item-title">
                                        {name}
                                        {friend.isPremium && <Crown size={14} color="var(--accent-gold)" />}
                                    </h3>
                                    <p className="list-item-subtitle">
                                        {friend.isOnline ? <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 12 }}>● Çevrimiçi</span> : getLastSeenText(friend.lastSeen) || 'Sohbet başlatmak için tıklayın ✨'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

// ==================== RequestsTab ====================
interface RequestsTabProps {
    requests: IFriendRequest[];
    isPremium: boolean;
    friendReqRemaining: number;
    actionLoading: boolean;
    setActionLoading: (v: boolean) => void;
    setRequests: React.Dispatch<React.SetStateAction<IFriendRequest[]>>;
    setFriendReqRemaining: (n: number) => void;
    setFriends: React.Dispatch<React.SetStateAction<IFriend[]>>;
    showToast: (msg: string, type: any) => void;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({ requests, isPremium, friendReqRemaining, actionLoading, setActionLoading, setRequests, setFriendReqRemaining, setFriends, showToast }) => {
    const navigate = useNavigate();
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {!isPremium && <div className="text-xs text-[var(--text-secondary)] text-right mb-4">Kalan Günlük Hakkınız: {friendReqRemaining}</div>}
            {requests.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center mt-8">Bekleyen arkadaşlık isteğiniz yok.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {requests.map((req) => (
                        <div key={req.id} className="glass-panel list-item-content">
                            <div onClick={() => navigate(`/profile/${req.sender.id}`)} className="list-item-avatar cursor-pointer" style={{ width: 48, height: 48 }}>
                                <img src={req.sender.avatar ? `${BACKEND_URL}${req.sender.avatar}` : `https://ui-avatars.com/api/?name=${req.sender.name || 'U'}&background=random`} alt={req.sender.name} />
                            </div>
                            <div className="list-item-info">
                                <h3 className="list-item-title">
                                    {req.sender.name || 'Kullanıcı'}
                                    <span className="text-sm ml-1.5">{req.sender.sunSign}</span>
                                </h3>
                                <p className="list-item-subtitle">Size arkadaşlık isteği gönderdi</p>
                            </div>
                            <div className="list-item-actions">
                                <button
                                    disabled={actionLoading}
                                    onClick={async () => {
                                        setActionLoading(true);
                                        try {
                                            await api.post(`/user/friend-request/${req.id}/reject`);
                                            setRequests(prev => prev.filter(r => r.id !== req.id));
                                            showToast('İstek reddedildi', 'info');
                                        } catch (err) {
                                            showToast('Hata oluştu', 'error');
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    className="btn-action-outline"
                                >
                                    Reddet
                                </button>
                                <button
                                    disabled={actionLoading}
                                    onClick={async () => {
                                        setActionLoading(true);
                                        try {
                                            const res = await api.post(`/user/friend-request/${req.id}/accept`);
                                            setRequests(prev => prev.filter(r => r.id !== req.id));
                                            setFriendReqRemaining(res.data.remaining);
                                            api.get('/user/friends').then(r => setFriends(r.data.friends || []));
                                            showToast('İstek kabul edildi! Artık arkadaşsınız ✨', 'success');
                                        } catch (err: any) {
                                            showToast(err.response?.data?.error || 'Hata oluştu', 'error');
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    className="btn-action-primary px-4"
                                >
                                    Kabul Et
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// ==================== GroupsTab ====================
interface GroupsTabProps {
    zodiacSigns: IZodiacSign[];
    setActiveGroup: (group: string) => void;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({ zodiacSigns, setActiveGroup }) => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>Burcunun gizli yetenekleriyle tanış veya ilgini çeken burçların odalarına katıl!</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {zodiacSigns.map(sign => (
                    <div
                        key={sign.id}
                        onClick={() => setActiveGroup(sign.id)}
                        className="glass-panel p-4 flex flex-col items-center justify-center gap-2 cursor-pointer text-center transition-all bg-transparent"
                    >
                        <div className="text-[32px] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{sign.emoji}</div>
                        <h4 className="text-sm m-0 text-white">{sign.tr} Odası</h4>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
