import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { motion } from 'framer-motion';
import './Auth.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Şifreler eşleşmiyor!');
            return;
        }

        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setError('Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setSuccess(true);
        } catch (err: any) {
            // Global interceptor handles errors
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-panel p-6 w-full max-w-sm text-center"
                >
                    <p className="text-lg mb-4" style={{ color: '#ff6b6b' }}>❌ Geçersiz bağlantı</p>
                    <p className="text-sm text-secondary mb-4">Şifre sıfırlama bağlantısı eksik veya bozuk.</p>
                    <Link to="/forgot-password" className="text-accent underline">Yeni bir bağlantı iste</Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="glass-panel p-6 w-full max-w-sm"
            >
                <h1 className="glow-text text-center text-2xl mb-6 font-bold">Yeni <span style={{ color: 'var(--accent-purple)' }}>Şifre</span></h1>

                {success ? (
                    <div className="text-center">
                        <p className="text-lg mb-4" style={{ color: 'var(--accent-green, #00e676)' }}>✅ Şifreniz başarıyla değiştirildi!</p>
                        <Link to="/login" className="primary-btn" style={{ display: 'inline-block', padding: '10px 24px', textDecoration: 'none' }}>Giriş Yap</Link>
                    </div>
                ) : (
                    <>
                        {error && <p className="text-sm mb-3 text-center" style={{ color: '#ff6b6b' }}>{error}</p>}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input
                                type="password"
                                placeholder="Yeni şifre"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="input-field"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Yeni şifre (tekrar)"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="input-field"
                                required
                            />
                            <button type="submit" className="primary-btn mt-2" disabled={loading}>
                                {loading ? 'Kaydediliyor...' : 'Şifremi Değiştir'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
