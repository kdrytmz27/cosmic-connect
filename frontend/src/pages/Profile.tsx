import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Loader, Edit2, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { NatalChart } from '../components/NatalChart';

import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileGamification } from '../components/profile/ProfileGamification';
import { ProfileHoroscope } from '../components/profile/ProfileHoroscope';
import { ProfileGallery } from '../components/profile/ProfileGallery';
import { ProfileActions } from '../components/profile/ProfileActions';
import { DailyQuests } from '../components/profile/DailyQuests';
import { premiumApi } from '../api/premium';
import { economyApi } from '../api/economy';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, logout, updateEconomy, user } = useAuth();
    const { showToast } = useToast();
    const targetId = id || userId;
    const isOwner = !id || id === userId;

    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [hobby, setHobby] = useState('');
    const [music, setMusic] = useState('');
    const [weekend, setWeekend] = useState('');
    const [moonSign, setMoonSign] = useState('');
    const [risingSign, setRisingSign] = useState('');
    const [cosmicStatus, setCosmicStatus] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [friendStatus, setFriendStatus] = useState<any>(null);
    const [friendReqRemaining, setFriendReqRemaining] = useState<number>(0);

    const COSMIC_STATUSES = [
        { id: '1', emoji: '🌕', text: 'Dolunay Enerjisi' },
        { id: '2', emoji: '☿', text: 'Merkür Retrosu' },
        { id: '3', emoji: '✨', text: 'Flow Halindeyim' },
        { id: '4', emoji: '🔮', text: 'Keşif Modu' },
        { id: '5', emoji: '🌊', text: 'Duygusal' },
        { id: '6', emoji: '🔥', text: 'Motivasyon Dolu' },
    ];

    useEffect(() => {
        if (targetId) {
            api.get(`/user/profile/${targetId}`).then(res => {
                setProfile(res.data);
                setName(res.data.profile.name || res.data.profile.email.split('@')[0]);
                setBio(res.data.profile.bio || '');
                setHobby(res.data.profile.hobby || '');
                setMusic(res.data.profile.music || '');
                setWeekend(res.data.profile.weekend || '');
                setCosmicStatus(res.data.profile.cosmicStatus || null);
            }).catch(console.error);

            if (!isOwner) {
                api.get(`/user/friend-request-status/${targetId}`).then(res => {
                    setFriendStatus(res.data.status);
                    setFriendReqRemaining(res.data.remaining);
                }).catch(console.error);
            }
        }
    }, [targetId, isOwner]);

    const handleSendFriendRequest = async () => {
        setSaving(true);
        try {
            const res = await api.post('/user/friend-request', { receiverId: targetId });
            setFriendStatus(res.data.autoAccepted ? 'friends' : 'sent');
            setFriendReqRemaining(res.data.remaining);
            showToast(res.data.autoAccepted ? 'Arkadaş oldunuz! ✨' : 'İstek gönderildi 💫', 'success');
        } catch (err: any) {
            if (err.response?.status === 403 && err.response?.data?.error?.includes('limit')) {
                showToast('Günlük arkadaşlık isteği limitine ulaştınız (5/5).', 'error');
            } else {
                showToast(err.response?.data?.error || 'İstek gönderilemedi', 'error');
            }
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

    const handleSendGift = async () => {
        if (!targetId) return;
        setSaving(true);
        try {
            const res = await economyApi.sendGift(targetId, 100);
            updateEconomy({ stardustBalance: res.data.remainingStardust });
            showToast('100 Yıldız Tozu hediyeniz gönderildi! 🎁', 'success');
        } catch (err) { }
        finally { setSaving(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/user/profile', { name, bio, hobby, music, weekend, moonSign, risingSign });
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
        const newStatus = status === cosmicStatus ? null : status; // Toggle off if clicked again
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
                navigate('/messages'); // Geri dön
            } catch (err: any) {
                showToast(err.response?.data?.error || 'Engelleme başarısız', 'error');
            }
        }
    };

    const handleReport = async () => {
        if (!targetId || isOwner) return;
        const reason = window.prompt('Lütfen şikayet nedeninizi kısaca açıklayın (örn. spam, küfür):');
        if (reason && reason.trim() !== '') {
            try {
                await api.post(`/user/report/${targetId}`, { reason });
                showToast('Şikayetiniz alındı, teşekkürler.', 'success');
            } catch (err: any) {
                showToast(err.response?.data?.error || 'Şikayet iletilemedi', 'error');
            }
        }
    };

    if (!profile || !profile.profile) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}><Loader className="animate-spin text-accent" size={32} /></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {!isOwner && (
                            <button onClick={() => navigate(-1)} style={{ background: 'var(--card-border)', padding: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'white' }}>
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h1 className="glow-text" style={{ fontSize: 32 }}>Profil</h1>
                    </div>
                    {isOwner && (
                        <div>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} style={{ marginRight: 16 }}>
                                    <Edit2 size={20} color="var(--accent-pink)" />
                                </button>
                            )}
                            <button onClick={logout}><Settings size={20} color="var(--text-secondary)" /></button>
                        </div>
                    )}
                </div>

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
                    moonSign={moonSign} setMoonSign={setMoonSign}
                    risingSign={risingSign} setRisingSign={setRisingSign}
                    handleSave={handleSave}
                    saving={saving}
                    uploadingAvatar={uploadingAvatar}
                    handleAvatarUpload={handleAvatarUpload}
                />

                {!isEditing && (
                    <>
                        {isOwner && <DailyQuests />}

                        <ProfileGamification
                            level={profile.profile.level}
                            xp={profile.profile.xp}
                            badges={profile.profile.badges}
                            karma={profile.profile.karma}
                        />

                        {/* Uyum Skoru (başka profil görüntülenirken) */}
                        {!isOwner && profile.compatibility && (
                            <div style={{
                                background: 'rgba(255, 215, 0, 0.1)', padding: 16, borderRadius: 16,
                                border: '1px solid rgba(255, 215, 0, 0.3)', marginBottom: 20, textAlign: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                                    <Sparkles size={18} color="var(--accent-gold)" />
                                    <span style={{ fontSize: 22, fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                                        %{profile.compatibility.score} Uyum
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                </p>
                                <button
                                    onClick={() => navigate(`/synastry/${targetId}`)}
                                    style={{ width: '100%', padding: '10px', marginTop: 12, borderRadius: 10, background: 'rgba(255,215,0,0.15)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <Sparkles size={16} fill="var(--accent-gold)" /> Detaylı Astromatik Analizi Gör
                                </button>
                            </div>
                        )}

                        {profile.profile.stardustBalance !== undefined && (
                            <p style={{ color: 'var(--accent-purple)', fontWeight: 600, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>{profile.profile.stardustBalance} Yıldız Tozu</p>
                        )}

                        {/* Cosmic Status Picker */}
                        {isOwner ? (
                            <div style={{ marginBottom: 24, textAlign: 'left' }}>
                                <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textAlign: 'center' }}>Kozmik Durumum</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                    {COSMIC_STATUSES.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => updateStatus(s.text)}
                                            style={{
                                                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                                                background: cosmicStatus === s.text ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${cosmicStatus === s.text ? 'var(--accent-pink)' : 'var(--card-border)'}`,
                                                color: cosmicStatus === s.text ? 'white' : 'var(--text-secondary)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', gap: 4
                                            }}
                                        >
                                            <span>{s.emoji}</span> {s.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            profile.profile.cosmicStatus && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '6px 14px', borderRadius: 20 }}>
                                        <span style={{ fontSize: 14 }}>{COSMIC_STATUSES.find(s => s.text === profile.profile.cosmicStatus)?.emoji || '✨'}</span>
                                        <span style={{ fontSize: 13, color: 'var(--accent-purple)', fontWeight: 600 }}>{profile.profile.cosmicStatus}</span>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Natal Chart Section */}
                        {profile.profile.sunSign && (
                            <div style={{ marginBottom: 32, background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: '24px 16px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <h3 style={{ fontSize: 18, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Sparkles size={18} color="var(--accent-gold)" /> Kozmik Harita
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
                                    Güneş, Ay ve Yükselen yerleşimleri
                                </p>
                                <NatalChart
                                    sunSign={profile.profile.sunSign}
                                    moonSign={profile.profile.moonSign}
                                    risingSign={profile.profile.risingSign}
                                />
                            </div>
                        )}

                        <ProfileActions
                            isOwner={isOwner}
                            targetId={targetId as string}
                            friendStatus={friendStatus}
                            friendReqRemaining={friendReqRemaining}
                            saving={saving}
                            handleSendFriendRequest={handleSendFriendRequest}
                            handleSuperLike={handleSuperLike}
                            handleSendGift={handleSendGift}
                            handleBlock={handleBlock}
                            handleReport={handleReport}
                            navigate={navigate}
                            user={user}
                        />

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Güneş: {profile.profile.sunSign}</span>
                            <span style={{ padding: '4px 12px', background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Ay: {profile.profile.moonSign}</span>
                            <span style={{ padding: '4px 12px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Yükselen: {profile.profile.risingSign}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginTop: 12 }}>
                            {profile.profile.hobby && <span style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.1)', color: '#ddd', borderRadius: 8, fontSize: 12 }}>{profile.profile.hobby}</span>}
                            {profile.profile.music && <span style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.1)', color: '#ddd', borderRadius: 8, fontSize: 12 }}>{profile.profile.music}</span>}
                            {profile.profile.weekend && <span style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.1)', color: '#ddd', borderRadius: 8, fontSize: 12 }}>{profile.profile.weekend}</span>}
                        </div>

                        {profile.matchHighlights && profile.matchHighlights.length > 0 && (
                            <div style={{ marginTop: 24, padding: 16, background: 'rgba(236, 72, 153, 0.1)', borderRadius: 12, border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                                <h3 style={{ fontSize: 14, color: 'var(--accent-pink)', marginBottom: 8 }}>✨ Arayışlarınla Eşleşiyor</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {profile.matchHighlights.map((h: string, i: number) => (
                                        <span key={i} style={{ fontSize: 13, color: 'white' }}>{h}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <ProfileHoroscope dailyHoroscope={profile.dailyHoroscope} />
                    </>
                )}

                <ProfileGallery
                    isOwner={isOwner}
                    photos={profile.profile.photos}
                    uploadingGallery={uploadingGallery}
                    handleGalleryUpload={handleGalleryUpload}
                    deleteGalleryPhoto={deleteGalleryPhoto}
                />
            </div>
        </motion.div>
    );
};
export default Profile;
