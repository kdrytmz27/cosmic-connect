import { Camera, Check, X, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { BACKEND_URL } from '../../api/client';
import { translateZodiac } from '../../utils/zodiac';

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
    handleSave: () => void;
    saving: boolean;
    uploadingAvatar: boolean;
    handleAvatarUpload: (e: any) => void;
}

export const ProfileHeader = ({
    isOwner, isEditing, setIsEditing, profile,
    name, setName, bio, setBio, hobby, setHobby,
    music, setMusic, weekend, setWeekend,
    handleSave, saving, uploadingAvatar, handleAvatarUpload
}: ProfileHeaderProps) => {
    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden group shadow-xl"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-colors duration-700"></div>
            
            <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border-4 border-primary/50 shadow-[0_0_20px_rgba(147,51,234,0.4)] relative z-10">
                    {uploadingAvatar ? (
                        <div className="flex flex-col items-center justify-center text-primary gap-2">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="font-label-sm text-[10px]">Yükleniyor</span>
                        </div>
                    ) : (
                        <img 
                            src={profile.profile.avatar ? `${BACKEND_URL}${profile.profile.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Kozmik')}&background=ddb8ff&color=000&size=128`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    )}
                </div>
                {isOwner && (
                    <label className="absolute bottom-0 right-0 bg-primary-container text-on-primary-container p-2.5 rounded-full cursor-pointer border-2 border-surface shadow-lg hover:scale-110 transition-transform z-20" title="Fotoğrafı Değiştir">
                        <Camera size={18} />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                    </label>
                )}
                {profile.profile.isPremium && (
                    <div className="absolute -top-3 -right-3 z-30 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] rotate-[15deg]">
                        <Crown size={40} className="text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="flex flex-col gap-4 mb-4 max-w-md mx-auto relative z-10">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="İsim"
                        className="bg-surface-container-highest border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors font-body-md"
                    />
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Kozmik enerjini anlat..."
                        className="bg-surface-container-highest border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors font-body-md h-24 resize-none"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={hobby}
                            onChange={e => setHobby(e.target.value)}
                            placeholder="Hobin (örn: Sanat)"
                            className="bg-surface-container-highest border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors font-body-sm"
                        />
                        <input
                            type="text"
                            value={music}
                            onChange={e => setMusic(e.target.value)}
                            placeholder="Müzik (örn: Pop)"
                            className="bg-surface-container-highest border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors font-body-sm"
                        />
                    </div>
                    
                    <input
                        type="text"
                        value={weekend}
                        onChange={e => setWeekend(e.target.value)}
                        placeholder="Hafta sonu ne yaparsın?"
                        className="bg-surface-container-highest border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors font-body-sm"
                    />
                    
                    <div className="flex gap-3 justify-center mt-4">
                        <button 
                            onClick={() => setIsEditing(false)} 
                            className="flex-1 py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-on-surface font-label-md flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        >
                            <X size={18} /> İptal
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="flex-1 py-3 px-6 rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:bg-inverse-primary transition-colors disabled:opacity-50"
                        >
                            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />} Kaydet
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative z-10">
                    <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2 capitalize flex items-center justify-center gap-2">
                        {profile.profile.name || profile.profile.email?.split('@')[0] || 'Kozmik Yolcu'}
                        {profile.profile.isPremium && <Crown size={24} className="text-secondary" />}
                    </h2>
                    
                    {profile.profile.bio && (
                        <p className="font-body-md text-body-md text-on-surface-variant italic max-w-md mx-auto mb-6">
                            "{profile.profile.bio}"
                        </p>
                    )}
                    
                    {(profile.profile.moonSign || profile.profile.risingSign) && (
                        <div className="flex justify-center gap-3 mb-2 flex-wrap">
                            {profile.profile.moonSign && (
                                <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-primary">dark_mode</span>
                                    <span className="font-label-sm text-label-sm text-primary">Ay: {translateZodiac(profile.profile.moonSign)}</span>
                                </div>
                            )}
                            {profile.profile.risingSign && (
                                <div className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-secondary">flare</span>
                                    <span className="font-label-sm text-label-sm text-secondary">Yükselen: {translateZodiac(profile.profile.risingSign)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
