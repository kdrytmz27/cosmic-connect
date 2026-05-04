import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import TellerDashboard from '../../src/pages/TellerDashboard';
import api from '../../src/api/client';
import * as AuthContextModule from '../../src/context/AuthContext';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
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
            post: vi.fn()
        }
    };
});

describe('Falcı Dashboard Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Falcı olmayan kullanıcılar erişim uyarısı görür', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'u1', token: 'tok', user: { role: 'USER' },
            stardustBalance: 200, isPremium: false, dailySwipes: 0, avatar: null,
            login: vi.fn(), logout: vi.fn(), updateEconomy: vi.fn(), refreshUser: vi.fn()
        });

        renderWithProviders(<TellerDashboard />);

        expect(screen.getByText('Bu sayfaya sadece falcılar erişebilir.')).toBeInTheDocument();
    });

    it('Falcı kullanıcı paneli ve istatistikleri görür', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'u1', token: 'tok', user: { role: 'FORTUNE_TELLER' },
            stardustBalance: 200, isPremium: false, dailySwipes: 0, avatar: null,
            login: vi.fn(), logout: vi.fn(), updateEconomy: vi.fn(), refreshUser: vi.fn()
        });

        const mockGet = vi.mocked(api.get);
        mockGet.mockImplementation((url: string) => {
            if (url === '/teller/fortunes/pending') {
                return Promise.resolve({
                    data: [{
                        id: 'f1',
                        appointmentDate: new Date().toISOString(),
                        stardustPrice: 100,
                        question: 'Aşk hayatım nasıl olacak?',
                        fortuneType: 'TAROT',
                        imageUrl: null,
                        user: { id: 'u2', name: 'Zeynep', avatar: null, sunSign: 'Kova', moonSign: 'Akrep', risingSign: 'Aslan' }
                    }]
                });
            }
            if (url === '/user/profile/me') {
                return Promise.resolve({
                    data: {
                        profile: {
                            fortuneTellerProfile: {
                                totalReadings: 42,
                                rating: 4.8,
                                earnedStardust: 8500
                            }
                        }
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderWithProviders(<TellerDashboard />);

        // İstatistikler yüklenmeli
        await waitFor(() => {
            expect(screen.getByText('42')).toBeInTheDocument(); // toplam okuma
            expect(screen.getByText('4.8')).toBeInTheDocument(); // puan
            expect(screen.getByText('8500')).toBeInTheDocument(); // kazanılan toz
        });

        // Bekleyen fal istekleri listelenmeli
        await waitFor(() => {
            expect(screen.getByText('Zeynep')).toBeInTheDocument();
        });
    });

    it('Fal yorumu gönderilir', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'u1', token: 'tok', user: { role: 'FORTUNE_TELLER' },
            stardustBalance: 200, isPremium: false, dailySwipes: 0, avatar: null,
            login: vi.fn(), logout: vi.fn(), updateEconomy: vi.fn(), refreshUser: vi.fn()
        });

        const mockGet = vi.mocked(api.get);
        mockGet.mockImplementation((url: string) => {
            if (url === '/teller/fortunes/pending') {
                return Promise.resolve({
                    data: [{
                        id: 'f1',
                        appointmentDate: new Date().toISOString(),
                        stardustPrice: 100,
                        question: 'Kariyer fırsatlarını merak ediyorum',
                        fortuneType: 'KAHVE',
                        imageUrl: '/uploads/kahve.jpg',
                        user: { id: 'u3', name: 'Ahmet', avatar: null, sunSign: 'Balık', moonSign: 'Boğa', risingSign: 'Terazi' }
                    }]
                });
            }
            if (url === '/user/profile/me') {
                return Promise.resolve({
                    data: { profile: { fortuneTellerProfile: { totalReadings: 10, rating: 4.5, earnedStardust: 2000 } } }
                });
            }
            return Promise.resolve({ data: {} });
        });

        const user = userEvent.setup();
        renderWithProviders(<TellerDashboard />);

        // İsteği bekle
        await waitFor(() => {
            expect(screen.getByText('Ahmet')).toBeInTheDocument();
        });

        // İsteğe tıkla (Falı Yorumla butonu ile)
        const interpretBtns = screen.getAllByRole('button', { name: /Falı Yorumla/i });
        await user.click(interpretBtns[0]);

        // Yorum alanı (modal) görünmeli
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Yıldızların mesajını/i)).toBeInTheDocument();
        });

        // 20+ karakter yorum yaz
        const longInterpretation = 'Bu kart büyük bir değişimi simgeliyor kariyer hayatında önemli fırsatlar kapıda.';
        const textarea = screen.getByPlaceholderText(/Yıldızların mesajını/i);
        await user.type(textarea, longInterpretation);

        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({ data: {} });
        // Gerideki fetchDashboardData çağrıları için
        mockGet.mockImplementation(() => Promise.resolve({ data: [] }));

        const sendBtns = screen.getAllByRole('button', { name: /Gönder/i });
        await user.click(sendBtns[sendBtns.length - 1]); // Modal'daki son Gönder butonu

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/teller/fortunes/interpret', {
                appointmentId: 'f1',
                interpretation: longInterpretation
            });
        });
    });
});
