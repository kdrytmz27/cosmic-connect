import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { AnimatePresence } from 'framer-motion';
import { BrandLoader } from '../components/BrandLoader';
import { PremiumModal } from '../components/common/PremiumModal';
import ChatView from '../components/messages/ChatView';
import GroupChatView from '../components/messages/GroupChatView';
import ExtendMatchModal from '../components/messages/ExtendMatchModal';
import MatchModal from '../components/messages/MatchModal';
import { MatchesTab, ConversationsTab, FriendsTab, RequestsTab, GroupsTab } from '../components/messages/MessageTabs';
import type { IFriend, IMessage, IFriendRequest, IGroupMessage, IZodiacSign } from '../types';
import '../styles/messages.css';

const ZODIAC_SIGNS: IZodiacSign[] = [
    { id: 'Aries', tr: 'Koç', emoji: '♈' },
    { id: 'Taurus', tr: 'Boğa', emoji: '♉' },
    { id: 'Gemini', tr: 'İkizler', emoji: '♊' },
    { id: 'Cancer', tr: 'Yengeç', emoji: '♋' },
    { id: 'Leo', tr: 'Aslan', emoji: '♌' },
    { id: 'Virgo', tr: 'Başak', emoji: '♍' },
    { id: 'Libra', tr: 'Terazi', emoji: '♎' },
    { id: 'Scorpio', tr: 'Akrep', emoji: '♏' },
    { id: 'Sagittarius', tr: 'Yay', emoji: '♐' },
    { id: 'Capricorn', tr: 'Oğlak', emoji: '♑' },
    { id: 'Aquarius', tr: 'Kova', emoji: '♒' },
    { id: 'Pisces', tr: 'Balık', emoji: '♓' },
];

