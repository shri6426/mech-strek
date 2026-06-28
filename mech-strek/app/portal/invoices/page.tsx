'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { IndianRupee, FileText, CheckCircle, Clock, AlertCircle, Download, Loader2 } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  pdf_url?: string;
  created_at: string;
  description?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  Paid:    { label: 'Paid',    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: CheckCircle },
  Overdue: { label: 'Overdue', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: AlertCircle },
  Pending: { label: 'Pending', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: Clock },
};

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    apiFetch<Invoice[]>('/invoices/client')
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      const updated = await apiFetch<Invoice>(`/invoices/client/${id}/pay`, { method: 'POST' });
      setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
      showToast('Payment processed successfully!', 'success');
    } catch {
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setPayingId(null);
    }
  };

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid   = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const totalDue    = totalBilled - totalPaid;

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-1">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SkeletonBlock className="h-20 rounded-2xl" />
          <SkeletonBlock className="h-20 rounded-2xl" />
          <SkeletonBlock className="h-20 rounded-2xl" />
        </div>
        {[1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl transition-all ${
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
        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Billing</span>
        <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Invoices</h1>
        <p className="text-sm text-neutral-500 mt-1">Review your billing history and settle pending payments.</p>
      </div>

      {/* Summary Stats */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Billed', value: fmt(totalBilled), icon: IndianRupee, color: 'text-neutral-300', bg: 'bg-white/5' },
            { label: 'Amount Paid',  value: fmt(totalPaid),   icon: CheckCircle, color: 'text-green-400',   bg: 'bg-green-500/10' },
            { label: 'Amount Due',   value: fmt(totalDue),    icon: Clock,       color: totalDue > 0 ? 'text-amber-400' : 'text-green-400', bg: totalDue > 0 ? 'bg-amber-500/10' : 'bg-green-500/10' },
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

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="p-12 text-center bg-[#0d0d0d] rounded-2xl border border-white/5">
            <FileText className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
            <p className="text-sm text-neutral-500">No invoices yet.</p>
            <p className="text-xs text-neutral-600 mt-1">Your billing history will appear here.</p>
          </div>
        ) : (
          invoices.map((inv) => {
            const cfg = statusConfig[inv.status] ?? statusConfig.Pending;
            const StatusIcon = cfg.icon;
            const isPaying = payingId === inv.id;
            const isPaid = inv.status === 'Paid';
            return (
              <div
                key={inv.id}
                className="bg-[#0d0d0d] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        INV-{inv.id.substring(0, 8).toUpperCase()}
                      </p>
                      {inv.description && (
                        <p className="text-xs text-neutral-500 mt-0.5">{inv.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-mono text-neutral-600">
                          Issued {new Date(inv.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-neutral-700">·</span>
                        <span className={`text-[10px] font-mono flex items-center gap-1 ${inv.status === 'Overdue' ? 'text-red-400' : 'text-neutral-600'}`}>
                          <Clock size={9} />
                          Due {new Date(inv.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right flex flex-col items-end gap-2.5 shrink-0">
                    <p className="text-lg font-bold text-white">₹{inv.amount.toLocaleString()}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <StatusIcon size={9} />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {(!isPaid || inv.pdf_url) && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-2">
                    {inv.pdf_url && (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                      >
                        <Download size={12} /> Receipt
                      </a>
                    )}
                    {!isPaid && (
                      <button
                        onClick={() => handlePay(inv.id)}
                        disabled={isPaying}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-colors disabled:opacity-60"
                      >
                        {isPaying ? (
                          <><Loader2 size={12} className="animate-spin" /> Processing...</>
                        ) : (
                          'Pay Now'
                        )}
                      </button>
                    )}
                  </div>
                )}
                {isPaid && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                      <CheckCircle size={12} /> Settled
                    </span>
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
