import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/client';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err: any) {
            // Interceptor handles error
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[420px] flex flex-col gap-element-gap"
            >
                {/* Brand Header */}
                <div className="flex flex-col items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[48px] text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h1 className="font-headline-xl text-headline-xl text-primary text-center tracking-tight">Cosmic Connect</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant text-center mt-2">Yıldızların rehberliğinde bağlanın</p>
                </div>

                {/* Glassmorphism Auth Card */}
                <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-6 text-center">Giriş Yap</h2>
                    
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        {/* Email Field */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="email">E-posta</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">mail</span>
                                <input 
                                    id="email" 
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
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
                                    id="password" 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:shadow-[0_0_10px_rgba(147,51,234,0.2)] outline-none transition-all duration-300 font-body-md text-body-md" 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end mt-[-8px] mb-2">
                            <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:text-secondary transition-colors">Şifremi Unuttum?</Link>
                        </div>

                        {/* Primary Action Button */}
                        <button type="submit" className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-3 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.7)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 mt-2">
                            <span>Giriş Yap</span>
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="h-[1px] bg-white/10 flex-1"></div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">veya</span>
                        <div className="h-[1px] bg-white/10 flex-1"></div>
                    </div>

                    {/* Secondary Action Button (Signup) */}
                    <Link to="/register" className="w-full border border-secondary text-secondary font-label-md text-label-md py-3 rounded-lg hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(255,198,64,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-center block">
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        <span>Kayıt Ol</span>
                    </Link>
                </div>

                {/* Decorative Floating Element */}
                <div className="absolute -z-10 top-[-20%] left-[-20%] w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -z-10 bottom-[-20%] right-[-20%] w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
            </motion.main>
        </div>
    );
};

export default Login;
