import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import Login from '../../src/pages/Login';
import Register from '../../src/pages/Register';
import api from '../../src/api/client';

vi.mock('../../src/api/client', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        default: {
            ...actual.default,
            post: vi.fn(),
            get: vi.fn()
        }
    };
});

describe('Authentication Flow Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Login Test: Submits successful login and attempts to login', async () => {
        const user = userEvent.setup();
        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({
            data: { token: 'mockToken99', user: { id: 'test_id', name: 'Tester' } }
        });

        renderWithProviders(<Login />);
        await user.type(screen.getByPlaceholderText('E-posta'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Şifre'), '123456');

        await user.click(screen.getByRole('button', { name: /giriş yap/i }));

        expect(mockPost).toHaveBeenCalledWith('/auth/login', {
            email: 'test@example.com',
            password: '123456'
        });
    });

    it('Register Test: Submits complete register tracking data', async () => {
        const user = userEvent.setup();
        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({
            data: { token: 'new_token', user: { name: 'Yeni Üye' } }
        });

        renderWithProviders(<Register />);
        await user.type(screen.getByPlaceholderText('Ad Soyad'), 'Ahmet Gezer');
        await user.type(screen.getByPlaceholderText('E-posta'), 'ahmet@astro.com');
        await user.type(screen.getByPlaceholderText('Şifre'), 'pass123');

        // Handling dates and times
        const dateInput = document.querySelector('input[type="date"]');
        const timeInput = document.querySelector('input[type="time"]');

        if (dateInput) await user.type(dateInput, '1995-05-15');
        if (timeInput) await user.type(timeInput, '14:30');

        await user.type(screen.getByPlaceholderText(/Doğum Yeri/i), 'Istanbul');

        await user.click(screen.getByRole('button', { name: /evrene katıl/i }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
                name: 'Ahmet Gezer',
                email: 'ahmet@astro.com',
                password: 'pass123',
                birthCity: 'Istanbul'
            }));
        });
    });
});
