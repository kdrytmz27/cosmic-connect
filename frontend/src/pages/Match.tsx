import { useState, useEffect } from 'react';
import './Match.css';
import { Heart, Loader } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/client';
import { motion } from 'framer-motion';

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

    useEffect(() => {
        if (!socket) return;

        socket.on('queueStatus', (data) => {
            console.log('Queue status:', data);
        });

        socket.on('matchFound', async (data) => {
            setPendingMatchData(data);
            setMatchState('pending');
            setMatchCountdown(5);

            const otherId = data.users.find((id: string) => String(id) !== String(userId));
            if (otherId) {
                try {
                    const res = await api.get(`/user/profile/${otherId}`);
                    setMatchedUser(res.data.profile || { name: 'Gizemli Yabancı' });
                } catch (e) {
                    setMatchedUser({ name: 'Gizemli Yabancı' });
                }
            } else {
                setMatchedUser({ name: 'Gizemli Yabancı' });
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

    // Countdown effect for the 5-second modal
    useEffect(() => {
        let timer: any;
        if (matchCountdown !== null && matchCountdown > 0) {
            timer = setTimeout(() => {
                setMatchCountdown(matchCountdown - 1);
            }, 1000);
        } else if (matchCountdown === 0 && pendingMatchData && matchedUser) {
            handleAcceptMatch();
        }
        return () => clearTimeout(timer);
    }, [matchCountdown, pendingMatchData, matchedUser]);

    const startMatchmaking = () => {
        if (!socket || !isConnected) return showToast('Bağlantı kurulamadı!', 'error');
        socket.emit('joinMatchmaking');
        setMatchState('searching');
    };

    const resetMatch = () => {
        setMatchState('idle');
        setMatchedUser(null);
        setPendingMatchData(null);
        setMatchCountdown(null);
    };

    const handleAcceptMatch = async () => {
        if (!pendingMatchData || !matchedUser?.id) return;
        try {
            // Create friendship with 160s expiration via backend
            await api.post(`/user/friend/${matchedUser.id}/accept-match`);
            // Don't emit leaveRoom - it would trigger partnerLeftRoom on the other user
            // Just leave the matchmaking queue
            socket?.emit('leaveMatchmaking');
            resetMatch();
            // Navigate to Messages with this chat open
            navigate('/messages', { state: { openChatId: matchedUser.id } });
        } catch (e) {
            showToast('Eşleşme kabul edilemedi', 'error');
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

    return (
        <div className="match-container" style={{ paddingBottom: 50 }}>
            {matchState === 'idle' && (
                <div className="match-content">
                    <h2 className="glow-text">Ruh Eşini Bul</h2>
                    <p>160 saniyelik bir kıvılcım başlat...</p>
                    <button className="match-btn glow-box" onClick={startMatchmaking}>
                        <Heart size={48} fill="var(--accent-pink)" color="var(--accent-pink)" />
                    </button>
                </div>
            )}

            {matchState === 'searching' && (
                <div className="match-content">
                    <div className="radar"></div>
                    <h3 className="glow-text">Kozmik Sinyal Gönderiliyor...</h3>
                    <p>Uyumluluk aranıyor</p>
                    <button className="mt-4 text-secondary text-sm" onClick={() => { resetMatch(); socket?.emit('leaveMatchmaking'); }}>İptal Et</button>
                </div>
            )}

            {matchState === 'pending' && matchedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10, 5, 20, 0.85)', backdropFilter: 'blur(10px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: 320, padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden', border: '2px solid var(--accent-pink)', borderRadius: 24 }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, height: 4, background: 'linear-gradient(90deg, var(--accent-pink), var(--accent-purple))', width: `${(matchCountdown || 0) * 20}%`, transition: 'width 1s linear' }} />

                        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent-pink)', marginBottom: 16 }}>Eşleşme Bulundu!</h2>

                        <div style={{ width: 100, height: 100, margin: '0 auto 16px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-gold)' }}>
                            <img loading="lazy" src={matchedUser.avatar ? `${BACKEND_URL}${matchedUser.avatar}` : `https://ui-avatars.com/api/?name=${matchedUser.name || matchedUser.email?.split('@')[0] || 'U'}&background=random`} alt="Match" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <p style={{ color: 'white', fontSize: 16, marginBottom: 24 }}>
                            <strong>{matchedUser.name || matchedUser.email?.split('@')[0] || 'Gizemli Yabancı'}</strong> ile eşleştin!
                        </p>

                        {isPremium && (
                            <button
                                onClick={handlePassMatch}
                                disabled={passingMatch}
                                style={{ width: '100%', padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', marginBottom: 12 }}
                            >
                                {passingMatch ? <Loader size={16} className="animate-spin" /> : 'Pas Geç'}
                            </button>
                        )}
                        {!isPremium && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Pas geçmek için Premium üye olmalısın.</p>}

                        <p style={{ fontSize: 13, color: 'var(--accent-gold)', fontWeight: 'bold' }}>{matchCountdown} saniye içinde sohbet başlayacak...</p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Match;
