import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { BACKEND_URL } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const Match = () => {
    const { socket, isConnected } = useSocket();
    const { userId, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const isPremium = user?.isPremium;

    const [matchState, setMatchState] = useState<'idle' | 'searching' | 'pending'>('idle');
    const [matchedUser, setMatchedUser] = useState<any>(null);
    const [matchCountdown, setMatchCountdown] = useState<number | null>(null);
    const [pendingMatchData, setPendingMatchData] = useState<any>(null);
    const [passingMatch, setPassingMatch] = useState(false);
    
    const [statusText, setStatusText] = useState('Kozmik dalgalar taranıyor...');

    useEffect(() => {
        if (!socket) return;

        socket.on('queueStatus', (data) => {
            console.log('Queue status:', data);
        });

        socket.on('matchFound', async (data) => {
            const otherId = data.users?.find((id: string) => String(id) !== String(userId));
            const enrichedData = { ...data, otherId };
            setPendingMatchData(enrichedData);
            setMatchState('pending');
            setMatchCountdown(5); // 5 seconds until auto-accept

            if (otherId) {
                const profileData = data.profiles && data.profiles[otherId] ? data.profiles[otherId] : {};
                setMatchedUser({ name: 'Gizemli Yabancı', ...profileData, id: otherId });
            } else {
                setMatchedUser({ id: null, name: 'Gizemli Yabancı' });
            }
        });

        socket.on('chatEnded', () => {
            resetMatch();
        });

        socket.on('partnerLeftRoom', () => {
            resetMatch();
            socket?.emit('leaveMatchmaking');
            showToast('Karşı taraftaki kişi eşleşmeden ayrıldı.', 'error');
        });

        return () => {
            socket.off('queueStatus');
            socket.off('matchFound');
            socket.off('chatEnded');
            socket.off('partnerLeftRoom');
        };
    }, [socket, userId]);

    // Match acceptance countdown
    useEffect(() => {
        let timer: any;
        if (matchCountdown !== null && matchCountdown > 0) {
            timer = setTimeout(() => {
                setMatchCountdown(matchCountdown - 1);
            }, 1000);
        } else if (matchCountdown === 0 && pendingMatchData) {
            const targetId = matchedUser?.id || pendingMatchData?.otherId;
            handleAcceptMatch(targetId);
        }
        return () => clearTimeout(timer);
    }, [matchCountdown, pendingMatchData, matchedUser]);

    // Searching text animation
    useEffect(() => {
        let timer: any;
        if (matchState === 'searching') {
            timer = setInterval(() => {
                const statuses = ["Yıldız haritaları hizalanıyor...", "Aura frekansları eşleşiyor...", "Kozmik dalgalar taranıyor...", "Derin uzay analizi yapılıyor..."];
                setStatusText(statuses[Math.floor(Math.random() * statuses.length)]);
            }, 3000);
        }
        return () => clearInterval(timer);
    }, [matchState]);

    const startMatchmaking = () => {
        if (!socket || !isConnected) return showToast('Bağlantı kurulamadı! Sunucuyla iletişim yok.', 'error');
        socket.emit('joinMatchmaking');
        setMatchState('searching');
    };

    const resetMatch = () => {
        setMatchState('idle');
        setMatchedUser(null);
        setPendingMatchData(null);
        setMatchCountdown(null);
    };

    const cancelMatchmaking = () => {
        resetMatch();
        socket?.emit('leaveMatchmaking');
    };

    const handleAcceptMatch = async (targetId?: string) => {
        const id = targetId || matchedUser?.id;
        if (!pendingMatchData || !id) {
            showToast('Eşleşme verisi eksik, tekrar deneyin.', 'error');
            resetMatch();
            return;
        }
        try {
            await api.post(`/user/friend/${id}/accept-match`);
            socket?.emit('leaveMatchmaking');
            resetMatch();
            navigate('/messages', { state: { openChatId: id } });
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Eşleşme kabul edilemedi';
            showToast(msg, 'error');
            resetMatch();
        }
    };

    const handlePassMatch = async () => {
        if (!isPremium) {
            showToast('Pas geçme özelliği sadece Premium üyeler içindir.', 'error');
            return;
        }
        setPassingMatch(true);
        try {
            if (matchedUser?.id) {
                const res = await api.post(`/user/friend/${matchedUser.id}/pass`);
                showToast(`Eşleşme pas geçildi. (Kalan: ${res.data.dailyMatchPasses})`, 'success');
            }
            socket?.emit('leaveRoom', { roomId: pendingMatchData?.roomId });
            socket?.emit('leaveMatchmaking');
            resetMatch();
        } catch (e: any) {
            showToast(e.response?.data?.error || 'Hata oluştu', 'error');
        } finally {
            setPassingMatch(false);
        }
    };

    // Fallback to a static number
    const swipesLeft = 50;

    return (
        <div className="w-full h-full min-h-[calc(100vh-140px)] flex flex-col justify-center items-center relative z-10">
            
            <main className="flex-1 flex flex-col justify-center items-center relative z-10 w-full px-4">
                
                {/* Radar/Match UI Area */}
                <div className="relative flex flex-col items-center justify-center mb-8">
                    
                    {/* Ring Animations when searching */}
                    {matchState === 'searching' && (
                        <>
                            <motion.div 
                                animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                className="absolute rounded-full border-[3px] border-[#a855f7]/40 w-64 h-64 md:w-72 md:h-72"
                            />
                            <motion.div 
                                animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                                className="absolute rounded-full border-[3px] border-[#a855f7]/40 w-64 h-64 md:w-72 md:h-72"
                            />
                        </>
                    )}
                    
                    {/* Main Button */}
                    <button 
                        onClick={matchState === 'idle' ? startMatchmaking : cancelMatchmaking}
                        className={`relative z-20 w-64 h-64 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-[#8b5cf6] via-[#a855f7] to-[#d946ef] transition-transform duration-300 hover:scale-105 shadow-[0_10px_40px_rgba(168,85,247,0.4)] ${matchState === 'searching' ? 'animate-pulse' : ''}`}
                    >
                        {matchState === 'idle' ? (
                            <>
                                <span className="material-symbols-outlined text-white text-7xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                <span className="font-headline-md text-white font-bold text-xl tracking-wide">Eşleşme Bul</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-white text-7xl mb-4 animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                <span className="font-headline-md text-white font-bold text-xl tracking-wide">İptal Et</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Status Text (Swipes left or Searching status) */}
                <div className="h-8 mt-6">
                    {matchState === 'idle' ? (
                        <p className="font-body-md text-on-surface-variant font-medium text-lg text-center tracking-wide">
                            {swipesLeft} günlük kaydırma hakkı kaldı
                        </p>
                    ) : (
                        <p className="font-body-md text-on-surface-variant font-medium text-lg text-center tracking-wide animate-pulse">
                            {statusText}
                        </p>
                    )}
                </div>
            </main>

            {/* Match Found Modal */}
            <AnimatePresence>
                {matchState === 'pending' && matchedUser && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm bg-surface-container-highest border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)]"
                        >
                            {/* Progress bar at the top */}
                            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] transition-all duration-1000 ease-linear" style={{ width: `${(matchCountdown || 0) * 20}%` }} />

                            <h2 className="text-2xl font-bold text-primary mb-6">Kozmik Eşleşme! ✨</h2>

                            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-secondary shadow-[0_0_20px_rgba(255,198,64,0.3)] relative">
                                <img 
                                    src={matchedUser.avatar ? `${BACKEND_URL}${matchedUser.avatar}` : `https://ui-avatars.com/api/?name=${matchedUser.name || matchedUser.email?.split('@')[0] || 'U'}&background=random`} 
                                    alt="Match" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex items-end justify-center pb-2">
                                    <span className="text-white font-label-sm">{matchedUser.sunSign || 'Gizemli'}</span>
                                </div>
                            </div>

                            <p className="text-on-surface text-lg mb-6">
                                <strong className="text-secondary">{matchedUser.name || matchedUser.email?.split('@')[0] || 'Gizemli Yabancı'}</strong> ile frekanslarınız tuttu!
                            </p>

                            <div className="flex flex-col gap-3">
                                {isPremium ? (
                                    <button
                                        onClick={handlePassMatch}
                                        disabled={passingMatch}
                                        className="w-full py-3 rounded-xl bg-white/5 text-on-surface-variant border border-white/10 font-bold text-sm hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {passingMatch ? 'Geçiliyor...' : 'Pas Geç'}
                                    </button>
                                ) : (
                                    <p className="text-xs text-on-surface-variant mb-2">Sınırsız pas geçmek için Premium'a geç.</p>
                                )}
                            </div>

                            <p className="text-xs text-secondary/80 font-medium mt-6">
                                {matchCountdown} saniye içinde odasına yönlendiriliyorsun...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Match;
