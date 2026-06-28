'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, MessageSquare, FileText, DollarSign, UserPlus, Info } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

export default function NotificationBell({ role }: { role: 'admin' | 'client' }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(role);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.is_read) {
      markRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'invoice': return <FileText className="w-4 h-4 text-violet-400" />;
      case 'proposal': return <FileText className="w-4 h-4 text-pink-400" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'lead': return <UserPlus className="w-4 h-4 text-amber-400" />;
      default: return <Info className="w-4 h-4 text-neutral-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors text-neutral-400 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[32rem] bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
            <h3 className="font-medium text-sm text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex gap-3 p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${!notif.is_read ? 'bg-white/[0.02]' : 'opacity-70'}`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate font-medium ${!notif.is_read ? 'text-white' : 'text-neutral-300'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-neutral-500 whitespace-nowrap mt-0.5 font-mono">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="flex-shrink-0 mt-1.5 flex items-start">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
