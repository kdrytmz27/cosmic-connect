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

describe('Profile Modification Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'my_id',
            token: 'mock-token',
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
    });

    it('Tests Profile Edit: Modifies hobby and music, saves via API', async () => {
        const user = userEvent.setup();
        const mockGet = vi.mocked(api.get);
        mockGet.mockResolvedValueOnce({
            data: {
                profile: {
                    name: 'Test',
                    email: 'test@test.com',
                    hobby: 'Eski Hobi',
                    music: 'Eski Müzik',
                    photos: []
                }
            }
        });

        const mockPut = vi.mocked(api.put);
        mockPut.mockResolvedValueOnce({
            data: {
                profile: {
                    name: 'Test', hobby: 'Yeni Hobi', music: 'Yeni Müzik', bio: '', weekend: ''
                }
            }
        });

        renderWithProviders(<Profile />);

        // Wait for profile data to load
        await waitFor(() => {
            expect(screen.getByText('Profil')).toBeInTheDocument();
        });

        // Edit mode opens
        const buttons = screen.getAllByRole('button');
        await user.click(buttons[0]);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/İlgi alanların/i)).toBeInTheDocument();
        });

        const hobbyInput = screen.getByPlaceholderText(/İlgi alanların/i);
        const musicInput = screen.getByPlaceholderText(/Favori Müzik/i);

        await user.clear(hobbyInput);
        await user.type(hobbyInput, 'Yeni Hobi');

        await user.clear(musicInput);
        await user.type(musicInput, 'Yeni Müzik');

        const saveButton = screen.getByRole('button', { name: /Kaydet/i });
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/user/profile', expect.objectContaining({
                hobby: 'Yeni Hobi',
                music: 'Yeni Müzik'
            }));
        });
    });
});