const Messages = () => {
    const { user, userId, updateEconomy } = useAuth();
    const isTeller = user?.role === 'FORTUNE_TELLER';
    const { socket } = useSocket();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [friends, setFriends] = useState<IFriend[]>([]);
    const [activeChat, setActiveChat] = useState<IFriend | null>(null);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [groupMessages, setGroupMessages] = useState<IGroupMessage[]>([]);
    const [requests, setRequests] = useState<IFriendRequest[]>([]);
    const [friendReqRemaining, setFriendReqRemaining] = useState<number>(0);
    const [friendStatus, setFriendStatus] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'messages' | 'requests' | 'friends' | 'matches' | 'groups'>('messages');
    const [actionLoading, setActionLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [chatTimeLeft, setChatTimeLeft] = useState<number | null>(null);
    const [swipedChatId, setSwipedChatId] = useState<string | null>(null);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendTargetFriend, setExtendTargetFriend] = useState<IFriend | null>(null);
    const [matchModalFriend, setMatchModalFriend] = useState<IFriend | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const isPremium = user?.isPremium;

    const [serverOffset, setServerOffset] = useState(0);

    // ==================== Data Fetching ====================
    useEffect(() => {
        if (!userId) return;
        Promise.all([
            api.get('/user/friends'),
            api.get('/user/friend-requests')
        ]).then(([friendsRes, requestsRes]) => {
            if (friendsRes.data.serverTime) {
                setServerOffset(Date.now() - friendsRes.data.serverTime);
            }
            setFriends(friendsRes.data.friends || []);
            setRequests(requestsRes.data.requests || []);
            setFriendReqRemaining(requestsRes.data.remaining || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        if (activeChat) {
            api.get(`/user/messages/${activeChat.id}`).then(res => {
                setMessages(res.data.messages || []);
                scrollToBottom();
            });
            api.get(`/user/friend-request-status/${activeChat.id}`).then(res => {
                setFriendStatus(res.data.status);
                setFriendReqRemaining(res.data.remaining);
            }).catch(() => setFriendStatus('none'));
        } else {
            setFriendStatus(null);
        }
    }, [activeChat]);

    // ==================== Timers ====================
    useEffect(() => {
        if (!activeChat?.expiresAt || activeChat.isExpired) {
            setChatTimeLeft(null);
            return;
        }
        const calcTimeLeft = () => {
            const adjustedNow = Date.now() - serverOffset;
            return Math.max(0, Math.floor((new Date(activeChat.expiresAt!).getTime() - adjustedNow) / 1000));
        };
        setChatTimeLeft(calcTimeLeft());

        const interval = setInterval(() => {
            const left = calcTimeLeft();
            setChatTimeLeft(left);
            if (left <= 0) {
                setActiveChat(prev => prev ? { ...prev, isExpired: true } : prev);
                setFriends(prev => prev.map(f => f.id === activeChat.id ? { ...f, isExpired: true } : f));
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeChat?.id, activeChat?.expiresAt, activeChat?.isExpired, serverOffset]);

    useEffect(() => {
        const interval = setInterval(() => {
            setFriends(prev => [...prev]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // ==================== Group Chat ====================
    useEffect(() => {
        if (activeGroup) {
            api.get(`/group/${activeGroup}`).then(res => {
                setGroupMessages(res.data.messages || []);
                scrollToBottom();
            });
            socket?.emit('joinGroup', activeGroup);
            return () => { socket?.emit('leaveGroup', activeGroup); };
        }
    }, [activeGroup, socket]);

    // ==================== Socket Handlers ====================
    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (msg: any) => {
            if (activeChat && msg.senderId === activeChat.id) {
                setMessages(prev => {
                    // Deduplication: Aynı messageId zaten varsa ekleme
                    if (msg.messageId && prev.some(m => m.id === msg.messageId)) {
                        return prev;
                    }
                    return [...prev, {
                        id: msg.messageId || Date.now().toString(),
                        senderId: msg.senderId,
                        receiverId: userId || '',
                        content: msg.content,
                        createdAt: new Date(msg.timestamp).toISOString()
                    }];
                });
                scrollToBottom();
            }
            setFriends(prev => prev.map(f => f.id === msg.senderId ? {
                ...f,
                lastMessage: { content: msg.content, senderId: msg.senderId, createdAt: new Date(msg.timestamp).toISOString() }
            } : f));
        };

        const handleNewGroupMessage = (msg: IGroupMessage) => {
            if (activeGroup && msg.roomId === activeGroup) {
                setGroupMessages(prev => [...prev, msg]);
                scrollToBottom();
            }
        };

        const handleUserTyping = (data: { senderId: string }) => {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.add(data.senderId);
                return next;
            });
        };

        const handleUserStoppedTyping = (data: { senderId: string }) => {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(data.senderId);
                return next;
            });
        };

        const handleChatExtended = (data: any) => {
            showToast(`${data.extenderName} sohbetinizi uzattı! 🎉`, 'success');
            setFriends(prev => prev.map(f => f.id === data.extendedBy ? {
                ...f, isExpired: false, expiresAt: data.expiresAt
            } : f));
            if (activeChat?.id === data.extendedBy) {
                setActiveChat(prev => prev ? { ...prev, isExpired: false, expiresAt: data.expiresAt } : prev);
            }
        };

        const handleNewFriendReq = (data: any) => {
            showToast(`${data.fromUserName} sana arkadaşlık isteği gönderdi 💫`, 'success');
            api.get('/user/friend-requests').then(res => {
                setRequests(res.data.requests || []);
                setFriendReqRemaining(res.data.remaining || 0);
            });
            if (activeChat?.id === data.fromUserId) setFriendStatus('received');
        };

        const handleFriendReqAccepted = (data: any) => {
            showToast(`${data.fromUserName} arkadaşlık isteğini kabul etti! ✨`, 'success');
            api.get('/user/friends').then(res => setFriends(res.data.friends || []));
            if (activeChat?.id === data.fromUserId) setFriendStatus('friends');
        };

        const handleSwipeMatchChatStarted = (data: any) => {
            showToast(`${data.fromUserName} seninle sohbet başlattı! 💛`, 'success');
            api.get('/user/friends').then(res => setFriends(res.data.friends || []));
        };

        const handleUserStatusChanged = (data: { userId: string; isOnline: boolean; lastSeen: string | null }) => {
            setFriends(prev => prev.map(f => f.id === data.userId
                ? { ...f, isOnline: data.isOnline, lastSeen: data.lastSeen }
                : f
            ));
            if (activeChat?.id === data.userId) {
                setActiveChat(prev => prev ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen } : prev);
            }
        };

        socket.on('receivePrivateMessage', handleNewMessage);
        socket.on('newGroupMessage', handleNewGroupMessage);
        socket.on('userTyping', handleUserTyping);
        socket.on('userStoppedTyping', handleUserStoppedTyping);
        socket.on('chatExtended', handleChatExtended);
        socket.on('newFriendRequest', handleNewFriendReq);
        socket.on('friendRequestAccepted', handleFriendReqAccepted);
        socket.on('swipeMatchChatStarted', handleSwipeMatchChatStarted);
        socket.on('userStatusChanged', handleUserStatusChanged);

        return () => {
            socket.off('receivePrivateMessage', handleNewMessage);
            socket.off('newGroupMessage', handleNewGroupMessage);
            socket.off('userTyping', handleUserTyping);
            socket.off('userStoppedTyping', handleUserStoppedTyping);
            socket.off('chatExtended', handleChatExtended);
            socket.off('newFriendRequest', handleNewFriendReq);
            socket.off('friendRequestAccepted', handleFriendReqAccepted);
            socket.off('swipeMatchChatStarted', handleSwipeMatchChatStarted);
            socket.off('userStatusChanged', handleUserStatusChanged);
        };
    }, [socket, activeChat, activeGroup, userId, updateEconomy, showToast]);

    // ==================== Deep Link / Navigation ====================
    useEffect(() => {
        if (location.state?.openChatId) {
            const friendToOpen = friends.find(f => f.id === location.state.openChatId);
            if (friendToOpen) {
                setActiveChat(friendToOpen);
                setActiveTab('messages');
                window.history.replaceState({}, document.title);
            } else if (!loading) {
                api.get('/user/friends').then(res => {
                    const updatedFriends: IFriend[] = res.data.friends || [];
                    setFriends(updatedFriends);
                    const found = updatedFriends.find(f => f.id === location.state.openChatId);
                    if (found) {
                        setActiveChat(found);
                        setActiveTab('messages');
                        window.history.replaceState({}, document.title);
                    }
                });
            }
        }
    }, [location.state, friends.length, loading]);

    // ==================== Handlers ====================
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        if (!activeChat) return;
        socket?.emit('typing', { receiverId: activeChat.id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit('stopTyping', { receiverId: activeChat.id });
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChat) return;
        const content = messageInput;
        setMessageInput('');
        socket?.emit('stopTyping', { receiverId: activeChat.id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        const optimisticMsg: IMessage = {
            id: Date.now().toString(),
            senderId: userId || '',
            receiverId: activeChat.id,
            content,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setFriends(prev => prev.map(f => f.id === activeChat.id ? { ...f, lastMessage: optimisticMsg } : f));
        scrollToBottom();

        try {
            await api.post('/user/messages', { receiverId: activeChat.id, content });
            // socket?.emit('sendPrivateMessage', ...) removed as backend handles emission
        } catch (err) {
            showToast('Mesaj gönderilemedi', 'error');
            console.error('Failed to send message');
        }
    };

    const handleSendGroupMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeGroup) return;
        const content = messageInput;
        setMessageInput('');
        socket?.emit('sendGroupMessage', { sign: activeGroup, content });
    };

    const handleExtendMatch = async (targetId?: string) => {
        const chatId = targetId || activeChat?.id;
        if (!chatId) return;
        setActionLoading(true);
        try {
            const res = await api.post(`/user/friend/${chatId}/extend`);
            updateEconomy({ stardustBalance: user.stardustBalance - 100 });
            showToast('Süre 24 saat uzatıldı!', 'success');
            if (activeChat?.id === chatId) {
                setActiveChat({ ...activeChat, isExpired: false, expiresAt: res.data.expiresAt });
            }
            setFriends(prev => prev.map(f => f.id === chatId ? { ...f, isExpired: false, expiresAt: res.data.expiresAt } : f));
            setShowExtendModal(false);
            setExtendTargetFriend(null);
        } catch (e: any) {
            if (e.response?.status === 403) {
                showToast('Yeterli Yıldız Tozun yok.', 'error');
                navigate('/market');
            } else {
                showToast('Hata oluştu', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteChat = async (friendId: string) => {
        try {
            await api.delete(`/user/friend/${friendId}`);
            setFriends(prev => prev.filter(f => f.id !== friendId));
            setSwipedChatId(null);
            if (activeChat?.id === friendId) setActiveChat(null);
            showToast('Sohbet silindi', 'success');
        } catch (e) {
            showToast('Sohbet silinemedi', 'error');
        }
    };

    // ==================== Sub-View Rendering ====================

    if (activeChat) {
        return (
            <ChatView
                activeChat={activeChat}
                setActiveChat={setActiveChat}
                userSunSign={user?.sunSign || ''}
                messages={messages}
                userId={userId || ''}
                friendStatus={friendStatus}
                setFriendStatus={setFriendStatus}
                friendReqRemaining={friendReqRemaining}
                setFriendReqRemaining={setFriendReqRemaining}
                chatTimeLeft={chatTimeLeft}
                typingUsers={typingUsers}
                isPremium={!!isPremium}
                actionLoading={actionLoading}
                setActionLoading={setActionLoading}
                setFriends={setFriends}
                socket={socket}
                handleSendMessage={handleSendMessage}
                handleMessageInputChange={handleMessageInputChange}
                messageInput={messageInput}
                handleExtendMatch={handleExtendMatch}
                messagesEndRef={messagesEndRef}
                updateEconomy={updateEconomy}
            />
        );
    }

    if (activeGroup) {
        return (
            <GroupChatView
                activeGroup={activeGroup}
                setActiveGroup={setActiveGroup}
                groupMessages={groupMessages}
                userId={userId || ''}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleSendGroupMessage={handleSendGroupMessage}
                messagesEndRef={messagesEndRef}
                zodiacSigns={ZODIAC_SIGNS}
            />
        );
    }

    // ==================== Derived Data ====================
    const newMatches = friends.filter(f => f.status === 'SWIPE_MATCH' && !f.hasMessages);
    const activeConversations = [...friends]
        .filter(f => f.hasMessages || f.status === 'MATCH')
        .sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : (a.expiresAt ? new Date(a.expiresAt).getTime() : 0);
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : (b.expiresAt ? new Date(b.expiresAt).getTime() : 0);
            return bTime - aTime;
        });
    const actualFriends = friends.filter(f => isTeller || f.status === 'FRIEND');

    // ==================== Main Tab View ====================
    return (
        <div className="messages-container">

            <div className="tabs-nav">
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
                >
                    Sohbet
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
                >
                    Astral Forum
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                >
                    İstekler
                    {requests.length > 0 && (
                        <span className="tab-badge">
                            {requests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                >
                    {isTeller ? 'Danışanlar' : 'Arkadaşlar'}
                </button>
                {!isTeller && (
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
                    >
                        Eşleşme
                    </button>
                )}
            </div>

            {loading ? (
                <BrandLoader message="Mesajlar ve Eşleşmeler Yükleniyor..." />
            ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'matches' && (
                        <MatchesTab
                            newMatches={newMatches}
                            user={user}
                            setShowPremiumModal={setShowPremiumModal}
                            setMatchModalFriend={setMatchModalFriend}
                            setActiveChat={setActiveChat}
                        />
                    )}
                    {activeTab === 'messages' && (
                        <ConversationsTab
                            activeConversations={activeConversations}
                            userId={userId || ''}
                            swipedChatId={swipedChatId}
                            setSwipedChatId={setSwipedChatId}
                            handleDeleteChat={handleDeleteChat}
                            showToast={showToast}
                            setActiveChat={setActiveChat}
                            setExtendTargetFriend={setExtendTargetFriend}
                            setShowExtendModal={setShowExtendModal}
                        />
                    )}
                    {activeTab === 'friends' && (
                        <FriendsTab
                            actualFriends={actualFriends}
                            isTeller={isTeller}
                            setActiveChat={setActiveChat}
                        />
                    )}
                    {activeTab === 'requests' && (
                        <RequestsTab
                            requests={requests}
                            isPremium={!!isPremium}
                            friendReqRemaining={friendReqRemaining}
                            actionLoading={actionLoading}
                            setActionLoading={setActionLoading}
                            setRequests={setRequests}
                            setFriendReqRemaining={setFriendReqRemaining}
                            setFriends={setFriends}
                            showToast={showToast}
                        />
                    )}
                    {activeTab === 'groups' && (
                        <GroupsTab
                            zodiacSigns={ZODIAC_SIGNS}
                            setActiveGroup={setActiveGroup}
                        />
                    )}
                </AnimatePresence>
            )}

            {/* Extend Match Modal */}
            <ExtendMatchModal
                isOpen={showExtendModal}
                friend={extendTargetFriend}
                actionLoading={actionLoading}
                onClose={() => { setShowExtendModal(false); setExtendTargetFriend(null); }}
                onConfirm={(id) => handleExtendMatch(id)}
            />

            {/* Match Modal — for premium users */}
            <MatchModal
                friend={matchModalFriend}
                onClose={() => setMatchModalFriend(null)}
                onStartChat={(friend) => {
                    setActiveChat(friend);
                    setMatchModalFriend(null);
                }}
            />

            {/* Premium Paywall Modal */}
            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />
        </div>
    );
};

export default Messages;
