import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const Onboarding = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    // User Details
    const [birthLocation, setBirthLocation] = useState('');

    // Step 2: Traits & Preferences
    const [hobby, setHobby] = useState('');
    const [music, setMusic] = useState('');
    const [weekend, setWeekend] = useState('');
    const [lookingForHobby, setLookingForHobby] = useState('');
    const [lookingForMusic, setLookingForMusic] = useState('');
    const [lookingForWeekend, setLookingForWeekend] = useState('');

    // Background stars logic
    useEffect(() => {
        const canvas = document.getElementById('star-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let width = 0, height = 0, stars: any[] = [];
        let animationFrameId: number;

        function init() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            stars = [];
            for (let i = 0; i < 150; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.5,
                    alpha: Math.random(),
                    speed: Math.random() * 0.05
                });
            }
        }

        function animate() {
            ctx!.clearRect(0, 0, width, height);
            
            stars.forEach(star => {
                star.alpha += star.speed;
                if (star.alpha > 1 || star.alpha < 0) {
                    star.speed = -star.speed;
                }
                
                ctx!.beginPath();
                ctx!.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(255, 255, 255, ${star.alpha * 0.5})`;
                ctx!.fill();
                
                star.y -= 0.1;
                if (star.y < 0) star.y = height;
            });
            
            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', init);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', init);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const geocodeCity = async (city: string): Promise<{ lat: number; lon: number } | null> => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
            return null;
        } catch {
            return null;
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let lat, lon;
            if (birthLocation) {
                const coords = await geocodeCity(birthLocation);
                if (coords) {
                    lat = coords.lat;
                    lon = coords.lon;
                }
            }

            await api.put('/user/profile', {
                latitude: lat,
                longitude: lon,
                hobby, 
                music, 
                weekend,
                lookingForHobby, 
                lookingForMusic, 
                lookingForWeekend
            });
            navigate('/');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background text-on-background min-h-screen relative overflow-hidden flex items-center justify-center font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container w-full">
            {/* Animated Background Layer */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center opacity-60 mix-blend-screen"
                style={{ 
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC-UL9FsD3FNFg2KemPCZg1OmRzmpSeLhOM41tfxR2z4XLh6dXXAv-MBEcvrwmBrsbe30vXocaSwfgsiKm9dXGK0ixwwHWuJnsIOw95tM4q_ThB3EJiFllrdGB5QE2Ao1WDSfwZGS2wPXgjb5UGJ_swJhAKRHIye6286lRfnJf1h5Mzjm2xvAR-0ri0nvIpBd-L9WQEHuLXfgbW3M9yoI_Ok5tdqlKpmehVkhZ-FPgxpSgp2-V_A34Guw')",
                    animation: "pan-space 120s linear infinite",
                    backgroundSize: "200% 200%"
                }}
            ></div>
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
            
            {/* Floating Particles/Stars Effect */}
            <canvas className="absolute inset-0 z-0 opacity-50 pointer-events-none" id="star-canvas"></canvas>

            {/* Main Content Container */}
            <main className="relative z-10 w-full max-w-xl mx-auto p-container-margin md:p-8 flex flex-col items-center">
                <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-8 relative overflow-hidden">
                    {/* Subtle internal glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary-container rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                    
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-6 w-full"
                        >
                            {/* Header & Progress */}
                            <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-full mb-2">
                                    <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>explore</span>
                                </div>
                                
                                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                                    Özellikleriniz
                                </h1>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Senin ve aradığın ruh eşinin ilgi alanlarını belirle.
                                </p>
                            </div>
                            
                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="birth-location">Doğum Yerin (Şehir)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-secondary transition-colors">
                                            <span className="material-symbols-outlined text-xl">location_on</span>
                                        </div>
                                        <input 
                                            autoComplete="off" 
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-on-surface-variant/50" 
                                            id="birth-location" 
                                            placeholder="Örn: Istanbul" 
                                            type="text"
                                            value={birthLocation}
                                            onChange={e => setBirthLocation(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-primary font-label-md flex items-center gap-2"><span className="material-symbols-outlined">person</span> Senin Özelliklerin</h3>
                                        
                                        <select 
                                            value={hobby} onChange={e => setHobby(e.target.value)} required
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                                        >
                                            <option value="" disabled className="bg-surface">Bir hobi seç...</option>
                                            <option value="Spor" className="bg-surface">Spor</option>
                                            <option value="Sanat" className="bg-surface">Sanat</option>
                                            <option value="Oyun" className="bg-surface">Oyun</option>
                                            <option value="Seyahat" className="bg-surface">Seyahat</option>
                                        </select>
                                        
                                        <select 
                                            value={music} onChange={e => setMusic(e.target.value)} required
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                                        >
                                            <option value="" disabled className="bg-surface">Müzik tarzın...</option>
                                            <option value="Pop" className="bg-surface">Pop</option>
                                            <option value="Rock" className="bg-surface">Rock</option>
                                            <option value="Klasik" className="bg-surface">Klasik</option>
                                            <option value="Rap" className="bg-surface">Rap</option>
                                        </select>

                                        <select 
                                            value={weekend} onChange={e => setWeekend(e.target.value)} required
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                                        >
                                            <option value="" disabled className="bg-surface">Hafta sonu planın...</option>
                                            <option value="Evde Dizi" className="bg-surface">Evde Dizi</option>
                                            <option value="Dışarıda Eğlence" className="bg-surface">Dışarıda Eğlence</option>
                                            <option value="Doğa Yürüyüşü" className="bg-surface">Doğa Yürüyüşü</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-secondary font-label-md flex items-center gap-2"><span className="material-symbols-outlined">search</span> Aradığın Kişi</h3>
                                        
                                        <select 
                                            value={lookingForHobby} onChange={e => setLookingForHobby(e.target.value)} required
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none"
                                        >
                                            <option value="" disabled className="bg-surface">Onun hobisi...</option>
                                            <option value="Spor" className="bg-surface">Spor</option>
                                            <option value="Sanat" className="bg-surface">Sanat</option>
                                            <option value="Oyun" className="bg-surface">Oyun</option>
                                            <option value="Seyahat" className="bg-surface">Seyahat</option>
                                        </select>
                                        
                                        <select 
                                            value={lookingForMusic} onChange={e => setLookingForMusic(e.target.value)} required
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none"
                                        >
                                            <option value="" disabled className="bg-surface">Onun müziği...</option>
                                            <option value="Pop" className="bg-surface">Pop</option>
                                            <option value="Rock" className="bg-surface">Rock</option>
                                            <option value="Klasik" className="bg-surface">Klasik</option>
                                            <option value="Rap" className="bg-surface">Rap</option>
                                        </select>

                                        <select 
                                            value={lookingForWeekend} onChange={e => setLookingForWeekend(e.target.value)} required
                                            className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none"
                                        >
                                            <option value="" disabled className="bg-surface">Onun hafta sonu planı...</option>
                                            <option value="Evde Dizi" className="bg-surface">Evde Dizi</option>
                                            <option value="Dışarıda Eğlence" className="bg-surface">Dışarıda Eğlence</option>
                                            <option value="Doğa Yürüyüşü" className="bg-surface">Doğa Yürüyüşü</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <button 
                                    className="w-full bg-primary-container text-on-primary-container py-4 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-inverse-primary transition-all duration-300 shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed mt-4" 
                                    type="submit"
                                    disabled={loading || !birthLocation || !hobby || !music || !weekend || !lookingForHobby || !lookingForMusic || !lookingForWeekend}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    )}
                                    {loading ? 'Hesaplanıyor...' : 'Evrene Katıl'}
                                </button>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                    
                    {/* Subtle disclaimer */}
                    <p className="text-center font-label-sm text-label-sm text-on-surface-variant/60 mt-2 relative z-10">
                        Bilgileriniz tamamen gizli tutulur ve sadece gökyüzü haritanızı hesaplamak için kullanılır.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Onboarding;
