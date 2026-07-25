/**
 * Parti odası FULLSCREEN hediyeleri için Lottie efekt katmanı üretir.
 *
 * Üretilen dosyalar hediyenin *arka plan efektidir* — hediyenin kendi ikonu
 * (emoji) GiftAnimationOverlay tarafından bunun üstüne bindirilir. Böylece
 * 10 hediyenin hepsi tek elden, tutarlı ve premium görünür; ileride herhangi
 * birinin yerine gerçek bir Lottie dosyası konmak istenirse sadece o hediyenin
 * animationUrl'i Admin panelinden değiştirilir.
 *
 * Çalıştır: node scripts/generate-gift-lottie.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/lottie');

const W = 512;
const H = 512;
const CX = W / 2;
const CY = H / 2;
const FR = 60;
const DUR = 150; // 2.5 saniye

// ---------------------------------------------------------------- yardımcılar

const hex = h => {
    const n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const k = v => ({ a: 0, k: v });

/**
 * Animasyonlu özellik. frames: [[frame, value], ...]
 * Değerler skaler ya da dizi olabilir; araya easeOut tanjantları koyar.
 */
const anim = frames => {
    const first = frames[0][1];
    const dims = Array.isArray(first) ? first.length : 1;
    const tan = (x, y) => (dims === 1 ? { x: [x], y: [y] } : { x: Array(dims).fill(x), y: Array(dims).fill(y) });
    return {
        a: 1,
        k: frames.map(([t, v], i) => {
            const key = { t: Math.round(t), s: Array.isArray(v) ? v : [v] };
            if (i < frames.length - 1) {
                key.i = tan(0.25, 1);
                key.o = tan(0.4, 0);
            }
            return key;
        })
    };
};

const group = (items, tr = {}) => ({
    ty: 'gr',
    nm: 'g',
    it: [
        ...items,
        {
            ty: 'tr',
            p: tr.p ?? k([0, 0]),
            a: tr.a ?? k([0, 0]),
            s: tr.s ?? k([100, 100]),
            r: tr.r ?? k(0),
            o: tr.o ?? k(100),
            sk: k(0),
            sa: k(0),
            nm: 'tr'
        }
    ]
});

const ellipse = (size, pos = [0, 0]) => ({ ty: 'el', d: 1, s: k(size), p: k(pos), nm: 'el' });
const rect = (size, pos = [0, 0], round = 0) => ({ ty: 'rc', d: 1, s: k(size), p: k(pos), r: k(round), nm: 'rc' });
const star = (outer, inner, points = 4) => ({
    ty: 'sr', sy: 1, d: 1, pt: k(points), p: k([0, 0]), r: k(0),
    ir: k(inner), is: k(0), or: k(outer), os: k(0), nm: 'sr'
});
const fill = (color, o = 100) => ({ ty: 'fl', c: k(color), o: k(o), r: 1, bm: 0, nm: 'fl' });
const stroke = (color, w, o = 100) => ({ ty: 'st', c: k(color), o: k(o), w: k(w), lc: 2, lj: 2, ml: 4, bm: 0, nm: 'st' });
const trim = (s, e) => ({ ty: 'tm', s, e, o: k(0), m: 1, nm: 'tm' });

const layer = (nm, shapes, ks = {}, ip = 0, op = DUR) => ({
    ddd: 0, ind: 0, ty: 4, nm, sr: 1, ao: 0,
    ks: {
        o: ks.o ?? k(100),
        r: ks.r ?? k(0),
        p: ks.p ?? k([CX, CY, 0]),
        a: ks.a ?? k([0, 0, 0]),
        s: ks.s ?? k([100, 100, 100])
    },
    shapes, ip, op, st: 0, bm: 0
});

// Deterministik sözde-rastgele — her çalıştırmada aynı dosyayı üretsin diye
const rnd = (i, salt = 1) => (((i * 9301 + salt * 49297) % 233280) / 233280);

// ------------------------------------------------------------------ efektler

