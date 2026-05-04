import { Request, Response } from 'express';
export declare const GIFTS: {
    CRYSTAL: {
        id: string;
        emoji: string;
        cost: number;
        name: string;
    };
    MOON: {
        id: string;
        emoji: string;
        cost: number;
        name: string;
    };
    TAROT: {
        id: string;
        emoji: string;
        cost: number;
        name: string;
    };
    STAR: {
        id: string;
        emoji: string;
        cost: number;
        name: string;
    };
};
export declare const sendGift: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=gift.controller.d.ts.map