import { useEffect, useState } from 'react';
import { X, Users2, Crown, Shield } from 'lucide-react';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

interface FamilyMemberData {
    id: string;
    role: 'LEADER' | 'VICE' | 'MEMBER';
    contributionScore: number;
    user: { id: string; name: string; avatar: string | null; level: number };
}

interface FamilyData {
    id: string;
    name: string;
    avatarUrl: string | null;
    announcement: string | null;
    level: number;
    totalScore: number;
    leaderId: string;
    members: FamilyMemberData[];
}

interface FamilySummary {
    id: string;
    name: string;
    avatarUrl: string | null;
    level: number;
    totalScore: number;
    _count: { members: number };
}

interface FamilyPanelProps {
    onClose: () => void;
}

const ROLE_LABEL: Record<string, string> = { LEADER: 'Lider', VICE: 'Vekil', MEMBER: 'Üye' };

export const FamilyPanel: React.FC<FamilyPanelProps> = ({ onClose }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [myFamily, setMyFamily] = useState<FamilyData | null>(null);
    const [browseList, setBrowseList] = useState<FamilySummary[]>([]);
    const [view, setView] = useState<'mine' | 'browse' | 'create'>('mine');
    const [newFamilyName, setNewFamilyName] = useState('');

    const loadMyFamily = () => {
        setLoading(true);
        api.get('/family/mine')
            .then(res => setMyFamily(res.data.family))
            .catch(e => console.error('Aile bilgisi çekilemedi:', e))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadMyFamily(); }, []);

    const loadBrowseList = () => {
        api.get('/family')
            .then(res => setBrowseList(res.data.families || []))
            .catch(e => console.error('Aile listesi çekilemedi:', e));
    };

    const handleCreate = async () => {
        if (newFamilyName.trim().length < 3) {
            showToast('Aile adı en az 3 karakter olmalı.', 'error');
            return;
        }
        try {
            await api.post('/family', { name: newFamilyName.trim() });
            showToast('Aile kuruldu! 🎉', 'success');
            setView('mine');
            loadMyFamily();
        } catch (e: any) {
            showToast(e?.response?.data?.error || 'Aile kurulamadı.', 'error');
        }
    };

    const handleJoin = async (familyId: string) => {
        try {
            await api.post(`/family/${familyId}/join`);
            showToast('Aileye katıldın! 🎉', 'success');
            setView('mine');
            loadMyFamily();
        } catch (e: any) {
            showToast(e?.response?.data?.error || 'Aileye katılamadın.', 'error');
        }
    };

    const handleLeave = async () => {
        try {
            await api.post('/family/leave');
            showToast('Aileden ayrıldın.', 'success');
            loadMyFamily();
        } catch (e: any) {
            showToast(e?.response?.data?.error || 'Aileden ayrılamadın.', 'error');
        }
    };

    const handlePromote = async (targetUserId: string, role: 'VICE' | 'MEMBER') => {
        if (!myFamily) return;
        try {
            await api.post(`/family/${myFamily.id}/promote`, { targetUserId, role });
            showToast('Rol güncellendi.', 'success');
            loadMyFamily();
        } catch (e: any) {
            showToast(e?.response?.data?.error || 'Rol güncellenemedi.', 'error');
        }
    };

    const isLeader = myFamily?.leaderId === user?.id;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 bg-[#131b2e] rounded-t-3xl z-50 p-6 shadow-2xl border-t border-white/10 pb-10 max-h-[75vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Users2 size={18} className="text-primary" /> Aile
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="text-center text-white/40 text-sm py-8">Yükleniyor...</div>
                    ) : view === 'mine' && myFamily ? (
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                                <img src={myFamily.avatarUrl || 'https://ui-avatars.com/api/?name=' + myFamily.name} className="w-14 h-14 rounded-xl object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-bold truncate">{myFamily.name}</div>
                                    <div className="text-white/40 text-xs">Seviye {myFamily.level} · {myFamily.totalScore} 🌟 toplam</div>
                                </div>
                            </div>
                            {myFamily.announcement && (
                                <div className="text-xs text-white/60 bg-white/5 rounded-xl p-3">{myFamily.announcement}</div>
                            )}
                            <div className="flex flex-col gap-2">
                                {myFamily.members.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <img src={m.user.avatar || `https://ui-avatars.com/api/?name=${m.user.name}`} className="w-9 h-9 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white truncate flex items-center gap-1">
                                                {m.user.name}
                                                {m.role === 'LEADER' && <Crown size={12} className="text-secondary" />}
                                                {m.role === 'VICE' && <Shield size={12} className="text-blue-400" />}
                                            </div>
                                            <div className="text-[10px] text-white/40">{ROLE_LABEL[m.role]} · {m.contributionScore} katkı</div>
                                        </div>
                                        {isLeader && m.user.id !== user?.id && (
                                            <button
                                                onClick={() => handlePromote(m.user.id, m.role === 'VICE' ? 'MEMBER' : 'VICE')}
                                                className="text-[10px] bg-white/10 text-white/70 px-2 py-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
                                            >
                                                {m.role === 'VICE' ? 'Vekilliği Al' : 'Vekil Yap'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleLeave} className="w-full py-3 rounded-xl bg-error/20 text-error border border-error/30 text-sm font-bold hover:bg-error/30 transition-colors">
                                Aileden Ayrıl
                            </button>
                        </div>
                    ) : view === 'create' ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-xs text-white/50">Aile kurmak 1000 Yıldız Tozu'na mal olur.</p>
                            <input
                                type="text"
                                value={newFamilyName}
                                onChange={e => setNewFamilyName(e.target.value)}
                                placeholder="Aile adı"
                                className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary"
                            />
                            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-bold">
                                Aile Kur (1000 🌟)
                            </button>
                            <button onClick={() => setView('mine')} className="w-full py-2 rounded-xl bg-white/5 text-white/60 text-sm">
                                Vazgeç
                            </button>
                        </div>
                    ) : view === 'browse' ? (
                        <div className="flex flex-col gap-2">
                            {browseList.length === 0 ? (
                                <div className="text-center text-white/40 text-sm py-8">Hiç aile yok, ilk aileyi sen kur!</div>
                            ) : browseList.map(f => (
                                <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                    <img src={f.avatarUrl || `https://ui-avatars.com/api/?name=${f.name}`} className="w-10 h-10 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white truncate">{f.name}</div>
                                        <div className="text-[10px] text-white/40">Sv.{f.level} · {f._count.members} üye</div>
                                    </div>
                                    <button onClick={() => handleJoin(f.id)} className="text-xs bg-primary/80 text-on-primary px-3 py-1.5 rounded-full font-bold">
                                        Katıl
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => setView('mine')} className="w-full py-2 rounded-xl bg-white/5 text-white/60 text-sm mt-2">
                                Geri
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-center text-white/40 text-sm py-4">Henüz bir ailen yok.</p>
                            <button
                                onClick={() => { setView('browse'); loadBrowseList(); }}
                                className="w-full py-3 rounded-xl bg-white/5 text-white text-sm font-bold border border-white/10"
                            >
                                Ailelere Göz At
                            </button>
                            <button
                                onClick={() => setView('create')}
                                className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-bold"
                            >
                                Yeni Aile Kur
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
