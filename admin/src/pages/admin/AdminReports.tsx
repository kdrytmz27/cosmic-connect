import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

interface Report {
    id: string;
    reporter: { id: string; name: string; email: string };
    reported: { id: string; name: string; email: string; role: string };
    reason: string;
    description: string;
    status: string;
    createdAt: string;
}

const AdminReports: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:3000/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(res.data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchReports();
    }, [token]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.patch(`http://localhost:3000/api/admin/reports/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReports();
        } catch (error) {
            console.error('Error updating report status', error);
        }
    };

    if (loading) return <div className="text-white">Yükleniyor...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Şikayet Yönetimi</h2>
            <div className="bg-[#1a1b2e] rounded-xl overflow-hidden shadow-lg border border-purple-900/30">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#242538] text-purple-300">
                        <tr>
                            <th className="px-6 py-4 font-medium">Şikayet Eden</th>
                            <th className="px-6 py-4 font-medium">Şikayet Edilen</th>
                            <th className="px-6 py-4 font-medium">Sebep</th>
                            <th className="px-6 py-4 font-medium">Açıklama</th>
                            <th className="px-6 py-4 font-medium">Tarih</th>
                            <th className="px-6 py-4 font-medium">Durum</th>
                            <th className="px-6 py-4 font-medium text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-purple-900/10 transition-colors">
                                <td className="px-6 py-4">{report.reporter.name}</td>
                                <td className="px-6 py-4">{report.reported.name} ({report.reported.role})</td>
                                <td className="px-6 py-4 font-medium">{report.reason}</td>
                                <td className="px-6 py-4 truncate max-w-xs">{report.description || '-'}</td>
                                <td className="px-6 py-4">{new Date(report.createdAt).toLocaleDateString('tr-TR')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${report.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' : report.status === 'RESOLVED' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {report.status === 'PENDING' ? 'Bekliyor' : report.status === 'RESOLVED' ? 'Çözüldü' : 'Reddedildi'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {report.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => updateStatus(report.id, 'RESOLVED')} className="text-green-400 hover:text-green-300">Çözüldü Yap</button>
                                            <button onClick={() => updateStatus(report.id, 'DISMISSED')} className="text-red-400 hover:text-red-300">Reddet</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Henüz şikayet bulunmuyor</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default AdminReports;