/** Merkezden dışa saçılan parçacıklar. */
const burst = ({ colors, count = 26, radius = 210, start = 0, span = 55, size = 15, shape = 'circle' }) =>
    Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + rnd(i, 3) * 0.35;
        const dist = radius * (0.55 + rnd(i, 7) * 0.55);
        const t0 = start + (i % 5) * 2;
        const t1 = t0 + span;
        const sz = size * (0.55 + rnd(i, 11) * 0.8);
        const body = shape === 'star' ? star(sz, sz * 0.42, 4) : ellipse([sz, sz]);
        return group([body, fill(colors[i % colors.length])], {
            p: anim([[t0, [0, 0]], [t1, [Math.cos(angle) * dist, Math.sin(angle) * dist]]]),
            s: anim([[t0, [115, 115]], [t1, [0, 0]]]),
            o: anim([[t0, 100], [t0 + span * 0.55, 100], [t1, 0]])
        });
    });

/** Genişleyerek sönen halka. */
const ring = ({ color, start = 0, end = 48, from = 15, to = 400, width = 9, opacity = 90 }) =>
    group([ellipse([100, 100]), stroke(color, width)], {
        s: anim([[start, [from, from]], [end, [to, to]]]),
        o: anim([[start, opacity], [end, 0]])
    });

/** Merkezden çıkan dönen ışınlar. */
const rays = ({ color, count = 14, length = 300, width = 9, spin = 40, start = 0, end = DUR }) =>
    layer('rays',
        Array.from({ length: count }, (_, i) =>
            group([rect([width, length], [0, -length / 2]), fill(color, 55)], {
                r: k((360 / count) * i),
                s: anim([[start, [0, 0]], [start + 30, [100, 100]], [end, [130, 130]]]),
                o: anim([[start, 0], [start + 18, 70], [end, 0]])
            })
        ),
        { r: anim([[start, 0], [end, spin]]) }
    );

/** Yörüngede dönen parıltılar. */
const orbit = ({ color, count = 8, radius = 150, start = 0, end = DUR, size = 20, spin = 200 }) =>
    layer('orbit',
        Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2;
            const t0 = start + i * 3;
            return group([star(size, size * 0.4, 4), fill(color)], {
                p: k([Math.cos(a) * radius, Math.sin(a) * radius]),
                s: anim([[t0, [0, 0]], [t0 + 25, [110, 110]], [end - 20, [90, 90]], [end, [0, 0]]]),
                o: anim([[t0, 0], [t0 + 18, 100], [end - 15, 100], [end, 0]])
            });
        }),
        { r: anim([[start, 0], [end, spin]]) }
    );

/** Yukarıdan düşen konfeti. */
const confetti = ({ colors, count = 30, start = 0, end = DUR }) =>
    layer('confetti',
        Array.from({ length: count }, (_, i) => {
            const x = -CX + rnd(i, 5) * W;
            const t0 = start + Math.floor(rnd(i, 13) * 40);
            const t1 = end - Math.floor(rnd(i, 17) * 25);
            return group([rect([9, 18], [0, 0], 2), fill(colors[i % colors.length])], {
                p: anim([[t0, [x, -CY - 30]], [t1, [x + (rnd(i, 19) - 0.5) * 90, CY + 40]]]),
                r: anim([[t0, 0], [t1, 180 + rnd(i, 23) * 360]]),
                o: anim([[t0, 0], [t0 + 10, 100], [t1 - 15, 100], [t1, 0]])
            });
        })
    );

/** Ekranı yatay kesen hız çizgileri. */
const speedLines = ({ colors, count = 16, start = 0, span = 45 }) =>
    layer('speed',
        Array.from({ length: count }, (_, i) => {
            const y = -CY + rnd(i, 29) * H;
            const len = 90 + rnd(i, 31) * 200;
            const t0 = start + (i % 6) * 4;
            const t1 = t0 + span;
            return group([rect([len, 6], [0, 0], 3), fill(colors[i % colors.length])], {
                p: anim([[t0, [-CX - len, y]], [t1, [CX + len, y]]]),
                o: anim([[t0, 0], [t0 + 8, 85], [t1 - 10, 85], [t1, 0]])
            });
        })
    );

