import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BACKEND_URL } from '../api/client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    setUnreadCount: () => { },
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }


        const newSocket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            // VULN 68 FIX: Hide socket ID from production logs (information disclosure)
            if (import.meta.env.DEV) console.log('Socket connected', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            if (import.meta.env.DEV) console.log('Socket disconnected');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMsg = () => {
            if (window.location.pathname !== '/messages') {
                setUnreadCount(prev => prev + 1);
            }
        };
        socket.on('receivePrivateMessage', handleNewMsg);
        return () => { socket.off('receivePrivateMessage', handleNewMsg); };
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, unreadCount, setUnreadCount }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
