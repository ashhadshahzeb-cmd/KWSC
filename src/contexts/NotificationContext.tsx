import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sqlApi } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    status: 'unread' | 'read';
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { role, isAdmin } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const audio = React.useMemo(() => new Audio(NOTIFICATION_SOUND_URL), []);

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    const playSound = () => {
        audio.play().catch(e => console.error('Error playing notification sound:', e));
    };

    const fetchNotifications = async (isInitial = false) => {
        if (!isAdmin) return;

        try {
            const data = await sqlApi.notifications.getAll();
            const prevUnreadCount = notifications.filter(n => n.status === 'unread').length;
            const newUnreadCount = data.filter((n: Notification) => n.status === 'unread').length;

            // Play sound and show toast if new notifications arrived (and it's not the initial fetch on mount)
            if (!isInitial && newUnreadCount > prevUnreadCount) {
                playSound();
                const latest = data.find((n: Notification) => n.status === 'unread' && !notifications.find(prev => prev.id === n.id));
                if (latest) {
                    toast.info(latest.title, {
                        description: latest.message,
                        duration: 5000,
                    });
                }
            }

            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            // Initial fetch
            fetchNotifications(true).then(() => {
                // Play sound if there are unread notifications on login
                const unreadOnEntry = notifications.filter(n => n.status === 'unread').length;
                if (unreadOnEntry > 0) {
                    // Wait a bit for UI to settle
                    setTimeout(playSound, 1000);
                }
            });

            // Set up polling (every 10 seconds)
            const interval = setInterval(() => fetchNotifications(), 10000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setLoading(false);
        }
    }, [isAdmin]);

    const markAsRead = async (id: number) => {
        try {
            await sqlApi.notifications.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await sqlApi.notifications.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const clearAll = async () => {
        try {
            await sqlApi.notifications.deleteAll();
            setNotifications([]);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                refreshNotifications: () => fetchNotifications(),
                markAsRead,
                markAllAsRead,
                clearAll
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
