import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/client';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', name: '', birthDate: '', birthTime: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                birthDate: formData.birthDate,
                birthTime: formData.birthTime,
            };

            const res = await api.post('/auth/register', payload);
            login(res.data.token, res.data.user, '/onboarding');
        } catch (err: any) {
            // Error managed by global interceptor
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
            
            {/* Main Container */}
            <motion.main 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[420px] flex flex-col gap-element-gap my-8"
            >
                {/* Brand Header */}
                <div className="flex flex-col items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[48px] text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h1 className="font-headline-xl text-headline-xl text-primary text-center tracking-tight">Cosmic Connect</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant text-center mt-2">Yıldızlara Katıl</p>
                </div>

                {/* Glassmorphism Auth Card */}
                <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-6 text-center">Kayıt Ol</h2>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Name Field */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="name">Ad Soyad</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">person</span>
                                <input 
                                    id="name" type="text"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ad Soyad" 
                                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.2)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="email">E-posta</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">mail</span>
                                <input 
                                    id="email" type="email"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="yildiz.tozu@evren.com" 
                                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.2)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="password">Şifre</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">lock</span>
                                <input 
                                    id="password" type={showPassword ? "text" : "password"}
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="En az 8 karakter" 
                                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.2)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Birth Date Field */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="birthDate">Doğum Tarihi</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">calendar_month</span>
                                <input 
                                    id="birthDate" type="date"
                                    value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.2)] outline-none transition-all duration-300 font-body-md text-body-md [&::-webkit-calendar-picker-indicator]:invert" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Birth Time Field */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="birthTime">Doğum Saati</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">schedule</span>
                                <input 
                                    id="birthTime" type="time"
                                    value={formData.birthTime} onChange={e => setFormData({ ...formData, birthTime: e.target.value })}
                                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.2)] outline-none transition-all duration-300 font-body-md text-body-md [&::-webkit-calendar-picker-indicator]:invert" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <button type="submit" disabled={loading} className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-3 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.7)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 mt-4">
                            <span>{loading ? 'Yıldızlar hesaplanıyor...' : 'Evrene Katıl'}</span>
                            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="h-[1px] bg-white/10 flex-1"></div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">veya</span>
                        <div className="h-[1px] bg-white/10 flex-1"></div>
                    </div>

                    {/* Secondary Action Button (Login) */}
                    <Link to="/login" className="w-full border border-secondary text-secondary font-label-md text-label-md py-3 rounded-lg hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(255,198,64,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-center block">
                        <span className="material-symbols-outlined text-[20px]">login</span>
                        <span>Giriş Yap</span>
                    </Link>
                </div>

                {/* Decorative Floating Element */}
                <div className="absolute -z-10 top-[-20%] left-[-20%] w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -z-10 bottom-[-20%] right-[-20%] w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
            </motion.main>
        </div>
    );
};

export default Register;
