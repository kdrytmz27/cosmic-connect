import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import SynastryAnalysis from '../../src/pages/SynastryAnalysis';
import api from '../../src/api/client';
import * as AuthContextModule from '../../src/context/AuthContext';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useParams: () => ({ id: 'astro123' }),
        useNavigate: () => vi.fn()
    };
});

vi.mock('../../src/api/client', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
        }
    };
});

describe('Synastry Analysis Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'user_1',
            token: 'fake-token',
            user: { role: 'USER' },
            stardustBalance: 0,
            isPremium: false,
            dailySwipes: 0,
            avatar: null,
            login: vi.fn(),
            logout: vi.fn(),
            updateEconomy: vi.fn(),
            refreshUser: vi.fn()
        });

        const mockGet = vi.mocked(api.get);
        mockGet.mockResolvedValueOnce({
            data: {
                user1: { name: 'Kendi İsmi', sunSign: 'Aries' },
                user2: { name: 'Arkadaş', sunSign: 'Taurus' },
                report: {
                    overallScore: 88,
                    summary: 'Harika bir evrensel bağınız var.',
                    user1Planets: [{ planet: 'Sun', sign: 'Aries', degree: 14 }],
                    user2Planets: [{ planet: 'Moon', sign: 'Pisces', degree: 21 }],
                    categories: [
                        { name: 'Aşk', score: 95, description: 'Güçlü duygu', emoji: '❤️' }
                    ],
                    aspects: [
                        { planet1: 'Sun', planet2: 'Moon', type: 'trine', orb: 2, angle: 120, nature: 'harmonious', interpretation: 'İyi' }
                    ]
                }
            }
        });
    });

    it('Tests Synastry Chart Rendering and Uyum Yüzdesi', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SynastryAnalysis />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Synastri Analizi')).toBeInTheDocument();
        });

        // Ensure overall score is visible
        expect(screen.getByText('88')).toBeInTheDocument();
        expect(screen.getByText('UYUMLULUK')).toBeInTheDocument();

        // Check if names are visible
        expect(screen.getAllByText('Kendi İsmi')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Arkadaş')[0]).toBeInTheDocument();

        // Switch to categories tab
        const categoriesTab = screen.getByRole('button', { name: /Kategoriler/i });
        await user.click(categoriesTab);

        await waitFor(() => {
            // Category score
            expect(screen.getByText('95')).toBeInTheDocument();
            expect(screen.getByText('Aşk')).toBeInTheDocument();
        });

        // Switch to aspects tab
        const aspectsTab = screen.getByRole('button', { name: /Açılar/i });
        await user.click(aspectsTab);

        const elements = await screen.findAllByText(/Uyumlu/i);
        expect(elements[0]).toBeInTheDocument();
    });
});
