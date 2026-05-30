import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { motion } from 'framer-motion';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err: any) {
            // Global interceptor handles errors
        } finally {
            setLoading(false);
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
                <h1 className="glow-text text-center text-2xl mb-6 font-bold">Şifremi <span style={{ color: 'var(--accent-pink)' }}>Unuttum</span></h1>

                {sent ? (
                    <div className="text-center">
                        <p className="text-lg mb-4" style={{ color: 'var(--accent-green, #00e676)' }}>✅ E-posta gönderildi!</p>
                        <p className="text-sm text-secondary mb-6">Eğer bu adresle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.</p>
                        <Link to="/login" className="primary-btn" style={{ display: 'inline-block', padding: '10px 24px', textDecoration: 'none' }}>Giriş Sayfasına Dön</Link>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-secondary mb-4 text-center">Kayıt olduğunuz e-posta adresini girin. Size şifre sıfırlama bağlantısı göndereceğiz.</p>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input
                                type="email"
                                id="forgot-email"
                                name="email"
                                placeholder="E-posta adresiniz"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-field"
                                required
                            />
                            <button type="submit" className="primary-btn mt-2" disabled={loading}>
                                {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                            </button>
                        </form>
                        <p className="text-center mt-4 text-sm text-secondary">
                            Şifreni hatırladın mı? <Link to="/login" className="text-accent underline">Giriş Yap</Link>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
