import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../../api/client';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                    <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-[24px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center relative overflow-hidden w-full text-center">
                        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
                        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight">Geçersiz Bağlantı</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant opacity-80 mb-6">
                            Şifre sıfırlama bağlantısı eksik, bozuk veya süresi dolmuş olabilir.
                        </p>
                        <Link to="/forgot-password" className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.7)] transition-all duration-300 flex items-center justify-center gap-2">
                            Yeni Bağlantı İste
                        </Link>
                    </div>
                </motion.main>
            </div>
        );
    }

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
                <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-[24px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center relative overflow-hidden w-full">
                    {/* Decorative Accent */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full blur-[60px] opacity-30 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary rounded-full blur-[60px] opacity-20 pointer-events-none"></div>

                    {/* Brand Icon */}
                    <div className="mb-6 w-16 h-16 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] relative z-10">
                        <span className="material-symbols-outlined text-4xl text-primary drop-shadow-[0_0_10px_rgba(221,184,255,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(221,184,255,0.5)]">
                            Yeni Şifre
                        </h1>
                        <p className="font-body-md text-body-md text-on-surface-variant opacity-80 mt-2">
                            {success ? "Harika! Yeni şifreniz oluşturuldu." : "Lütfen yeni, güçlü ve güvenli şifrenizi belirleyin."}
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center relative z-10 flex flex-col gap-6 w-full">
                            <div className="flex flex-col items-center justify-center py-4">
                                <span className="material-symbols-outlined text-6xl text-tertiary-fixed mb-2 drop-shadow-[0_0_15px_rgba(60,221,199,0.4)]">check_circle</span>
                            </div>
                            <Link to="/login" className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.7)] transition-all duration-300 flex items-center justify-center gap-2">
                                <span>Giriş Yap</span>
                                <span className="material-symbols-outlined text-lg">login</span>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 relative z-10">
                            {error && (
                                <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-center">
                                    <p className="text-error text-sm">{error}</p>
                                </div>
                            )}

                            {/* New Password Input */}
                            <div className="flex flex-col gap-2">
                                <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 ml-1" htmlFor="newPassword">
                                    Yeni Şifre
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">lock</span>
                                    <input 
                                        id="newPassword" 
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 px-4 pl-11 pr-10 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.3)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                        required 
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="flex flex-col gap-2">
                                <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 ml-1" htmlFor="confirmPassword">
                                    Yeni Şifre (Tekrar)
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">lock_reset</span>
                                    <input 
                                        id="confirmPassword" 
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 px-4 pl-11 pr-10 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.3)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                        required 
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" disabled={loading} className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 mt-2">
                                <span>{loading ? 'Kaydediliyor...' : 'Şifremi Değiştir'}</span>
                                <span className="material-symbols-outlined text-lg">{loading ? 'sync' : 'save'}</span>
                            </button>
                        </form>
                    )}
                </div>
            </motion.main>
        </div>
    );
};

export default ResetPassword;
