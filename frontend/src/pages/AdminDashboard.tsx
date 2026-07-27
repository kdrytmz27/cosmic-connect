import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, CheckCircle, XCircle, TrendingUp, Activity, DollarSign, Ban, Check, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'OVERVIEW' | 'APPLICATIONS' | 'USERS' | 'TELLERS' | 'REPORTS' | 'FINANCE' | 'PAYOUTS';

export default function AdminDashboard() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
    const [loading, setLoading] = useState(true);

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [financeData, setFinanceData] = useState<any>(null);
    const [stats, setStats] = useState<any>({
        totalUsers: 0, premiumUsers: 0, totalAppointments: 0, pendingTellers: 0, totalStardustCirculation: 0
    });
    const [charts, setCharts] = useState<any>({ dailyRegistrations: [], topTellers: [] });
    const [payouts, setPayouts] = useState<any[]>([]);
    // Hangi talebin işlendiğini takip eder - çift tıklamada iki istek gitmesin
    const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, appsRes, statsRes, reportsRes, financeRes, payoutsRes] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/admin/users?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/api/admin/tellers/applications`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/api/admin/reports?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/api/admin/financial-reports`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/api/admin/payouts?status=PENDING`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPayouts(payoutsRes.data.payouts || []);
            
            setUsers(usersRes.data.users || []);
            setApplications(appsRes.data || []);
            
            if(statsRes.data) {
                setStats(statsRes.data.summary || {});
                setCharts(statsRes.data.charts || {});
            }
            setReports(reportsRes.data.reports || []);
            setFinanceData(financeRes.data.data || {});

        } catch (error) {
            console.error("Admin data fetch error:", error);
            showToast('Admin verileri güncellenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Ödeme talebini sonuçlandırır.
     *
     * COMPLETE yalnızca kayıt tutar - para banka üzerinden elle gönderiliyor.
     * REJECT ise emanetteki elması falcıya iade ediyor (sunucu tarafında).
     */
    const handleProcessPayout = async (id: string, action: 'COMPLETE' | 'REJECT') => {
        if (processingPayoutId) return;
        setProcessingPayoutId(id);
        try {
            await axios.patch(
                `${BACKEND_URL}/api/admin/payouts/${id}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Liste yalnızca bekleyenleri gösteriyor, sonuçlanan satır düşer
            setPayouts(prev => prev.filter(p => p.id !== id));
            showToast(action === 'COMPLETE' ? 'Ödeme tamamlandı olarak işaretlendi.' : 'Talep reddedildi, tutar iade edildi.', 'success');
        } catch (error: any) {
            showToast(error?.response?.data?.error || 'Ödeme talebi işlenemedi.', 'error');
        } finally {
            setProcessingPayoutId(null);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [token, showToast]);

    const handleApplication = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await axios.post(`${BACKEND_URL}/api/admin/tellers/applications/${appId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`Başvuru ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}`, 'success');
            fetchAllData(); // Refresh all to update stats and lists
        } catch (error) {
            console.error("Error updating application", error);
            showToast('İşlem başarısız.', 'error');
        }
    };

    const handleToggleBan = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'BANNED' ? 'STANDARD' : 'BANNED';
        try {
            await axios.patch(`${BACKEND_URL}/api/admin/users/${userId}`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`Kullanıcı ${newRole === 'BANNED' ? 'yasaklandı' : 'yasaklaması kaldırıldı'}.`, 'success');
            fetchAllData();
        } catch (error) {
            console.error("Ban action error", error);
            showToast('Banlama/kaldırma işlemi başarısız oldu.', 'error');
        }
    };

    const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
        try {
            await axios.patch(`${BACKEND_URL}/api/admin/reports/${reportId}/status`, { status: action }, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`Rapor durumu: ${action}`, 'success');
            fetchAllData();
        } catch(error) {
            console.error("Report action error", error);
            showToast('Rapor güncellenemedi.', 'error');
        }
    };

    const pendingReports = reports.filter((r:any) => r.status === 'PENDING').length;
    const allTellers = users.filter((u:any) => u.role === 'FORTUNE_TELLER');

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-7xl mx-auto w-full pb-24 flex flex-col gap-8 h-full">
            <header className="flex flex-col justify-between items-start gap-6">
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h1 className="font-headline-lg text-primary flex items-center gap-3">
                            <ShieldAlert className="text-secondary" size={32} />
                            Yönetici Paneli
                        </h1>
                        <p className="font-body-md text-on-surface-variant">Cosmic Connect evreninin yönetim merkezi.</p>
                    </div>
                    <button onClick={fetchAllData} className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full text-on-surface hover:text-white transition-colors border border-white/10">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Güncelleniyor...' : 'Yenile'}
                    </button>
                </div>

                <div className="flex flex-wrap bg-surface-container border border-white/10 p-1 rounded-3xl w-full md:rounded-full">
                    {(['OVERVIEW', 'USERS', 'TELLERS', 'APPLICATIONS', 'REPORTS', 'FINANCE', 'PAYOUTS'] as TabType[]).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 min-w-[100px] px-4 py-2 rounded-full font-label-md transition-colors ${activeTab === tab ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-white'}`}
                        >
                            {tab === 'OVERVIEW' ? 'Genel' : 
                             tab === 'USERS' ? 'Kullanıcılar' : 
                             tab === 'TELLERS' ? 'Falcılar' : 
                             tab === 'APPLICATIONS' ? 'Başvurular' : 
                             tab === 'REPORTS' ? 'Raporlar' :
                             tab === 'FINANCE' ? 'Finans' :
                             `Ödemeler${payouts.length ? ` (${payouts.length})` : ''}`}
                        </button>
                    ))}
                </div>
            </header>

            {loading && activeTab === 'OVERVIEW' && <div className="text-center text-primary mt-10">Yükleniyor...</div>}

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* OVERVIEW TAB */}
                    {activeTab === 'OVERVIEW' && (
                        <div className="flex flex-col gap-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div onClick={() => setActiveTab('USERS')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                    <StatCard icon={<Users />} title="Toplam Kullanıcı" value={stats.totalUsers.toString()} />
                                </div>
                                <div onClick={() => setActiveTab('TELLERS')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                    <StatCard icon={<Activity />} title="Aktif Falcılar" value={allTellers.length.toString()} color="text-secondary" bg="bg-secondary/20" />
                                </div>
                                <div onClick={() => setActiveTab('REPORTS')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                    <StatCard icon={<ShieldAlert />} title="Bekleyen Raporlar" value={pendingReports.toString()} color="text-error" bg="bg-error/20" />
                                </div>
                                <div onClick={() => setActiveTab('FINANCE')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                    <StatCard icon={<DollarSign />} title="Yıldız Tozu Sirkülasyonu" value={stats.totalStardustCirculation.toString()} color="text-tertiary" bg="bg-tertiary/20" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-surface-container border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('FINANCE')}>
                                    <h3 className="font-headline-sm text-white mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-primary"/> Finansal Özet (Yıldız Tozu Harcamaları)</h3>
                                    <div className="flex flex-col gap-4 mt-8">
                                        <div className="flex justify-between items-center p-4 bg-background/50 rounded-2xl">
                                            <span className="text-on-surface-variant font-body-md">Randevulardan Gelen</span>
                                            <span className="text-secondary font-bold font-headline-md">✨ {financeData?.totalStardustFromAppointments || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-background/50 rounded-2xl">
                                            <span className="text-on-surface-variant font-body-md">Hediyelerden Gelen</span>
                                            <span className="text-tertiary font-bold font-headline-md">✨ {financeData?.totalStardustFromGifts || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface-container border border-white/10 rounded-3xl p-6">
                                    <h3 className="font-headline-sm text-white mb-4 flex items-center gap-2"><StarIcon /> Top Falcılar (Rating'e Göre)</h3>
                                    <div className="flex flex-col gap-3">
                                        {charts.topTellers && charts.topTellers.length > 0 ? charts.topTellers.map((t:any, i:number) => (
                                            <div key={t.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 text-center text-on-surface-variant font-bold">#{i+1}</span>
                                                    <span className="text-white font-body-md">{t.name}</span>
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-on-surface-variant text-sm">{t.reviewCount} Yorum</span>
                                                    <span className="text-secondary font-bold flex items-center gap-1">⭐ {t.rating}</span>
                                                </div>
                                            </div>
                                        )) : <p className="text-on-surface-variant">Henüz falcı verisi yok.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPLICATIONS TAB */}
                    {activeTab === 'APPLICATIONS' && (
                        <div>
                            {applications.length === 0 ? (
                                <div className="text-center py-12 bg-surface-container rounded-3xl border border-white/5">
                                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                                    <p className="text-on-surface-variant font-body-lg">Bekleyen başvuru bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {applications.map(app => (
                                        <div key={app.id} className="bg-surface-container border border-white/10 p-6 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <img src={`https://ui-avatars.com/api/?name=${app.user.name}&background=random`} className="w-12 h-12 rounded-full" alt="Avatar"/>
                                                    <div>
                                                        <h4 className="font-headline-sm text-white">{app.user.name}</h4>
                                                        <p className="font-label-sm text-on-surface-variant">{app.user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-background/50 p-4 rounded-xl mb-6">
                                                    <p className="text-sm text-white mb-2"><strong className="text-primary">Deneyim:</strong> {app.experience}</p>
                                                    <p className="text-sm text-white"><strong className="text-secondary">Uzmanlık:</strong> {app.fortuneTypes}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => handleApplication(app.id, 'APPROVED')} className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-green-500 hover:text-white transition-colors">
                                                    <CheckCircle size={18} /> Onayla
                                                </button>
                                                <button onClick={() => handleApplication(app.id, 'REJECTED')} className="flex-1 bg-error/20 text-error border border-error/30 py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-error hover:text-white transition-colors">
                                                    <XCircle size={18} /> Reddet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* USERS & TELLERS TABS */}
                    {(activeTab === 'USERS' || activeTab === 'TELLERS') && (
                        <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-black/20">
                                        <tr>
                                            <th className="p-4 font-label-md text-on-surface-variant">Kullanıcı</th>
                                            <th className="p-4 font-label-md text-on-surface-variant">Rol</th>
                                            <th className="p-4 font-label-md text-on-surface-variant">Seviye & Bakiye</th>
                                            <th className="p-4 font-label-md text-on-surface-variant">Kayıt Tarihi</th>
                                            <th className="p-4 font-label-md text-on-surface-variant text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(activeTab === 'TELLERS' ? allTellers : users).map(u => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-10 h-10 rounded-full" alt="Avatar"/>
                                                        <div>
                                                            <p className="font-body-md text-white flex items-center gap-2">
                                                                {u.name} {u.isPremium && <span className="text-secondary text-xs border border-secondary px-1 rounded">PREM</span>}
                                                            </p>
                                                            <p className="text-xs text-on-surface-variant">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        u.role === 'ADMIN' ? 'bg-error/20 text-error' : 
                                                        u.role === 'BANNED' ? 'bg-red-900/50 text-red-500 line-through' :
                                                        u.role === 'FORTUNE_TELLER' ? 'bg-secondary/20 text-secondary' : 
                                                        'bg-primary/20 text-primary'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-white text-sm">Seviye {u.level || 1}</p>
                                                    <p className="text-xs text-secondary">✨ {u.stardustBalance || 0}</p>
                                                </td>
                                                <td className="p-4 text-on-surface-variant text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4 text-right">
                                                    {u.role !== 'ADMIN' && (
                                                        <button 
                                                            onClick={() => handleToggleBan(u.id, u.role)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 inline-flex ${u.role === 'BANNED' ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-error/20 text-error hover:bg-error hover:text-white'} transition-colors`}
                                                        >
                                                            {u.role === 'BANNED' ? <><Check size={14} /> Banı Kaldır</> : <><Ban size={14} /> Yasakla</>}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(activeTab === 'TELLERS' ? allTellers : users).length === 0 && (
                                            <tr><td colSpan={5} className="text-center p-8 text-on-surface-variant">Listelenecek kayıt yok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'REPORTS' && (
                        <div className="flex flex-col gap-4">
                            {reports.length === 0 ? (
                                <div className="text-center py-12 bg-surface-container rounded-3xl border border-white/5">
                                    <ShieldAlert className="text-4xl text-on-surface-variant mb-2 mx-auto" />
                                    <p className="text-on-surface-variant font-body-lg">Hiç rapor bulunmuyor.</p>
                                </div>
                            ) : (
                                reports.map(r => (
                                    <div key={r.id} className={`bg-surface-container border ${r.status === 'PENDING' ? 'border-error/50' : 'border-white/10'} p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-md ${r.status === 'PENDING' ? 'bg-error text-white' : r.status === 'RESOLVED' ? 'bg-green-500 text-white' : 'bg-zinc-500 text-white'}`}>{r.status}</span>
                                                <span className="text-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col gap-2 mb-4 bg-background/50 p-4 rounded-xl">
                                                <p className="text-sm"><strong className="text-error">Şikayet Edilen:</strong> <span className="text-white">{r.reported?.name || 'Bilinmiyor'}</span> <span className="text-on-surface-variant">({r.reported?.email})</span></p>
                                                <p className="text-sm"><strong className="text-primary">Şikayet Eden:</strong> <span className="text-white">{r.reporter?.name || 'Bilinmiyor'}</span></p>
                                            </div>
                                            <p className="text-white font-bold mb-1">Sebep: {r.reason}</p>
                                            <p className="text-on-surface-variant text-sm">{r.description || 'Detaylı açıklama girilmemiş.'}</p>
                                        </div>
                                        <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                                            {r.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleResolveReport(r.id, 'RESOLVED')} className="w-full bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-xl hover:bg-green-500 hover:text-white transition-colors text-sm font-bold">
                                                        Çözüldü Olarak İşaretle
                                                    </button>
                                                    <button onClick={() => handleResolveReport(r.id, 'DISMISSED')} className="w-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 py-2 rounded-xl hover:bg-zinc-500 hover:text-white transition-colors text-sm font-bold">
                                                        Asılsız / Reddet
                                                    </button>
                                                    <button onClick={() => handleToggleBan(r.reportedId, r.reported?.role)} className="w-full mt-2 bg-error text-white py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-error/80 transition-colors text-sm font-bold">
                                                        <Ban size={14} /> Şikayet Edileni Banla
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* FINANCE TAB */}
                    {activeTab === 'FINANCE' && (
                        <div className="bg-surface-container border border-tertiary/30 p-8 rounded-3xl flex flex-col gap-6">
                            <h2 className="font-headline-lg text-tertiary flex items-center gap-3"><DollarSign size={32}/> Ekonomi & Finans Özeti</h2>
                            <p className="text-on-surface-variant">Sistem içerisindeki tüm Yıldız Tozu akışının özeti (Tüm zamanlar).</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div className="bg-background/80 p-6 rounded-2xl border border-white/5 text-center shadow-[0_0_20px_rgba(255,198,64,0.05)]">
                                    <p className="text-on-surface-variant text-sm mb-2">Randevulardan Gelen</p>
                                    <p className="text-3xl font-bold text-secondary">✨ {financeData?.totalStardustFromAppointments || 0}</p>
                                </div>
                                <div className="bg-background/80 p-6 rounded-2xl border border-white/5 text-center shadow-[0_0_20px_rgba(255,198,64,0.05)]">
                                    <p className="text-on-surface-variant text-sm mb-2">Hediyelerden Gelen</p>
                                    <p className="text-3xl font-bold text-tertiary">✨ {financeData?.totalStardustFromGifts || 0}</p>
                                </div>
                                <div className="bg-tertiary/10 p-6 rounded-2xl border border-tertiary/30 text-center shadow-[0_0_20px_rgba(255,198,64,0.1)]">
                                    <p className="text-tertiary/80 text-sm mb-2">Toplam Sirkülasyon</p>
                                    <p className="text-4xl font-bold text-tertiary">✨ {financeData?.totalCirculation || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PAYOUTS' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h2 className="font-headline-md text-white">Bekleyen Ödeme Talepleri</h2>
                                <span className="font-label-sm text-on-surface-variant">
                                    Para banka üzerinden elle gönderilir; burası yalnızca kayıt tutar.
                                </span>
                            </div>

                            {payouts.length === 0 ? (
                                <p className="text-on-surface-variant text-center py-10">Bekleyen ödeme talebi yok.</p>
                            ) : (
                                payouts.map(p => (
                                    <div key={p.id} className="bg-surface-container border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-white font-bold">{p.teller?.user?.name || 'İsimsiz falcı'}</span>
                                                <span className="text-xs text-on-surface-variant">{p.teller?.user?.email}</span>
                                            </div>
                                            <div className="font-mono text-sm text-on-surface-variant mt-1 break-all">
                                                {String(p.iban || '').replace(/(.{4})/g, '$1 ').trim()}
                                            </div>
                                            <div className="text-xs text-on-surface-variant mt-1">
                                                Talep: {new Date(p.createdAt).toLocaleString('tr-TR')} · Kalan bakiye: {(p.teller?.user?.diamondBalance ?? 0).toLocaleString('tr-TR')} elmas
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="font-headline-md text-emerald-400 font-bold">
                                                {Number(p.amount).toLocaleString('tr-TR')}
                                            </div>
                                            <div className="font-label-sm text-on-surface-variant">elmas</div>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleProcessPayout(p.id, 'COMPLETE')}
                                                disabled={processingPayoutId !== null}
                                                className="flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                                            >
                                                <Check size={16} /> Ödendi
                                            </button>
                                            <button
                                                onClick={() => handleProcessPayout(p.id, 'REJECT')}
                                                disabled={processingPayoutId !== null}
                                                className="flex items-center gap-1 px-4 py-2 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                                            >
                                                <XCircle size={16} /> Reddet
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function StatCard({ icon, title, value, color = "text-primary", bg = "bg-primary/20" }: { icon: React.ReactNode, title: string, value: string, color?: string, bg?: string }) {
    return (
        <div className="bg-surface-container border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="font-label-sm text-on-surface-variant">{title}</p>
                <p className="font-headline-md text-white font-bold">{value}</p>
            </div>
        </div>
    );
}

function StarIcon() {
    return <span className="material-symbols-outlined text-secondary">stars</span>;
}
