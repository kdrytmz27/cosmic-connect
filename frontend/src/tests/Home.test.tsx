import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import Home from '../../src/pages/Home';
import api from '../../src/api/client';
import * as AuthContextModule from '../../src/context/AuthContext';

vi.mock('../../src/api/client', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            post: vi.fn(),
        }
    };
});

describe('Home Page Swiping & Premium Limit Tests', () => {
    const setupAuth = (isPremium: boolean = false, dailySwipes: number = 0) => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'user_1',
            token: 'fake-token',
            user: { role: 'USER' },
            stardustBalance: 0,
            isPremium,
            dailySwipes,
            avatar: null,
            login: vi.fn(),
            logout: vi.fn(),
            updateEconomy: vi.fn(),
            refreshUser: vi.fn()
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();

        const mockGet = vi.mocked(api.get);
        mockGet.mockImplementation((url) => {
            if (url === '/user/daily-match') {
                return Promise.resolve({
                    data: {
                        matches: [
                            { match: { id: 'm1', name: 'Alien', gender: 'MALE', sunSign: 'Aries' }, score: 85 }
                        ]
                    }
                });
            }
            if (url === '/astrology/daily-horoscope') {
                return Promise.resolve({ data: { horoscope: null } });
            }
            return Promise.resolve({ data: {} });
        });
    });

    it('Swipes right (Like/Match) successfully without hitting limits', async () => {
        setupAuth(false, 5); // 5 swipes, limit is 20
        const user = userEvent.setup();
        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({ data: { matched: false } });

        renderWithProviders(<Home />);

        // Wait for the simulated card to appear
        await waitFor(() => {
            expect(screen.getByText('Alien')).toBeInTheDocument();
        });

        const likeButton = screen.getAllByTitle('Beğen')[0];
        await user.click(likeButton);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/user/friend', { receiverId: 'm1' });
        });

        // Ensure card disappears from the list
        expect(screen.queryByText('Alien')).not.toBeInTheDocument();
    });

    it('Shows Premium Modal when a Free user reaches the swipe limit', async () => {
        setupAuth(false, 20); // Limit reached
        const user = userEvent.setup();

        renderWithProviders(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Alien')).toBeInTheDocument();
        });

        const likeButton = screen.getAllByTitle('Beğen')[0];
        await user.click(likeButton);

        // API should NOT be called
        expect(api.post).not.toHaveBeenCalled();

        // Premium Modal should appear
        await waitFor(() => {
            expect(screen.getByText("Premium'a Yükselt")).toBeInTheDocument();
        });
    });

    it('Allows Premium users to swipe even if dailySwipes >= 20', async () => {
        setupAuth(true, 50); // Limit bypassed for premium
        const user = userEvent.setup();
        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({ data: { matched: false } });

        renderWithProviders(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Alien')).toBeInTheDocument();
        });

        const passButton = screen.getAllByTitle('Geç')[0];
        await user.click(passButton);

        // It doesn't call an API for PASS right now, but we just verify modal is not opened.
        await waitFor(() => {
            expect(screen.queryByText("Premium'a Yükselt")).not.toBeInTheDocument();
        });
        expect(screen.queryByText('Alien')).not.toBeInTheDocument();
    });
});
