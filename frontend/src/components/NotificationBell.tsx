import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import type { Notification as NotificationType } from '../context/NotificationContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Dışarı tıklandığında popover kapansın
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = async (notification: NotificationType) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    return (
        <div className="notification-bell-container" ref={popoverRef}>
            <button className="notification-bell-button" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-popover">
                    <div className="popover-header">
                        <h3>Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read" onClick={markAllAsRead}>
                                Tümünü Oku
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>Henüz bildiriminiz yok.</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="notification-content-wrapper">
                                        <h4>{notif.title}</h4>
                                        <p>{notif.content}</p>
                                        <span className="notification-time">
                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {!notif.isRead && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
