import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VenusRetroModalProps {
    isOpen: boolean;
    onClose: () => void;
    sunSign: string | undefined;
}

const zodiacMap: Record<string, string> = {
    'ARIES': 'Koç', 'TAURUS': 'Boğa', 'GEMINI': 'İkizler', 'CANCER': 'Yengeç',
    'LEO': 'Aslan', 'VIRGO': 'Başak', 'LIBRA': 'Terazi', 'SCORPIO': 'Akrep',
    'SAGITTARIUS': 'Yay', 'CAPRICORN': 'Oğlak', 'AQUARIUS': 'Kova', 'PISCES': 'Balık'
};

const retroMessages: Record<string, string> = {
    'ARIES': 'Venüs retrosu senin ilişki aksında gerçekleşiyor. Eski aşklar kapını çalabilir veya mevcut ilişkinde halı altına süpürülen konular su yüzüne çıkabilir. Finansal konularda dürtüsel harcamalardan kesinlikle kaçınmalısın.',
    'TAURUS': 'Yönetici gezegenin Venüs geri gidiyor! Bu dönemde köklü estetik değişimlerden (saç kesimi, estetik vb.) kaçın. Kendi öz değerini sorgulayacağın ve kendini baştan tanımlayacağın derin bir döneme giriyorsun.',
    'GEMINI': 'Bu retro senin bilinçaltı ve sırlar evinde. Gizli kalmış aşklar, platonik hisler veya geçmişte kalmış sırlar gündeme gelebilir. Zihnini dinlendirmeli ve dedikodulardan olabildiğince uzak durmalısın.',
    'CANCER': 'Sosyal çevrende bir eleme dönemi başlıyor. Eski dostluklar tekrar canlanabilir veya bazı arkadaşlıkların miyadının dolduğunu fark edebilirsin. Gelecek hedeflerini gözden geçirmek için harika bir zaman.',
    'LEO': 'Kariyer ve toplumsal imaj alanında Venüs retroda. İş hayatında kadın figürlerle veya otoritelerle geçmişte kalan konuları çözmen gerekebilir. Eskiden kaçırdığın bir iş fırsatı tekrar karşına çıkabilir.',
    'VIRGO': 'Eğitim, seyahatler veya hayata bakış açınla ilgili konularda bir yavaşlama hissedebilirsin. Eskiden inandığın felsefeleri sorguluyor olabilirsin. Yarım kalan bir eğitime veya yurtdışı planına geri dönmek için uygun.',
    'LIBRA': 'Yönetici gezegenin Venüs retro hareketinde! Ortaklı finansal konular, krediler veya mirasla ilgili geçmiş hesaplar kapanıyor. Bir ilişkinin derinliğine ve güven temeline inmek zorunda kalacaksın.',
    'SCORPIO': 'Tam karşıt burcunda gerçekleşen bu retro, odağını tamamen ikili ilişkilere ve evliliğe çekiyor. Eski partnerler dönebilir, ortaklıklarda geçmiş krizler tekrar test edilebilir. Sağlam bağlar güçlenerek çıkacaktır.',
    'SAGITTARIUS': 'Günlük rutinin, sağlığın ve iş ortamında Venüs retroda. Çalışma arkadaşlarınla diplomatik olmaya özen göster. Geçmişten gelen bir sağlık hassasiyeti (özellikle boğaz veya böbrek) varsa kontrollerini aksatma.',
    'CAPRICORN': 'Aşk, romantizm ve hobiler alanın şenleniyor! Eski flörtler, kıvılcımlar veya eskiden çok sevdiğin ama bıraktığın yeteneklerin tekrar gündemde. Yaratıcılığını yeniden keşfetmek için bu retronun enerjisini kullan.',
    'AQUARIUS': 'Aile, ev ve kökler alanında bir retro yaşıyorsun. Ev içinde geçmişten gelen konular, eski eşyaları yenileme veya ailevi küslükleri barıştırma dönemi. Taşınma planın varsa biraz daha detaylı düşünmelisin.',
    'PISCES': 'İletişim, yakın çevre ve kardeşlerle ilgili alanda geçmiş konular açılıyor. Eski mailler, mesajlar veya yarım kalmış anlaşmalar tekrar gündeminde. Sözleşme imzalarken detayları iki kere kontrol etmelisin.'
};

export const VenusRetroModal: React.FC<VenusRetroModalProps> = ({ isOpen, onClose, sunSign }) => {
    if (!isOpen) return null;

    const message = (sunSign && retroMessages[sunSign]) 
        ? retroMessages[sunSign] 
        : 'Venüs retrosu, aşk ve değer algımızı yeniden yapılandırdığımız kadersel bir kozmik dinlenme sürecidir. Geçmişe dönüp neleri düzeltmemiz gerektiğine karar veririz.';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-gradient-to-b from-background to-surface-container border border-secondary/30 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(255,198,64,0.15)] z-10 flex flex-col items-center text-center overflow-hidden"
                >
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>

                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors z-20"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="relative w-24 h-24 mb-6"
                    >
                        {/* Venus Symbol Abstract */}
                        <div className="absolute inset-0 bg-secondary/20 rounded-full border-2 border-secondary/50 flex items-center justify-center shadow-[0_0_30px_rgba(255,198,64,0.3)]">
                            <span className="text-secondary text-4xl">♀</span>
                        </div>
                    </motion.div>

                    <div className="bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 text-secondary text-xs font-bold mb-4 uppercase tracking-widest">
                        Astrolojik Gündem
                    </div>

                    <h2 className="font-headline-md text-white mb-2">Venüs Retrosu</h2>
                    <p className="text-on-surface-variant text-sm mb-6">
                        Sevgi, uyum ve değerlerin gezegeni Venüs geri hareketine başladı. Kozmos senden yavaşlamanı ve geçmişi gözden geçirmeni istiyor.
                    </p>

                    <div className="w-full bg-background/50 border border-white/5 rounded-2xl p-5 relative">
                        <span className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold text-secondary">
                            {sunSign ? `${zodiacMap[sunSign] || sunSign} Burcu Etkisi` : 'Genel Etki'}
                        </span>
                        <p className="text-white text-sm leading-relaxed text-left">
                            {message}
                        </p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="mt-8 w-full bg-surface-container-highest hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl font-bold transition-all"
                    >
                        Kozmik Akışa Dön
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
