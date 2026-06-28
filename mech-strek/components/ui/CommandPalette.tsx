'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchAdminProjects, AdminProject } from '@/lib/api';
import { Search, FileText, Folder, User, PlusCircle, Command, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen for Ctrl+K / Cmd+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Pre-fetch projects for quick search
      const getProjects = async () => {
        try {
          const data = await fetchAdminProjects();
          setProjects(data);
        } catch (e) {
          console.error(e);
        }
      };
      getProjects();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const defaultActions = [
    { label: 'Create Invoice', href: '/admin/invoices', icon: PlusCircle },
    { label: 'New Proposal', href: '/admin/proposals', icon: FileText },
    { label: 'New Client', href: '/admin/clients', icon: User },
    { label: 'Open CRM Inquiries', href: '/admin/crm', icon: Search },
    { label: 'Open Projects Workspace', href: '/admin/projects', icon: Folder }
  ];

  // Filter actions and projects based on search query
  const filteredActions = defaultActions.filter(act => 
    act.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter(proj => 
    proj.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-start justify-center pt-[15vh] px-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      {/* Main command palette box */}
      <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[50vh]">
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 border-b border-white/5 h-12">
          <Search size={15} className="text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search workspace..."
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder-neutral-500"
          />
          <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
            ESC
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5 scrollbar-thin">
          {/* Actions Section */}
          {filteredActions.length > 0 && (
            <div className="p-1 space-y-1">
              <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest px-2 py-1">
                Quick Actions
              </span>
              {filteredActions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNavigate(act.href)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <act.icon size={13} className="text-neutral-500 group-hover:text-white" />
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Projects Section */}
          {filteredProjects.length > 0 && (
            <div className="p-1 pt-2 space-y-1">
              <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest px-2 py-1">
                Active Projects
              </span>
              {filteredProjects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleNavigate(`/admin/projects/${proj.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <Folder size={13} className="text-neutral-400 group-hover:text-white" />
                  <span>Open {proj.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredActions.length === 0 && filteredProjects.length === 0 && (
            <div className="text-center py-8 text-xs text-neutral-500 font-mono">
              No actions or projects matching query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
