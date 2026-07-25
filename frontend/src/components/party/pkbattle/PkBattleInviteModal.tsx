import { useEffect, useState } from 'react';
import { X, Swords } from 'lucide-react';
import api from '../../../api/client';
import { useSocket } from '../../../context/SocketContext';

interface PartyRoomSummary {
    id: string;
    title: string;
    coverUrl: string | null;
    currentCount: number;
}

interface PkBattleInviteModalProps {
    roomId: string;
    onClose: () => void;
}

export const PkBattleInviteModal: React.FC<PkBattleInviteModalProps> = ({ roomId, onClose }) => {
    const { socket } = useSocket();
    const [rooms, setRooms] = useState<PartyRoomSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [invitedRoomId, setInvitedRoomId] = useState<string | null>(null);

    useEffect(() => {
        api.get('/party')
            .then(res => setRooms((res.data || []).filter((r: PartyRoomSummary) => r.id !== roomId)))
            .catch(e => console.error('Oda listesi çekilemedi:', e))
            .finally(() => setLoading(false));
    }, [roomId]);

    const handleInvite = (targetRoomId: string) => {
        socket?.emit('pkBattleInvite', { roomId, targetRoomId });
        setInvitedRoomId(targetRoomId);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10 max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Swords size={18} className="text-error" /> PK Battle Başlat
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
                </div>
                <p className="text-xs text-white/50 mb-4">Meydan okumak istediğin bir oda seç. Kabul ederse 5 dakikalık hediye yarışı başlar.</p>

                <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-2">
                    {loading ? (
                        <div className="text-center text-white/40 text-sm py-8">Yükleniyor...</div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-8">Meydan okuyabileceğin başka aktif oda yok.</div>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                <img src={room.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white truncate">{room.title}</div>
                                    <div className="text-xs text-white/40">{room.currentCount} katılımcı</div>
                                </div>
                                <button
                                    onClick={() => handleInvite(room.id)}
                                    disabled={invitedRoomId === room.id}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-error/20 text-error border border-error/30 hover:bg-error/30 transition-colors disabled:opacity-50"
                                >
                                    {invitedRoomId === room.id ? 'Davet Gönderildi' : 'Meydan Oku'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};
