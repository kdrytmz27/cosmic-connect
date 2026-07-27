import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Mic, MicOff, Gift, X, Flame,
    LogOut, Lock, Unlock, Users, Minimize2,
    Settings2, Shield, FileText,
    MessageSquare, Hash, UserPlus, MoreVertical, Edit2, Trash2,
    Dices, Scissors, Trophy, Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiftAnimationOverlay } from '../components/party/GiftAnimationOverlay';
import { GiftPanel } from '../components/party/GiftPanel';
import { LuckyGiftResultModal } from '../components/party/LuckyGiftResultModal';
import { RoomLeaderboardTab } from '../components/party/RoomLeaderboardTab';
import { PkBattleBar } from '../components/party/pkbattle/PkBattleBar';
import { FamilyBadge } from '../components/party/family/FamilyBadge';
import { FamilyPanel } from '../components/party/family/FamilyPanel';
import { buildGiftStreakKey } from '../utils/giftStreakKey';

// TODO: Mikrofon/koltuk UI'ı şu an dekoratif - gerçek ses aktarımı (WebRTC/Agora/LiveKit) henüz entegre değil.
// Aynı sunucu hatası bu süre içinde tekrar gelirse bildirim basılmaz
const PARTY_ERROR_COOLDOWN_MS = 3000;

