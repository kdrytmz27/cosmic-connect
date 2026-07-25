/**
 * Hediye görselleri.
 *
 * Bir hediyeye gerçek çizim eklemek için tek yapman gereken, dosyayı
 * `src/assets/gifts/<giftKey>.png` olarak koymak (webp ve svg de olur).
 * Vite derleme sırasında klasörü tarar; kod değişikliği gerekmez.
 * Görseli olmayan hediye emojisiyle gösterilmeye devam eder.
 *
 * Ayrıntı ve hazır AI prompt'ları için: src/assets/gifts/README.md
 */
const modules = import.meta.glob('../../assets/gifts/*.{png,webp,svg}', {
    eager: true,
    query: '?url',
    import: 'default'
}) as Record<string, string>;

const byGiftKey: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
    const file = path.split('/').pop();
    if (!file) continue;
    byGiftKey[file.replace(/\.(png|webp|svg)$/i, '')] = url;
}

export const getGiftArtwork = (giftKey?: string | null): string | undefined =>
    giftKey ? byGiftKey[giftKey] : undefined;
