export const zodiacMap: Record<string, string> = {
    'ARIES': 'Koç', 'TAURUS': 'Boğa', 'GEMINI': 'İkizler', 'CANCER': 'Yengeç',
    'LEO': 'Aslan', 'VIRGO': 'Başak', 'LIBRA': 'Terazi', 'SCORPIO': 'Akrep',
    'SAGITTARIUS': 'Yay', 'CAPRICORN': 'Oğlak', 'AQUARIUS': 'Kova', 'PISCES': 'Balık'
};

export const translateZodiac = (sign: string | undefined | null): string => {
    if (!sign) return '';
    return zodiacMap[sign.toUpperCase()] || sign;
};
