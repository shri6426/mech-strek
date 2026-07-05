'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileSignature,
  Receipt,
  FolderOpen,
  MessagesSquare,
  HelpCircle,
  LogOut,
  Briefcase,
  ChevronRight,
  Menu,
  X,
  User2,
} from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';

const navigation = [
  { name: 'Dashboard',     href: '/portal',            icon: LayoutDashboard },
  { name: 'Proposals',     href: '/portal/proposals',  icon: FileSignature },
  { name: 'Invoices',      href: '/portal/invoices',   icon: Receipt },
  { name: 'Files & Assets',href: '/portal/files',      icon: FolderOpen },
  { name: 'Messages',      href: '/portal/messages',   icon: MessagesSquare },
  { name: 'Support',       href: '/portal/support',    icon: HelpCircle },
];

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add('use-default-cursor');
    return () => document.body.classList.remove('use-default-cursor');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('client_token');
    if (!token && pathname !== '/portal/login') {
      router.push('/portal/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('client_token');
    if (token) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      // Revoke the token server-side (fire-and-forget — don't block UX)
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // silently ignore network errors on logout
    }
    localStorage.removeItem('client_token');
    router.push('/portal/login');
  };

  if (pathname === '/portal/login') return <>{children}</>;
  if (!isAuthenticated) return null;

  const SidebarContent = () => (
    <>
      {/* Logo and Bell */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
        <Link href="/portal" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight block leading-none">Client Portal</span>
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">MechStrek Agency</span>
          </div>
        </Link>
        <NotificationBell role="client" />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest px-3 pt-2 pb-1">Workspace</p>
        {navigation.map((item) => {
          const isActive = item.href === '/portal' ? pathname === '/portal' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative ${
                isActive
                  ? 'bg-white/8 text-white font-medium'
                  : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-neutral-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-white/3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex items-center justify-center shrink-0">
            <User2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium text-white truncate">Client</p>
            <p className="text-[9px] font-mono text-neutral-500 truncate">Secure Session</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen pt-16 bg-[#080808] flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 z-50 w-64 bg-[#0d0d0d] border-r border-white/5 flex flex-col transition-transform duration-200 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0d0d0d] border-r border-white/5 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0d0d0d] sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">
            {navigation.find(n => n.href === '/portal' ? pathname === '/portal' : pathname.startsWith(n.href))?.name || 'Portal'}
          </span>
        </div>

        <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
