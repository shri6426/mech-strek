'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchClientDashboard, ClientDashboardData } from '@/lib/api';
import {
  Clock,
  Folder,
  FileText,
  MessagesSquare,
  Upload,
  ArrowUpRight,
  TrendingUp,
  IndianRupee,
  CalendarCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
  );
}

export default function ClientDashboard() {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClientDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data || uploading) return;
    setUploading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('client_token');
      const res = await fetch(`${API_BASE_URL}/client/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const projects = await res.json();
        if (projects.length > 0) {
          const projectId = projects[0].id;
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch(`${API_BASE_URL}/client/projects/${projectId}/files/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (uploadRes.ok) {
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-4">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-7 w-64" />
        </div>
        <SkeletonBlock className="h-52 w-full rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">
          <SkeletonBlock className="h-20 rounded-2xl" />
          <SkeletonBlock className="h-20 rounded-2xl" />
          <SkeletonBlock className="h-20 rounded-2xl" />
        </div>
        <SkeletonBlock className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-28 rounded-2xl" />
          <SkeletonBlock className="h-28 rounded-2xl" />
          <SkeletonBlock className="h-28 rounded-2xl" />
          <SkeletonBlock className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 rounded-2xl bg-[#0d0d0d] border border-white/5 text-center">
        <Zap className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
        <p className="text-sm text-neutral-500 font-mono">No active project found for your account.</p>
        <p className="text-xs text-neutral-600 mt-1">Contact your project manager to get started.</p>
      </div>
    );
  }

  const progress = data.progress_percent ?? 0;

  const stats = [
    {
      label: 'Progress',
      value: `${progress}%`,
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Outstanding',
      value: data.outstanding_invoice_amount > 0 ? formatCurrency(data.outstanding_invoice_amount) : '₹0',
      icon: IndianRupee,
      color: data.outstanding_invoice_amount > 0 ? 'text-amber-400' : 'text-green-400',
      bg: data.outstanding_invoice_amount > 0 ? 'bg-amber-500/10' : 'bg-green-500/10',
    },
    {
      label: 'Next Milestone',
      value: data.next_milestone?.due_date
        ? new Date(data.next_milestone.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'TBD',
      icon: CalendarCheck,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

  const quickLinks = [
    { label: 'Files & Assets',  href: '/portal/files',      icon: Folder, badge: undefined },
    { label: 'Invoices',        href: '/portal/invoices',   icon: FileText, badge: data.outstanding_invoice_amount > 0 ? 'Due' : undefined },
    { label: 'Messages',        href: '/portal/messages',   icon: MessagesSquare, badge: undefined },
    { label: 'Proposals',       href: '/portal/proposals',  icon: Clock, badge: undefined },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="space-y-0.5">
        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Client Workspace</span>
        <h1 className="text-xl font-bold tracking-tight text-white">{data.project_name}</h1>
      </div>

      {/* Progress Hero */}
      <div className="relative p-8 rounded-3xl bg-[#0d0d0d] border border-white/5 overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Website Progress</span>
          <div className="text-8xl font-black tracking-tighter text-white tabular-nums leading-none">
            {progress}
            <span className="text-4xl text-neutral-500">%</span>
          </div>
          {/* Animated gradient bar */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c3aed, #6366f1, #818cf8)',
              }}
            />
          </div>
          <p className="text-xs text-neutral-500">
            {progress < 25 ? 'Just getting started 🚀' :
             progress < 50 ? 'Building core features 🔧' :
             progress < 75 ? 'Great progress! Almost there 💪' :
             progress < 100 ? 'Final stretch — finishing up ✨' : 'Complete! 🎉'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 flex flex-col gap-2">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <div>
              <p className="text-base font-bold text-white leading-tight">{s.value}</p>
              <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Current Phase */}
      <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Current Phase</span>
          <span className="text-[9px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
            In Progress
          </span>
        </div>
        <p className="text-sm font-medium text-white leading-relaxed">
          {data.today_update || 'Development and integrations in progress.'}
        </p>

        {data.next_milestone && (
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">Next Milestone</p>
              <p className="text-sm font-semibold text-white mt-0.5">{data.next_milestone.title}</p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
              Due {data.next_milestone.due_date
                ? new Date(data.next_milestone.due_date).toLocaleDateString(undefined, { weekday: 'long' })
                : 'Friday'}
            </span>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 block">Workspace</span>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/10 hover:bg-white/3 transition-all duration-150 flex flex-col justify-between h-28 group"
            >
              <div className="flex justify-between items-start w-full">
                <div className="p-2 rounded-lg bg-white/5 text-neutral-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                  <item.icon size={14} />
                </div>
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{item.label}</div>
                {item.badge && (
                  <span className="text-[8px] font-mono text-amber-400 uppercase tracking-wider block mt-0.5 animate-pulse">
                    ● {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Upload */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl font-semibold text-xs transition-all duration-200 ${
            uploadSuccess
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white hover:bg-[#e5e5e5] text-black'
          }`}
        >
          <Upload size={12} />
          {uploading ? 'Uploading...' : uploadSuccess ? 'Asset Uploaded!' : 'Upload Assets / Brand Guidelines'}
        </button>
      </div>
    </div>
  );
}
