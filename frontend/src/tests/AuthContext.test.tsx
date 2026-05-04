import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import * as jwtDecodeModule from 'jwt-decode';

vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const TestComponent = () => {
    const { user, stardustBalance, login, logout, updateEconomy } = useAuth();

    return (
        <div>
            <div data-testid="user-state">{user ? user.name : 'Guest'}</div>
            <div data-testid="balance-state">{stardustBalance}</div>
            <button onClick={() => login('fake_token', { name: 'Test User' }, '/home')}>Login</button>
            <button onClick={() => updateEconomy({ stardustBalance: 500 })}>Update Economy</button>
            <button onClick={() => logout()}>Logout</button>
        </div>
    );
};

const renderAuth = () => render(
    <MemoryRouter>
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
    </MemoryRouter>
);

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should initialize with default states', () => {
        renderAuth();
        expect(screen.getByTestId('user-state')).toHaveTextContent('Guest');
        expect(screen.getByTestId('balance-state')).toHaveTextContent('0');
    });

    it('should login, decode token, and navigate', async () => {
        const user = userEvent.setup();
        vi.spyOn(jwtDecodeModule, 'jwtDecode').mockReturnValue({ userId: '123' } as any);

        renderAuth();
        const loginBtn = screen.getByText('Login');

        await user.click(loginBtn);

        expect(localStorage.getItem('token')).toBe('fake_token');
        expect(localStorage.getItem('user')).toContain('Test User');
        expect(mockNavigate).toHaveBeenCalledWith('/home');

        await waitFor(() => {
            expect(screen.getByTestId('user-state')).toHaveTextContent('Test User');
        });
    });

    it('should update economy stats', async () => {
        const user = userEvent.setup();
        renderAuth();

        await user.click(screen.getByText('Update Economy'));

        await waitFor(() => {
            expect(screen.getByTestId('balance-state')).toHaveTextContent('500');
        });
    });

    it('should perform logout correctly', async () => {
        localStorage.setItem('token', 'fake_token');
        localStorage.setItem('user', JSON.stringify({ name: 'Test User' }));

        const user = userEvent.setup();
        renderAuth();

        await waitFor(() => {
            expect(screen.getByTestId('user-state')).toHaveTextContent('Test User');
        });

        await user.click(screen.getByText('Logout'));

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/login');

        await waitFor(() => {
            expect(screen.getByTestId('user-state')).toHaveTextContent('Guest');
        });
    });
});
