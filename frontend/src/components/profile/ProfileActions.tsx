import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileActionsProps {
    isOwner: boolean;
    targetId: string;
    friendStatus: any;
    friendReqRemaining: number;
    saving: boolean;
    handleSendFriendRequest: () => void;
    handleSuperLike: () => void;
    handleSendGift: () => void;
    handleBlock: () => void;
    handleReport: () => void;
    navigate: any;
    user: any;
}

export const ProfileActions = ({
    isOwner,
    targetId,
    friendStatus,
    friendReqRemaining,
    saving,
    handleSendFriendRequest,
    handleSuperLike,
    handleSendGift,
    handleBlock,
    handleReport,
    navigate,
    user
}: ProfileActionsProps) => {
    return (
        <>
            {/* Friend Request Section */}
            {!isOwner && friendStatus !== null && (
                <div style={{ marginBottom: 16 }}>
                    {friendStatus === 'friends' ? (
                        <div style={{ width: '100%', padding: '14px 20px', borderRadius: 16, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: 'var(--accent-pink)', textAlign: 'center', fontWeight: 'bold', fontSize: 15 }}>
                            ✨ Arkadaşınız ✨
                        </div>
                    ) : friendStatus === 'sent' ? (
                        <div style={{ width: '100%', padding: '14px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 'bold', fontSize: 15 }}>
                            İstek Gönderildi ✓
                        </div>
                    ) : friendStatus === 'received' ? (
                        <div style={{ width: '100%', padding: '14px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', color: 'var(--accent-pink)', textAlign: 'center', fontWeight: 'bold', fontSize: 15 }}>
                            Sana İstek Gönderdi (Mesajlardan Onayla)
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={handleSendFriendRequest}
                                disabled={saving}
                                style={{
                                    width: '100%', padding: '14px 20px', borderRadius: 16,
                                    background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(14,165,233,0.15))',
                                    border: '1px solid rgba(56,189,248,0.25)',
                                    color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 15,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Sparkles size={18} color="#38bdf8" />
                                Arkadaşlık İsteği Gönder
                            </button>
                            {!user?.isPremium && <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 4 }}>Kalan İstek Hakkı: {friendReqRemaining}</div>}
                        </div>
                    )}
                </div>
            )}

            {/* Premium & Economy Actions */}
            {!isOwner && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSuperLike}
                        disabled={saving}
                        style={{
                            flex: 1, padding: '12px', borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.15))',
                            border: '1px solid rgba(234,179,8,0.3)',
                            color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.3s'
                        }}
                    >
                        <Sparkles size={16} color="var(--accent-gold)" />
                        Süper Beğeni
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendGift}
                        disabled={saving}
                        style={{
                            flex: 1, padding: '12px', borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(126,34,206,0.15))',
                            border: '1px solid rgba(168,85,247,0.3)',
                            color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.3s'
                        }}
                    >
                        <span style={{ fontSize: 16 }}>🎁</span>
                        100 Toz Gönder
                    </motion.button>
                </div>
            )}

            {/* Synastry Analysis Button - shown on other users' profiles */}
            {!isOwner && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/synastry/${targetId}`)}
                    style={{
                        width: '100%', padding: '14px 20px', borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2))',
                        border: '1px solid rgba(236,72,153,0.3)',
                        color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginBottom: 24, transition: 'all 0.3s'
                    }}
                >
                    <Sparkles size={18} color="var(--accent-gold)" />
                    Synastri Analizi
                    <span style={{ fontSize: 12, color: 'var(--accent-gold)', opacity: 0.8 }}>✨</span>
                </motion.button>
            )}

            {/* Become Teller Button */}
            {isOwner && user?.role !== 'FORTUNE_TELLER' && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <button
                        onClick={() => navigate('/teller-application')}
                        className="primary-btn flex items-center gap-2 justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))', padding: '12px 24px' }}
                    >
                        <Sparkles size={16} /> Falcı Başvurusu Yap
                    </button>
                </div>
            )}

            {/* Danger Actions (FEAT-04) */}
            {!isOwner && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 40, borderTop: '1px solid var(--card-border)', paddingTop: 24 }}>
                    <button
                        onClick={handleBlock}
                        style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}
                    >
                        Engelle
                    </button>
                    <button
                        onClick={handleReport}
                        style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}
                    >
                        Şikayet Et
                    </button>
                </div>
            )}
        </>
    );
};
