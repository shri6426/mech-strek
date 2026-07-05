import { useEffect, useState, useCallback, useRef } from 'react';
import { getAuthToken, getWsUrl } from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(role: 'admin' | 'client') {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return role === 'admin' ? getAuthToken() : localStorage.getItem('client_token');
  }, [role]);

  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [API_BASE_URL, getToken]);

  useEffect(() => {
    fetchNotifications();

    const token = getToken();
    if (!token) return;

    const payload = parseJwt(token);
    const userId = payload?.sub;
    if (!userId) return;

    const wsUrl = getWsUrl(`/ws/notifications/${userId}?token=${token}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          const newNotif: Notification = {
            id: data.id,
            title: data.title,
            body: data.body,
            type: data.notification_type,
            link: data.link,
            is_read: data.is_read,
            created_at: data.created_at
          };
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Failed to parse WS notification:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [fetchNotifications, getToken]);

  const markRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllRead = async () => {
    const token = getToken();
    if (!token) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
