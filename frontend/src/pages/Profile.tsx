import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, ArrowLeft, Sparkles, LogOut, Crown, Diamond } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Income } from './Income';
import { BrandLoader } from '../components/BrandLoader';
import { translateZodiac } from '../utils/zodiac';

// Component Imports
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileGamification } from '../components/profile/ProfileGamification';
import { ProfileHoroscope } from '../components/profile/ProfileHoroscope';
import { ProfileGallery } from '../components/profile/ProfileGallery';
import { ProfileActions } from '../components/profile/ProfileActions';
import { premiumApi } from '../api/premium';
import { NatalChart } from '../components/NatalChart';

const COSMIC_STATUSES = [
    { id: '1', emoji: '🌕', text: 'Dolunay Enerjisi' },
    { id: '2', emoji: '☿', text: 'Merkür Retrosu' },
    { id: '3', emoji: '✨', text: 'Flow Halindeyim' },
    { id: '4', emoji: '🔮', text: 'Keşif Modu' },
    { id: '5', emoji: '🌊', text: 'Duygusal' },
    { id: '6', emoji: '🔥', text: 'Motivasyon Dolu' },
];

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, logout, updateEconomy, user, stardustBalance } = useAuth();
    const { showToast } = useToast();
    const targetId = id || userId;
    const isOwner = !id || id === userId;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showIncome, setShowIncome] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [hobby, setHobby] = useState('');
    const [music, setMusic] = useState('');
    const [weekend, setWeekend] = useState('');
    const [cosmicStatus, setCosmicStatus] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [friendStatus, setFriendStatus] = useState<any>(null);
    const [friendReqRemaining, setFriendReqRemaining] = useState<number>(0);

    useEffect(() => {
        if (targetId) {
            setLoading(true);
            api.get(`/user/profile/${targetId}`).then(res => {
                setProfile(res.data);
                setName(res.data.profile.name || res.data.profile.email?.split('@')[0] || 'Kozmik Yolcu');
                setBio(res.data.profile.bio || '');
                setHobby(res.data.profile.hobby || '');
                setMusic(res.data.profile.music || '');
                setWeekend(res.data.profile.weekend || '');
                setCosmicStatus(res.data.profile.cosmicStatus || null);
            }).catch(console.error)
            .finally(() => setLoading(false));

            if (!isOwner) {
                api.get(`/user/friend-request-status/${targetId}`).then(res => {
                    setFriendStatus(res.data.status);
                    setFriendReqRemaining(res.data.remaining);
                }).catch(console.error);
            }
        }
    }, [targetId, isOwner]);

    const handleSendLike = async () => {
        setSaving(true);
        try {
            const res = await api.post('/user/friend', { receiverId: targetId });
            setFriendStatus(res.data.matched ? 'MATCH' : 'sent');
            showToast(res.data.matched ? 'Eşleşme oluştu! 💛' : 'Beğeni gönderildi 💫', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Beğeni gönderilemedi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSuperLike = async () => {
        if (!targetId) return;
        setSaving(true);
        try {
            await premiumApi.superLike(targetId);
            showToast('Süper Beğeni başarıyla gönderildi! 🌟', 'success');
        } catch (err) { }
        finally { setSaving(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/user/profile', { name, bio, hobby, music, weekend });
            setProfile({ ...profile, profile: res.data.profile });
            showToast('Profil başarıyla güncellendi.', 'success');
            setIsEditing(false);
        } catch (err) {
            showToast('Profil güncellenirken hata oluştu.', 'error');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (status: string) => {
        const newStatus = status === cosmicStatus ? null : status;
        setCosmicStatus(newStatus);
        setProfile({ ...profile, profile: { ...profile.profile, cosmicStatus: newStatus } });
        try {
            await api.put('/user/status', { cosmicStatus: newStatus });
        } catch (err) {
            showToast('Durum güncellenemedi', 'error');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('image', e.target.files[0]);

        try {
            const res = await api.post('/photo/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile({ ...profile, profile: { ...profile.profile, avatar: res.data.avatar } });
            updateEconomy({ avatar: res.data.avatar });
            showToast('Profil fotoğrafı değiştirildi', 'success');
        } catch (err) {
            showToast('Fotoğraf yüklenemedi', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploadingGallery(true);
        const formData = new FormData();
        formData.append('image', e.target.files[0]);

        try {
            const res = await api.post('/photo/gallery', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newPhotos = [...(profile.profile.photos || []), res.data.photo];
            setProfile({ ...profile, profile: { ...profile.profile, photos: newPhotos } });
            showToast('Galeriye fotoğraf eklendi', 'success');
        } catch (err) {
            showToast('Fotoğraf yüklenemedi', 'error');
        } finally {
            setUploadingGallery(false);
        }
    };

    const deleteGalleryPhoto = async (photoId: string) => {
        const oldPhotos = [...(profile.profile.photos || [])];
        setProfile({ ...profile, profile: { ...profile.profile, photos: oldPhotos.filter((p: any) => p.id !== photoId) } });

        try {
            await api.delete(`/photo/gallery/${photoId}`);
            showToast('Fotoğraf silindi', 'success');
        } catch (err) {
            setProfile({ ...profile, profile: { ...profile.profile, photos: oldPhotos } });
            showToast('Fotoğraf silinemedi', 'error');
        }
    };

    const handleBlock = async () => {
        if (!targetId || isOwner) return;
        if (window.confirm('Bu kullanıcıyı engellemek istediğinize emin misiniz?')) {
            try {
                await api.post(`/user/block/${targetId}`);
                showToast('Kullanıcı engellendi.', 'success');
                navigate('/messages');
            } catch (err: any) {
                showToast(err.response?.data?.error || 'Engelleme başarısız', 'error');
            }
        }
    };

    const handleReport = async () => {
        if (!targetId || isOwner) return;
        const reason = window.prompt('Lütfen şikayet nedeninizi kısaca açıklayın:');
        if (reason && reason.trim() !== '') {
            try {
                await api.post(`/user/report/${targetId}`, { reason });
                showToast('Şikayetiniz alındı.', 'success');
            } catch (err: any) {
                showToast(err.response?.data?.error || 'Şikayet iletilemedi', 'error');
            }
        }
    };

    if (loading || !profile || !profile.profile) return <BrandLoader message="Yıldız haritası çıkarılıyor..." />;

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-3xl mx-auto w-full pb-24">
            
            {/* Action Bar */}
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    {!isOwner && (
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-on-surface"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h1 className="font-headline-lg text-headline-lg text-primary">{isOwner ? 'Kozmik Profilim' : 'Kozmik Yolcu'}</h1>
                </div>
                {isOwner && (
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button 
                                    onClick={() => navigate('/vip')} 
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-pink)] text-black font-bold border border-transparent rounded-full hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all"
                                >
                                    <Crown size={16} /> <span className="hidden md:inline text-xs uppercase tracking-wider">VIP</span>
                                </button>
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary border border-secondary/30 rounded-full hover:bg-secondary/20 transition-colors"
                            >
                                <Edit2 size={16} /> <span className="hidden md:inline font-label-md">Düzenle</span>
                            </button>
                            </>
                        )}
                        <button 
                            onClick={logout}
                            className="p-2 rounded-full bg-error/10 text-error border border-error/30 hover:bg-error/20 transition-colors"
                            title="Çıkış Yap"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                )}
            </header>

            {/* Main Profile Structure */}
            <div className="flex flex-col gap-section-gap">
                
                {/* User Info Header Component */}
                <ProfileHeader
                    isOwner={isOwner}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    profile={profile}
                    name={name} setName={setName}
                    bio={bio} setBio={setBio}
                    hobby={hobby} setHobby={setHobby}
                    music={music} setMusic={setMusic}
                    weekend={weekend} setWeekend={setWeekend}
                    handleSave={handleSave}
                    saving={saving}
                    uploadingAvatar={uploadingAvatar}
                    handleAvatarUpload={handleAvatarUpload}
                />

                {!isEditing && (
                    <>
                        {/* Stardust Balance Card */}
                        {isOwner && (
                            <div className="bg-surface-container-highest border border-tertiary/30 rounded-2xl p-4 flex justify-between items-center shadow-[0_0_15px_rgba(255,198,64,0.1)]">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-3xl text-tertiary">stars</span>
                                    <div>
                                        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Yıldız Tozu Bakiyen</h3>
                                        <p className="font-headline-md text-headline-md text-tertiary font-bold">{stardustBalance || 0}</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/market')} className="px-4 py-2 bg-tertiary/10 text-tertiary border border-tertiary/30 rounded-full font-label-sm hover:bg-tertiary hover:text-on-tertiary transition-colors">
                                    Satın Al
                                </button>
                            </div>
                        )}

                        {/* Income Access Button */}
                        {isOwner && (
                             <button 
                                onClick={() => setShowIncome(true)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                             >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl">
                                        <Diamond size={20} className="text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-on-surface">Gelir ve Elmaslar</h3>
                                        <p className="text-xs text-on-surface-variant">Kazançlarınızı görüntüleyin</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                             </button>
                        )}

                        {/* Daily Quests Link */}
                        {isOwner && (
                            <button 
                                onClick={() => navigate('/quests')}
                                className="w-full bg-gradient-to-r from-tertiary/20 to-primary/20 border border-white/10 rounded-2xl p-6 flex justify-between items-center hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,198,64,0.15)] group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-tertiary/20 rounded-full flex items-center justify-center border border-tertiary/30">
                                        <span className="material-symbols-outlined text-tertiary text-2xl group-hover:scale-110 transition-transform">task_alt</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-headline-md text-headline-md text-on-surface">Görevlerim</h3>
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">Görevleri tamamla, ödülleri kap!</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-tertiary">chevron_right</span>
                            </button>
                        )}

                        {/* Gamification & Badges */}
                        <ProfileGamification
                            level={profile.profile.level}
                            xp={profile.profile.xp}
                            badges={profile.profile.badges}
                            karma={profile.profile.karma}
                        />

                        {/* Compatibility Score for Visitors */}
                        {!isOwner && profile.compatibility && (
                            <div className="bg-gradient-to-r from-secondary/20 to-transparent p-[1px] rounded-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-secondary/10 blur-xl"></div>
                                <div className="bg-surface-container-highest p-6 rounded-[15px] relative z-10 flex flex-col items-center text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px]">
                                            <span className="text-3xl mb-2">☀️</span>
                                            <span className="font-label-sm text-on-surface-variant mb-1">Güneş</span>
                                            <span className="font-headline-sm text-primary">{translateZodiac(profile.profile.sunSign)}</span>
                                        </div>
                                        <Sparkles size={24} className="text-secondary" />
                                        <span className="font-headline-lg text-headline-lg text-secondary">
                                            %{profile.compatibility.score} Uyum
                                        </span>
                                    </div>
                                    <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                                        Yıldızlarınız birbiriyle iletişim kuruyor.
                                    </p>
                                    <button
                                        onClick={() => navigate(`/synastry/${targetId}`)}
                                        className="w-full py-3 bg-secondary/10 border border-secondary text-secondary font-label-md font-bold rounded-xl hover:bg-secondary hover:text-on-secondary transition-colors"
                                    >
                                        Detaylı Astromatik Analizi Gör
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Cosmic Status Picker */}
                        <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-tertiary">mood</span>
                                Kozmik Durum
                            </h3>
                            {isOwner ? (
                                <div className="flex flex-wrap gap-2">
                                    {COSMIC_STATUSES.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => updateStatus(s.text)}
                                            className={`px-4 py-2 rounded-full font-label-sm text-label-sm flex items-center gap-2 transition-all ${
                                                cosmicStatus === s.text 
                                                ? 'bg-tertiary text-on-tertiary shadow-[0_0_15px_rgba(255,198,64,0.4)] border-tertiary scale-105' 
                                                : 'bg-surface border border-white/10 text-on-surface-variant hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <span className="text-lg">{s.emoji}</span> {s.text}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                profile.profile.cosmicStatus && (
                                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-tertiary/10 border border-tertiary/30">
                                        <span className="text-2xl">{COSMIC_STATUSES.find(s => s.text === profile.profile.cosmicStatus)?.emoji || '✨'}</span>
                                        <span className="font-label-md text-label-md text-tertiary font-bold">{profile.profile.cosmicStatus}</span>
                                    </div>
                                )
                            )}
                        </section>

                        {/* Astrological Chart */}
                        {profile.profile.sunSign && (
                            <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative overflow-hidden group min-h-[380px] flex flex-col items-center">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/30 transition-colors"></div>
                                <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2 relative z-10 self-start">
                                    <Sparkles className="text-primary" size={20} />
                                    Kozmik Harita
                                </h3>
                                <div className="relative z-10 w-full flex justify-center mb-4">
                                    <NatalChart
                                        sunSign={profile.profile.sunSign}
                                        moonSign={profile.profile.moonSign}
                                        risingSign={profile.profile.risingSign}
                                    />
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 mt-auto relative z-10 w-full pt-4">
                                    {profile.profile.hobby && <span className="px-3 py-1 bg-white/10 rounded-full font-label-sm text-label-sm text-on-surface-variant">{profile.profile.hobby}</span>}
                                    {profile.profile.music && <span className="px-3 py-1 bg-white/10 rounded-full font-label-sm text-label-sm text-on-surface-variant">{profile.profile.music}</span>}
                                    {profile.profile.weekend && <span className="px-3 py-1 bg-white/10 rounded-full font-label-sm text-label-sm text-on-surface-variant">{profile.profile.weekend}</span>}
                                </div>
                            </section>
                        )}

                        {/* Match Highlights for Visitors */}
                        {profile.matchHighlights && profile.matchHighlights.length > 0 && (
                            <div className="bg-error/10 border border-error/20 p-4 rounded-xl">
                                <h3 className="font-label-md text-error mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                                    Arayışlarınla Eşleşiyor
                                </h3>
                                <ul className="space-y-1">
                                    {profile.matchHighlights.map((h: string, i: number) => (
                                        <li key={i} className="font-body-sm text-on-surface-variant flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-error rounded-full"></span> {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <ProfileActions
                            isOwner={isOwner}
                            targetId={targetId as string}
                            friendStatus={friendStatus}
                            friendReqRemaining={friendReqRemaining}
                            saving={saving}
                            handleSendLike={handleSendLike}
                            handleSuperLike={handleSuperLike}
                            handleBlock={handleBlock}
                            handleReport={handleReport}
                            navigate={navigate}
                            user={user}
                        />

                        {/* Horoscope Component */}
                        <ProfileHoroscope dailyHoroscope={profile.dailyHoroscope} />
                    </>
                )}

                {/* Photo Gallery */}
                <ProfileGallery
                    isOwner={isOwner}
                    photos={profile.profile.photos}
                    uploadingGallery={uploadingGallery}
                    handleGalleryUpload={handleGalleryUpload}
                    deleteGalleryPhoto={deleteGalleryPhoto}
                />
            </div>

            {/* Income Modal */}
            <AnimatePresence>
                {showIncome && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[9999]"
                    >
                        <Income onClose={() => setShowIncome(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default Profile;
