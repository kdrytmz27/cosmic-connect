import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import Market from '../../src/pages/Market';
import api from '../../src/api/client';
import * as AuthContextModule from '../../src/context/AuthContext';

vi.mock('../../src/api/client', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            post: vi.fn()
        }
    };
});

describe('Market Sayfası Testleri', () => {
    let mockUpdateEconomy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateEconomy = vi.fn();
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'user_1',
            token: 'mock-token',
            user: { role: 'USER' },
            stardustBalance: 500,
            isPremium: false,
            dailySwipes: 0,
            avatar: null,
            login: vi.fn(),
            logout: vi.fn(),
            updateEconomy: mockUpdateEconomy,
            refreshUser: vi.fn()
        });

        const mockPost = vi.mocked(api.post);
        mockPost.mockImplementation((url: string) => {
            if (url === '/user/daily-reward/claim') {
                return Promise.resolve({ data: { newBalance: 600, rewardAmount: 100, streak: 3 } });
            }
            if (url === '/premium/buy-stardust') {
                return Promise.resolve({ data: { balance: 1000 } });
            }
            if (url === '/premium/buy-premium') {
                return Promise.resolve({ data: {} });
            }
            return Promise.resolve({ data: {} });
        });
    });

    it('Günlük ödül toplanınca bakiye güncellenir', async () => {
        const user = userEvent.setup();

        renderWithProviders(<Market />);

        // Bakiye görünür
        expect(screen.getAllByText('500')[0]).toBeInTheDocument();
        expect(screen.getByText('Günlük Ödül')).toBeInTheDocument();

        // Topla butonuna tıkla
        const toplaBtn = screen.getByRole('button', { name: /Topla/i });
        await user.click(toplaBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/user/daily-reward/claim');
            expect(mockUpdateEconomy).toHaveBeenCalledWith({ stardustBalance: 600 });
        });
    });

    it('Yıldız Tozu satın alım butonları çalışır', async () => {
        const user = userEvent.setup();

        renderWithProviders(<Market />);

        // 500 tozu olan paket butonuna tıkla (₺19.99)
        const buyBtn = screen.getByRole('button', { name: /₺19.99/i });
        await user.click(buyBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/premium/buy-stardust', { amount: 500 });
            expect(mockUpdateEconomy).toHaveBeenCalledWith({ stardustBalance: 1000 });
        });
    });

    it('Premium abonelik butonu çalışır', async () => {
        const user = userEvent.setup();

        renderWithProviders(<Market />);

        expect(screen.getByText('Cosmic Premium')).toBeInTheDocument();

        const premiumBtn = screen.getByRole('button', { name: /Premium'a Geç/i });
        await user.click(premiumBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/premium/buy-premium');
            expect(mockUpdateEconomy).toHaveBeenCalledWith({ isPremium: true });
        });
    });

    it('Premium aktifken "Premium Aktif" yazısı görünür', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'user_1', token: 'mock-token', user: { role: 'USER' },
            stardustBalance: 5000, isPremium: true, dailySwipes: 0, avatar: null,
            login: vi.fn(), logout: vi.fn(), updateEconomy: vi.fn(), refreshUser: vi.fn()
        });

        renderWithProviders(<Market />);

        expect(screen.getByText('Premium Aktif ✨')).toBeInTheDocument();
        // Premium'a Geç butonu olmamalı
        expect(screen.queryByText(/Premium'a Geç/i)).not.toBeInTheDocument();
    });
});
