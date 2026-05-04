import { Request, Response } from 'express';
export declare const getAllReports: (req: Request, res: Response) => Promise<void>;
export declare const updateReportStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=admin.report.controller.d.ts.map