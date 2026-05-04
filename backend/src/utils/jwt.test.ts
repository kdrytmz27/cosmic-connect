import { describe, it, expect } from '@jest/globals';
import { signToken, verifyToken } from './jwt';

describe('JWT Utility', () => {
    it('should sign and verify a token successfully', () => {
        const userId = '123456';
        const role = 'USER';

        const token = signToken(userId, role);
        expect(typeof token).toBe('string');

        const decoded = verifyToken(token);
        expect(decoded).not.toBeNull();
        expect(decoded?.userId).toBe(userId);
        expect(decoded?.role).toBe(role);
    });

    it('should return null for an invalid token', () => {
        const decoded = verifyToken('invalid.token.string');
        expect(decoded).toBeNull();
    });
});
