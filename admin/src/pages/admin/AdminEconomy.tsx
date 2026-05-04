import { useEffect, useState } from 'react';
import { ArrowUpRight, Calendar, Loader2, Info } from 'lucide-react';
import api from '../../api/client';

interface Appointment {
    id: string;
    appointmentDate: string;
    status: string;
    stardustPrice: number;
    fortuneType: string;
    user: {
        name: string;
        email: string;
    };
    teller: {
        user: {
            name: string;
            email: string;
        }
    };
}

interface Financials {
    totalStardustFromAppointments: number;
    totalStardustFromGifts: number;
    totalCirculation: number;
}

const AdminEconomy = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [financials, setFinancials] = useState<Financials | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEconomyData();
    }, []);

    const fetchEconomyData = async () => {
        try {
            setLoading(true);
            const [aptRes, finRes] = await Promise.all([
                api.get('/admin/appointments'),
                api.get('/admin/financial-reports')
            ]);
            setAppointments(aptRes.data);
            setFinancials(finRes.data.data);
        } catch (error) {
            console.error('Failed to fetch economy view data', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 admin-card-glow text-center sm:text-left">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    Ekonomi ve Trafik
                </h1>
                <p className="text-white/60 mt-1">Platform genelindeki stardust işlemlerini ve randevu geçmişini izleyin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 admin-card-glow">
                    <div className="flex items-center gap-3 text-green-400 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg"><ArrowUpRight size={20} /></div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Fal Gelirleri (Tamamlanan)</h3>
                    </div>
                    <p className="text-2xl font-bold text-white mt-4">{financials?.totalStardustFromAppointments?.toLocaleString() || 0} ✦</p>
                    <p className="text-sm text-green-300 mt-1">Başarılı seanslar</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 admin-card-glow">
                    <div className="flex items-center gap-3 text-purple-400 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg"><ArrowUpRight size={20} /></div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Hediye Akışı</h3>
                    </div>
                    <p className="text-2xl font-bold text-white mt-4">{financials?.totalStardustFromGifts?.toLocaleString() || 0} ✦</p>
                    <p className="text-sm text-purple-300 mt-1">Kullanıcılar arası hediyeler</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 admin-card-glow flex flex-col justify-center items-center text-center">
                    <div className="p-3 bg-blue-500/20 rounded-full mb-3 text-blue-400">
                        <Info size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{financials?.totalCirculation?.toLocaleString() || 0} ✦</h3>
                    <p className="text-white/60 text-sm">Toplam Stardust Dolaşımı</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden admin-card-glow">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="text-purple-400" />
                        Son Randevu Trafiği
                    </h2>
                    <span className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                        Son 50 işlem gösteriliyor
                    </span>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-white/50 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Tarih & Tür</th>
                                <th className="p-4 font-semibold">Danışan</th>
                                <th className="p-4 font-semibold">Falcı</th>
                                <th className="p-4 font-semibold text-right">Miktar (✦)</th>
                                <th className="p-4 font-semibold text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/50">
                                        <Loader2 className="animate-spin mx-auto text-purple-400 w-8 h-8" />
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/50">
                                        Herhangi bir işlem bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <p className="font-semibold text-white/90">{new Date(apt.appointmentDate).toLocaleString()}</p>
                                            <p className="text-xs text-white/50 px-2 py-0.5 bg-white/5 border border-white/10 rounded inline-block mt-1">{apt.fortuneType}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{apt.user.name}</p>
                                            <p className="text-xs text-white/50">{apt.user.email}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium text-purple-300">{apt.teller.user.name}</p>
                                        </td>
                                        <td className="p-4 text-right font-bold text-yellow-400">
                                            {apt.stardustPrice.toLocaleString()} ✦
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${apt.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                                apt.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                                    'bg-white/10 text-white/70 border border-white/5'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminEconomy;
