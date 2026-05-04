import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../src/tests/utils/test-utils';
import Messages from '../../src/pages/Messages';
import api from '../../src/api/client';
import * as AuthContextModule from '../../src/context/AuthContext';
import * as SocketContextModule from '../../src/context/SocketContext';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useLocation: () => ({ state: null, pathname: '/messages', search: '', hash: '' }),
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

describe('Mesajlaşma Sayfası Testleri', () => {
    const mockSocket = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            userId: 'my_id',
            token: 'mock-token',
            user: { role: 'USER', isPremium: false },
            stardustBalance: 200,
            isPremium: false,
            dailySwipes: 0,
            avatar: null,
            login: vi.fn(),
            logout: vi.fn(),
            updateEconomy: vi.fn(),
            refreshUser: vi.fn()
        });

        vi.spyOn(SocketContextModule, 'useSocket').mockReturnValue({
            socket: mockSocket as any,
            isConnected: true,
            unreadCount: 0,
            setUnreadCount: vi.fn()
        });

        const mockGet = vi.mocked(api.get);
        mockGet.mockImplementation((url: string) => {
            if (url === '/user/friends') {
                return Promise.resolve({
                    data: {
                        friends: [
                            {
                                id: 'f1', name: 'Galaktik Ayşe', email: 'ayse@test.com',
                                status: 'MATCH', hasMessages: true,
                                lastMessage: { content: 'Selam!', senderId: 'f1', createdAt: new Date().toISOString() }
                            },
                            {
                                id: 'f2', name: 'Süresi Dolmuş Ali', email: 'ali@test.com',
                                status: 'MATCH', hasMessages: true,
                                expiresAt: new Date(Date.now() - 10000).toISOString(), isExpired: true,
                                lastMessage: { content: 'Bye', senderId: 'f2', createdAt: new Date().toISOString() }
                            }
                        ],
                        serverTime: Date.now()
                    }
                });
            }
            if (url === '/user/friend-requests') {
                return Promise.resolve({
                    data: {
                        requests: [
                            { id: 'req1', sender: { id: 's1', name: 'İstekte Mehmet', email: 'mehmet@test.com' }, createdAt: new Date().toISOString() }
                        ],
                        remaining: 4
                    }
                });
            }
            if (url.startsWith('/user/messages/')) {
                return Promise.resolve({ data: { messages: [] } });
            }
            if (url.includes('/user/friend-request-status/')) {
                return Promise.resolve({ data: { status: 'friends', remaining: 4 } });
            }
            return Promise.resolve({ data: {} });
        });
    });

    it('Sohbet listesinde arkadaşların gözükmesi ve İstekler sekmesine geçiş', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Messages />);

        // Default tab is 'messages' (Sohbet) — arkadaşlar hasMessages:true ile listelenmeli
        await waitFor(() => {
            expect(screen.getByText('Galaktik Ayşe')).toBeInTheDocument();
        });

        // İstekler sekmesine geç
        const requestsTab = screen.getByRole('button', { name: /İstekler/i });
        await user.click(requestsTab);

        await waitFor(() => {
            expect(screen.getByText('İstekte Mehmet')).toBeInTheDocument();
        });

        // Sohbet sekmesine geri dön
        const sohbetTab = screen.getByRole('button', { name: /Sohbet/i });
        await user.click(sohbetTab);

        await waitFor(() => {
            expect(screen.getByText('Galaktik Ayşe')).toBeInTheDocument();
        });
    });

    it('Sohbet açıldığında mesaj giriş alanı ve mesaj gönderimi', async () => {
        const user = userEvent.setup();
        const mockPost = vi.mocked(api.post);
        mockPost.mockResolvedValueOnce({ data: { success: true } });

        renderWithProviders(<Messages />);

        await waitFor(() => {
            expect(screen.getByText('Galaktik Ayşe')).toBeInTheDocument();
        });

        // Sohbet aç
        await user.click(screen.getByText('Galaktik Ayşe'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Mesaj yaz...')).toBeInTheDocument();
        });

        // Yazı yaz ve gönder
        const input = screen.getByPlaceholderText('Mesaj yaz...');
        await user.type(input, 'Merhaba dünya!{Enter}');

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/user/messages', {
                receiverId: 'f1',
                content: 'Merhaba dünya!'
            });
        });
    });

    it('Süresi dolan sohbette uyarı gösterilmesi', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Messages />);

        await waitFor(() => {
            expect(screen.getByText('Süresi Dolmuş Ali')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Süresi Dolmuş Ali'));

        await waitFor(() => {
            expect(screen.getByText('Bu sohbetin süresi doldu!')).toBeInTheDocument();
        });

        // Süreyi uzat butonu görünmeli
        const extendBtn = screen.getByRole('button', { name: /Süreyi Uzat/i });
        expect(extendBtn).toBeInTheDocument();
    });
});
