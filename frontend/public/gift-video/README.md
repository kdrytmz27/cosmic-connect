# Render edilmiş hediye animasyonları (alfa kanallı video)

Lottie yalnızca **vektör** taşır. 3D render, doku, hacimli parçacık, gerçek ışık gibi şeyler
vektöre sığmadığı için canlı yayın uygulamalarının hediyeleri farklı görünür — onlar render
edilmiş kare dizisi oynatır. Bu klasör o yolu açar.

## Nasıl eklenir

1. Videoyu `<giftKey>.webm` adıyla bu klasöre koy (ör. `dragon.webm`)
2. Hediyenin `animationUrl` alanını `/gift-video/dragon.webm` yap — Admin panelinden ya da
   `backend/scripts/seed-party-gifts.ts` içinden

Oynatıcı seçimi **uzantıdan otomatik** yapılır: `.json` → Lottie, `.webm/.mp4/.mov` → video.
Kod değişikliği gerekmez.

## Video gereksinimleri

- **Alfa kanallı VP9 (ya da VP8) WebM.** Alfa yoksa hediye siyah bir dikdörtgen olarak görünür.
- Kare: 1024×1024 civarı yeterli, ekranda en fazla ~450px gösteriliyor
- Süre: 2–4 saniye. Uzun animasyonlar hızlı combo'da kuyruk biriktirir
- Boyut: hediye başına 500 KB–1.5 MB makul. Katalog büyüdükçe toplam paket boyutu önemli
- **Ses istemiyoruz** — oynatıcı `muted` çalışır, ses kanalı boşuna yer kaplar

ffmpeg ile alfa kanalını koruyarak dönüştürme (kaynakta alfa varsa):

```bash
ffmpeg -i kaynak.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 1M -an cikti.webm
```

`-pix_fmt yuva420p` kritik — `yuv420p` yazarsan alfa kanalı sessizce düşer.

## Önemli: iOS

Chromium (Android WebView, tarayıcı) alfa kanallı WebM'i doğrudan oynatır. **WKWebView oynatmaz** —
iOS'ta alfa için HEVC kodlu `.mov` gerekir ve onu da Chromium oynatmaz. Yani iOS'a paketlendiğinde
her hediye için iki dosya ve kaynak listesi gerekecek.

Proje şu an yalnızca Android'e paketlendiği için (`frontend/android/`, iOS klasörü yok) tek WebM
yeterli. iOS'a çıkılacağı zaman `AlphaVideoPlayer` çoklu `<source>` destekleyecek şekilde
genişletilmeli.

## Emniyet

Video bozuksa, çözücü takılırsa ya da otomatik oynatma reddedilirse oynatıcı hediyeyi bitmiş
sayar ve katman kapanır. Ayrıca hangi oynatıcı olursa olsun 10 saniyelik bir emniyet süresi var —
hediye katmanı hiçbir koşulda ekranda asılı kalmaz.
