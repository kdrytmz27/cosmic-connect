import { Request, Response } from 'express';
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTellerApplications: (req: Request, res: Response) => Promise<void>;
export declare const approveRejectTeller: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllAppointments: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map