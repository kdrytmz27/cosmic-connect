import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { motion } from 'framer-motion';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', name: '', birthDate: '', birthTime: '', birthCity: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

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
            // Şehir ismini enlem/boylam koordinatına çevir
            const coords = await geocodeCity(formData.birthCity);
            if (!coords) {
                alert('Doğum yeri bulunamadı. Lütfen geçerli bir şehir adı girin (Örn: Istanbul).');
                setLoading(false);
                return;
            }

            const payload = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                birthDate: formData.birthDate,
                birthTime: formData.birthTime,
                latitude: coords.lat,
                longitude: coords.lon,
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
        <div className="auth-container p-5">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-panel p-6 w-full max-w-sm overflow-auto scrollbar-hide"
                style={{ maxHeight: '90vh' }}
            >
                <h1 className="glow-text text-center text-3xl mb-8 font-bold">Yıldızlara <span style={{ color: 'var(--accent-pink)' }}>Katıl</span></h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input type="text" id="name" name="name" placeholder="Ad Soyad" onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                    <input type="email" id="email" name="email" placeholder="E-posta" onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-field" required />
                    <input type="password" id="password" name="password" placeholder="Şifre (En az 8 karakter, 1 büyük harf, 1 rakam)" onChange={e => setFormData({ ...formData, password: e.target.value })} className="input-field" required />
                    <input type="date" id="birthDate" name="birthDate" onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="input-field" required />
                    <input type="time" id="birthTime" name="birthTime" onChange={e => setFormData({ ...formData, birthTime: e.target.value })} className="input-field" required />
                    <input type="text" id="birthCity" name="birthCity" placeholder="Doğum Yeri (Örn: Istanbul)" onChange={e => setFormData({ ...formData, birthCity: e.target.value })} className="input-field" required />
                    <button type="submit" className="primary-btn mt-4" disabled={loading}>
                        {loading ? 'Yıldızlar hesaplanıyor...' : 'Evrene Katıl'}
                    </button>
                </form>
                <p className="text-center mt-4 text-sm text-secondary">
                    Zaten yolcu musun? <Link to="/login" className="text-accent underline">Giriş Yap</Link>
                </p>
            </motion.div>
        </div>
    );
};
export default Register;
