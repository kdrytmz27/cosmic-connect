"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSunSign = calculateSunSign;
exports.calculateMoonSign = calculateMoonSign;
exports.calculateRisingSign = calculateRisingSign;
exports.getZodiacElement = getZodiacElement;
exports.calculateCompatibility = calculateCompatibility;
function calculateSunSign(day, month) {
    const dates = [
        { month: 1, limit: 19, current: 'Capricorn', next: 'Aquarius' },
        { month: 2, limit: 18, current: 'Aquarius', next: 'Pisces' },
        { month: 3, limit: 20, current: 'Pisces', next: 'Aries' },
        { month: 4, limit: 19, current: 'Aries', next: 'Taurus' },
        { month: 5, limit: 20, current: 'Taurus', next: 'Gemini' },
        { month: 6, limit: 21, current: 'Gemini', next: 'Cancer' },
        { month: 7, limit: 22, current: 'Cancer', next: 'Leo' },
        { month: 8, limit: 22, current: 'Leo', next: 'Virgo' },
        { month: 9, limit: 22, current: 'Virgo', next: 'Libra' },
        { month: 10, limit: 22, current: 'Libra', next: 'Scorpio' },
        { month: 11, limit: 21, current: 'Scorpio', next: 'Sagittarius' },
        { month: 12, limit: 21, current: 'Sagittarius', next: 'Capricorn' },
    ];
    const signObj = dates.find(d => d.month === month);
    if (!signObj)
        return 'Unknown';
    return day <= signObj.limit ? signObj.current : signObj.next;
}
function calculateMoonSign(year, month, day) {
    const epochDate = new Date('2000-01-01T12:00:00Z');
    const inputDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00Z`);
    const diffTime = inputDate.getTime() - epochDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    let currentLongitude = (218 + (diffDays * 13.176396)) % 360;
    if (currentLongitude < 0) {
        currentLongitude += 360;
    }
    const signIndex = Math.floor(currentLongitude / 30);
    const ZODIAC_ORDER = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    return ZODIAC_ORDER[signIndex] || 'Unknown';
}
function calculateRisingSign(birthTime, sunSign) {
    if (!birthTime || !birthTime.includes(':'))
        return 'Unknown';
    const [hourStr, minStr] = birthTime.split(':');
    const hours = parseInt(hourStr || '0', 10);
    const mins = parseInt(minStr || '0', 10);
    const timeInHours = hours + (mins / 60);
    const ZODIAC_ORDER = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    const sunIndex = ZODIAC_ORDER.indexOf(sunSign);
    if (sunIndex === -1)
        return 'Unknown';
    const shift = Math.floor((timeInHours - 6) / 2);
    let risingIndex = (sunIndex + shift) % 12;
    if (risingIndex < 0) {
        risingIndex += 12;
    }
    return ZODIAC_ORDER[risingIndex] || 'Unknown';
}
function getZodiacElement(sign) {
    const fire = ['Aries', 'Leo', 'Sagittarius'];
    const water = ['Cancer', 'Scorpio', 'Pisces'];
    const earth = ['Taurus', 'Virgo', 'Capricorn'];
    if (fire.includes(sign))
        return 'FIRE';
    if (water.includes(sign))
        return 'WATER';
    if (earth.includes(sign))
        return 'EARTH';
    return 'AIR';
}
function calculateCompatibility(sign1, sign2) {
    const e1 = getZodiacElement(sign1);
    const e2 = getZodiacElement(sign2);
    if (e1 === e2)
        return { score: 90, message: 'Aynı elementin mükemmel uyumu. Birbirinizi çok iyi anlıyorsunuz.' };
    if ((e1 === 'FIRE' && e2 === 'AIR') || (e1 === 'AIR' && e2 === 'FIRE')) {
        return { score: 85, message: 'Ateş ve Hava: Eğlenceli ve tutkulu bir ilişki potansiyeli.' };
    }
    if ((e1 === 'WATER' && e2 === 'EARTH') || (e1 === 'EARTH' && e2 === 'WATER')) {
        return { score: 88, message: 'Su ve Toprak: Birbirinizi inanılmaz derecede dengeliyorsunuz.' };
    }
    if ((e1 === 'FIRE' && e2 === 'WATER') || (e1 === 'WATER' && e2 === 'FIRE')) {
        return { score: 40, message: 'Ateş ve Su: Büyük bir tutku veya sönmeyen bir çatışma! Dengeyi bulmak zor olabilir.' };
    }
    if ((e1 === 'EARTH' && e2 === 'AIR') || (e1 === 'AIR' && e2 === 'EARTH')) {
        return { score: 45, message: 'Toprak ve Hava: Pratiklik ile özgürlüğün kavgası. Birbirinizden öğrenecek çok şeyiniz var.' };
    }
    return { score: 65, message: 'Farklı dünyaların insanlarısınız ama farklılıklarınız yenilikçi bir köprü oluşturabilir.' };
}
//# sourceMappingURL=astrology.js.map