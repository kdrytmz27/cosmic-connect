import { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [usersRes, appsRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/api/admin/users?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BACKEND_URL}/api/admin/tellers/applications`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setUsers(usersRes.data.users);
                setApplications(appsRes.data);
            } catch (error) {
                console.error("Admin data fetch error:", error);
                showToast('Admin verileri alınamadı.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, [token, showToast]);

    const handleApplication = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            // VULN 66 FIX: Use the correct admin-protected endpoint instead of the open teller endpoint
            await axios.post(`${BACKEND_URL}/api/admin/tellers/applications/${appId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`Başvuru ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}`, 'success');
            setApplications(prev => prev.filter(app => app.id !== appId));
        } catch (error) {
            console.error("Error updating application", error);
            showToast('İşlem başarısız.', 'error');
        }
    };

    if (loading) return <div style={{ padding: '20px', color: 'white' }}>Yükleniyor...</div>;

    return (
        <div style={{ padding: '20px', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldAlert color="#4facfe" /> Admin Kontrol Paneli</h2>

            <section style={{ marginTop: '30px' }}>
                <h3><Users size={20} style={{ marginRight: '8px' }} />Bekleyen Falcı Başvuruları</h3>
                {applications.length === 0 ? <p>Bekleyen başvuru yok.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {applications.map(app => (
                            <div key={app.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px' }}>
                                <p><strong>Kullanıcı:</strong> {app.user.name} ({app.user.email})</p>
                                <p><strong>Deneyim:</strong> {app.experience}</p>
                                <p><strong>Fal Tipleri:</strong> {app.fortuneTypes}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => handleApplication(app.id, 'APPROVED')} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16} /> Onayla</button>
                                    <button onClick={() => handleApplication(app.id, 'REJECTED')} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><XCircle size={16} /> Reddet</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginTop: '40px' }}>
                <h3>Son Kayıt Olan Kullanıcılar</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '10px' }}>İsim</th>
                                <th style={{ padding: '10px' }}>Email</th>
                                <th style={{ padding: '10px' }}>Rol</th>
                                <th style={{ padding: '10px' }}>Kayıt Tarihi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.slice(0, 15).map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <td style={{ padding: '10px' }}>{u.name}</td>
                                    <td style={{ padding: '10px' }}>{u.email}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{ background: u.role === 'ADMIN' ? '#ef4444' : u.role === 'FORTUNE_TELLER' ? '#8b5cf6' : '#3b82f6', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
