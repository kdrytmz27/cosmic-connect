export interface TokenPayload {
    userId: string;
    role: string;
}
export declare function signToken(userId: string, role: string): string;
export declare function verifyToken(token: string): TokenPayload | null;
//# sourceMappingURL=jwt.d.ts.map