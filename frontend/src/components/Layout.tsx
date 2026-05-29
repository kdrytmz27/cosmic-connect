import React, { useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, Sparkles, User, Star, ShoppingBag, Trophy, ShieldAlert } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const Layout = () => {
    const { unreadCount, setUnreadCount } = useSocket();
    const { user } = useAuth();
    const isTeller = user?.role === 'FORTUNE_TELLER';
    const location = useLocation();
    const mainContentRef = useRef<HTMLElement>(null);

    // Scroll to top when route changes
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    interface NavItem {
        path: string;
        icon: React.ReactElement;
        label: string;
        badge?: number;
        onClick?: () => void;
        exact?: boolean;
    }

    const tellerNavItems: NavItem[] = [
        { path: '/messages', icon: <MessageCircle size={22} />, label: 'Mesajlar', badge: unreadCount, onClick: () => setUnreadCount(0) },
        { path: '/teller-dashboard', icon: <Star size={22} />, label: 'Panel' },
        { path: '/profile', icon: <User size={22} />, label: 'Profil' },
    ];

    const userNavItems: NavItem[] = [
        { path: '/', icon: <Home size={22} />, label: 'Keşfet', exact: true },
        { path: '/match', icon: <Heart size={22} />, label: 'Eşleş' },
        { path: '/messages', icon: <MessageCircle size={22} />, label: 'Mesajlar', badge: unreadCount, onClick: () => setUnreadCount(0) },
        { path: '/fortune', icon: <Sparkles size={22} />, label: 'Fal' },
        { path: '/market', icon: <ShoppingBag size={22} />, label: 'Market' },
        { path: '/leaderboard', icon: <Trophy size={22} />, label: 'Liderler' },
        { path: '/profile', icon: <User size={22} />, label: 'Profil' },
    ];

    const adminNavItems: NavItem[] = [
        { path: '/', icon: <Home size={22} />, label: 'Ana', exact: true },
        { path: '/admin', icon: <ShieldAlert size={22} />, label: 'Admin' },
        { path: '/profile', icon: <User size={22} />, label: 'Profil' },
    ];

    const navItems = user?.role === 'ADMIN' ? adminNavItems : isTeller ? tellerNavItems : userNavItems;

    return (
        <div className="app-layout">
            <header className="app-header" style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: 'calc(12px + env(safe-area-inset-top, 0px)) 20px 12px 20px',
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 100,
                background: 'linear-gradient(to bottom, rgba(15,15,30,0.95), rgba(15,15,30,0))',
                pointerEvents: 'none'
            }}>
                {/* Sol tarafta Logo artık kullanılmıyor, direkt NotificationBell sağ tarafa kilitli */}
                <div style={{ pointerEvents: 'auto' }}>
                    {/* Right Action Icons (Notifications) */}
                    <NotificationBell />
                </div>
            </header>

            <main className="main-content" ref={mainContentRef} style={{ paddingTop: '60px' }}>
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <div className={`nav-track ${isTeller ? 'nav-track--teller' : 'nav-track--user'}`}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={!!item.exact}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div
                                className="icon-wrapper"
                                onClick={item.onClick}
                                style={{ position: 'relative' }}
                            >
                                {item.icon}
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
