import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { motion } from 'framer-motion';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    // Removed unused useToast

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
        } catch (err: any) {
            // Error managed by global interceptor, but we can also trigger a toast explicitly if we want, or rely on interceptor.
            // Since the interceptor handles it, we don't need to do anything here except maybe stop loading state.
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="glass-panel p-6 w-full max-w-sm"
            >
                <h1 className="glow-text text-center text-3xl mb-8 font-bold" style={{ color: 'var(--text-primary)' }}>Cosmic <span style={{ color: 'var(--accent-purple)' }}>Connect</span></h1>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="E-posta"
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="input-field" required
                    />
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Şifre"
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="input-field" required
                    />
                    <button type="submit" className="primary-btn mt-2">Giriş Yap</button>
                </form>
                <p className="text-center mt-3 text-sm">
                    <Link to="/forgot-password" className="text-accent underline">Şifremi Unuttum</Link>
                </p>
                <p className="text-center mt-2 text-sm text-secondary">
                    Kozmik yolculuğuna başlamadın mı? <Link to="/register" className="text-accent underline">Kayıt Ol</Link>
                </p>
            </motion.div>
        </div>
    );
};
export default Login;
