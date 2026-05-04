import { PrismaClient } from '@prisma/client';
declare const app: import("express-serve-static-core").Express;
declare const httpServer: import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>;
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { app, httpServer };
//# sourceMappingURL=index.d.ts.map