/** Dönen spiral iz. */
const swirl = ({ color, start = 0, end = DUR, radius = 170, width = 12 }) =>
    layer('swirl',
        [
            group([ellipse([radius * 2, radius * 2]), stroke(color, width), trim(anim([[start, 0], [end, 85]]), anim([[start, 5], [end, 100]]))]),
            group([ellipse([radius * 1.35, radius * 1.35]), stroke(color, width * 0.7, 70), trim(anim([[start, 10], [end, 95]]), anim([[start, 0], [end, 100]]))], {
                r: anim([[start, 0], [end, -180]])
            })
        ],
        {
            r: anim([[start, 0], [end, 300]]),
            o: anim([[start, 0], [start + 20, 100], [end - 25, 100], [end, 0]])
        }
    );

/** Merkezdeki yumuşak parlama — iç içe halkalarla. */
const glow = ({ color, start = 0, peak = 28, end = DUR, radius = 230 }) =>
    layer('glow',
        [0.4, 0.62, 0.82, 1].map((f, i) =>
            group([ellipse([radius * 2 * f, radius * 2 * f]), fill(color, 22 - i * 4)])
        ),
        {
            s: anim([[start, [30, 30, 100]], [peak, [110, 110, 100]], [end, [135, 135, 100]]]),
            o: anim([[start, 0], [peak, 100], [end, 0]])
        }
    );

/** Yukarı süzülen kabarcıklar. */
const bubbles = ({ color, count = 22, start = 0, end = DUR }) =>
    layer('bubbles',
        Array.from({ length: count }, (_, i) => {
            const x = -CX + rnd(i, 37) * W;
            const sz = 10 + rnd(i, 41) * 26;
            const t0 = start + Math.floor(rnd(i, 43) * 45);
            const t1 = end - Math.floor(rnd(i, 47) * 20);
            return group([ellipse([sz, sz]), stroke(color, 3, 80), fill(color, 18)], {
                p: anim([[t0, [x, CY + 40]], [t1, [x + (rnd(i, 53) - 0.5) * 70, -CY - 30]]]),
                o: anim([[t0, 0], [t0 + 12, 100], [t1 - 20, 100], [t1, 0]])
            });
        })
    );

// ------------------------------------------------------------- kompozisyonlar

const build = (nm, layers) => ({
    v: '5.7.4',
    fr: FR,
    ip: 0,
    op: DUR,
    w: W,
    h: H,
    nm,
    ddd: 0,
    assets: [],
    layers: layers.filter(Boolean).map((l, i) => ({ ...l, ind: i + 1 }))
});

