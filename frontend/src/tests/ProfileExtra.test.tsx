import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import Profile from '../../src/pages/Profile';
import api from '../../src/api/client';
import * as AuthContextModule from '../../src/context/AuthContext';

vi.mock('../../src/api/client', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            put: vi.fn(),
            post: vi.fn(),
            delete: vi.fn()
        }
    };
});

describe('Profile Extra Features Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'my_id',
            token: 'mock-token',
            user: { role: 'USER' },
            stardustBalance: 0,
            isPremium: true,
            dailySwipes: 0,
            avatar: null,
            login: vi.fn(),
            logout: vi.fn(),
            updateEconomy: vi.fn(),
            refreshUser: vi.fn()
        });
    });

    it('Tests Premium Crown, Cosmic Status update and Gallery delete', async () => {
        const user = userEvent.setup();
        const mockGet = vi.mocked(api.get);
        mockGet.mockResolvedValueOnce({
            data: {
                profile: {
                    name: 'Kral',
                    email: 'kral@test.com',
                    isPremium: true,
                    cosmicStatus: null,
                    photos: [{ id: 'photo1', url: '/p1.jpg' }]
                }
            }
        });

        const mockPut = vi.mocked(api.put);
        mockPut.mockResolvedValueOnce({ data: { success: true } }); // Status update

        const mockDelete = vi.mocked(api.delete);
        mockDelete.mockResolvedValueOnce({ data: { success: true } });

        renderWithProviders(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Profil')).toBeInTheDocument();
        });

        // Test Premium Crown existence
        // The Crown component doesn't have a label but we can find its parent holding the name
        // <h2 ...>Kral <Crown /></h2>
        const nameHeader = screen.getByText(/Kral/i);
        // Within nameHeader, there should be svg element
        const svgElement = nameHeader.querySelector('svg');
        expect(svgElement).toBeInTheDocument(); // This represents the Crown

        // Test Cosmic Status selection
        const statusButton = screen.getByText(/Flow Halindeyim/i);
        await user.click(statusButton);

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/user/status', { cosmicStatus: 'Flow Halindeyim' });
        });

        // Test Gallery photo deletion
        // We have an image with an overlaying trash icon
        const trashButton = screen.getAllByRole('button').find(btn => btn.innerHTML.includes('lucide-trash'));
        if (trashButton) {
            await user.click(trashButton);
            await waitFor(() => {
                expect(mockDelete).toHaveBeenCalledWith('/photo/gallery/photo1');
            });
        }
    });
});
