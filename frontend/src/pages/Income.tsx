import React, { useEffect, useState } from 'react';
import { ChevronLeft, Diamond, Sparkles, ArrowRight, ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface IncomeProps {
    onClose: () => void;
}

export const Income: React.FC<IncomeProps> = ({ onClose }) => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<any>(authUser);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const { data } = await api.get('/user/profile/me');
                // API returns { profile: {...} }, extract the profile object
                const profileData = data.profile || data;
                setUser(profileData);

                const txRes = await api.get('/user/transactions');
                setTransactions(txRes.data.transactions || []);
            } catch (error) {
                console.error("Bakiye veya İşlemler çekilemedi", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0b1326] z-[9999] flex flex-col font-body-md text-white overflow-y-auto">
            {/* Header */}
            <header className="flex items-center px-4 py-4 pt-safe sticky top-0 bg-[#0b1326]/90 backdrop-blur-md z-10 border-b border-white/5">
                <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="flex-1 text-center font-display-md text-lg font-bold pr-8">Kozmik Gelir</h1>
            </header>

            <main className="flex-1 px-4 py-6 flex flex-col gap-6 pb-safe">
                {/* Total Diamond Balance Card */}
                <div className="bg-gradient-to-br from-[#3cddc7]/20 to-[#0b1326] border border-[#3cddc7]/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(60,221,199,0.15)]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Diamond size={120} />
                    </div>
                    <h2 className="text-sm font-semibold text-white/70 mb-2">Çekilebilir Elmas Bakiyesi</h2>
                    <div className="flex items-baseline gap-2 mb-6">
                        <Diamond className="w-8 h-8 text-[#3cddc7] fill-[#3cddc7]/20" />
                        <span className="text-5xl font-black text-white tracking-tight">{loading ? '—' : ((user as any)?.diamondBalance || 0)}</span>
                    </div>
                    
                    {/* TODO: Nakite çevirme/gönderme bir ödeme sağlayıcısı (payout) entegrasyonu bekliyor - backend'de PayoutRequest modeli var ama endpoint yok. */}
                    <div className="flex gap-3 relative z-10">
                        <button className="flex-1 bg-[#3cddc7] text-[#0b1326] font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(60,221,199,0.4)]">
                            <ArrowDown size={18} /> Nakite Çevir
                        </button>
                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/10">
                            <ArrowUp size={18} /> Gönder
                        </button>
                    </div>
                </div>

                {/* Stardust Balance (Harcanabilir) */}
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#ffc640]/10 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-[#ffc640]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white/70">Yıldız Tozu (Hediye Bakiyesi)</h3>
                            <div className="text-xl font-bold text-white">{(user as any)?.stardustBalance || 0} <span className="text-xs font-normal text-white/50">Toz</span></div>
                        </div>
                    </div>
                    {/* TODO: Yıldız Tozu yükleme akışı RevenueCat entegrasyonuna bağlı (bkz. main.tsx) - henüz aktif değil. */}
                    <button className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-colors">
                        Yükle
                    </button>
                </div>

                {/* Recent Transactions */}
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Activity size={20} className="text-[#ddb8ff]" />
                            Son İşlemler
                        </h2>
                        {/* TODO: Tüm işlemler sayfası/modalı henüz yok. */}
                        <button className="text-sm text-[#3cddc7] font-semibold flex items-center">
                            Tümü <ArrowRight size={14} className="ml-1" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            tx.type === 'income' ? 'bg-[#3cddc7]/10 text-[#3cddc7]' : 'bg-[#ffc640]/10 text-[#ffc640]'
                                        }`}>
                                            {tx.type === 'income' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-white">
                                                {tx.type === 'income' ? `${tx.from} hediye gönderdi` : `Hediyeniz: ${tx.to}`}
                                            </p>
                                            <p className="text-xs text-white/50">{new Date(tx.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} • {tx.gift}</p>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${tx.type === 'income' ? 'text-[#3cddc7]' : 'text-white'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{tx.amount} 
                                        {tx.currency === 'diamond' ? (
                                            <Diamond size={12} className="inline ml-0.5 mb-0.5" />
                                        ) : (
                                            <Sparkles size={12} className="inline ml-0.5 mb-0.5 text-[#ffc640]" />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-white/40 text-sm">
                                <Activity size={32} className="mx-auto mb-3 opacity-20" />
                                <p>Henüz bir işlem geçmişiniz bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Income;
