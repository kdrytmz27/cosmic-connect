# Cosmic Connect - Astroloji ve Tanışma Platformu

Cosmic Connect, modern astroloji algoritmaları ile gerçek zamanlı sosyal etkileşimi birleştiren, kullanıcıların gökyüzü rotasına göre bağ kurmasını sağlayan kapsamlı bir mobil platformdur.

## 🌌 Uygulamanın Amacı
Uygulamanın temel amacı, kullanıcıların doğum haritalarındaki gezegen konumlarını (Güneş, Ay, Merkür, Venüs, Mars vb.) kullanarak:
- Kendilerini daha iyi tanımalarını sağlamak.
- Diğer kullanıcılarla olan kozmik uyumlarını (Sinastri) bilimsel astroloji temelleriyle analiz etmek.
- Gerçek zamanlı eşleşme ve mesajlaşma ile anlamlı ilişkiler kurmalarına yardımcı olmak.
- Profesyonel falcılar aracılığıyla spiritüel rehberlik sunmaktır.

---

## 🛠️ Güncel Eksiksiz Özellikler

### 1. Astroloji ve Profil Yönetimi
- **Doğum Haritası Analizi:** Kullanıcının doğum tarihi, saati ve yerine göre Güneş, Ay ve Yükselen burçlarının yanı sıra tüm ana gezegenlerin (Merkür, Venüs, Mars, Jüpiter, Satürn) konumlarını hesaplar.
- **Günlük Burç Yorumları:** Sağlık, İş, Finans ve Aşk kategorilerinde, kullanıcının doğum haritasına özel günlük dinamik yorumlar.
- **Gelişmiş Profil:** Burç özellikleri, element dengesi (Ateş, Su, Toprak, Hava) ve kullanıcı fotoğraflarının sergilendiği estetik profil sayfaları.

### 2. Eşleşme ve Sosyal Etkileşim
- **160 Saniye Eşleşmesi (Speed Dating):** "Eşleş" butonuna basan aktif kullanıcılar arasında en yüksek uyum skoruna sahip olanlar WebSocket üzerinden anında eşleştirilir.
- **Süreli Mesajlaşma:** Eşleşme anında başlayan ve süre bitiminde kendini imha eden 160 saniyelik canlı sohbet odaları. (Premium üyeler için bu süre 320 saniyedir).
- **Arkadaşlık Sistemi:** Karşılıklı beğeni veya mesajlaşma sırasında gönderilen arkadaşlık istekleri ile kalıcı bağlantılar kurma.
- **Grup Sohbetleri:** Ortak ilgi alanları ve burç gruplarına özel topluluk odaları.

### 3. Sinastri (Uyumluluk) Analizi
- **Gezegen Açı Analizi:** İki kullanıcının haritalarındaki gezegenlerin birbirine yaptığı açılar (Kavuşum, Trigon, Kare vb.) üzerinden derinlemesine analiz.
- **Kategori Bazlı Skorlama:** Aşk, İletişim, Tutku, Güven ve Uzun Vadeli Uyum kategorilerinde 100 üzerinden başarı skorları.
- **Özel Analiz Raporları:** İki kişinin ilişkisindeki güçlü ve zayıf yönleri açıklayan detaylı metin analizleri.

### 4. Fal ve Spiritüel Rehberlik
- **Yetenekli Falcılar:** Kahve Falı, Tarot, Astroloji gibi alanlarda uzmanlaşmış falcı profilleri.
- **Randevu Sistemi:** Falcılardan uygun saatlerine göre randevu alma ve seans yönetimi.
- **Değerlendirme:** Falcılara verilen puanlar ve yorumlarla kalite kontrolü.

### 5. Oyunlaştırma ve Ekonomi
- **Yıldız Tozu (Star Dust):** Uygulama içi aksiyonlarla kazanılan sanal para birimi.
- **Market ve Hediyeler:** Yıldız Tozu ile sanal hediyeler alma veya marketten özel özellikler (ekstra süre, profil öne çıkarma vb.) edinme.
- **XP ve Seviye Sistemi:** Sosyal etkileşimle artan XP puanları, seviye atlama ve başarı rozetleri (Badges).
- **Liderlik Tablosu:** En popüler ve aktif kullanıcıların sıralandığı rekabet ortamı.

### 6. Premium Hizmetler
- **Premium Rozeti:** Profilde prestij simgesi.
- **Ayrıcalıklar:** İki kat uzun mesajlaşma süresi, sınırsız profil ziyareti, özel analizler ve reklamdan arındırılmış deneyim.

---

## 📱 Uygulamanın Kullanışı

1. **Kayıt ve Onboarding:** Uygulamaya ilk girişte doğum bilgilerinizi (gün/ay/yıl, saat ve şehir) girin. Sistem otomatik olarak gökyüzü haritanızı oluşturacaktır.
2. **Keşfet:** Ana ekranda size özel "Günün En Uyumlu Kişisi"ni görün veya "Eşleş" butonuyla anında biriyle sohbete başlayın.
3. **Mesajlaşma:** 160 saniyelik geri sayım bitmeden enerjinizi yansıtın! Eğer sohbetten keyif aldıysanız "Arkadaş Ekle" butonuna basarak bağlantıyı kalıcı hale getirin.
4. **Analiz Al:** Arkadaş listenizdeki veya keşfetteki herhangi bir profile girerek "Kozmik Uyum" skorunuzu inceleyin.
5. **Rehberlik:** Hayatınızdaki belirsizlikler için bir falcı seçin, randevunuzu oluşturun ve spiritüel danışmanlık alın.
6. **Kazan:** Günlük giriş yaparak ve etkileşimde bulunarak Yıldız Tozu toplayın, markette harcayarak profilinizi güçlendirin.

---

## 🛠️ Teknik Altyapı Notu
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL.
- **Frontend & Mobil:** React / React Native (Expo).
- **Real-time:** Socket.IO üzerinden anlık eşleşme ve mesajlaşma.
- **Algoritma:** Meeus/Moshier astronomik hesaplama algoritmaları ile üçüncü parti API bağımlılığı olmadan %100 yerli hesaplama motoru.
