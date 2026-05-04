import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Star, Calendar, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';

interface DashboardStats {
    summary: {
        totalUsers: number;
        premiumUsers: number;
        totalAppointments: number;
        pendingTellers: number;
        totalStardustCirculation: number;
    };
    charts: {
        dailyRegistrations: { date: string; count: number }[];
        topTellers: { id: string; name: string; rating: number; reviewCount: number }[];
    };
}

const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch admin stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-400 w-12 h-12" />
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        { title: 'Toplam Kullanıcı', value: stats.summary.totalUsers, icon: <Users size={24} />, color: 'from-blue-500 to-cyan-400' },
        { title: 'Premium Kullanıcılar', value: stats.summary.premiumUsers, icon: <Star size={24} className="fill-current text-yellow-400" />, color: 'from-yellow-600 to-yellow-400' },
        { title: 'Toplam Randevu', value: stats.summary.totalAppointments, icon: <Calendar size={24} />, color: 'from-purple-500 to-pink-500' },
        { title: 'Onay Bekleyen Falcılar', value: stats.summary.pendingTellers, icon: <UserPlus size={24} />, color: 'from-orange-500 to-red-400' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 admin-card-glow">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Sisteme Genel Bakış
                    </h1>
                    <p className="text-white/60 mt-1">Gerçek zamanlı istatistikler ve trafik izleme</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm text-white/50 uppercase tracking-wider font-semibold">Toplam Stardust Hacmi</p>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                        {stats.summary.totalStardustCirculation.toLocaleString()} ✦
                    </p>
                </div>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group admin-card-glow"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-2xl -mr-16 -mt-16 transition-opacity group-hover:opacity-20`} />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-20`}>
                                {card.icon}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white/60 text-sm font-medium mb-1">{card.title}</h3>
                            <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Registration Chart - spans 2 columns */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 admin-card-glow">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <UserPlus size={20} className="text-purple-400" />
                        Yeni Kayıtlar (Son 7 Gün)
                    </h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.charts.dailyRegistrations}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#ffffff80"
                                    tick={{ fill: '#ffffff80', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis stroke="#ffffff80" tick={{ fill: '#ffffff80', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1625', borderColor: '#ffffff1a', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#c084fc' }}
                                    labelStyle={{ color: '#ffffff80', marginBottom: '4px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#c084fc"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#c084fc', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#f472b6', strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Tellers - spans 1 column */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 admin-card-glow flex flex-col">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Star size={20} className="text-yellow-400" />
                        En Çok Kazandıran Falcılar
                    </h2>

                    <div className="flex-1">
                        <div className="space-y-4">
                            {stats.charts.topTellers.length > 0 ? (
                                stats.charts.topTellers.map((teller, i) => (
                                    <div key={teller.id} className="flex items-center gap-4 bg-black/20 p-3 rounded-xl">
                                        <div className="font-bold text-white/40 w-4">{i + 1}</div>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/50 to-pink-500/50 flex items-center justify-center font-bold">
                                            {teller.name ? teller.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{teller.name || 'Bilinmeyen Falcı'}</p>
                                            <p className="text-xs text-white/50">{teller.reviewCount} Reviews</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-500 px-2 py-1 rounded-md text-sm font-semibold">
                                            <span>{Number(teller.rating).toFixed(1)}</span>
                                            <Star size={14} className="fill-current" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-white/50 py-10">
                                    No teller data available yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
