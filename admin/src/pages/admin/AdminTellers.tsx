import { useEffect, useState } from 'react';
import { UserCheck, UserX, Star, ShieldAlert, FileText, Loader2 } from 'lucide-react';
import api from '../../api/client';

interface TellerApplication {
    id: string;
    userId: string;
    experience: string;
    fortuneTypes: string;
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

const AdminTellers = () => {
    const [applications, setApplications] = useState<TellerApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/tellers/applications');
            setApplications(res.data);
        } catch (error) {
            console.error('Failed to fetch teller applications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!window.confirm(`Bu başvuruyu ${status === 'APPROVED' ? 'ONAYLAMAK' : 'REDDETMEK'} istediğinize emin misiniz?`)) return;

        try {
            await api.post(`/admin/tellers/applications/${id}`, { status });
            // Remove from list
            setApplications(applications.filter(app => app.id !== id));
        } catch (error) {
            console.error(`İşlem başarısız: ${status.toLowerCase()}`, error);
            alert('İşlem başarısız oldu.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 admin-card-glow">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Falcı Başvuruları
                    </h1>
                    <p className="text-white/60 mt-1">Yeni falcı başvurularını inceleyin ve onaylayın</p>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-xl border border-purple-500/30">
                    <FileText size={20} />
                    <span className="font-bold">{applications.length} Bekleyen</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <Loader2 className="animate-spin text-purple-400 w-10 h-10" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Bekleyen başvuru yok</p>
                        <p className="text-sm">Tüm başvuruları incelediniz!</p>
                    </div>
                ) : (
                    applications.map((app) => (
                        <div key={app.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col admin-card-glow transition-transform hover:-translate-y-1">
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg">
                                            {app.user.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{app.user.name || 'İsimsiz Aday'}</h3>
                                            <p className="text-white/50 text-sm">{app.user.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-white/40">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-300 mb-2 uppercase tracking-wider">Yetenekler</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {app.fortuneTypes.split(',').map((type, i) => (
                                                <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-sm text-white/80 border border-white/5">
                                                    {type.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-300 mb-2 uppercase tracking-wider">Deneyim Mektubu</h4>
                                        <div className="bg-black/30 p-4 rounded-xl text-sm text-white/70 italic leading-relaxed h-32 overflow-y-auto custom-scrollbar border border-white/5">
                                            "{app.experience}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex border-t border-white/10 mt-auto">
                                <button
                                    onClick={() => handleAction(app.id, 'REJECTED')}
                                    className="flex-1 py-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors font-medium border-r border-white/10"
                                >
                                    <UserX size={18} /> Reddet
                                </button>
                                <button
                                    onClick={() => handleAction(app.id, 'APPROVED')}
                                    className="flex-1 py-4 flex items-center justify-center gap-2 text-green-400 hover:bg-green-500/10 transition-colors font-medium relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <UserCheck size={18} /> Onayla
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Active Tellers Section */}
            <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                    <Star className="text-yellow-400" />
                    <h2 className="text-2xl font-bold">Aktif Falcıları Yönet</h2>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center admin-card-glow">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-white/20" />
                    <p className="text-white/60">Aktif falcı yönetim tablosu burada yer alacaktır.</p>
                    <p className="text-sm text-white/40 mt-2">Şu anda Kullanıcılar bölmesinden erişilebilir.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminTellers;
