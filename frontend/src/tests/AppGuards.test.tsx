import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, UserOnlyRoute, TellerOnlyRoute } from '../../src/App';
import * as AuthContextModule from '../../src/context/AuthContext';

const MockChild = () => <div data-testid="protected-content">Secret Content</div>;
const MockLogin = () => <div data-testid="login-page">Login Page</div>;
const MockTellerDashboard = () => <div data-testid="teller-dashboard">Teller Dashboard</div>;
const MockHome = () => <div data-testid="home-page">Home Page</div>;

const setupMockAuth = (token: string | null = null, role: string = 'USER') => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        token,
        user: role ? { role } : null,
        userId: '1',
        stardustBalance: 0,
        isPremium: false,
        dailySwipes: 0,
        avatar: null,
        login: vi.fn(),
        logout: vi.fn(),
        updateEconomy: vi.fn(),
        refreshUser: vi.fn()
    });
};

describe('Route Guards Tests', () => {

    it('ProtectedRoute: Redirects to /login if there is no token', () => {
        setupMockAuth(null);
        render(
            <MemoryRouter initialEntries={['/secret']}>
                <Routes>
                    <Route path="/login" element={<MockLogin />} />
                    <Route path="/secret" element={<ProtectedRoute><MockChild /></ProtectedRoute>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('ProtectedRoute: Renders children if token is present', () => {
        setupMockAuth('fake-token');
        render(
            <MemoryRouter initialEntries={['/secret']}>
                <Routes>
                    <Route path="/secret" element={<ProtectedRoute><MockChild /></ProtectedRoute>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('UserOnlyRoute: Redirects teller to /teller-dashboard', () => {
        setupMockAuth('fake-token', 'FORTUNE_TELLER');
        render(
            <MemoryRouter initialEntries={['/messages']}>
                <Routes>
                    <Route path="/teller-dashboard" element={<MockTellerDashboard />} />
                    <Route path="/messages" element={<UserOnlyRoute><MockChild /></UserOnlyRoute>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTestId('teller-dashboard')).toBeInTheDocument();
    });

    it('UserOnlyRoute: Renders normal user', () => {
        setupMockAuth('fake-token', 'USER');
        render(
            <MemoryRouter initialEntries={['/messages']}>
                <Routes>
                    <Route path="/messages" element={<UserOnlyRoute><MockChild /></UserOnlyRoute>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('TellerOnlyRoute: Redirects normal user to /', () => {
        setupMockAuth('fake-token', 'USER');
        render(
            <MemoryRouter initialEntries={['/teller-dashboard']}>
                <Routes>
                    <Route path="/" element={<MockHome />} />
                    <Route path="/teller-dashboard" element={<TellerOnlyRoute><MockChild /></TellerOnlyRoute>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
});
