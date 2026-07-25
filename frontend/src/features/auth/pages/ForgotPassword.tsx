import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import { motion } from 'framer-motion';

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
        <div className="bg-background text-on-background relative min-h-screen flex items-center justify-center p-container-margin overflow-hidden font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container w-full">
            {/* Cinematic Deep Space Background */}
            <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCB-7XzGX5qJxZRCPi26VCzeI-RK-AaeyyTuDzcLoerqpS525HBTYtUEfK9nDfvxhiH2IavviWjtHBaFvdQKEPS17MhEB63YR139K_Hg7JLSFXed2djOjHRjs0YRrNJLRjPN68zqNkgroqADhEuO_9ajBm_lJjxQijkhjwV2Mui8juLAIPw-o5GieRyp9ta6fPL8N7zlIIzM1y4vkrt8jZyQpz6GMeeynk_bs_kFCGECfxOsLH_Q42_hQ')" }}></div>
            <div className="absolute inset-0 z-0 bg-background/70 backdrop-blur-md"></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-background/90"></div>

            <motion.main 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-element-gap"
            >
                <Link to="/login" className="absolute -top-16 left-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-on-surface-variant hover:text-primary transition-colors z-20 group">
                    <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                </Link>

                <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-[24px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center relative overflow-hidden w-full">
                    {/* Decorative Accent */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full blur-[60px] opacity-30 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary rounded-full blur-[60px] opacity-20 pointer-events-none"></div>

                    {/* Brand Icon */}
                    <div className="mb-6 w-16 h-16 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] relative z-10">
                        <span className="material-symbols-outlined text-4xl text-primary drop-shadow-[0_0_10px_rgba(221,184,255,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(221,184,255,0.5)]">
                            Şifremi Unuttum
                        </h1>
                        <p className="font-body-md text-body-md text-on-surface-variant opacity-80 mt-2">
                            {sent ? "Bağlantı gönderildi!" : "Kozmik bağlantınızı yeniden kurmak için e-posta adresinizi girin."}
                        </p>
                    </div>

                    {sent ? (
                        <div className="text-center relative z-10 flex flex-col gap-6 w-full">
                            <div className="flex flex-col items-center justify-center py-4">
                                <span className="material-symbols-outlined text-6xl text-tertiary-fixed mb-2 drop-shadow-[0_0_15px_rgba(60,221,199,0.4)]">check_circle</span>
                                <p className="text-on-surface-variant">
                                    Eğer bu adresle kayıtlı bir hesap varsa, gelen kutunuzda bir sıfırlama bağlantısı bulacaksınız.
                                </p>
                            </div>
                            <Link to="/login" className="w-full bg-surface-container-high border border-white/10 text-on-surface font-label-md text-label-md py-4 rounded-xl hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2">
                                <span>Giriş Sayfasına Dön</span>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 relative z-10">
                            {/* Email Input */}
                            <div className="flex flex-col gap-2">
                                <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 ml-1" htmlFor="email">
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                    E-posta Adresi
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">alternate_email</span>
                                    <input 
                                        id="email" 
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="yildiztozu@evren.com" 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 px-4 pl-11 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.3)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" disabled={loading} className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 mt-2">
                                <span>{loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}</span>
                                <span className="material-symbols-outlined text-lg">{loading ? 'sync' : 'send'}</span>
                            </button>
                        </form>
                    )}

                    {!sent && (
                        <div className="mt-8 text-center relative z-10">
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Hatırladınız mı? 
                                <Link to="/login" className="text-primary hover:text-secondary transition-colors font-label-md text-label-md ml-1 border-b border-transparent hover:border-secondary">
                                    Giriş Yap
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </motion.main>
        </div>
    );
};

export default ForgotPassword;
