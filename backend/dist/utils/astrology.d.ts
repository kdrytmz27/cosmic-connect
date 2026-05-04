export declare function calculateSunSign(day: number, month: number): string;
export declare function calculateMoonSign(year: number, month: number, day: number): string;
export declare function calculateRisingSign(birthTime: string, sunSign: string): string;
type Element = 'FIRE' | 'WATER' | 'EARTH' | 'AIR';
export declare function getZodiacElement(sign: string): Element;
export declare function calculateCompatibility(sign1: string, sign2: string): {
    score: number;
    message: string;
};
export {};
//# sourceMappingURL=astrology.d.ts.map