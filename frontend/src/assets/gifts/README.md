# Hediye görselleri

Bu klasör parti odası hediyelerinin **gerçek çizimlerini** tutar.

## Nasıl eklenir

Dosyayı `<giftKey>.png` adıyla bu klasöre koy — hepsi bu. Kod değişikliği gerekmez;
Vite klasörü derleme sırasında tarar ve görseli olan hediye otomatik olarak çizimiyle,
olmayan emojisiyle gösterilir. (`webp` ve `svg` de kabul edilir; `webp` daha küçük olur.)

Dev sunucusu açıkken dosya eklersen Vite sayfayı yeniler.

**Kurallar**
- Arka plan **gerçekten şeffaf** olmalı (PNG alpha kanalı). Dikkat: görsel üreten yapay zekalar
  "transparent background" dendiğinde çoğu zaman şeffaflığı *temsil eden* gri-beyaz damalı deseni
  resmin içine çiziyor. Bu durumda hediye ekranda kare bir levha gibi görünür.
  Kontrol: dosyayı koyu renkli bir arka planın üstünde aç — dama görüyorsan alpha yok demektir.
  Çözümü aşağıda, "Şeffaflık sorunu" başlığında.
- Kare olsun (1024×1024 ideal), obje ortalı, kenarlarda biraz boşluk bırak.
- Dosya başına ~300 KB'ı geçmesin. Büyükse `webp`e çevir.
- Zemin gölgesi çizdirme — uygulama kendi gölgesini ve parlamasını ekliyor.

## Dosya adları

| Dosya adı | Hediye | Fiyat |
|---|---|---|
| `firework.png` | Havai Fişek | 300 |
| `car.png` | Spor Araba | 500 |
| `ring.png` | Yüzük | 600 |
| `lucky_diamond.png` | Şanslı Elmas | 1.000 |
| `yacht.png` | Yat | 3.000 |
| `castle.png` | Kozmik Şato | 5.000 |
| `jet.png` | Özel Jet | 8.000 |
| `dragon.png` | Ejderha | 10.000 |
| `lucky_galaxy.png` | Şanslı Galaksi | 12.000 |
| `carriage.png` | Aşk Arabası | 20.000 |

---

## AI prompt'ları

Hepsi tek bir set gibi durmalı — bu yüzden **ortak stil bloğunu her prompt'un başına aynen
yapıştır**, sonuna da o hediyenin konu satırını ekle. Stil bloğunu değiştirirsen hepsinde
değiştir, yoksa hediyeler birbirinden kopuk görünür.

### Ortak stil bloğu

```
3D rendered mobile game gift icon, glossy premium finish, smooth polished surfaces,
soft studio lighting with a bright rim light from the upper left, vibrant saturated colors,
subtle inner glow, three-quarter view, single centered object, generous padding around the
subject, isolated on a plain solid pure black background, no ground, no shadow, no text,
no watermark, no border, no checkerboard pattern, highly detailed, cohesive collectible
icon set style, square 1024x1024
```

> Arka planı bilerek **düz siyah** istiyoruz, "transparent" değil — sebebi aşağıda.

### Konu satırları

**firework.png**
```
Subject: a festive golden firework shell bursting into radiant streaks, gold and hot pink
and cyan sparks radiating outward, glowing core
```

**car.png**
```
Subject: a sleek red supercar seen from a dynamic three-quarter front angle, glossy candy
red paint, chrome and amber accents, wheels slightly blurred with motion
```

**ring.png**
```
Subject: an elegant gold engagement ring standing upright, large brilliant-cut diamond on top
catching the light, warm gold band with delicate rose-gold detailing, sparkle highlights
```

**lucky_diamond.png**
```
Subject: a large faceted gemstone floating upright, icy cyan and white crystal with violet
inner refractions, razor-sharp facets, prismatic light caustics
```

**yacht.png**
```
Subject: a luxury white motor yacht at a three-quarter angle, gleaming white hull with deep
blue and chrome trim, crisp foam spray curling at the bow
```

**castle.png**
```
Subject: a fairytale castle floating in space, ivory walls with violet and gold spires,
glowing windows, small purple nebula wisps drifting around the base
```

**jet.png**
```
Subject: a private jet banking in a three-quarter view, brushed silver fuselage with blue
racing stripes, polished chrome engines, faint blue vapor trailing from the wingtips
```

**dragon.png**
```
Subject: a majestic eastern dragon coiled in an S-curve, molten orange and crimson scales
with amber underglow, wisps of fire curling around its body, glowing eyes
```

**lucky_galaxy.png**
```
Subject: a swirling spiral galaxy orb, deep violet and cyan nebula clouds with pink hot spots,
bright dense core, scattered white stars, contained in a clean circular silhouette
```

**carriage.png**
```
Subject: an ornate fairytale carriage, blush pink body with gold filigree scrollwork, gilded
spoked wheels, small heart motifs, lilac velvet curtains in the windows
```

---

## Şeffaflık sorunu

Görsel üreten yapay zekalara "transparent background" demek genelde **işe yaramaz** — model
şeffaflığı bir kavram olarak anlamaz, onun yerine şeffaflığı temsil eden gri-beyaz damalı deseni
resmin içine çizer. Sonuç: alpha kanalı olmayan, damalı zeminli kare bir resim.

Bu yüzden prompt'ta **düz siyah arka plan** istiyoruz. Siyahı sonradan silmek 30 saniyelik iş:

**Photopea ile** (ücretsiz, tarayıcıda çalışır, kurulum yok — photopea.com)
1. Dosyayı aç
2. `Select` → `Color Range`, siyah alana tıkla, `Fuzziness` ~40 yap, OK
3. `Delete` tuşu
4. `Select` → `Deselect`, sonra `File` → `Export as` → `PNG`

**Kontrol:** dosyayı koyu bir arka planın üstünde aç. Objenin çevresinde kare bir kenar ya da
dama deseni görüyorsan alpha hâlâ yok demektir.

Havai fişek, ejderha ateşi, galaksi gibi **parlak-ışıklı** hediyelerde alternatif bir yol daha var:
siyah zemini hiç silmeden, uygulamada `screen` karışım modu ile basmak — siyah otomatik olarak
kaybolur. Bu yol sadece koyu gövdesi olmayan efekt tipi hediyelerde işe yarar (araba, şato, yat
gibi katı objelerde koyu bölgeler de silinir). İhtiyaç olursa kodda hediye bazında açılabilir.

---

## Not

Görsellerin arkasında zaten seviyeye göre renklenen bir Lottie efekt katmanı oynuyor
(`frontend/public/lottie/<giftKey>.json`, üreten script: `frontend/scripts/generate-gift-lottie.mjs`).
Konu satırlarındaki renkler o paletle eşleşiyor — kendi prompt'unu yazarken renkleri
korursan efekt ve çizim uyumlu kalır.
