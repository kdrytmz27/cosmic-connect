/**
 * Synastry Service — Gerçek gezegen pozisyonları ve açı analizi
 *
 * Moshier/Meeus algoritmaları kullanarak ekliptik boylamları hesaplar.
 * Güneş, Ay, Merkür, Venüs, Mars, Jüpiter, Satürn pozisyonları.
 */
export interface PlanetPosition {
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
    retrograde?: boolean;
}
export interface Aspect {
    planet1: string;
    planet1Sign: string;
    planet2: string;
    planet2Sign: string;
    type: string;
    angle: number;
    orb: number;
    nature: 'harmonious' | 'challenging' | 'neutral';
    interpretation: string;
}
export interface SynastryCategory {
    name: string;
    nameEn: string;
    score: number;
    emoji: string;
    description: string;
}
export interface SynastryReport {
    overallScore: number;
    categories: SynastryCategory[];
    aspects: Aspect[];
    user1Planets: PlanetPosition[];
    user2Planets: PlanetPosition[];
    summary: string;
}
export declare function calculatePlanetaryPositions(birthDate: Date, birthTime: string): PlanetPosition[];
export declare function calculateAspects(planets1: PlanetPosition[], planets2: PlanetPosition[]): Aspect[];
export declare function calculateSynastryReport(user1: {
    birthDate: Date;
    birthTime: string;
    name?: string;
}, user2: {
    birthDate: Date;
    birthTime: string;
    name?: string;
}): SynastryReport;
export declare function calculateQuickSynastryScore(user1: {
    birthDate: Date;
    birthTime: string;
}, user2: {
    birthDate: Date;
    birthTime: string;
}): {
    score: number;
    message: string;
};
//# sourceMappingURL=synastry.service.d.ts.map