import { useEffect, useState } from 'react';
import { Crown, Trophy, X } from 'lucide-react';
import api from '../../api/client';

interface RankingEntry {
    rank: number;
    userId: string;
    name: string;
    avatar: string | null;
    totalReceived: number;
}

interface RoomLeaderboardTabProps {
    roomId: string;
    onClose: () => void;
}

const PODIUM_STYLES = [
    { bg: 'bg-gradient-to-t from-secondary/40 to-secondary/10 border-secondary/50', rank: 'bg-secondary text-on-secondary', crown: true },
    { bg: 'bg-gradient-to-t from-zinc-300/40 to-zinc-300/10 border-zinc-300/50', rank: 'bg-zinc-300 text-black', crown: false },
    { bg: 'bg-gradient-to-t from-amber-700/40 to-amber-700/10 border-amber-700/50', rank: 'bg-amber-600 text-white', crown: false }
];

export const RoomLeaderboardTab: React.FC<RoomLeaderboardTabProps> = ({ roomId, onClose }) => {
    const [window_, setWindow] = useState<'daily' | 'weekly'>('daily');
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/party/${roomId}/ranking?window=${window_}`)
            .then(res => setRanking(res.data.ranking || []))
            .catch(e => console.error('Sıralama çekilemedi:', e))
            .finally(() => setLoading(false));
    }, [roomId, window_]);

    const top3 = ranking.slice(0, 3);
    const rest = ranking.slice(3);
    // Podium visual order: 2nd, 1st, 3rd
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10 max-h-[75vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Trophy size={18} className="text-secondary" /> Oda Sıralaması
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-4 shrink-0">
                    {(['daily', 'weekly'] as const).map(w => (
                        <button
                            key={w}
                            onClick={() => setWindow(w)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                window_ === w ? 'bg-primary text-on-primary' : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                        >
                            {w === 'daily' ? 'Bugün' : 'Bu Hafta'}
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="text-center text-white/40 text-sm py-8">Yükleniyor...</div>
                    ) : ranking.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-8">Bu dönemde henüz hediye alan olmamış.</div>
                    ) : (
                        <>
                            {/* Podium */}
                            {podiumOrder.length > 0 && (
                                <div className="flex justify-center items-end gap-3 mb-6 h-[140px]">
                                    {podiumOrder.map((entry, i) => {
                                        if (!entry) return null;
                                        const isFirst = top3.length === 3 ? i === 1 : i === 0;
                                        const styleIdx = top3.length === 3 ? (i === 1 ? 0 : i === 0 ? 1 : 2) : i;
                                        const style = PODIUM_STYLES[styleIdx] ?? PODIUM_STYLES[2];
                                        const height = isFirst ? 'h-[90px]' : 'h-[65px]';
                                        return (
                                            <div key={entry.userId} className="flex flex-col items-center w-20">
                                                <div className="relative mb-2">
                                                    {style?.crown && (
                                                        <Crown size={18} className="absolute -top-5 left-1/2 -translate-x-1/2 text-secondary drop-shadow-[0_0_8px_rgba(255,198,64,0.8)]" />
                                                    )}
                                                    <img
                                                        src={entry.avatar || `https://ui-avatars.com/api/?name=${entry.name}`}
                                                        className={`rounded-full object-cover border-2 border-[#131b2e] ${isFirst ? 'w-14 h-14' : 'w-11 h-11'}`}
                                                    />
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${style?.rank}`}>
                                                        {entry.rank}
                                                    </div>
                                                </div>
                                                <div className={`w-full rounded-t-xl border-t border-l border-r flex flex-col items-center justify-start pt-2 px-1 ${height} ${style?.bg}`}>
                                                    <span className="text-[10px] text-white truncate w-full text-center">{entry.name}</span>
                                                    <span className="text-xs font-bold text-[#3cddc7]">{entry.totalReceived}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Rest of list */}
                            <div className="flex flex-col gap-2">
                                {rest.map(entry => (
                                    <div key={entry.userId} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <span className="w-6 text-center text-white/50 font-bold text-sm">{entry.rank}</span>
                                        <img src={entry.avatar || `https://ui-avatars.com/api/?name=${entry.name}`} className="w-9 h-9 rounded-full object-cover" />
                                        <span className="flex-1 text-sm text-white truncate">{entry.name}</span>
                                        <span className="text-xs font-bold text-[#3cddc7]">{entry.totalReceived} 🌟</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
