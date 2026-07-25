/**
 * Hediye görsellerini uygulamaya hazırlar.
 *
 * Görsel üreten yapay zekalar "transparent background" dendiğinde şeffaflığı temsil eden
 * gri-beyaz damalı deseni resmin İÇİNE çizer - alpha kanalı opak kalır. Bu script o zemini
 * kenarlardan flood-fill ile siler (objenin içindeki gri tonlara dokunmaz), kenarları
 * yumuşatır ve dosyayı makul boyuta küçültür.
 *
 * Kullanım:
 *   node scripts/clean-gift-artwork.mjs                 # src/assets/gifts içindeki tüm PNG'ler
 *   node scripts/clean-gift-artwork.mjs firework.png    # tek dosya
 *
 * Orijinaller frontend/.artwork-originals/ altına yedeklenir (bir kez; tekrar çalıştırınca
 * yedeğin üstüne yazmaz, yani script iki kez çalışsa görsel bozulmaz). Yedekler assets
 * klasörünün DIŞINDA tutulur, yoksa Vite onları da uygulama paketine katar.
 */
import { createRequire } from 'node:module';
import { readdirSync, existsSync, copyFileSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GIFTS_DIR = resolve(HERE, '../src/assets/gifts');
const BACKUP_DIR = resolve(HERE, '../.artwork-originals');

// pngjs frontend'in bağımlılığı değil - backend'inkini kullanıyoruz, tek seferlik araç için yeterli
const require = createRequire(import.meta.url);
let PNG;
try {
    ({ PNG } = require('pngjs'));
} catch {
    ({ PNG } = require(resolve(HERE, '../../backend/node_modules/pngjs')));
}

const TARGET_SIZE = 1024;   // 2048 gereksiz; ekranda en fazla ~260px gösteriliyor
const GRAY_TOLERANCE = 14;  // R/G/B birbirine bu kadar yakınsa "gri" sayılır
const CHECKER_MIN = 55;     // damalı desenin koyu ve açık tonları bu aralıkta
const CHECKER_MAX = 150;

const isBackgroundGray = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min > GRAY_TOLERANCE) return false;
    const v = (r + g + b) / 3;
    return v >= CHECKER_MIN && v <= CHECKER_MAX;
};

/** Kenarlardan içeri doğru yayılarak zemini siler. Objenin içindeki grilere ulaşamaz. */
const floodFillBackground = png => {
    const { width: w, height: h, data } = png;
    const removed = new Uint8Array(w * h);
    const queue = [];

    const push = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (removed[p]) return;
        const i = p * 4;
        if (!isBackgroundGray(data[i], data[i + 1], data[i + 2])) return;
        removed[p] = 1;
        queue.push(p);
    };

    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

    while (queue.length) {
        const p = queue.pop();
        const x = p % w;
        const y = (p - x) / w;
        push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }

    for (let p = 0; p < w * h; p++) if (removed[p]) data[p * 4 + 3] = 0;
    return removed;
};

/**
 * Zemin ile obje arasındaki yumuşatma pikselleri yarı gri kalır ve silinince
 * objenin çevresinde gri bir hale bırakır. Bunları griliği oranında saydamlaştırır.
 */
const featherEdges = (png, removed) => {
    const { width: w, height: h, data } = png;
    const next = new Uint8Array(data.length / 4);
    for (let p = 0; p < w * h; p++) {
        if (removed[p]) continue;
        const x = p % w;
        const y = (p - x) / w;
        let touchesHole = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (removed[ny * w + nx]) { touchesHole = true; break; }
        }
        if (!touchesHole) continue;
        const i = p * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const grayness = 1 - Math.min(1, (max - min) / 40); // 1 = tam gri, 0 = renkli
        next[p] = Math.round(data[i + 3] * (1 - grayness * 0.85));
    }
    for (let p = 0; p < w * h; p++) if (next[p]) data[p * 4 + 3] = next[p];
};

/** Alpha'yı önceden çarparak küçültür - yoksa şeffaf kenarlarda koyu hale oluşur. */
const downscale = (png, target) => {
    const { width: w, height: h, data } = png;
    if (w <= target && h <= target) return png;
    const factor = Math.ceil(Math.max(w, h) / target);
    const nw = Math.floor(w / factor);
    const nh = Math.floor(h / factor);
    const out = new PNG({ width: nw, height: nh });

    for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
            let r = 0, g = 0, b = 0, a = 0, n = 0;
            for (let dy = 0; dy < factor; dy++) {
                for (let dx = 0; dx < factor; dx++) {
                    const i = ((y * factor + dy) * w + (x * factor + dx)) * 4;
                    const al = data[i + 3] / 255;
                    r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al;
                    a += data[i + 3];
                    n++;
                }
            }
            const avgA = a / n;
            const o = (y * nw + x) * 4;
            const un = avgA > 0 ? (n * 255) / (a || 1) : 0;
            out.data[o] = Math.min(255, Math.round((r / n) * un));
            out.data[o + 1] = Math.min(255, Math.round((g / n) * un));
            out.data[o + 2] = Math.min(255, Math.round((b / n) * un));
            out.data[o + 3] = Math.round(avgA);
        }
    }
    return out;
};

const prepare = file => {
    const path = join(GIFTS_DIR, file);
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, file);
    if (!existsSync(backup)) copyFileSync(path, backup);

    const before = statSync(backup).size;
    const png = PNG.sync.read(readFileSync(backup));

    let transparentBefore = 0;
    for (let i = 3; i < png.data.length; i += 4) if (png.data[i] < 16) transparentBefore++;

    const removed = floodFillBackground(png);
    featherEdges(png, removed);
    const out = downscale(png, TARGET_SIZE);

    let cleared = 0;
    for (let i = 3; i < out.data.length; i += 4) if (out.data[i] < 16) cleared++;
    const totalOut = out.data.length / 4;

    writeFileSync(path, PNG.sync.write(out, { deflateLevel: 9 }));
    const after = statSync(path).size;

    console.log(
        `✔️  ${file}\n` +
        `    ${png.width}x${png.height} → ${out.width}x${out.height}` +
        `   ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024).toFixed(0)} KB\n` +
        `    şeffaf piksel: %${Math.round(transparentBefore / (png.data.length / 4) * 100)}` +
        ` → %${Math.round(cleared / totalOut * 100)}`
    );
};

const arg = process.argv[2];
const files = arg ? [arg] : readdirSync(GIFTS_DIR).filter(f => /\.png$/i.test(f));

if (!files.length) {
    console.log('src/assets/gifts içinde işlenecek PNG yok.');
} else {
    for (const f of files) prepare(f);
    console.log(`\n✅ ${files.length} görsel hazırlandı. Orijinaller *.original.png olarak duruyor.`);
}
