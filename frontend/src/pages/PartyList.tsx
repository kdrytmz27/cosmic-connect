import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, Sparkles, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface PartyRoom {
    id: string;
    title: string;
    owner: { name: string; avatar: string };
    currentCount: number;
    maxParticipants: number;
    imageUrl: string;
}

const PartyList = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [rooms, setRooms] = useState<PartyRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoomTitle, setNewRoomTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/party`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (error) {
            console.error('Odalar yüklenemedi:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomTitle.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/party`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newRoomTitle })
            });

            const data = await res.json();
            
            if (res.ok) {
                showToast('Oda başarıyla oluşturuldu!', 'success');
                setIsCreateModalOpen(false);
                navigate(`/party/${data.id}`);
            } else {
                showToast(data.error || 'Oda oluşturulamadı', 'error');
            }
        } catch (error) {
            showToast('Sunucu bağlantı hatası', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen pb-32">
            {/* Header & Search */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-[#ddb8ff] flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-[#ffc640]" />
                            Kozmik Odalar
                        </h1>
                        <p className="text-[#cfc2d7] text-sm mt-1">Gezegenlerin fısıldadığı odaları keşfet ve sohbete katıl.</p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-[#ddb8ff] to-[#9333ea] p-3 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:scale-105 active:scale-95 transition-all text-[#2c0051]"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#988ca0]" />
                    <input 
                        type="text" 
                        placeholder="Oda adı veya konu ara..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-[#dae2fd] focus:outline-none focus:border-[#ddb8ff] transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Room Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader className="w-8 h-8 text-[#ddb8ff] animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map((room, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={room.id}
                            onClick={() => navigate(`/party/${room.id}`)}
                            className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-[#ddb8ff]/50 transition-colors shadow-lg"
                        >
                            <img 
                                src={room.imageUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80'} 
                                alt={room.title} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-[#060e20]/60 to-transparent"></div>
                            
                            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                <div className="flex justify-between items-end gap-2">
                                    <div className="flex-1">
                                        <h3 className="font-headline-md text-lg font-bold text-white line-clamp-2 leading-tight mb-1 group-hover:text-[#ddb8ff] transition-colors">
                                            {room.title}
                                        </h3>
                                        <p className="text-sm text-[#cfc2d7]">Kurucu: {room.owner?.name}</p>
                                    </div>
                                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shrink-0">
                                        <Users className="w-4 h-4 text-[#3cddc7]" />
                                        <span className="font-label-md text-sm font-semibold text-white">
                                            {room.currentCount}<span className="text-white/50">/{room.maxParticipants}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            
            {/* Empty State */}
            {!isLoading && rooms.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-[#4d4354] mb-4">search_off</span>
                    <h3 className="text-xl font-bold text-[#cfc2d7] mb-2">Oda Bulunamadı</h3>
                    <p className="text-[#988ca0]">Bu isimde bir gezegen veya oda henüz keşfedilmedi.</p>
                </div>
            )}

            {/* Create Room Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl p-6"
                        >
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="absolute top-4 right-4 text-[#cfc2d7] hover:text-white"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-2xl font-bold text-[#ddb8ff] mb-2">Oda Oluştur</h2>
                            <p className="text-[#cfc2d7] text-sm mb-6">Kendi partini başlat ve insanları kozmik sohbetine davet et.</p>

                            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm text-[#cfc2d7] mb-1">Oda Başlığı</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Örn: Venüs Retrosu Sohbeti" 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#ddb8ff]"
                                        value={newRoomTitle}
                                        onChange={(e) => setNewRoomTitle(e.target.value)}
                                        maxLength={50}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isCreating}
                                    className="mt-2 w-full bg-gradient-to-r from-[#ddb8ff] to-[#9333ea] text-[#2c0051] font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all disabled:opacity-50"
                                >
                                    {isCreating ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Oluştur ve Gir'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PartyList;
