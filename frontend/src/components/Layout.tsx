import { useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { FloatingBubble } from './FloatingBubble';
import { GlobalGiftBanner } from './GlobalGiftBanner';

const Layout = () => {
    const { unreadCount, setUnreadCount, activePartyRoom } = useSocket();
    const { user, stardustBalance, isPremium } = useAuth();
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
        icon: string;
        label: string;
        badge?: number;
        onClick?: () => void;
        exact?: boolean;
    }

    const tellerNavItems: NavItem[] = [
        { path: '/messages', icon: 'chat_bubble', label: 'Mesajlar', badge: unreadCount, onClick: () => setUnreadCount(0) },
        { path: '/teller-dashboard', icon: 'stars', label: 'Panel' },
        { path: '/profile', icon: 'account_circle', label: 'Profil' },
    ];

    const userNavItems: NavItem[] = [
        { path: '/', icon: 'explore', label: 'Keşfet', exact: true },
        { path: '/match', icon: 'auto_awesome', label: 'Uyum' },
        { path: '/party', icon: 'celebration', label: 'Parti' },
        { path: '/messages', icon: 'chat_bubble', label: 'Mesajlar', badge: unreadCount, onClick: () => setUnreadCount(0) },
        { path: '/profile', icon: 'account_circle', label: 'Profil' },
    ];

    const adminNavItems: NavItem[] = [
        { path: '/', icon: 'home', label: 'Ana', exact: true },
        { path: '/admin', icon: 'admin_panel_settings', label: 'Admin' },
        { path: '/profile', icon: 'account_circle', label: 'Profil' },
    ];

    const desktopNavItems = [
        { path: '/market', icon: 'shopping_bag', label: 'Market' },
        { path: '/fortune/slot', icon: 'casino', label: 'Slot Makinesi' },
        { path: '/leaderboard', icon: 'leaderboard', label: 'Liderlik' },
        { path: '/teller/apply', icon: 'edit_note', label: 'Başvuru' },
        ...userNavItems,
        { path: '/settings', icon: 'settings', label: 'Ayarlar' },
    ];

    if (user?.role === 'ADMIN') {
        desktopNavItems.splice(1, 0, { path: '/admin', icon: 'admin_panel_settings', label: 'Yönetim Paneli' });
    }

    const navItems = user?.role === 'ADMIN' ? adminNavItems : isTeller ? tellerNavItems : userNavItems;

    // Check if we are inside a specific Party Room
    const isPartyRoom = location.pathname.startsWith('/party/') && location.pathname.length > 7;

    if (isPartyRoom) {
        return (
            <div className="w-full min-h-screen bg-[#0b1326]">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
            {/* DESKTOP NAVIGATION DRAWER (Hidden on Mobile) */}
            <nav className="fixed inset-y-0 left-0 z-[60] flex-col p-6 backdrop-blur-2xl border-r border-white/10 shadow-2xl bg-surface-container-lowest/80 h-full w-80 rounded-r-xl hidden md:flex">
                {/* Brand / Header */}
                <div className="flex flex-col items-start mb-10">
                    <div className="flex items-center gap-4 mb-6">
                        <img 
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Kozmik'}&background=ddb8ff&color=000&bold=true`} 
                            alt="User Avatar" 
                            className="w-16 h-16 rounded-full border-2 border-secondary object-cover" 
                        />
                        <div>
                            <h2 className="font-headline-md text-headline-md text-primary truncate max-w-[150px]">{user?.name || 'Kozmik Gezgin'}</h2>
                            <p className="font-label-sm text-label-sm text-secondary">{isPremium ? 'Premium Üye' : 'Standart Üye'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="font-label-sm text-label-sm text-on-surface-variant">Seviye {Math.floor((stardustBalance || 0) / 100) + 1}</p>
                                <span className="font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 rounded-full border border-secondary/20">✨ {stardustBalance || 0}</span>
                            </div>
                        </div>
                    </div>
                    <Link to="/" className="font-headline-lg text-headline-lg text-secondary hover:text-primary transition-colors">Cosmic Connect</Link>
                </div>
                
                {/* Navigation Links */}
                <ul className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 pb-4">
                    {desktopNavItems.map(item => (
                        <li key={item.path}>
                            <NavLink 
                                to={item.path} 
                                end={item.exact}
                                className={({ isActive }) => 
                                    isActive 
                                    ? "flex items-center gap-4 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold opacity-80 hover:pl-2 transition-all duration-300"
                                    : "flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-white/5 hover:pl-6 transition-all duration-300"
                                }
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-label-md text-label-md flex-1">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="bg-error text-on-error font-label-sm px-2 py-0.5 rounded-full">{item.badge}</span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* MOBILE TOP APP BAR (Hidden on Desktop) */}
            <header className="fixed top-0 left-0 w-full z-[100] flex justify-end items-center px-container-margin py-3 backdrop-blur-2xl border-b border-white/10 shadow-[0_0_15px_rgba(147,51,234,0.3)] bg-background/90 md:hidden">
                <div className="flex items-center gap-3 shrink-0">
                    <Link to="/leaderboard" className="flex items-center justify-center p-2 rounded-full text-secondary hover:bg-white/5 border border-transparent hover:border-secondary/30 transition-colors">
                        <span className="material-symbols-outlined text-[24px]">leaderboard</span>
                    </Link>
                    <Link to="/market" className="flex items-center gap-1 bg-surface-container-highest px-2 py-1 rounded-full border border-secondary/30 cursor-pointer hover:bg-white/5 transition-colors">
                        <span className="text-secondary font-label-md">✨ {stardustBalance || 0}</span>
                    </Link>
                    <NotificationBell />
                </div>
            </header>

            {/* MAIN CONTENT CANVAS */}
            <main className="flex-1 flex flex-col relative pb-24 md:pb-0 pt-20 md:pt-0 md:ml-80" ref={mainContentRef}>
                {/* Desktop Header Top Bar */}
                <div className="hidden md:flex justify-between items-center px-8 py-6 w-full max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <h2 className="font-headline-lg text-headline-lg text-on-surface capitalize">
                            {location.pathname === '/' ? 'Panel' : location.pathname.substring(1).replace('-', ' ')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <Link to="/market" className="flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-full border border-secondary/30 shadow-[0_0_15px_rgba(255,198,64,0.15)] cursor-pointer hover:bg-white/5 transition-colors">
                            <span className="material-symbols-outlined text-secondary">stars</span>
                            <span className="text-secondary font-label-md text-label-md font-bold">{stardustBalance || 0} Yıldız Tozu</span>
                            <span className="material-symbols-outlined text-on-surface-variant ml-2 text-sm">add_circle</span>
                        </Link>
                    </div>
                </div>

                <div className="px-container-margin md:px-8 py-4 md:py-0 w-full max-w-7xl mx-auto flex-1">
                    <Outlet />
                </div>
            </main>

            {/* MOBILE BOTTOM NAV BAR */}
            <nav className="fixed bottom-0 left-0 w-full h-[76px] z-[100] flex justify-around items-center px-2 pb-safe pt-2 border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] bg-background md:hidden">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={!!item.exact}
                        className={({ isActive }) => 
                            isActive 
                            ? "flex flex-col items-center justify-center bg-primary-container/20 text-secondary rounded-full px-4 py-1 scale-110 duration-200 relative" 
                            : "flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:text-primary transition-all relative"
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {item.badge !== undefined && item.badge > 0 && !isActive && (
                                    <div className="absolute top-0 right-1 w-2 h-2 bg-error rounded-full"></div>
                                )}
                                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                                <span className="font-label-sm text-label-sm mt-1">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* GAMES FLOATING ACTION BUTTON */}
            {user?.role !== 'FORTUNE_TELLER' && user?.role !== 'ADMIN' && (
                <Link 
                    to="/games" 
                    className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 bg-tertiary-container text-on-tertiary-container w-14 h-14 rounded-full shadow-[0_0_20px_rgba(255,198,64,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border border-tertiary/30"
                    title="Kozmik Oyunlar"
                >
                    <span className="material-symbols-outlined text-3xl drop-shadow-md">casino</span>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-error border border-background"></span>
                    </span>
                </Link>
            )}

            <GlobalGiftBanner />

            {/* PARTY ROOM FLOATING BUBBLE */}
            {activePartyRoom && (
                <FloatingBubble 
                    roomId={activePartyRoom.id} 
                    roomName={activePartyRoom.title} 
                    ownerAvatar={activePartyRoom.ownerAvatar} 
                />
            )}
        </div>
    );
};

export default Layout;
