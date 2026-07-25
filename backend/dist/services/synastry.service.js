"use strict";
/**
 * Synastry Service — Gerçek gezegen pozisyonları ve açı analizi
 *
 * Moshier/Meeus algoritmaları kullanarak ekliptik boylamları hesaplar.
 * Güneş, Ay, Merkür, Venüs, Mars, Jüpiter, Satürn pozisyonları.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePlanetaryPositions = calculatePlanetaryPositions;
exports.calculateAspects = calculateAspects;
exports.calculateSynastryReport = calculateSynastryReport;
exports.calculateQuickSynastryScore = calculateQuickSynastryScore;
// ─── Constants ───────────────────────────────
const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
const ZODIAC_TR = {
    'Aries': 'Koç', 'Taurus': 'Boğa', 'Gemini': 'İkizler', 'Cancer': 'Yengeç',
    'Leo': 'Aslan', 'Virgo': 'Başak', 'Libra': 'Terazi', 'Scorpio': 'Akrep',
    'Sagittarius': 'Yay', 'Capricorn': 'Oğlak', 'Aquarius': 'Kova', 'Pisces': 'Balık'
};
const PLANET_TR = {
    'Sun': 'Güneş', 'Moon': 'Ay', 'Mercury': 'Merkür',
    'Venus': 'Venüs', 'Mars': 'Mars', 'Jupiter': 'Jüpiter', 'Saturn': 'Satürn'
};
const ASPECT_TYPES = [
    { name: 'conjunction', angle: 0, orb: 8, nature: 'neutral', symbol: '☌', tr: 'Kavuşum' },
    { name: 'sextile', angle: 60, orb: 6, nature: 'harmonious', symbol: '⚹', tr: 'Sekstil' },
    { name: 'square', angle: 90, orb: 7, nature: 'challenging', symbol: '□', tr: 'Kare' },
    { name: 'trine', angle: 120, orb: 8, nature: 'harmonious', symbol: '△', tr: 'Trigon' },
    { name: 'opposition', angle: 180, orb: 8, nature: 'challenging', symbol: '☍', tr: 'Karşıtlık' },
];
// ─── Astronomical Calculations ───────────────
function toJulianDay(date) {
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440;
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function normalizeAngle(angle) {
    angle = angle % 360;
    return angle < 0 ? angle + 360 : angle;
}
function rad(deg) {
    return deg * Math.PI / 180;
}
function deg(radian) {
    return radian * 180 / Math.PI;
}
/**
 * Güneş boylamı — Meeus algoritması (yüksek hassasiyet)
 */
function calculateSunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
    // Güneşin ortalama boylamı
    const L0 = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    // Güneşin ortalama anomalisi
    const M = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const Mr = rad(M);
    // Denklem merkezi
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
        + 0.000289 * Math.sin(3 * Mr);
    // Güneşin gerçek boylamı
    let sunLon = L0 + C;
    // Nütasyon düzeltmesi (basitleştirilmiş)
    const omega = 125.04 - 1934.136 * T;
    sunLon = sunLon - 0.00569 - 0.00478 * Math.sin(rad(omega));
    return normalizeAngle(sunLon);
}
/**
 * Ay boylamı — Meeus (ELP2000 basitleştirilmiş)
 */
function calculateMoonLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    // Ay'ın ortalama boylamı
    const Lp = normalizeAngle(218.3165 + 481267.8813 * T);
    // Ay'ın ortalama anomalisi
    const D = normalizeAngle(297.8502 + 445267.1115 * T);
    const M = normalizeAngle(357.5291 + 35999.0503 * T);
    const Mp = normalizeAngle(134.9634 + 477198.8676 * T);
    const F = normalizeAngle(93.2720 + 483202.0175 * T);
    // Ana pertürbasyon terimleri
    let moonLon = Lp
        + 6.289 * Math.sin(rad(Mp))
        - 1.274 * Math.sin(rad(2 * D - Mp))
        + 0.658 * Math.sin(rad(2 * D))
        + 0.214 * Math.sin(rad(2 * Mp))
        - 0.186 * Math.sin(rad(M))
        - 0.114 * Math.sin(rad(2 * F))
        + 0.059 * Math.sin(rad(2 * D - 2 * Mp))
        + 0.057 * Math.sin(rad(2 * D - M - Mp))
        + 0.053 * Math.sin(rad(2 * D + Mp))
        + 0.046 * Math.sin(rad(2 * D - M))
        - 0.041 * Math.sin(rad(M - Mp))
        - 0.035 * Math.sin(rad(D))
        - 0.031 * Math.sin(rad(M + Mp))
        + 0.015 * Math.sin(rad(2 * F - 2 * D));
    return normalizeAngle(moonLon);
}
/**
 * Merkür boylamı
 */
function calculateMercuryLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L = normalizeAngle(252.2509 + 149474.0722 * T);
    const M = normalizeAngle(174.7948 + 149472.5153 * T);
    const Mr = rad(M);
    const lon = L
        + 23.4400 * Math.sin(Mr)
        + 2.9818 * Math.sin(2 * Mr)
        + 0.5255 * Math.sin(3 * Mr)
        + 0.1058 * Math.sin(4 * Mr);
    // Heliocentric → geocentric: basitleştirilmiş (güneş pozisyonuyla düzeltme)
    const sunLon = calculateSunLongitude(jd);
    // Merkür'ün güneşe yakın olması nedeniyle, iç gezegen olarak düzeltelim
    const diff = normalizeAngle(lon - sunLon);
    const geocentricLon = sunLon + Math.atan2(Math.sin(rad(diff)) * 0.387, 1 + Math.cos(rad(diff)) * 0.387) * 180 / Math.PI;
    return normalizeAngle(geocentricLon);
}
/**
 * Venüs boylamı
 */
function calculateVenusLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L = normalizeAngle(181.9798 + 58519.2130 * T);
    const M = normalizeAngle(50.4161 + 58517.8039 * T);
    const Mr = rad(M);
    const lon = L
        + 0.7758 * Math.sin(Mr)
        + 0.0033 * Math.sin(2 * Mr);
    const sunLon = calculateSunLongitude(jd);
    const diff = normalizeAngle(lon - sunLon);
    const geocentricLon = sunLon + Math.atan2(Math.sin(rad(diff)) * 0.723, 1 + Math.cos(rad(diff)) * 0.723) * 180 / Math.PI;
    return normalizeAngle(geocentricLon);
}
/**
 * Mars boylamı
 */
function calculateMarsLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L = normalizeAngle(355.4330 + 19141.6964 * T);
    const M = normalizeAngle(19.3730 + 19139.8585 * T);
    const Mr = rad(M);
    const lon = L
        + 10.6912 * Math.sin(Mr)
        + 0.6228 * Math.sin(2 * Mr)
        + 0.0503 * Math.sin(3 * Mr)
        + 0.0046 * Math.sin(4 * Mr);
    // Dış gezegen: heliocentric → geocentric
    const sunLon = calculateSunLongitude(jd);
    const diff = normalizeAngle(lon - sunLon);
    const r = 1.524; // Mars-Güneş ortalama mesafe (AU)
    const geocentricLon = sunLon + 180 + Math.atan2(Math.sin(rad(diff)), r - Math.cos(rad(diff))) * 180 / Math.PI;
    return normalizeAngle(geocentricLon);
}
/**
 * Jüpiter boylamı
 */
function calculateJupiterLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L = normalizeAngle(34.3515 + 3036.3027 * T);
    const M = normalizeAngle(20.0202 + 3034.6961 * T);
    const Mr = rad(M);
    const lon = L
        + 5.5549 * Math.sin(Mr)
        + 0.1683 * Math.sin(2 * Mr)
        + 0.0071 * Math.sin(3 * Mr);
    const sunLon = calculateSunLongitude(jd);
    const diff = normalizeAngle(lon - sunLon);
    const r = 5.203;
    const geocentricLon = sunLon + 180 + Math.atan2(Math.sin(rad(diff)), r - Math.cos(rad(diff))) * 180 / Math.PI;
    return normalizeAngle(geocentricLon);
}
/**
 * Satürn boylamı
 */
function calculateSaturnLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L = normalizeAngle(50.0774 + 1223.5110 * T);
    const M = normalizeAngle(317.0207 + 1222.1138 * T);
    const Mr = rad(M);
    const lon = L
        + 6.3585 * Math.sin(Mr)
        + 0.2204 * Math.sin(2 * Mr)
        + 0.0106 * Math.sin(3 * Mr);
    const sunLon = calculateSunLongitude(jd);
    const diff = normalizeAngle(lon - sunLon);
    const r = 9.537;
    const geocentricLon = sunLon + 180 + Math.atan2(Math.sin(rad(diff)), r - Math.cos(rad(diff))) * 180 / Math.PI;
    return normalizeAngle(geocentricLon);
}
// ─── Position & Aspect Analysis ──────────────
function longitudeToSign(longitude) {
    const signIndex = Math.floor(longitude / 30) % 12;
    const degree = longitude % 30;
    return { sign: ZODIAC_SIGNS[signIndex] || 'Aries', degree: Math.round(degree * 100) / 100 };
}
function calculatePlanetaryPositions(birthDate, birthTime) {
    // Doğum saatini parse et
    const [hourStr, minStr] = (birthTime || '12:00').split(':');
    const hours = parseInt(hourStr || '12', 10);
    const minutes = parseInt(minStr || '0', 10);
    const dt = new Date(birthDate);
    dt.setUTCHours(hours, minutes, 0, 0);
    const jd = toJulianDay(dt);
    const calculators = [
        ['Sun', calculateSunLongitude],
        ['Moon', calculateMoonLongitude],
        ['Mercury', calculateMercuryLongitude],
        ['Venus', calculateVenusLongitude],
        ['Mars', calculateMarsLongitude],
        ['Jupiter', calculateJupiterLongitude],
        ['Saturn', calculateSaturnLongitude],
    ];
    return calculators.map(([name, calcFn]) => {
        const longitude = calcFn(jd);
        const { sign, degree } = longitudeToSign(longitude);
        return {
            planet: name,
            longitude: Math.round(longitude * 100) / 100,
            sign,
            degree
        };
    });
}
function angleDifference(lon1, lon2) {
    let diff = Math.abs(lon1 - lon2);
    if (diff > 180)
        diff = 360 - diff;
    return diff;
}
function calculateAspects(planets1, planets2) {
    const aspects = [];
    for (const p1 of planets1) {
        for (const p2 of planets2) {
            const diff = angleDifference(p1.longitude, p2.longitude);
            for (const aspectType of ASPECT_TYPES) {
                const orb = Math.abs(diff - aspectType.angle);
                if (orb <= aspectType.orb) {
                    aspects.push({
                        planet1: p1.planet,
                        planet1Sign: p1.sign,
                        planet2: p2.planet,
                        planet2Sign: p2.sign,
                        type: aspectType.name,
                        angle: Math.round(diff * 100) / 100,
                        orb: Math.round(orb * 100) / 100,
                        nature: aspectType.nature,
                        interpretation: generateAspectInterpretation(p1.planet, p2.planet, aspectType.name, aspectType.nature)
                    });
                }
            }
        }
    }
    // En güçlü açıdan zayıfa sırala (küçük orb = güçlü)
    aspects.sort((a, b) => a.orb - b.orb);
    return aspects;
}
// ─── Interpretation Engine ───────────────────
function generateAspectInterpretation(planet1, planet2, aspectType, nature) {
    const p1 = PLANET_TR[planet1] || planet1;
    const p2 = PLANET_TR[planet2] || planet2;
    const interpretations = {
        'Sun': {
            'Sun': {
                'conjunction': `${p1}-${p2} kavuşumu: İnanılmaz bir kimlik uyumu! Benzer yaşam hedefleriniz ve enerjiniz var.`,
                'trine': `${p1}-${p2} trigonu: Doğal bir anlayış ve enerji akışı. Birbirinizi kolayca destekliyorsunuz.`,
                'sextile': `${p1}-${p2} sekstili: Birbirinize ilham veren, uyumlu bir bağlantı.`,
                'square': `${p1}-${p2} karesi: Ego çatışmaları olabilir ama büyüme potansiyeli çok yüksek.`,
                'opposition': `${p1}-${p2} karşıtlığı: Tamamlayıcı enerjiler. Birbirinizden çok şey öğreneceksiniz.`,
            },
            'Moon': {
                'conjunction': `${p1}-${p2} kavuşumu: Güçlü duygusal bağ. Birinizin kimliği diğerinin duygularıyla örtüşüyor.`,
                'trine': `${p1}-${p2} trigonu: Doğal duygusal anlayış ve karşılıklı destek.`,
                'sextile': `${p1}-${p2} sekstili: Rahat ve destekleyici bir duygusal bağlantı.`,
                'square': `${p1}-${p2} karesi: Duygusal ihtiyaçlar ile kişisel hedefler arasında gerilim.`,
                'opposition': `${p1}-${p2} karşıtlığı: Güçlü çekim ama duygusal dengeyi bulmak zaman alabilir.`,
            },
            'Venus': {
                'conjunction': `${p1}-${p2} kavuşumu: Çok güçlü romantik çekim! Sevgi ve değerler mükemmel uyumlu.`,
                'trine': `${p1}-${p2} trigonu: Doğal romantik uyum ve karşılıklı beğeni.`,
                'sextile': `${p1}-${p2} sekstili: Hoş ve çekici bir bağlantı. Birbirinizden keyif alıyorsunuz.`,
                'square': `${p1}-${p2} karesi: Değer farklılıkları zorluk yaratabilir ama tutku yüksek.`,
                'opposition': `${p1}-${p2} karşıtlığı: Manyetik çekim. Farklı sevgi dilleri birbirini tamamlıyor.`,
            },
            'Mars': {
                'conjunction': `${p1}-${p2} kavuşumu: Yoğun enerji ve aksiyona dayalı bir bağ. Tutku dolu!`,
                'trine': `${p1}-${p2} trigonu: Enerjileriniz mükemmel akıyor. Birlikte harikalar yaratabilirsiniz.`,
                'sextile': `${p1}-${p2} sekstili: Motive edici ve canlandırıcı bir bağlantı.`,
                'square': `${p1}-${p2} karesi: Güçlü fiziksel çekim ama güç mücadeleleri olabilir.`,
                'opposition': `${p1}-${p2} karşıtlığı: Yoğun tutku. Çatışmaları yapıcı hale getirmek anahtar.`,
            },
        },
        'Moon': {
            'Moon': {
                'conjunction': `${p1}-${p2} kavuşumu: Duygusal ikizler! Birbirinizi derinden hissediyorsunuz.`,
                'trine': `${p1}-${p2} trigonu: Duygusal güvenlik ve anlayış. Ev gibi hissettiriyorsunuz.`,
                'sextile': `${p1}-${p2} sekstili: Rahat bir duygusal uzlaşı.`,
                'square': `${p1}-${p2} karesi: Farklı duygusal ihtiyaçlar. İletişimle aşılabilir.`,
                'opposition': `${p1}-${p2} karşıtlığı: Duygusal tamamlayıcılık ama uyum sağlamak emek ister.`,
            },
            'Venus': {
                'conjunction': `${p1}-${p2} kavuşumu: Büyüleyici romantik bağ! Duygusal ve estetik uyum.`,
                'trine': `${p1}-${p2} trigonu: Sevgi dolu ve besleyici bir bağlantı.`,
                'sextile': `${p1}-${p2} sekstili: Hoş, keyifli ve sevgi dolu bir ilişki enerjisi.`,
                'square': `${p1}-${p2} karesi: Sevgi gösterme biçimleri farklı ama öğrenme fırsatı.`,
                'opposition': `${p1}-${p2} karşıtlığı: Güçlü çekim. Sevgide denge bulmak önemli.`,
            },
        },
        'Venus': {
            'Venus': {
                'conjunction': `${p1}-${p2} kavuşumu: Aşk, güzellik ve değerlerde mükemmel uyum!`,
                'trine': `${p1}-${p2} trigonu: Romantizm doğal akıyor. Estetik ve zevkler uyumlu.`,
                'sextile': `${p1}-${p2} sekstili: Keyifli ve uyumlu bir romantik bağlantı.`,
                'square': `${p1}-${p2} karesi: Farklı zevkler ve değerler. Uzlaşı önemli.`,
                'opposition': `${p1}-${p2} karşıtlığı: Güçlü çekim ama farklı sevgi ifadeleri.`,
            },
            'Mars': {
                'conjunction': `${p1}-${p2} kavuşumu: Klasik tutku açısı! Fiziksel ve romantik çekim çok yoğun.`,
                'trine': `${p1}-${p2} trigonu: Doğal cinsel ve romantik uyum. Harika bir çift enerjisi!`,
                'sextile': `${p1}-${p2} sekstili: Çekici ve dengelenmiş bir tutku.`,
                'square': `${p1}-${p2} karesi: Yoğun tutku ama kıskançlık ve çatışma riski.`,
                'opposition': `${p1}-${p2} karşıtlığı: Manyetik cinsel çekim. Çok güçlü ama yoğun!`,
            },
        },
        'Mars': {
            'Mars': {
                'conjunction': `${p1}-${p2} kavuşumu: Birlikte çok güçlüsünüz ama kontrol savaşlarına dikkat.`,
                'trine': `${p1}-${p2} trigonu: Enerjileriniz harika uyum içinde. Birlikte dağları yerinden oynatırsınız.`,
                'sextile': `${p1}-${p2} sekstili: İşbirliğine dayalı, motive edici bir enerji.`,
                'square': `${p1}-${p2} karesi: Çatışma riski yüksek ama tutku da öyle!`,
                'opposition': `${p1}-${p2} karşıtlığı: Rekabet veya çekim? İkisi de olabilir.`,
            },
        },
        'Jupiter': {
            'Saturn': {
                'conjunction': `${p1}-${p2} kavuşumu: Büyüme ve disiplin dengesi. Uzun vadeli başarı potansiyeli.`,
                'trine': `${p1}-${p2} trigonu: Birlikte hem eğlenceli hem de yapıcı olabiliyorsunuz.`,
                'sextile': `${p1}-${p2} sekstili: Fırsatlar ve yapı birleşiyor. Harika bir iş ortaklığı.`,
                'square': `${p1}-${p2} karesi: Özgürlük vs. sorumluluk gerilimi.`,
                'opposition': `${p1}-${p2} karşıtlığı: Farklı yaklaşımlar ama dengeleme potansiyeli.`,
            },
        },
    };
    // İlgili yorumu bul (simetrik arama)
    const direct = interpretations[planet1]?.[planet2]?.[aspectType];
    if (direct)
        return direct;
    const reverse = interpretations[planet2]?.[planet1]?.[aspectType];
    if (reverse)
        return reverse;
    // Genel yorum
    const aspectTR = ASPECT_TYPES.find(a => a.name === aspectType)?.tr || aspectType;
    if (nature === 'harmonious') {
        return `${p1}-${p2} ${aspectTR}: Uyumlu ve destekleyici bir açı. Bu enerji ilişkinize olumlu katkı sağlıyor.`;
    }
    else if (nature === 'challenging') {
        return `${p1}-${p2} ${aspectTR}: Zorlayıcı ama büyüme getiren bir açı. Birbirinizi geliştiriyorsunuz.`;
    }
    return `${p1}-${p2} ${aspectTR}: İlginç bir bağlantı. Bu enerji ilişkinizi şekillendiriyor.`;
}
// ─── Category Scoring ────────────────────────
function calculateCategoryScores(aspects) {
    // Aşk: Sun-Venus, Moon-Venus, Venus-Venus, Venus-Mars
    // İletişim: Mercury-Mercury, Sun-Mercury, Moon-Mercury
    // Tutku: Mars-Venus, Mars-Mars, Sun-Mars
    // Güven: Moon-Moon, Moon-Saturn, Sun-Moon
    // Uzun Vade: Saturn-Saturn, Jupiter-Saturn, Sun-Saturn
    const lovePlanets = new Set(['Sun-Venus', 'Venus-Sun', 'Moon-Venus', 'Venus-Moon', 'Venus-Venus', 'Venus-Mars', 'Mars-Venus']);
    const commPlanets = new Set(['Mercury-Mercury', 'Sun-Mercury', 'Mercury-Sun', 'Moon-Mercury', 'Mercury-Moon']);
    const passionPlanets = new Set(['Mars-Venus', 'Venus-Mars', 'Mars-Mars', 'Sun-Mars', 'Mars-Sun', 'Moon-Mars', 'Mars-Moon']);
    const trustPlanets = new Set(['Moon-Moon', 'Moon-Saturn', 'Saturn-Moon', 'Sun-Moon', 'Moon-Sun', 'Moon-Jupiter', 'Jupiter-Moon']);
    const longTermPlanets = new Set(['Saturn-Saturn', 'Jupiter-Saturn', 'Saturn-Jupiter', 'Sun-Saturn', 'Saturn-Sun', 'Jupiter-Jupiter']);
    function scoreCat(relevantPairs) {
        let score = 50; // başlangıç
        let relevantAspects = 0;
        for (const asp of aspects) {
            const pair = `${asp.planet1}-${asp.planet2}`;
            if (relevantPairs.has(pair)) {
                relevantAspects++;
                const orbFactor = 1 - (asp.orb / 10); // Küçük orb = daha güçlü etki
                if (asp.nature === 'harmonious') {
                    score += 15 * orbFactor;
                }
                else if (asp.nature === 'challenging') {
                    score -= 8 * orbFactor;
                }
                else { // neutral (conjunction)
                    score += 10 * orbFactor;
                }
            }
        }
        // Eğer hiç ilgili açı yoksa, nötre yakın bir değer
        if (relevantAspects === 0) {
            score = 45 + Math.floor(Math.random() * 15);
        }
        return Math.max(10, Math.min(98, Math.round(score)));
    }
    return [
        {
            name: 'Aşk & Romantizm',
            nameEn: 'love',
            score: scoreCat(lovePlanets),
            emoji: '❤️',
            description: getScoreDescription(scoreCat(lovePlanets), 'Romantik bağınız'),
        },
        {
            name: 'İletişim',
            nameEn: 'communication',
            score: scoreCat(commPlanets),
            emoji: '💬',
            description: getScoreDescription(scoreCat(commPlanets), 'İletişim kaliteniz'),
        },
        {
            name: 'Tutku & Çekim',
            nameEn: 'passion',
            score: scoreCat(passionPlanets),
            emoji: '🔥',
            description: getScoreDescription(scoreCat(passionPlanets), 'Fiziksel uyumunuz'),
        },
        {
            name: 'Güven & Duygusal Bağ',
            nameEn: 'trust',
            score: scoreCat(trustPlanets),
            emoji: '🛡️',
            description: getScoreDescription(scoreCat(trustPlanets), 'Duygusal güveniniz'),
        },
        {
            name: 'Uzun Vadeli Uyum',
            nameEn: 'longterm',
            score: scoreCat(longTermPlanets),
            emoji: '🌟',
            description: getScoreDescription(scoreCat(longTermPlanets), 'Uzun vadeli uyumunuz'),
        },
    ];
}
function getScoreDescription(score, prefix) {
    if (score >= 85)
        return `${prefix} olağanüstü güçlü! Kozmik bir bağ var aranızda.`;
    if (score >= 70)
        return `${prefix} çok iyi seviyede. Doğal bir uyum hissedeceksiniz.`;
    if (score >= 55)
        return `${prefix} iyi durumda. Biraz çaba ile mükemmelleşebilir.`;
    if (score >= 40)
        return `${prefix} gelişim alanları barındırıyor. Birbirinizden öğreneceğiniz çok şey var.`;
    return `${prefix} zorlayıcı olabilir ama en büyük büyüme buradan gelir.`;
}
// ─── Main Report Generator ──────────────────
function calculateSynastryReport(user1, user2) {
    const user1Planets = calculatePlanetaryPositions(user1.birthDate, user1.birthTime);
    const user2Planets = calculatePlanetaryPositions(user2.birthDate, user2.birthTime);
    const aspects = calculateAspects(user1Planets, user2Planets);
    const categories = calculateCategoryScores(aspects);
    const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
    const harmonious = aspects.filter(a => a.nature === 'harmonious').length;
    const challenging = aspects.filter(a => a.nature === 'challenging').length;
    const neutral = aspects.filter(a => a.nature === 'neutral').length;
    let summary = '';
    if (overallScore >= 80) {
        summary = `İnanılmaz bir kozmik bağ! ${harmonious} uyumlu, ${neutral} kavuşum ve ${challenging} zorlayıcı açı tespit edildi. Bu ilişki çok özel bir potansiyel taşıyor.`;
    }
    else if (overallScore >= 65) {
        summary = `Güçlü bir uyum! ${harmonious} uyumlu, ${neutral} kavuşum ve ${challenging} zorlayıcı açı tespit edildi. Doğal bir ahenk var aranızda.`;
    }
    else if (overallScore >= 50) {
        summary = `Dengeli bir ilişki potansiyeli. ${harmonious} uyumlu, ${neutral} kavuşum ve ${challenging} zorlayıcı açı tespit edildi. Farklılıklarınız sizi zenginleştiriyor.`;
    }
    else {
        summary = `Zorlayıcı ama büyütücü bir bağ. ${harmonious} uyumlu, ${neutral} kavuşum ve ${challenging} zorlayıcı açı tespit edildi. En büyük dersleri birbirinizden alacaksınız.`;
    }
    return {
        overallScore,
        categories,
        aspects: aspects.slice(0, 20), // En güçlü ilk 20 açı
        user1Planets,
        user2Planets,
        summary
    };
}
// ─── Quick Score (for lists / cards) ─────────
function calculateQuickSynastryScore(user1, user2) {
    if (!user1.birthDate || !user2.birthDate) {
        return { score: 50, message: 'Astromatik analiz için doğum tarihi bilgileri eksik.' };
    }
    const u1Planets = calculatePlanetaryPositions(user1.birthDate, user1.birthTime || '12:00');
    const u2Planets = calculatePlanetaryPositions(user2.birthDate, user2.birthTime || '12:00');
    const aspects = calculateAspects(u1Planets, u2Planets);
    const categories = calculateCategoryScores(aspects);
    let score = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
    score = Math.min(100, score);
    let message;
    if (score >= 85)
        message = 'Olağanüstü kozmik bağ! Yıldızlar sizin için parlıyor.';
    else if (score >= 70)
        message = 'Güçlü bir uyum. Doğal bir çekim ve ahenk var.';
    else if (score >= 55)
        message = 'Dengeli bir potansiyel. Birbirinizi tamamlayabilirsiniz.';
    else if (score >= 40)
        message = 'Farklılıklarınız zenginlik kaynağı. Öğrenme fırsatı çok!';
    else
        message = 'Zorlayıcı ama büyüme getiren bir bağ.';
    return { score, message };
}
//# sourceMappingURL=synastry.service.js.map