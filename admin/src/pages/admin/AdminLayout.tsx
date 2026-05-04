import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, BadgeDollarSign, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './Admin.css';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Gösterge Paneli' },
        { path: '/users', icon: <Users size={20} />, label: 'Kullanıcılar ve Kontrol' },
        { path: '/tellers', icon: <UserCog size={20} />, label: 'Falcı Yönetimi' },
        { path: '/economy', icon: <BadgeDollarSign size={20} />, label: 'Ekonomi ve Trafik' },
        { path: '/reports', icon: <ShieldAlert size={20} />, label: 'Şikayet Yönetimi' }
    ];

    return (
        <div className="admin-layout flex h-screen bg-[#13111C] text-white font-sans overflow-hidden">

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {!isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(true)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 260 : 0,
                    opacity: isSidebarOpen ? 1 : 0
                }}
                className={`bg-[#1A1625] border-r border-white/5 flex flex-col z-50 overflow-hidden shrink-0 ${!isSidebarOpen && 'absolute md:relative h-full'}`}
            >
                <div className="p-6 flex items-center justify-between min-w-[260px]">
                    <div className="flex items-center gap-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        <ShieldAlert size={24} className="text-purple-400" />
                        Admin Panel
                    </div>
                    <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pb-6 min-w-[260px]">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <p className="font-semibold text-sm">{user?.name || 'Yönetici'}</p>
                        <p className="text-xs text-white/50">{user?.role}</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 min-w-[260px]">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 min-w-[260px]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Çıkış Yap</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-16 flex items-center px-4 md:px-8 border-b border-white/5 bg-[#1A1625]/50 backdrop-blur-md sticky top-0 z-30 justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="text-sm font-medium text-white/50">
                        Cosmic Connect Yönetim Merkezi
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default AdminLayout;
