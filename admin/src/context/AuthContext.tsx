import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('adminToken');
        const storedUser = localStorage.getItem('adminUser');

        if (storedToken && storedUser) {
            try {
                const decoded = jwtDecode(storedToken) as any;
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } else {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                }
            } catch (error) {
                console.error('Invalid token');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('adminToken', newToken);
        localStorage.setItem('adminUser', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    };

    if (loading) {
        return <div className="min-h-screen bg-[#13111C] flex items-center justify-center text-white">Loading Auth...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
