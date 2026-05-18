import { Loader, Camera, Check, X, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { BACKEND_URL } from '../../api/client';

interface ProfileHeaderProps {
    isOwner: boolean;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    profile: any;
    name: string; setName: (val: string) => void;
    bio: string; setBio: (val: string) => void;
    hobby: string; setHobby: (val: string) => void;
    music: string; setMusic: (val: string) => void;
    weekend: string; setWeekend: (val: string) => void;
    moonSign: string; setMoonSign: (val: string) => void;
    risingSign: string; setRisingSign: (val: string) => void;
    handleSave: () => void;
    saving: boolean;
    uploadingAvatar: boolean;
    handleAvatarUpload: (e: any) => void;
}

export const ProfileHeader = ({
    isOwner, isEditing, setIsEditing, profile,
    name, setName, bio, setBio, hobby, setHobby,
    music, setMusic, weekend, setWeekend,
    moonSign, setMoonSign, risingSign, setRisingSign,
    handleSave, saving, uploadingAvatar, handleAvatarUpload
}: ProfileHeaderProps) => {
    return (
        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass-panel" style={{ padding: 32, textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--accent-purple)' }}>
                    {uploadingAvatar ? (
                        <Loader className="animate-spin text-accent" size={32} />
                    ) : (
                        <img src={profile.profile.avatar ? `${BACKEND_URL}${profile.profile.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Kozmik')}&background=random&size=120`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                </div>
                {isOwner && (
                    <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-pink)', padding: 8, borderRadius: '50%', cursor: 'pointer', border: '2px solid #1a1a1a', display: 'flex' }}>
                        <Camera size={16} color="white" />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploadingAvatar} />
                    </label>
                )}
            </div>

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="İsim"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none' }}
                    />
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Kozmik enerjini anlat..."
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none', resize: 'none', height: 60 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                            type="text"
                            value={hobby}
                            onChange={e => setHobby(e.target.value)}
                            placeholder="İlgi alanların (örn: Doğa yürüyüşü, Resim)"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none' }}
                        />
                        <input
                            type="text"
                            value={music}
                            onChange={e => setMusic(e.target.value)}
                            placeholder="Favori Müzik Türün (örn: Rock, Pop, Klasik)"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none' }}
                        />
                        <input
                            type="text"
                            value={weekend}
                            onChange={e => setWeekend(e.target.value)}
                            placeholder="Hafta Sonu Rutinin"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none' }}
                        />
                        <select
                            value={moonSign}
                            onChange={e => setMoonSign(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none', appearance: 'none' }}
                        >
                            <option value="" disabled>Ay Burcunu Seç (Duygular)</option>
                            <option value="Aries">Koç</option><option value="Taurus">Boğa</option><option value="Gemini">İkizler</option><option value="Cancer">Yengeç</option><option value="Leo">Aslan</option><option value="Virgo">Başak</option><option value="Libra">Terazi</option><option value="Scorpio">Akrep</option><option value="Sagittarius">Yay</option><option value="Capricorn">Oğlak</option><option value="Aquarius">Kova</option><option value="Pisces">Balık</option>
                        </select>
                        <select
                            value={risingSign}
                            onChange={e => setRisingSign(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '8px 12px', borderRadius: 8, outline: 'none', appearance: 'none' }}
                        >
                            <option value="" disabled>Yükselen Burcunu Seç (Dış Görünüş)</option>
                            <option value="Aries">Koç</option><option value="Taurus">Boğa</option><option value="Gemini">İkizler</option><option value="Cancer">Yengeç</option><option value="Leo">Aslan</option><option value="Virgo">Başak</option><option value="Libra">Terazi</option><option value="Scorpio">Akrep</option><option value="Sagittarius">Yay</option><option value="Capricorn">Oğlak</option><option value="Aquarius">Kova</option><option value="Pisces">Balık</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                        <button onClick={() => setIsEditing(false)} style={{ padding: '6px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={16} /> İptal
                        </button>
                        <button onClick={handleSave} disabled={saving} style={{ padding: '6px 16px', borderRadius: 16, background: 'var(--accent-purple)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {saving ? <Loader size={16} className="animate-spin" /> : <Check size={16} />} Kaydet
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <h2 style={{ marginBottom: 4, fontSize: 24, textTransform: 'capitalize', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {profile.profile.name || profile.profile.email?.split('@')[0] || 'Kozmik Yolcu'}
                        {profile.profile.isPremium && <Crown size={20} color="var(--accent-gold)" />}
                    </h2>
                    {profile.profile.bio && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, padding: '0 16px', fontStyle: 'italic' }}>"{profile.profile.bio}"</p>
                    )}
                    {(profile.profile.moonSign || profile.profile.risingSign) && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                            {profile.profile.moonSign && <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 12 }}>🌙 Ay: {profile.profile.moonSign}</div>}
                            {profile.profile.risingSign && <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 12 }}>✨ Yükselen: {profile.profile.risingSign}</div>}
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};
