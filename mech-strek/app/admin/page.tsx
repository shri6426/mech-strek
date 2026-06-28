'use client';

import { useState, useEffect } from 'react';
import { fetchAdminDashboardMetrics, fetchAdminProjects, AdminDashboardMetrics, AdminProject } from '@/lib/api';
import { 
  DollarSign, 
  Briefcase, 
  Inbox, 
  FileText, 
  CheckSquare, 
  UserPlus, 
  FilePlus, 
  Calendar, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function FounderDashboard() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [metricsData, projectsData] = await Promise.all([
          fetchAdminDashboardMetrics(),
          fetchAdminProjects()
        ]);
        setMetrics(metricsData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Static Agenda as specified
  const agendaItems = [
    { title: 'Client Call — 10:30 AM', completed: false },
    { title: 'Deploy BC Cafe Website', completed: false },
    { title: 'Review Gym Proposal', completed: false }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xs text-neutral-400 font-mono">Loading Agency Operating System...</div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="pb-6 border-b border-white/5">
        <h1 className="text-2xl font-display font-semibold tracking-tight text-white">
          Good Evening, Aashish 👋
        </h1>
        <p className="text-xs text-neutral-400 mt-1">Here is the current state of your agency operations.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Revenue This Month', 
            val: formatCurrency(metrics?.revenue_this_month || 85000), 
            icon: DollarSign,
            color: 'text-emerald-400 bg-emerald-500/10'
          },
          { 
            label: 'Active Projects', 
            val: projects.length || 6, 
            icon: Briefcase,
            color: 'text-blue-400 bg-blue-500/10'
          },
          { 
            label: 'New Leads', 
            val: metrics?.new_leads || 8, 
            icon: Inbox,
            color: 'text-purple-400 bg-purple-500/10'
          },
          { 
            label: 'Pending Invoices', 
            val: metrics?.invoices_pending || 2, 
            icon: FileText,
            color: 'text-amber-400 bg-amber-500/10'
          }
        ].map((m, idx) => (
          <div 
            key={idx} 
            className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between h-28"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                {m.label}
              </span>
              <div className={`p-1.5 rounded-lg ${m.color}`}>
                <m.icon size={13} />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-white">
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Agenda & Activity */}
        <div className="md:col-span-7 space-y-12">
          {/* Today's Agenda */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Today's Agenda
            </h2>
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 overflow-hidden divide-y divide-white/5">
              {agendaItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3.5 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-neutral-200 font-medium">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Recent Activity
            </h2>
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 p-5 space-y-4">
              {metrics && metrics.recent_activity && metrics.recent_activity.length > 0 ? (
                <div className="relative border-l border-white/10 pl-5 ml-2.5 space-y-6">
                  {metrics.recent_activity.map((act) => (
                    <div key={act.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-[#1c1c1e] border-2 border-blue-500 group-hover:border-white transition-colors" />
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-white">
                          {act.action}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {act.details}
                        </div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 text-center py-4">No recent activity.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Quick Actions */}
        <div className="md:col-span-5 space-y-12">
          {/* Projects */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Active Projects
            </h2>
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 p-5 space-y-5">
              {projects.length > 0 ? (
                projects.map((proj) => (
                  <Link 
                    key={proj.id} 
                    href={`/admin/projects/${proj.id}`}
                    className="block space-y-2 hover:bg-white/[0.02] p-2.5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{proj.name}</span>
                      <span className="text-neutral-400 font-mono text-[10px]">{proj.progress_percent}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500" 
                        style={{ width: `${proj.progress_percent}%` }}
                      />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-neutral-500 text-center py-4">No active projects.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { label: 'New Client', href: '/admin/clients', icon: UserPlus },
                { label: 'Create Proposal', href: '/admin/proposals', icon: FilePlus },
                { label: 'Create Invoice', href: '/admin/invoices', icon: PlusCircle },
                { label: 'New Project', href: '/admin/projects', icon: Briefcase },
                { label: 'Schedule Meeting', href: '/admin/calendar', icon: Calendar }
              ].map((act, idx) => (
                <Link
                  key={idx}
                  href={act.href}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d0d0d] border border-white/5 hover:border-white/10 text-xs text-neutral-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <act.icon size={13} className="text-neutral-500 group-hover:text-white" />
                    <span>{act.label}</span>
                  </div>
                  <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400" />
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
