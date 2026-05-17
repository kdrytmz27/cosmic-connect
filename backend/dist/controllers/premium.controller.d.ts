import { Request, Response } from 'express';
export declare const buyStardust: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const buyPremium: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordSwipe: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const unblurProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const superLike: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addExtraTime: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=premium.controller.d.ts.map