import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Purchases } from '@revenuecat/purchases-capacitor';

interface EconomyUpdate {
    stardustBalance?: number;
    isPremium?: boolean;
    dailySwipes?: number;
    avatar?: string;
}

interface AuthContextType {
    token: string | null;
    userId: string | null;
    user: any | null;
    stardustBalance: number;
    isPremium: boolean;
    dailySwipes: number;
    avatar: string | null;
    login: (newToken: string, userData?: any, redirectUrl?: string) => void;
    logout: () => void;
    updateEconomy: (updates: EconomyUpdate) => void;
    refreshUser: () => Promise<void>;
}

import api from '../api/client';

const AuthContext = createContext<AuthContextType>({
    token: null,
    userId: null,
    user: null,
    stardustBalance: 0,
    isPremium: false,
    dailySwipes: 0,
    avatar: null,
    login: () => { },
    logout: () => { },
    updateEconomy: () => { },
    refreshUser: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(JSON.parse(localStorage.getItem('user') || 'null'));
    const [stardustBalance, setStardustBalance] = useState<number>(0);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [dailySwipes, setDailySwipes] = useState<number>(0);
    const [avatar, setAvatar] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUserId(decoded.userId);
                Purchases.logIn({ appUserID: decoded.userId }).catch(e => console.error("RC LogIn Error:", e));
            } catch (e) {
                logout();
            }
        } else {
            Purchases.logOut().catch(e => console.error("RC LogOut Error:", e));
        }
    }, [token]);

    useEffect(() => {
        const handleUnauthorized = () => {
            logout();
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const updateEconomy = (updates: EconomyUpdate) => {
        if (updates.stardustBalance !== undefined) setStardustBalance(updates.stardustBalance);
        if (updates.isPremium !== undefined) setIsPremium(updates.isPremium);
        if (updates.dailySwipes !== undefined) setDailySwipes(updates.dailySwipes);
        if (updates.avatar !== undefined) setAvatar(updates.avatar);
    };

    const login = (newToken: string, userData: any = null, redirectUrl = '/') => {
        localStorage.setItem('token', newToken);
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }
        setToken(newToken);
        navigate(redirectUrl);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUserId(null);
        setUser(null);
        setStardustBalance(0);
        setIsPremium(false);
        setDailySwipes(0);
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/user/profile/me');
            const userData = res.data.profile;
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (e) {
            console.error('Failed to refresh user:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ token, userId, user, stardustBalance, isPremium, dailySwipes, avatar, login, logout, updateEconomy, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
