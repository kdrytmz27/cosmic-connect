export interface DailyTransit {
    title: string;
    message: string;
    energyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    icon: string;
    type: 'ROMANCE' | 'COMMUNICATION' | 'CONFLICT' | 'LUCK';
}

const transitDatabase: DailyTransit[] = [
    { title: "Venüs Etkileşimi 🌟", message: "Bugün aranızdaki romantik enerji zirvede. Tatlı mesajlar göndermek için harika bir gün!", energyLevel: "HIGH", icon: "💖", type: "ROMANCE" },
    { title: "Merkür Retro'su ⚠️", message: "İletişim gezegeni geriliyor. Yanlış anlaşılmalara açıksınız, mesaj yazarken iki kere düşünün.", energyLevel: "LOW", icon: "🌀", type: "COMMUNICATION" },
    { title: "Ay Sinerjisi 🌙", message: "Duygusal bağınız bugün çok güçlü. Derin konulardan konuşmak için mükemmel bir zaman.", energyLevel: "HIGH", icon: "🌊", type: "ROMANCE" },
    { title: "Mars Karesi ☄️", message: "Gökyüzünde gerilim var. Gereksiz tartışmalardan ve inatlaşmaktan uzak durmalısınız.", energyLevel: "LOW", icon: "🔥", type: "CONFLICT" },
    { title: "Jüpiter Şansı 🍀", message: "Bugün şans gezegeni yanınızda! İlk buluşmayı teklif etmek veya cesur bir adım atmak için doğru an.", energyLevel: "HIGH", icon: "✨", type: "LUCK" },
    { title: "Güneş Üçgeni ☀️", message: "Egonuz ve özgüveniniz yüksek. Kendinizi çok net ve etkileyici ifade edebileceğiniz parlak bir gün.", energyLevel: "MEDIUM", icon: "🌞", type: "COMMUNICATION" },
    { title: "Satürn Sınavı 🪐", message: "Biraz sabırlı olma zamanı. Mesajlara geç cevap gelirse kişisel algılamayın, herkesin yoğun bir günü.", energyLevel: "MEDIUM", icon: "⏳", type: "COMMUNICATION" },
    { title: "Uranüs Sürprizi ⚡", message: "Bugün hiç beklenmedik, spontane gelişmeler olabilir. Sohbetiniz aniden çok ilginç bir yöne kayabilir!", energyLevel: "HIGH", icon: "🎢", type: "LUCK" },
    { title: "Neptün Sisi 🌫️", message: "Bugün duygular biraz karmaşık ve belirsiz olabilir. Net kararlar almak yerine sadece akışta kalmayı deneyin.", energyLevel: "MEDIUM", icon: "☁️", type: "ROMANCE" },
    { title: "Kuzey Düğümü 🧭", message: "Kadersel bir etkileşim günü. Konuştuğunuz konular geleceğinizi şekillendirecek ufak ipuçları taşıyabilir.", energyLevel: "HIGH", icon: "🔮", type: "LUCK" }
];

export function getDailyTransit(userSign: string = 'Aries', partnerSign: string = 'Aries'): DailyTransit {
    // 1. Bugunun tarihini al (Sadece Gün-Ay-Yıl)
    const today = new Date();
    const dateString = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;

    // 2. Iki burcu alfabetik siraya koy (Boylece A->B veya B->A ayni sonucu verir)
    const signs = [userSign.toLowerCase(), partnerSign.toLowerCase()].sort();
    
    // 3. Essiz bir String (Seed) olustur
    const seedString = `${dateString}-${signs[0]}-${signs[1]}`;

    // 4. String'i sayisal bir Hash'e cevir
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        const char = seedString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // 5. Negatif hash'i pozitife cevir
    const positiveHash = Math.abs(hash);

    // 6. DB boyutuna gore mod al
    const index = positiveHash % transitDatabase.length;

    return transitDatabase[index];
}
