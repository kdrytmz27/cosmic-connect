import { motion } from 'framer-motion';
import { Loader, ImagePlus, Trash2 } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';

interface ProfileGalleryProps {
    isOwner: boolean;
    photos: any[];
    uploadingGallery: boolean;
    handleGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    deleteGalleryPhoto: (id: string) => void;
}

export const ProfileGallery = ({
    isOwner,
    photos,
    uploadingGallery,
    handleGalleryUpload,
    deleteGalleryPhoto
}: ProfileGalleryProps) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20 }}>Fotoğraflar</h2>
                {isOwner && (
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-pink)', fontSize: 14, fontWeight: 600 }}>
                        {uploadingGallery ? <Loader size={16} className="animate-spin" /> : <><ImagePlus size={18} /> Ekle</>}
                        <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: 'none' }} disabled={uploadingGallery} />
                    </label>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {photos && photos.length > 0 ? (
                    photos.map((photo: any) => (
                        <motion.div
                            key={photo.id}

                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'relative', paddingTop: '100%', borderRadius: 12, overflow: 'hidden', background: 'var(--card-border)' }}
                        >
                            <img src={`${BACKEND_URL}${photo.url}`} alt="Gallery item" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            {isOwner && (
                                <button
                                    onClick={() => deleteGalleryPhoto(photo.id)}
                                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </button>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 32, background: 'rgba(255,255,255,0.05)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                        {isOwner ? "Henüz fotoğraf eklemediniz." : "Bu kullanıcının fotoğrafı yok."}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
