import { useEffect, useState } from 'react';
import { Search, Edit2, ShieldAlert, Star, Zap, Loader2 } from 'lucide-react';
import api from '../../api/client';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    stardustBalance: number;
    isPremium: boolean;
    createdAt: string;
    level: number;
    xp: number;
}

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});

    useEffect(() => {
        fetchUsers();
    }, [page, search, selectedRole]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users', {
                params: { page, limit: 10, search, role: selectedRole }
            });
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            const res = await api.patch(`/admin/users/${selectedUser.id}`, {
                ...editForm,
                stardustBalance: Number(editForm.stardustBalance),
                level: Number(editForm.level),
                xp: Number(editForm.xp)
            });

            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...res.data.user } : u));
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user', error);
            alert('Failed to update user.');
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            role: user.role,
            stardustBalance: user.stardustBalance,
            isPremium: user.isPremium,
            level: user.level,
            xp: user.xp
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 admin-card-glow">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Kullanıcı Yönetimi
                    </h1>
                    <p className="text-white/60 mt-1">Hesapları, rolleri ve ekonomi bakiyelerini yönetin</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="İsim veya e-posta ile ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>

                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50 appearance-none min-w-[120px]"
                    >
                        <option value="">Tüm Roller</option>
                        <option value="STANDARD">Standart</option>
                        <option value="FORTUNE_TELLER">Falcı</option>
                        <option value="ADMIN">Yönetici</option>
                    </select>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden admin-card-glow">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-white/50 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Kullanıcı</th>
                                <th className="p-4 font-semibold">Rol & Durum</th>
                                <th className="p-4 font-semibold">Ekonomi</th>
                                <th className="p-4 font-semibold">İlerleme</th>
                                <th className="p-4 font-semibold">Katılım</th>
                                <th className="p-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/50">
                                        <Loader2 className="animate-spin mx-auto text-purple-400 w-8 h-8" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/50">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 flex items-center justify-center font-bold text-lg text-purple-300 border border-purple-500/20">
                                                    {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{u.name || 'Unnamed User'}</p>
                                                    <p className="text-sm text-white/50">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                                    u.role === 'FORTUNE_TELLER' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                                                        'bg-white/10 text-white/70 border border-white/5'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                                {u.isPremium && (
                                                    <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                                                        <Star size={12} className="fill-current" /> Premium
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-orange-300 font-semibold bg-orange-400/10 px-3 py-1.5 rounded-lg w-fit">
                                                <Zap size={16} />
                                                {u.stardustBalance.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-sm font-medium">Lvl {u.level}</p>
                                                <p className="text-xs text-white/40">{u.xp} XP</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-white/60">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="p-2 bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 rounded-lg transition-colors border border-white/10"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 flex justify-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${page === i + 1 ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
                    <div className="bg-[#1A1625] border border-white/10 w-full max-w-md rounded-2xl p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <h2 className="text-xl font-bold mb-1">Kullanıcı Profilini Düzenle</h2>
                        <p className="text-white/50 text-sm mb-6">{selectedUser.email}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1">Rol</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50"
                                >
                                    <option value="STANDARD">Standart</option>
                                    <option value="FORTUNE_TELLER">Falcı</option>
                                    <option value="ADMIN">Yönetici</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-white/60 mb-1">Stardust Bakiyesi</label>
                                <div className="relative">
                                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                                    <input
                                        type="number"
                                        value={editForm.stardustBalance}
                                        onChange={(e) => setEditForm({ ...editForm, stardustBalance: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Seviye (Level)</label>
                                    <input
                                        type="number"
                                        value={editForm.level}
                                        onChange={(e) => setEditForm({ ...editForm, level: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">XP</label>
                                    <input
                                        type="number"
                                        value={editForm.xp}
                                        onChange={(e) => setEditForm({ ...editForm, xp: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isPremium}
                                        onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.checked })}
                                        className="w-5 h-5 rounded border-white/20 bg-black/50 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium flex items-center gap-2">
                                            <Star size={16} className={editForm.isPremium ? "text-yellow-400 fill-current" : "text-white/40"} />
                                            Premium Statüsü
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-8 pt-6 border-t border-red-500/20">
                                <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                                    <ShieldAlert size={18} /> Tehlikeli Bölge
                                </h3>
                                <button className="w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-medium border border-red-500/20 transition-colors">
                                    Hesabı Dondur / Yasakla
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
                            >
                                Değişiklikleri Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
