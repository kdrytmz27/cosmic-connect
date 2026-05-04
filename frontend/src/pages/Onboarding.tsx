import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader, ArrowRight } from 'lucide-react';
import api from '../api/client';

const HOBBIES = ['Spor/Fitness', 'Oyun & Espor', 'Müzik/Dizi/Film', 'Doğa/Kamp', 'Sanat/Tasarım', 'Kitap/Edebiyat', 'Seyahat', 'Moda/Alışveriş'];
const MUSIC = ['Pop', 'Rock/Metal', 'R&B/Hiphop', 'Elektronik/Techno', 'Klasik/Jazz', 'Arabesk/Fantezi', 'Indie/Alternatif', 'Karışık'];
const WEEKEND = ['Evde Dizi/Film', 'Dışarıda Eğlence/Kulüp', 'Doğa Yürüyüşü', 'Arkadaşlarla Kafe', 'Sadece Uyumak', 'Hobi/Kurs Gömmek'];

const Onboarding = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Personal traits
    const [hobby, setHobby] = useState('');
    const [music, setMusic] = useState('');
    const [weekend, setWeekend] = useState('');

    // Desired traits
    const [lookingForHobby, setLookingForHobby] = useState('');
    const [lookingForMusic, setLookingForMusic] = useState('');
    const [lookingForWeekend, setLookingForWeekend] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/profile', {
                hobby, music, weekend,
                lookingForHobby, lookingForMusic, lookingForWeekend
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const renderSelect = (label: string, value: string, setter: any, options: string[]) => (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</label>
            <select value={value} onChange={e => setter(e.target.value)} required style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: 12, color: 'white', outline: 'none', appearance: 'none' }}>
                <option value="" disabled>Seçimini yap...</option>
                {options.map(o => <option key={o} value={o} style={{ background: '#1c1c24' }}>{o}</option>)}
            </select>
        </div>
    );

    return (
        <div style={{ padding: 24, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: 32, marginTop: 20 }}>
                <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 16px' }} />
                <h1 className="glow-text" style={{ fontSize: 28, marginBottom: 8 }}>Kozmik Profilin</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Eşleşme oranını artırmak için birkaç soru...</p>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--accent-pink)', borderBottom: '1px solid rgba(236, 72, 153, 0.2)', paddingBottom: 8 }}>🔮 Senin Özelliklerin</h2>
                    {renderSelect('Favori Hobin / İlgi Alanın', hobby, setHobby, HOBBIES)}
                    {renderSelect('Müzik Zevkin', music, setMusic, MUSIC)}
                    {renderSelect('Tipik Hafta Sonu Rutinin', weekend, setWeekend, WEEKEND)}
                </div>

                <div className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--accent-purple)', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: 8 }}>✨ Aradığın Ruh Eşi Özellikleri</h2>
                    {renderSelect('Onda Olmasını İstediğin Hobi', lookingForHobby, setLookingForHobby, HOBBIES)}
                    {renderSelect('Onun Müzik Zevki Nasıl Olmalı?', lookingForMusic, setLookingForMusic, MUSIC)}
                    {renderSelect('Onun Hafta Sonu Rutini', lookingForWeekend, setLookingForWeekend, WEEKEND)}
                </div>

                <button
                    type="submit"
                    disabled={loading || !hobby || !music || !weekend || !lookingForHobby || !lookingForMusic || !lookingForWeekend}
                    style={{ width: '100%', padding: 16, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))', color: 'white', border: 'none', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 'auto', marginBottom: 40, boxShadow: '0 4px 15px rgba(236,72,153,0.3)' }}
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : <>Kozmik Yolculuğa Başla <ArrowRight size={20} /></>}
                </button>
            </form>
        </div>
    );
};

export default Onboarding;