export const PartyRoom: React.FC = () => {
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const { socket, setActivePartyRoom } = useSocket();
    const { user, refreshUser, stardustBalance: authStardustBalance } = useAuth();
    const { showToast } = useToast();
    
    const [roomState, setRoomState] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [chatTab, setChatTab] = useState<'all' | 'messages'>('all');
    
    // UI Panels
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
    const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
    const [isCloverMenuOpen, setIsCloverMenuOpen] = useState(false);
    const [isLuckyPackagePanelOpen, setIsLuckyPackagePanelOpen] = useState(false);
    const [isRankingPanelOpen, setIsRankingPanelOpen] = useState(false);
    const [isFamilyPanelOpen, setIsFamilyPanelOpen] = useState(false);
    const [luckyPackageAmount, setLuckyPackageAmount] = useState(100);
    const [luckyPackagePieces, setLuckyPackagePieces] = useState(5);
    const [selectedGiftTarget, setSelectedGiftTarget] = useState<string | null>(null);
    const [activeDiceAnim, setActiveDiceAnim] = useState<{ userId: string, value: number } | null>(null);
    
    // Local Economy State
    const [localStardust, setLocalStardust] = useState<number>(0);
    const localGiftStreaksRef = useRef<Map<string, { count: number, timeout: ReturnType<typeof setTimeout> }>>(new Map());
    // Hızlı combo'da sunucu aynı hatayı her dokunuş için geri yolluyor; aynı mesajı
    // arka arkaya bildirim olarak basmak ekranı kaplıyordu.
    const lastPartyErrorRef = useRef<{ message: string; at: number }>({ message: '', at: 0 });

    const isOwner = roomState?.ownerId === user?.id;
    const isModerator = roomState?.moderators?.includes(user?.id);
    const hasPower = isOwner || isModerator;

    useEffect(() => {
        setLocalStardust(authStardustBalance || 0);
    }, [authStardustBalance]);

    const hasSyncedRef = React.useRef(false);

    useEffect(() => {
        if (!socket || !roomId || !user) return;
        hasSyncedRef.current = false;

        socket.emit('joinPartyRoom', roomId);

        const handleStateSync = (state: any) => {
            hasSyncedRef.current = true;
            setRoomState(state);
            setActivePartyRoom({
                id: state.id,
                title: state.settings?.title || 'Oda',
                ownerAvatar: state.participants.find((p:any)=>p.id===state.ownerId)?.avatar
            });
        };

        const handleRoomLocked = () => {
            const pwd = prompt('Bu oda kilitli. Lütfen şifreyi girin:');
            if (pwd !== null) {
                socket.emit('joinPartyRoom', roomId, pwd);
            } else {
                showToast('Kilitli odaya giriş iptal edildi.', 'info');
                navigate('/party');
            }
        };

        const handleBanned = () => {
            showToast('Bu odadan engellendiniz.', 'error');
            navigate('/party');
        };

        const handleNewMsg = (msg: any) => {
            setMessages(prev => [...prev.slice(-49), msg]);
        };

        const handleBalance = (data: { userId: string, stardustBalance: number, diamondBalance: number }) => {
            if (data.userId === user.id) {
                setLocalStardust(data.stardustBalance);
                refreshUser();
            }
        };

        const handleChatCleared = () => {
            setMessages([]);
        };

        const handleDiceRoll = (data: { userId: string, value: number }) => {
            setActiveDiceAnim(data);
            setTimeout(() => setActiveDiceAnim(null), 3000);
        };

        const handleRPS = (_data: { userId: string, move: string }) => {
            // Can be extended with a visual animation overlay
        };

        const handleLuckyNumber = (_data: { userId: string, value: number }) => {
            // Can be extended with a visual animation overlay
        };

        const handleLuckyPackageClaimed = (data: { packageId: string, userId: string, userName: string, amount: number, remainingPieces: number }) => {
            if (data.userId === user?.id) {
                showToast(`Şanslı paketten ${data.amount} Yıldız Tozu kazandınız! 🎉`, 'success');
            } else {
                showToast(`${data.userName} şanslı paketten ${data.amount} Yıldız Tozu kaptı!`, 'info');
            }
        };

        const handleQueueStatus = (data: { status: string, message?: string }) => {
            if (data.status === 'error' && data.message) {
                showToast(data.message, 'error');
            }
        };

        const handleGiftReceived = (data: { id: string, senderId: string, sender: { id: string, name: string, avatar: string }, receiverName?: string, receiverId: string, giftId: string, giftName?: string, giftPrice: number, comboCount?: number, earnedDiamonds: number }) => {
            const combo = (data.comboCount ?? 1) > 1 ? ` x${data.comboCount}` : '';
            const content = `${data.sender?.name || 'Biri'}, ${data.receiverName || 'birine'} ${data.giftName || 'bir hediye'} gönderdi!${combo} 🎁`;
            setMessages(prev => {
                // Rapid repeat-taps reuse the same id (escalating combo) - update that line in
                // place instead of spamming a new chat entry (and colliding React keys) per tap.
                const lastIndex = prev.length - 1;
                if (lastIndex >= 0 && prev[lastIndex].id === data.id) {
                    const next = [...prev];
                    next[lastIndex] = { ...next[lastIndex], content };
                    return next;
                }
                return [...prev.slice(-49), {
                    id: data.id,
                    sender: data.sender,
                    isSystem: true,
                    color: 'text-pink-400',
                    content
                }];
            });
        };

        const handlePartyError = (data: { message?: string }) => {
            if (data?.message) {
                const now = Date.now();
                const last = lastPartyErrorRef.current;
                const isRepeat = last.message === data.message && now - last.at < PARTY_ERROR_COOLDOWN_MS;
                if (!isRepeat) {
                    lastPartyErrorRef.current = { message: data.message, at: now };
                    showToast(data.message, 'error');
                }
            }
            // If we never got an initial state sync, the join itself failed - don't
            // leave the user staring at "Odaya bağlanılıyor..." forever.
            if (!hasSyncedRef.current) {
                navigate('/party');
            }
        };

        socket.on('partyRoomStateSync', handleStateSync);
        socket.on('newPartyMessage', handleNewMsg);
        socket.on('balanceUpdated', handleBalance);
        socket.on('partyChatCleared', handleChatCleared);
        socket.on('partyDiceRoll', handleDiceRoll);
        socket.on('partyRPS', handleRPS);
        socket.on('partyLuckyNumber', handleLuckyNumber);
        socket.on('partyLuckyPackageClaimed', handleLuckyPackageClaimed);
        socket.on('queueStatus', handleQueueStatus);
        socket.on('partyGiftReceived', handleGiftReceived);
        socket.on('partyError', handlePartyError);
        socket.on('partyRoomLocked', handleRoomLocked);
        socket.on('partyBanned', handleBanned);

        return () => {
            socket.off('partyRoomStateSync', handleStateSync);
            socket.off('newPartyMessage', handleNewMsg);
            socket.off('balanceUpdated', handleBalance);
            socket.off('partyChatCleared', handleChatCleared);
            socket.off('partyDiceRoll', handleDiceRoll);
            socket.off('partyRPS', handleRPS);
            socket.off('partyLuckyNumber', handleLuckyNumber);
            socket.off('partyLuckyPackageClaimed', handleLuckyPackageClaimed);
            socket.off('queueStatus', handleQueueStatus);
            socket.off('partyGiftReceived', handleGiftReceived);
            socket.off('partyError', handlePartyError);
            socket.off('partyRoomLocked', handleRoomLocked);
            socket.off('partyBanned', handleBanned);
        };
    }, [socket, roomId, user?.id]);

    const handleLeaveRoom = () => {
        if (socket && roomId) {
            socket.emit('leavePartyRoom', roomId);
        }
        setActivePartyRoom(null);
        navigate('/party');
    };

    const handleMinimize = () => {
        // Just navigate away, layout will render floating bubble
        navigate(-1);
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket || !roomId) return;
        
        if (roomState?.settings?.chatEnabled === false && !hasPower) {
            showToast('Sohbet şu anda kapalı.', 'error');
            return;
        }

        socket.emit('sendPartyMessage', { roomId, content: messageInput });
        setMessageInput('');
    };

    const handleSeatClick = (index: number) => {
        setSelectedSeatIndex(index);
        setIsSeatMenuOpen(true);
    };

    const executeSeatAction = (action: string, extra?: any) => {
        if (selectedSeatIndex === null || !socket || !roomId) return;
        socket.emit('partyAction', { roomId, action, seatIndex: selectedSeatIndex, ...extra });
        setIsSeatMenuOpen(false);
    };

    if (!roomState) {
        return <div className="flex h-screen items-center justify-center bg-[#0b1326] text-white">Odaya bağlanılıyor...</div>;
    }

    // Dynamic Grid Layout based on seatLayout
    const renderSeats = () => {
        const layout = roomState.settings?.seatLayout || "8+1";
        
        if (layout === "8+1") {
            // 1 top, 2 rows of 4
            return (
                <div className="flex flex-col items-center gap-4 p-4 w-full">
                    {/* Host */}
                    <div className="flex justify-center w-full mb-2">
                        {renderSingleSeat(0, "w-24 h-24")}
                    </div>
                    {/* Others */}
                    <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
                        {roomState.seats.slice(1, 9).map((_seat: any, i: number) => renderSingleSeat(i + 1))}
                    </div>
                </div>
            );
        } else if (layout === "10") {
            return (
                <div className="grid grid-cols-5 gap-3 p-4 w-full max-w-md mx-auto">
                    {roomState.seats.slice(0, 10).map((_seat: any, i: number) => renderSingleSeat(i))}
                </div>
            );
        } else if (layout === "12") {
            return (
                <div className="grid grid-cols-4 gap-4 p-4 w-full max-w-sm mx-auto">
                    {roomState.seats.slice(0, 12).map((_seat: any, i: number) => renderSingleSeat(i))}
                </div>
            );
        } else if (layout === "15+1") {
            return (
                <div className="flex flex-col items-center gap-3 p-4 w-full">
                    <div className="flex justify-center w-full mb-1">
                        {renderSingleSeat(0, "w-20 h-20")}
                    </div>
                    <div className="grid grid-cols-5 gap-3 w-full max-w-md">
                        {roomState.seats.slice(1, 16).map((_seat: any, i: number) => renderSingleSeat(i + 1))}
                    </div>
                </div>
            );
        } else {
            // Fallback grid
            return (
                <div className="flex flex-wrap justify-center gap-4 p-4 w-full">
                    {roomState.seats.map((_seat: any, i: number) => renderSingleSeat(i))}
                </div>
            );
        }
    };

    const renderSingleSeat = (index: number, sizeClass: string = "w-16 h-16") => {
        const seat = roomState.seats[index];
        if (!seat) return null;

        const isOccupied = !!seat.userId;
        const isMuted = seat.isMuted;
        const isLocked = seat.isLocked;
        const label = seat.label;

        return (
            <div key={index} className="flex flex-col items-center gap-1 relative" onClick={() => handleSeatClick(index)}>
                {/* Seat Label */}
                {label && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary/90 text-[10px] px-2 py-0.5 rounded-full z-20 whitespace-nowrap text-white font-medium shadow-md">
                        {label}
                    </div>
                )}
                
                {/* Avatar / Empty Circle */}
                <div className={`relative rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 transition-all ${
                    isOccupied ? 'border-primary shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 
                    isLocked ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/5 border-dashed'
                } ${sizeClass}`}>
                    
                    {isOccupied ? (
                        <img 
                            src={seat.userAvatar || `https://ui-avatars.com/api/?name=${seat.userName}&background=random`}
                            alt="avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : isLocked ? (
                        <Lock className="text-red-400/50 w-6 h-6" />
                    ) : (
                        <Users className="text-white/20 w-6 h-6" />
                    )}

                    {/* Mic status indicator */}
                    {isOccupied && (
                        <div className="absolute bottom-0 right-0 bg-black/70 rounded-full p-0.5">
                            {isMuted ? <MicOff size={12} className="text-red-500" /> : <Mic size={12} className="text-green-400" />}
                        </div>
                    )}
                </div>

                {/* Name tag */}
                <span className="text-[10px] text-white/70 max-w-full truncate px-1">
                    {isOccupied ? seat.userName : `${index}`}
                </span>
            </div>
        );
    };

    const bgUrl = roomState.settings?.backgroundUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80';

    return (
        <div className="fixed inset-0 bg-[#0b1326] flex flex-col font-sans overflow-hidden">
            {/* Background Image & Blur */}
            <div className="absolute inset-0 z-0">
                <img src={bgUrl} alt="bg" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b1326]/80 via-[#0b1326]/40 to-[#0b1326]"></div>
            </div>

            <GiftAnimationOverlay />
            <LuckyGiftResultModal />
            {isRankingPanelOpen && roomId && (
                <RoomLeaderboardTab roomId={roomId} onClose={() => setIsRankingPanelOpen(false)} />
            )}
            {roomId && <PkBattleBar roomId={roomId} isOwner={isOwner} />}
            {isFamilyPanelOpen && <FamilyPanel onClose={() => setIsFamilyPanelOpen(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img 
                        src={roomState.settings?.coverUrl || bgUrl} 
                        alt="Room" 
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                        <h1 className="text-white font-bold text-sm line-clamp-1">{roomState.settings?.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span className="flex items-center gap-1"><Flame size={10} className="text-orange-500"/> {roomState.popularity}</span>
                            <button onClick={() => setIsParticipantsOpen(true)} className="flex items-center gap-1 hover:text-white transition-colors">
                                <Users size={10} className="text-blue-400"/> {roomState.participants.length}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Announcement Marquee */}
                    {roomState.settings?.announcement && (
                        <div className="hidden md:flex bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-white/70 max-w-[200px] overflow-hidden whitespace-nowrap">
                            📢 {roomState.settings.announcement}
                        </div>
                    )}
                    
                    {/* Minimize */}
                    <button onClick={handleMinimize} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <Minimize2 size={16} />
                    </button>

                    {/* Settings Menu */}
                    <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <MoreVertical size={16} />
                    </button>

                    {/* Leave Room */}
                    <button onClick={handleLeaveRoom} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/30">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            {/* Room Content Container */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* Left: Stage (Seats) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    {renderSeats()}
                </div>

                {/* Right: Chat & Actions */}
                <div className="h-[40vh] md:h-full md:w-80 flex flex-col bg-black/40 backdrop-blur-xl border-l border-white/5">
                    {/* Tabs */}
                    <div className="flex px-4 py-2 gap-4 border-b border-white/5 shrink-0">
                        <button 
                            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${chatTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            onClick={() => setChatTab('all')}
                        >
                            Hepsi
                        </button>
                        <button 
                            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${chatTab === 'messages' ? 'border-primary text-primary' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            onClick={() => setChatTab('messages')}
                        >
                            Mesajlar
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                        {messages.filter(m => chatTab === 'all' || !m.isSystem).map((msg, i) => (
                            <div key={msg.id || i} className="text-sm">
                                {msg.isSystem ? (
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md bg-white/5 ${msg.color || 'text-yellow-400'}`}>
                                            {msg.content}
                                        </span>
                                        {msg.isPackage && (
                                            <button 
                                                onClick={() => socket?.emit('claimLuckyPackage', { roomId, packageId: msg.packageId })}
                                                className="ml-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                                            >
                                                AÇ 🎁
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        <img src={msg.sender?.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.name}`} className="w-6 h-6 rounded-full" alt="av" />
                                        <div className="bg-white/5 px-3 py-1.5 rounded-2xl rounded-tl-sm text-white/90">
                                            <span className="font-bold text-xs text-primary/80 block mb-0.5">{msg.sender?.name}</span>
                                            {msg.content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <div className="p-3 bg-black/50 border-t border-white/5 flex gap-2 shrink-0 relative">
                        {/* Clover / Fun Tools */}
                        <button 
                            onClick={() => setIsCloverMenuOpen(!isCloverMenuOpen)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isCloverMenuOpen ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-green-400 hover:bg-white/10'}`}
                        >
                            <span className="text-xl">☘️</span>
                        </button>
                        
                        <AnimatePresence>
                            {isCloverMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-16 left-3 bg-[#131b2e] border border-white/10 shadow-2xl rounded-2xl p-2 z-50 flex flex-col gap-1 w-48"
                                >
                                    <button onClick={() => {
                                        socket?.emit('sendPartyRPS', { roomId });
                                        setIsCloverMenuOpen(false);
                                    }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm text-white/90 w-full text-left transition-colors">
                                        <Scissors size={16} className="text-blue-400" /> Taş Kağıt Makas
                                    </button>
                                    <button onClick={() => {
                                        socket?.emit('sendPartyLuckyNumber', { roomId });
                                        setIsCloverMenuOpen(false);
                                    }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm text-white/90 w-full text-left transition-colors">
                                        <Hash size={16} className="text-purple-400" /> Şanslı Numara
                                    </button>
                                    <button onClick={() => {
                                        socket?.emit('sendPartyDice', { roomId });
                                        setIsCloverMenuOpen(false);
                                    }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm text-white/90 w-full text-left transition-colors">
                                        <Dices size={16} className="text-orange-400" /> Zar At
                                    </button>
                                    <div className="h-px bg-white/10 my-1"></div>
                                    <button onClick={() => {
                                        setIsLuckyPackagePanelOpen(true);
                                        setIsCloverMenuOpen(false);
                                    }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm text-white/90 w-full text-left transition-colors">
                                        <Gift size={16} className="text-pink-400" /> Şanslı Paket
                                    </button>
                                    <button onClick={() => {
                                        setIsRankingPanelOpen(true);
                                        setIsCloverMenuOpen(false);
                                    }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm text-white/90 w-full text-left transition-colors">
                                        <Trophy size={16} className="text-secondary" /> Oda Sıralaması
                                    </button>
                                    <button onClick={() => {
                                        setIsFamilyPanelOpen(true);
                                        setIsCloverMenuOpen(false);
                                    }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm text-white/90 w-full text-left transition-colors">
                                        <Users2 size={16} className="text-primary" /> Aile
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={sendMessage} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={roomState.settings?.chatEnabled === false && !hasPower ? 'Sohbet kapalı' : 'Mesaj gönder...'}
                                disabled={roomState.settings?.chatEnabled === false && !hasPower}
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                            />
                        </form>
                        
                        {/* Send Gift Button */}
                        <button 
                            onClick={() => setIsGiftPanelOpen(true)}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform shrink-0"
                        >
                            <Gift size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SEAT ACTION BOTTOM SHEET */}
            <AnimatePresence>
                {isSeatMenuOpen && selectedSeatIndex !== null && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsSeatMenuOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
                        <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10">
                            <h3 className="text-white text-center font-semibold mb-6">Koltuk #{selectedSeatIndex} İşlemleri</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                                
                                {/* Label Edit (Admins) */}
                                {hasPower && (
                                    <button onClick={() => {
                                        const label = prompt("Koltuk etiketini girin:");
                                        executeSeatAction('setLabel', { label });
                                    }} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        <Edit2 size={18} className="text-blue-400" />
                                        <span>Etiketi Düzenle</span>
                                    </button>
                                )}
                                
                                {/* Take Seat */}
                                {!roomState.seats[selectedSeatIndex].userId && !roomState.seats[selectedSeatIndex].isLocked && (
                                    <button onClick={() => executeSeatAction('takeSeat')} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        <Mic size={18} className="text-green-400" />
                                        <span>Bu Mikrofonu Al</span>
                                    </button>
                                )}

                                {/* Lock Seat (Admins) */}
                                {hasPower && (
                                    <button onClick={() => executeSeatAction('lockSeat', { isLocked: !roomState.seats[selectedSeatIndex].isLocked })} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        {roomState.seats[selectedSeatIndex].isLocked ? <Unlock size={18} className="text-yellow-400"/> : <Lock size={18} className="text-red-400" />}
                                        <span>{roomState.seats[selectedSeatIndex].isLocked ? 'Kilidi Aç' : 'Kilitle'}</span>
                                    </button>
                                )}

                                {/* Invite */}
                                {hasPower && !roomState.seats[selectedSeatIndex].userId && (
                                    <button onClick={() => setIsSeatMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                        <UserPlus size={18} className="text-purple-400" />
                                        <span>Davet Et</span>
                                    </button>
                                )}

                                {/* Clear Label */}
                                {hasPower && roomState.seats[selectedSeatIndex].label && (
                                    <button onClick={() => executeSeatAction('setLabel', { label: null })} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                                        <Trash2 size={18} />
                                        <span>Etiketi Sil</span>
                                    </button>
                                )}

                            </div>
                            <button onClick={() => setIsSeatMenuOpen(false)} className="mt-6 w-full max-w-md mx-auto block py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors">
                                İptal
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* GIFT PANEL BOTTOM SHEET */}
            <AnimatePresence>
                {isGiftPanelOpen && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsGiftPanelOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
                        <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-semibold">Hediye Gönder</h3>
                                <button onClick={() => setIsGiftPanelOpen(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                            </div>
                            
                            {/* Target Selection */}
                            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-4 mb-4">
                                <div 
                                    onClick={() => setSelectedGiftTarget(user?.id || null)}
                                    className={`flex flex-col items-center gap-1 min-w-[60px] cursor-pointer transition-transform hover:scale-105 ${selectedGiftTarget === user?.id ? 'opacity-100' : 'opacity-50 grayscale'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black/30 ${selectedGiftTarget === user?.id ? 'border-primary' : 'border-transparent'}`}>
                                        <span className="text-sm">😎</span>
                                    </div>
                                    <span className="text-[10px] text-white">Kendim</span>
                                </div>
                                {roomState.participants.filter((p:any) => p.id !== user?.id).map((p:any) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setSelectedGiftTarget(p.id)}
                                        className={`flex flex-col items-center gap-1 min-w-[60px] cursor-pointer transition-transform hover:scale-105 ${selectedGiftTarget === p.id ? 'opacity-100' : 'opacity-50 grayscale'}`}
                                    >
                                        <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`} className={`w-12 h-12 rounded-full border-2 object-cover ${selectedGiftTarget === p.id ? 'border-primary' : 'border-transparent'}`} />
                                        <span className="text-[10px] text-white truncate w-14 text-center">{p.name.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>

                            <GiftPanel
                                localStardust={localStardust}
                                onSend={(gift, quantity) => {
                                    if (!selectedGiftTarget) {
                                        showToast('Lütfen hediye göndermek için birini seçin', 'error');
                                        return;
                                    }

                                    // Bakiye sunucudan yankı gelene kadar güncellenmezse, hızlı combo'da
                                    // buton açık kalıyor ve combo ödenebilirin çok ötesine kaçıyor (sunucu
                                    // reddederken sayaç tırmanmaya devam ediyordu). Maliyeti burada da
                                    // düşüyoruz; sunucunun balanceUpdated yankısı gerçek değerle üzerine yazar.
                                    const totalPrice = gift.price * quantity;
                                    if (localStardust < totalPrice) {
                                        showToast('Yetersiz Yıldız Tozu bakiyesi!', 'error');
                                        return;
                                    }
                                    setLocalStardust(prev => prev - totalPrice);

                                    // Optimistic local animation - shows instantly instead of waiting on the
                                    // server round trip (remote DB), then merges seamlessly with the real
                                    // echo once it arrives (same deterministic streak key = same id).
                                    const streakKey = buildGiftStreakKey(roomId || '', user?.id || '', selectedGiftTarget, gift.giftKey);
                                    const streaks = localGiftStreaksRef.current;
                                    const existing = streaks.get(streakKey);
                                    if (existing) clearTimeout(existing.timeout);
                                    const count = (existing?.count || 0) + quantity;
                                    streaks.set(streakKey, { count, timeout: setTimeout(() => streaks.delete(streakKey), 2500) });

                                    const targetParticipant = roomState?.participants?.find((p: any) => p.id === selectedGiftTarget);
                                    window.dispatchEvent(new CustomEvent('localGiftSend', {
                                        detail: {
                                            id: streakKey,
                                            senderId: user?.id,
                                            sender: { id: user?.id, name: (user as any)?.name, avatar: (user as any)?.avatar },
                                            receiverName: targetParticipant?.name,
                                            receiverAvatar: targetParticipant?.avatar,
                                            receiverId: selectedGiftTarget,
                                            giftId: gift.giftKey,
                                            giftKey: gift.giftKey,
                                            comboCount: count,
                                            giftName: gift.name,
                                            giftIcon: gift.icon,
                                            animationUrl: gift.animationUrl,
                                            animationTier: gift.animationTier,
                                            category: gift.category
                                        }
                                    }));

                                    socket?.emit('sendPartyGift', { roomId, giftId: gift.giftKey, targetUserId: selectedGiftTarget, quantity });
                                }}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* PARTICIPANTS LIST BOTTOM SHEET */}
            <AnimatePresence>
                {isParticipantsOpen && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsParticipantsOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
                        <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10 max-h-[70vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <Users size={18} className="text-blue-400" /> Katılımcılar ({roomState.participants.length})
                                </h3>
                                <button onClick={() => setIsParticipantsOpen(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                            </div>
                            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                                {roomState.participants.map((p: any) => (
                                    <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-medium truncate flex items-center gap-1.5">
                                                {p.name}
                                                <FamilyBadge familyTag={p.familyTag} />
                                            </div>
                                            <div className="text-white/40 text-xs">Lv. {p.level || 1}</div>
                                        </div>
                                        {p.id === roomState.ownerId && (
                                            <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-1 rounded-full font-bold shrink-0">Sahip</span>
                                        )}
                                        {p.id !== roomState.ownerId && roomState.moderators?.includes(p.id) && (
                                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold shrink-0">Moderatör</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* LUCKY PACKAGE SEND PANEL */}
            <AnimatePresence>
                {isLuckyPackagePanelOpen && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsLuckyPackagePanelOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
                        <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-semibold flex items-center gap-2"><Gift className="text-pink-400"/> Şanslı Paket Gönder</h3>
                                <button onClick={() => setIsLuckyPackagePanelOpen(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                            </div>
                            
                            <div className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="text-white/70 text-sm mb-1 block">Toplam Yıldız Tozu (Min 100)</label>
                                    <input 
                                        type="number" 
                                        min="100" 
                                        value={luckyPackageAmount} 
                                        onChange={(e) => setLuckyPackageAmount(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-white/70 text-sm mb-1 block">Kaç Parçaya Bölünsün?</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="50"
                                        value={luckyPackagePieces} 
                                        onChange={(e) => setLuckyPackagePieces(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                                    />
                                </div>
                                <div className="text-sm text-white/50 mt-2">
                                    Mevcut Bakiyeniz: <span className="text-yellow-400 font-bold">{localStardust}</span> 🌟
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        if (localStardust < luckyPackageAmount) {
                                            showToast('Yetersiz bakiye!', 'error');
                                            return;
                                        }
                                        socket?.emit('sendPartyLuckyPackage', { roomId, amount: luckyPackageAmount, pieces: luckyPackagePieces });
                                        setIsLuckyPackagePanelOpen(false);
                                    }}
                                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Gift size={20} /> Paketi Gönder
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* FULL SCREEN SETTINGS MODAL */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="fixed inset-0 z-50 bg-[#0b1326] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings2 size={20}/> Oda Yönetimi</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full flex flex-col gap-6 custom-scrollbar">
                            {!hasPower ? (
                                <div className="text-center text-white/50 py-20">Sadece yetkililer ayarları görebilir.</div>
                            ) : (
                                <>
                                    {/* Settings sections placeholder for Phase 1 */}
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><FileText size={18}/> Temel Ayarlar</h3>
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <label className="text-xs text-white/50 mb-1 block">Oda Adı</label>
                                                <div className="flex gap-2">
                                                    <input type="text" defaultValue={roomState.settings?.title} id="roomTitleInput" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                                                    <button onClick={() => {
                                                        const val = (document.getElementById('roomTitleInput') as HTMLInputElement).value;
                                                        socket?.emit('partyUpdateSettings', { roomId, settings: { title: val } });
                                                    }} className="px-4 bg-primary rounded-xl text-sm font-medium text-white hover:bg-primary/80">Kaydet</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-white/50 mb-1 block">Oda Duyurusu</label>
                                                <div className="flex gap-2">
                                                    <input type="text" defaultValue={roomState.settings?.announcement || ''} id="roomAnnInput" placeholder="Duyuru metni..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                                                    <button onClick={() => {
                                                        const val = (document.getElementById('roomAnnInput') as HTMLInputElement).value;
                                                        socket?.emit('partyUpdateSettings', { roomId, settings: { announcement: val } });
                                                    }} className="px-4 bg-primary rounded-xl text-sm font-medium text-white hover:bg-primary/80">Güncelle</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Mic size={18}/> Mikrofon Modu (Düzen)</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {["8+1", "10", "12", "15+1", "16", "20", "30"].map(l => (
                                                <button key={l} onClick={() => {
                                                    socket?.emit('partyUpdateSettings', { roomId, settings: { seatLayout: l }});
                                                }} className={`px-4 py-2 rounded-xl text-sm ${roomState.settings?.seatLayout === l ? 'bg-primary text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                                                    {l} Koltuk
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Shield size={18}/> Kimlik Yönetimi</h3>
                                        {roomState.moderators?.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {roomState.moderators.map((modId: string) => {
                                                    const modUser = roomState.participants.find((p:any) => p.id === modId);
                                                    return (
                                                        <div key={modId} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <img src={modUser?.avatar || `https://ui-avatars.com/api/?name=${modUser?.name || 'M'}`} className="w-8 h-8 rounded-full" />
                                                                <span className="text-sm text-white">{modUser?.name || 'Bilinmeyen Kullanıcı'}</span>
                                                            </div>
                                                            {isOwner && (
                                                                <button onClick={() => socket?.emit('partySetModerator', { roomId, targetUserId: modId, isModerator: false })} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white">İptal Et</button>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white/50">Henüz yönetici atanmamış.</p>
                                        )}
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><MessageSquare size={18}/> Genel Ekran Ayarları</h3>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-white">Genel Konuşma</span>
                                                <button onClick={() => socket?.emit('partyUpdateSettings', { roomId, settings: { chatEnabled: !roomState.settings?.chatEnabled } })} className={`px-4 py-1.5 rounded-full text-xs font-medium ${roomState.settings?.chatEnabled !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {roomState.settings?.chatEnabled !== false ? 'Açık' : 'Kapalı'}
                                                </button>
                                            </div>
                                            <button onClick={() => socket?.emit('partyClearChat', { roomId })} className="px-4 py-2 w-full bg-red-500/20 text-red-400 rounded-xl text-sm border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
                                                Bütün Genel Mesajları Temizle
                                            </button>
                                        </div>
                                    </div>
                                    {isOwner && (
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Lock size={18}/> Oda Kilidi & Şifre</h3>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm text-white">Oda Kilidi</span>
                                                <button onClick={() => {
                                                    const pwd = !roomState.settings?.isLocked ? prompt("Oda şifresi belirleyin (boş bırakılabilir):") : undefined;
                                                    socket?.emit('partyToggleLock', { roomId, isLocked: !roomState.settings?.isLocked, password: pwd });
                                                }} className={`px-4 py-1.5 rounded-full text-xs font-medium ${roomState.settings?.isLocked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                                                    {roomState.settings?.isLocked ? 'Kilidi Kaldır' : 'Kilitle'}
                                                </button>
                                            </div>
                                            {roomState.settings?.isLocked && (
                                                <p className="text-xs text-white/50">Oda kilitli. Sadece şifreyi bilenler veya yöneticiler girebilir.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DICE ANIMATION OVERLAY */}
            <AnimatePresence>
                {activeDiceAnim && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0, y: -100 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
                    >
                        <div className="relative">
                            <div className="text-8xl drop-shadow-2xl">🎲</div>
                            <motion.div 
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="absolute -top-4 -right-4 w-12 h-12 bg-white text-black font-bold text-2xl flex items-center justify-center rounded-full shadow-xl border-4 border-orange-500 z-10"
                            >
                                {activeDiceAnim.value}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default PartyRoom;
