import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export interface Notification {
    id: string;
    type: string;
    title: string;
    content: string;
    isRead: boolean;
    actionUrl?: string;
    entityId?: string;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string, actionUrl?: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    fetchNotifications: async () => { },
    markAsRead: async () => { },
    markAllAsRead: async () => { }
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${BACKEND_URL}/api/notification`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.notifications.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Bildirimler yüklenemedi:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await axios.post(`${BACKEND_URL}/api/notification/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Eğer actionUrl varsa navigation işlemi NavBar bileşeninde veya çağrıldığı yerde yapılmalı (navigate)
            // Bu yüzden burası sadece veritabanını güncelliyor.
        } catch (error) {
            console.error('Bildirim okundu işaretlenemedi:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/notification/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Bildirimler okundu işaretlenemedi:', error);
        }
    };

    useEffect(() => {
        if (token) fetchNotifications();
        else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [token]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socket.on('newNotification', handleNewNotification);
        return () => {
            socket.off('newNotification', handleNewNotification);
        };
    }, [socket]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
