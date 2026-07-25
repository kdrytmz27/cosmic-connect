import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../../api/client';

export interface PartyGiftData {
    giftKey: string;
    name: string;
    icon: string | null;
    price: number;
    category: string;
    isLuckyEligible: boolean;
    animationUrl?: string | null;
    animationTier?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    BASLANGIC: 'Başlangıç',
    ORTA: 'Orta',
    PREMIUM: 'Premium',
    LUKS: 'Lüks'
};
const CATEGORY_ORDER = ['BASLANGIC', 'ORTA', 'PREMIUM', 'LUKS'];
const COMBO_QUANTITIES = [1, 7, 17, 50];

interface GiftPanelProps {
    localStardust: number;
    onSend: (gift: PartyGiftData, quantity: number) => void;
}

export const GiftPanel: React.FC<GiftPanelProps> = ({ localStardust, onSend }) => {
    const [gifts, setGifts] = useState<PartyGiftData[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('BASLANGIC');
    const [loading, setLoading] = useState(true);
    const [selectedGift, setSelectedGift] = useState<PartyGiftData | null>(null);

    useEffect(() => {
        api.get('/party/gifts/catalog')
            .then(res => setGifts(res.data.gifts || []))
            .catch(e => console.error('Hediye kataloğu çekilemedi:', e))
            .finally(() => setLoading(false));
    }, []);

    const categoriesPresent = CATEGORY_ORDER.filter(c => gifts.some(g => g.category === c));
    const visibleGifts = gifts.filter(g => g.category === activeCategory);

    return (
        <div>
            {/* Live stardust balance - always visible while sending gifts */}
            <div className="flex items-center justify-end gap-1.5 mb-3 text-[#3cddc7] text-sm font-bold">
                <Sparkles size={14} />
                <span>{localStardust.toLocaleString('tr-TR')}</span>
                <span className="text-white/40 font-normal text-xs">Yıldız Tozu</span>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                {categoriesPresent.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                            activeCategory === cat ? 'bg-primary text-on-primary' : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                        {CATEGORY_LABELS[cat] || cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center text-white/40 text-sm py-8">Yükleniyor...</div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                    {visibleGifts.map(gift => {
                        const isSelected = selectedGift?.giftKey === gift.giftKey;
                        return (
                            <div
                                key={gift.giftKey}
                                onClick={() => setSelectedGift(gift)}
                                className={`relative bg-white/5 rounded-xl p-3 flex flex-col items-center gap-2 border cursor-pointer hover:bg-white/10 transition-colors ${
                                    isSelected ? 'border-primary shadow-[0_0_12px_rgba(147,51,234,0.4)]' : 'border-white/10'
                                } ${localStardust < gift.price ? 'opacity-50' : ''}`}
                            >
                                {gift.isLuckyEligible && (
                                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded-full font-bold">
                                        ŞANSLI
                                    </span>
                                )}
                                <span className="text-3xl">{gift.icon || '🎁'}</span>
                                <span className="text-xs text-white/80 text-center">{gift.name}</span>
                                <div className="flex items-center gap-1 text-[#3cddc7] text-xs font-bold">
                                    <Sparkles size={10} /> {gift.price}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quantity / combo bar - appears once a gift is selected, stays open across sends */}
            {selectedGift && (
                <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-3 border border-white/10 mb-2">
                    <span className="text-2xl shrink-0">{selectedGift.icon || '🎁'}</span>
                    <span className="text-xs text-white/70 flex-1 min-w-0 truncate">{selectedGift.name}</span>
                    {COMBO_QUANTITIES.map(qty => {
                        const totalPrice = selectedGift.price * qty;
                        const insufficient = localStardust < totalPrice;
                        return (
                            <button
                                key={qty}
                                disabled={insufficient}
                                onClick={() => onSend(selectedGift, qty)}
                                className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                                    insufficient
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                        : 'bg-primary/80 text-on-primary hover:bg-primary'
                                }`}
                            >
                                <span>x{qty}</span>
                                <span className="text-[9px] font-normal opacity-80">{totalPrice}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