const compositions = {
    // 🎆 Havai Fişek — art arda üç patlama
    firework: () => {
        const gold = hex('#FFC640'), pink = hex('#FF5FA2'), cyan = hex('#5FD8FF'), white = hex('#FFFFFF');
        return build('firework', [
            layer('burst-3', burst({ colors: [cyan, white], count: 22, radius: 240, start: 55, span: 60, size: 13 })),
            layer('burst-2', burst({ colors: [pink, white], count: 24, radius: 200, start: 28, span: 58, size: 14 })),
            layer('burst-1', burst({ colors: [gold, white], count: 28, radius: 220, start: 0, span: 55, size: 16, shape: 'star' })),
            layer('rings', [
                ring({ color: gold, start: 0, end: 45, to: 380 }),
                ring({ color: pink, start: 28, end: 78, to: 340, width: 7 }),
                ring({ color: cyan, start: 55, end: 105, to: 300, width: 6 })
            ]),
            glow({ color: gold, peak: 22, end: 110 })
        ]);
    },

    // 🏎️ Spor Araba — hız çizgileri ve toz bulutu
    car: () => {
        const red = hex('#FF3B3B'), white = hex('#FFFFFF'), amber = hex('#FFB020');
        return build('car', [
            speedLines({ colors: [white, red, amber], count: 20, start: 0, span: 42 }),
            layer('dust', burst({ colors: [white, amber], count: 20, radius: 190, start: 20, span: 55, size: 17 })),
            layer('rings', [ring({ color: red, start: 12, end: 60, to: 360, width: 10 })]),
            glow({ color: red, peak: 26, end: 105, radius: 200 })
        ]);
    },

    // 💍 Yüzük — parıltı yörüngesi ve halkalar
    ring: () => {
        const gold = hex('#FFD874'), white = hex('#FFFFFF'), rose = hex('#FF9EC4');
        return build('ring', [
            orbit({ color: white, count: 10, radius: 165, size: 22, spin: 240, end: 130 }),
            layer('sparks', burst({ colors: [gold, white], count: 18, radius: 175, start: 10, span: 60, size: 13, shape: 'star' })),
            layer('rings', [
                ring({ color: gold, start: 0, end: 55, to: 330, width: 11 }),
                ring({ color: rose, start: 30, end: 90, to: 280, width: 7 })
            ]),
            glow({ color: gold, peak: 30, end: 120 })
        ]);
    },

    // 💎 Şanslı Elmas — ışınlar ve buz parıltısı
    lucky_diamond: () => {
        const cyan = hex('#7FE7FF'), white = hex('#FFFFFF'), violet = hex('#A98CFF');
        return build('lucky_diamond', [
            layer('sparks', burst({ colors: [white, cyan], count: 24, radius: 210, start: 12, span: 62, size: 15, shape: 'star' })),
            orbit({ color: cyan, count: 6, radius: 140, size: 24, spin: -200, end: 135 }),
            rays({ color: cyan, count: 16, length: 320, width: 8, spin: 45, end: 130 }),
            layer('rings', [
                ring({ color: white, start: 0, end: 50, to: 350, width: 10 }),
                ring({ color: violet, start: 32, end: 92, to: 300, width: 7 })
            ]),
            glow({ color: cyan, peak: 28, end: 125 })
        ]);
    },

    // 🛥️ Yat — su kabarcıkları ve dalga halkaları
    yacht: () => {
        const blue = hex('#4FB6FF'), white = hex('#FFFFFF'), deep = hex('#2C6BD1');
        return build('yacht', [
            bubbles({ color: white, count: 24, end: 140 }),
            layer('spray', burst({ colors: [white, blue], count: 20, radius: 200, start: 15, span: 60, size: 16 })),
            layer('waves', [
                ring({ color: blue, start: 0, end: 58, to: 380, width: 12 }),
                ring({ color: white, start: 26, end: 88, to: 330, width: 8 }),
                ring({ color: deep, start: 52, end: 114, to: 280, width: 6 })
            ]),
            glow({ color: blue, peak: 30, end: 130, radius: 220 })
        ]);
    },

    // 🏰 Kozmik Şato — kraliyet ışınları ve konfeti
    castle: () => {
        const purple = hex('#B27BFF'), gold = hex('#FFD874'), white = hex('#FFFFFF');
        return build('castle', [
            confetti({ colors: [gold, purple, white], count: 34, end: 145 }),
            layer('sparks', burst({ colors: [gold, white], count: 22, radius: 215, start: 14, span: 60, size: 15, shape: 'star' })),
            rays({ color: purple, count: 18, length: 340, width: 10, spin: 35, end: 135 }),
            layer('rings', [
                ring({ color: gold, start: 0, end: 55, to: 370, width: 11 }),
                ring({ color: purple, start: 30, end: 95, to: 320, width: 8 })
            ]),
            glow({ color: purple, peak: 30, end: 130, radius: 240 })
        ]);
    },

    // ✈️ Özel Jet — hız çizgileri ve gümüş patlama
    jet: () => {
        const silver = hex('#DCE7F5'), blue = hex('#5FA8FF'), white = hex('#FFFFFF');
        return build('jet', [
            speedLines({ colors: [white, silver, blue], count: 22, start: 0, span: 40 }),
            layer('trail', burst({ colors: [silver, blue], count: 24, radius: 230, start: 18, span: 58, size: 14 })),
            rays({ color: blue, count: 12, length: 300, width: 7, spin: -40, end: 125 }),
            layer('rings', [
                ring({ color: white, start: 8, end: 58, to: 360, width: 10 }),
                ring({ color: blue, start: 34, end: 94, to: 310, width: 7 })
            ]),
            glow({ color: blue, peak: 28, end: 120, radius: 225 })
        ]);
    },

    // 🐉 Ejderha — ateş girdabı ve kor parçacıkları
    dragon: () => {
        const fire = hex('#FF6B2C'), ember = hex('#FFC24A'), crimson = hex('#FF2D55');
        return build('dragon', [
            layer('embers', burst({ colors: [ember, fire], count: 30, radius: 245, start: 20, span: 65, size: 17 })),
            swirl({ color: fire, radius: 185, width: 14, end: 140 }),
            layer('sparks', burst({ colors: [crimson, ember], count: 20, radius: 165, start: 0, span: 55, size: 13, shape: 'star' })),
            layer('rings', [
                ring({ color: crimson, start: 0, end: 55, to: 390, width: 13 }),
                ring({ color: ember, start: 30, end: 95, to: 330, width: 9 })
            ]),
            glow({ color: fire, peak: 30, end: 138, radius: 250 })
        ]);
    },

    // 🌌 Şanslı Galaksi — yıldız girdabı
    lucky_galaxy: () => {
        const violet = hex('#9D6BFF'), cyan = hex('#67E8F9'), pink = hex('#FF7AC8'), white = hex('#FFFFFF');
        return build('lucky_galaxy', [
            layer('stardust', burst({ colors: [white, cyan, pink], count: 32, radius: 250, start: 15, span: 70, size: 12, shape: 'star' })),
            orbit({ color: white, count: 12, radius: 175, size: 18, spin: 320, end: 145 }),
            swirl({ color: violet, radius: 195, width: 15, end: 145 }),
            swirl({ color: cyan, radius: 130, width: 10, start: 15, end: 145 }),
            layer('rings', [
                ring({ color: violet, start: 0, end: 60, to: 400, width: 12 }),
                ring({ color: pink, start: 35, end: 100, to: 340, width: 8 })
            ]),
            glow({ color: violet, peak: 32, end: 142, radius: 255 })
        ]);
    },

    // 🎠 Aşk Arabası — pembe konfeti ve kalp rengi halkalar
    carriage: () => {
        const pink = hex('#FF7AB8'), gold = hex('#FFD874'), white = hex('#FFFFFF'), lilac = hex('#C9A7FF');
        return build('carriage', [
            confetti({ colors: [pink, gold, white, lilac], count: 36, end: 145 }),
            orbit({ color: gold, count: 10, radius: 160, size: 20, spin: 260, end: 140 }),
            layer('sparks', burst({ colors: [pink, white], count: 24, radius: 210, start: 12, span: 62, size: 15, shape: 'star' })),
            layer('rings', [
                ring({ color: pink, start: 0, end: 58, to: 385, width: 12 }),
                ring({ color: gold, start: 32, end: 98, to: 325, width: 8 }),
                ring({ color: lilac, start: 60, end: 125, to: 275, width: 6 })
            ]),
            glow({ color: pink, peak: 30, end: 140, radius: 245 })
        ]);
    }
};

// ------------------------------------------------------------------ çalıştır

mkdirSync(OUT_DIR, { recursive: true });

let total = 0;
for (const [giftKey, make] of Object.entries(compositions)) {
    const json = make();
    const path = resolve(OUT_DIR, `${giftKey}.json`);
    const body = JSON.stringify(json);
    writeFileSync(path, body);
    total += body.length;
    console.log(`✔️  ${giftKey}.json — ${json.layers.length} katman, ${(body.length / 1024).toFixed(1)} KB`);
}
console.log(`\n✅ ${Object.keys(compositions).length} animasyon üretildi (toplam ${(total / 1024).toFixed(1)} KB) → public/lottie/`);
