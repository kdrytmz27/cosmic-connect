import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import TellerApplication from '../../src/pages/TellerApplication';
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

describe('Falcı Başvuru Formu Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'u1', token: 'tok', user: { role: 'USER' },
            stardustBalance: 500, isPremium: false, dailySwipes: 0, avatar: null,
            login: vi.fn(), logout: vi.fn(), updateEconomy: vi.fn(), refreshUser: vi.fn()
        });

        const mockGet = vi.mocked(api.get);
        mockGet.mockResolvedValue({ data: { application: null } });
    });

    it('Başvuru formu yüklenip deneyim ve fal türü seçimi yapılabilir', async () => {
        const user = userEvent.setup();
        renderWithProviders(<TellerApplication />);

        await waitFor(() => {
            expect(screen.getByText('Falcı Başvurusu')).toBeInTheDocument();
        });

        // Deneyim seçimi
        expect(screen.getByText('Deneyim Süreniz')).toBeInTheDocument();
        const experienceBtn = screen.getByRole('button', { name: /3-5 Yıl Deneyim/i });
        await user.click(experienceBtn);

        // Fal türü seçimi (çoklu)
        const tarotBtn = screen.getByRole('button', { name: /Tarot/i });
        const kahveBtn = screen.getByRole('button', { name: /Kahve/i });
        await user.click(tarotBtn);
        await user.click(kahveBtn);

        // Başvuruyu gönder
        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({ data: {} });

        const submitBtn = screen.getByRole('button', { name: /Başvuruyu Tamamla/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/teller/apply', {
                experience: '3-5 Yıl',
                fortuneTypes: ['TAROT', 'KAHVE']
            });
        });
    });

    it('Deneyim seçilmeden gönderilince hata uyarısı verir', async () => {
        const user = userEvent.setup();
        renderWithProviders(<TellerApplication />);

        await waitFor(() => {
            expect(screen.getByText('Falcı Başvurusu')).toBeInTheDocument();
        });

        // Hiçbir şey seçmeden gönder
        const submitBtn = screen.getByRole('button', { name: /Başvuruyu Tamamla/i });
        await user.click(submitBtn);

        // API çağrılmamalı
        expect(api.post).not.toHaveBeenCalled();
    });

    it('Başvuru PENDING durumunda "İnceleniyor" mesajı gösterilir', async () => {
        vi.mocked(api.get).mockResolvedValue({ data: { application: { id: 'app1', status: 'PENDING' } } });

        renderWithProviders(<TellerApplication />);

        await waitFor(() => {
            expect(screen.getByText('Başvurunuz İnceleniyor')).toBeInTheDocument();
        });
    });

    it('Başvuru REJECTED durumunda "Başvuru Reddedildi" mesajı gösterilir', async () => {
        vi.mocked(api.get).mockResolvedValue({ data: { application: { id: 'app1', status: 'REJECTED' } } });

        renderWithProviders(<TellerApplication />);

        await waitFor(() => {
            expect(screen.getByText('Başvuru Reddedildi')).toBeInTheDocument();
        });
    });

    it('Zaten onaylı falcıya "Başlangıç Tamamlandı" gösterilir', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'u1', token: 'tok', user: { role: 'FORTUNE_TELLER' },
            stardustBalance: 500, isPremium: false, dailySwipes: 0, avatar: null,
            login: vi.fn(), logout: vi.fn(), updateEconomy: vi.fn(), refreshUser: vi.fn()
        });
        vi.mocked(api.get).mockResolvedValue({ data: { application: null } });

        renderWithProviders(<TellerApplication />);

        await waitFor(() => {
            expect(screen.getByText('Başlangıç Tamamlandı')).toBeInTheDocument();
        });
    });
});
