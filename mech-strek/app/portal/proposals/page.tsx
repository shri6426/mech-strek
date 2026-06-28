'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { FileSignature, CheckCircle, Clock, ChevronDown, ChevronUp, Download, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProposalScopeItem {
  id: string;
  title: string;
  description?: string;
  price: number;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  total_amount: number;
  created_at: string;
  scope_items: ProposalScopeItem[];
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  ACCEPTED: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  SENT:     { color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/20'  },
  DRAFT:    { color: 'text-neutral-400', bg: 'bg-white/5',    border: 'border-white/10'      },
};

export default function ClientProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch<Proposal[]>('/proposals/client')
      .then((data) => { setProposals(data); if (data.length > 0) setExpandedId(data[0].id); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      await apiFetch<Proposal>(`/proposals/client/${id}/accept`, { method: 'POST' });
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: 'ACCEPTED' } : p));
      showToast('Proposal accepted! Your project is now active.', 'success');
      setTimeout(() => router.push('/portal'), 2500);
    } catch {
      showToast('Failed to accept proposal. Please try again.', 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const token = localStorage.getItem('client_token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${API_BASE_URL}/proposals/client/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposal_${id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Could not generate PDF. Contact your project manager.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalQuoted   = proposals.reduce((s, p) => s + p.total_amount, 0);
  const totalAccepted = proposals.filter((p) => p.status === 'ACCEPTED').reduce((s, p) => s + p.total_amount, 0);
  const pendingCount  = proposals.filter((p) => p.status === 'SENT').length;

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <SkeletonBlock className="h-7 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <SkeletonBlock key={i} className="h-20 rounded-2xl" />)}
        </div>
        {[1,2].map(i => <SkeletonBlock key={i} className="h-40 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="pb-5 border-b border-white/5">
        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Agreements</span>
        <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Project Proposals</h1>
        <p className="text-sm text-neutral-500 mt-1">Review scope of work and authorize new projects.</p>
      </div>

      {/* Stats */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Quoted',  value: fmt(totalQuoted),   color: 'text-neutral-300', bg: 'bg-white/5', icon: FileSignature },
            { label: 'Accepted',      value: fmt(totalAccepted), color: 'text-green-400',   bg: 'bg-green-500/10', icon: CheckCircle },
            { label: 'Awaiting Review', value: `${pendingCount} Proposal${pendingCount !== 1 ? 's' : ''}`, color: pendingCount > 0 ? 'text-blue-400' : 'text-neutral-400', bg: pendingCount > 0 ? 'bg-blue-500/10' : 'bg-white/5', icon: Clock },
          ].map((s) => (
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
      )}

      {/* Proposals */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="p-12 text-center bg-[#0d0d0d] rounded-2xl border border-white/5">
            <FileSignature className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
            <p className="text-sm text-neutral-500">No proposals yet.</p>
          </div>
        ) : (
          proposals.map((p) => {
            const cfg = statusConfig[p.status] ?? statusConfig.DRAFT;
            const isExpanded = expandedId === p.id;
            const isAccepting = acceptingId === p.id;
            const isDownloading = downloadingId === p.id;
            return (
              <div key={p.id} className="bg-[#0d0d0d] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-150">
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="w-full p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border} shrink-0 mt-0.5`}>
                      <FileSignature className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">{p.title}</h2>
                      <p className="text-[10px] font-mono text-neutral-600 mt-0.5">
                        Created {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-white">₹{p.total_amount.toLocaleString()}</p>
                      <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {p.status}
                      </span>
                    </div>
                    {isExpanded
                      ? <ChevronUp size={14} className="text-neutral-600 shrink-0" />
                      : <ChevronDown size={14} className="text-neutral-600 shrink-0" />}
                  </div>
                </button>

                {/* Collapsible Scope */}
                {isExpanded && (
                  <div className="border-t border-white/5">
                    <div className="p-5 space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">Deliverables</p>
                      <div className="space-y-2">
                        {p.scope_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center bg-[#111] border border-white/5 p-3.5 rounded-xl"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">{item.title}</p>
                              {item.description && (
                                <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <span className="text-sm font-mono font-bold text-white shrink-0 ml-4">
                              ₹{item.price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total row */}
                      <div className="flex justify-between items-center px-3.5 py-2 rounded-xl bg-white/3 border border-white/5">
                        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Total</span>
                        <span className="text-sm font-bold text-white">₹{p.total_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-white/5 bg-[#080808] flex flex-wrap gap-3 justify-end">
                      <button
                        onClick={() => handleDownload(p.id)}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        Download PDF
                      </button>

                      {p.status === 'SENT' && (
                        <button
                          onClick={() => handleAccept(p.id)}
                          disabled={isAccepting}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-colors disabled:opacity-60"
                        >
                          {isAccepting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          {isAccepting ? 'Accepting...' : 'Accept & Start Project'}
                        </button>
                      )}

                      {p.status === 'ACCEPTED' && (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle size={12} /> Accepted
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
