'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, removeAuthToken } from '@/lib/api';
import { Inbox, Folder, MessageSquare, Layers, LogOut, ShieldCheck, FileText, Briefcase, Users, Zap, Calendar } from 'lucide-react';
import CommandPalette from '@/components/ui/CommandPalette';
import NotificationBell from '@/components/ui/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add('use-default-cursor');
    return () => {
      document.body.classList.remove('use-default-cursor');
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      localStorage.setItem('admin_token', tokenParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      router.push('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-sm text-neutral-400 font-mono">Verifying authentication...</div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    const token = getAuthToken();
    if (token) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    removeAuthToken();
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: Briefcase },
    { label: 'CRM', path: '/admin/crm', icon: Inbox },
    { label: 'Projects', path: '/admin/projects', icon: Folder },
    { label: 'Proposal', path: '/admin/proposals', icon: FileText },
    { label: 'Invoices', path: '/admin/invoices', icon: FileText },
    { label: 'Calendar', path: '/admin/calendar', icon: Calendar },
    { label: 'Messages', path: '/admin/messages', icon: MessageSquare },
    { label: 'Files', path: '/admin/files', icon: Folder },
    { label: 'Clients', path: '/admin/clients', icon: Users },
    { label: 'Analytics', path: '/admin/analytics', icon: Zap },
    { label: 'Settings', path: '/admin/settings', icon: Layers },
  ];

  return (
    <div className="h-screen pt-16 bg-[#080808] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0c0c0c] flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
                M
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">MechOS Studio</div>
                <div className="text-[10px] text-neutral-500 font-mono">Admin Portal v1.0</div>
              </div>
            </div>
            <NotificationBell role="admin" />
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white text-black font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-4 px-1">
            <ShieldCheck size={14} />
            Authenticated Session
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
