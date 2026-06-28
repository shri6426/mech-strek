'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { DollarSign, Clock, AlertCircle, Plus, CheckCircle, X, Send } from 'lucide-react';
import { AdminProject } from '@/lib/api';

interface Invoice {
  id: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string;
  pdf_url?: string;
}

interface Summary {
  total_revenue: number;
  pending_revenue: number;
  overdue_revenue: number;
  total_invoices_count: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  
  // Form State
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, sumData, projData] = await Promise.all([
          apiFetch<Invoice[]>('/admin/portal/invoices'),
          apiFetch<Summary>('/invoices/admin/summary'),
          apiFetch<AdminProject[]>('/admin/portal/projects')
        ]);
        setInvoices(invData);
        setSummary(sumData);
        setProjects(projData);
      } catch (err) {
        console.error("Failed to load invoices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMarkPaid = async (id: string) => {
    try {
      await apiFetch<Invoice>(`/invoices/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Paid' })
      });
      setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'Paid' } : i));
      if (summary) {
        const inv = invoices.find(i => i.id === id);
        if (inv) {
          setSummary({
            ...summary,
            total_revenue: summary.total_revenue + inv.amount,
            pending_revenue: Math.max(0, summary.pending_revenue - inv.amount)
          });
        }
      }
    } catch (err) {
      console.error("Failed to mark invoice paid", err);
    }
  };

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Determine client ID from selected project if applicable
      let targetClient = clientId;
      if (projectId && projects.find(p => p.id === projectId)) {
        targetClient = projects.find(p => p.id === projectId)!.client_id;
      }
      
      const res = await apiFetch<Invoice>('/invoices/admin', {
        method: 'POST',
        body: JSON.stringify({
          client_id: targetClient,
          project_id: projectId || undefined,
          amount: Number(amount),
          due_date: new Date(dueDate).toISOString(),
          status: 'Pending'
        })
      });

      setInvoices([res, ...invoices]);
      if (summary) {
        setSummary({
          ...summary,
          pending_revenue: summary.pending_revenue + Number(amount),
          total_invoices_count: summary.total_invoices_count + 1
        });
      }
      
      // Reset form
      setShowModal(false);
      setAmount('');
      setDueDate('');
      setProjectId('');
      setClientId('');
    } catch (err) {
      alert("Failed to issue invoice");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-white">Loading financial engine...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Revenue & Invoices</h1>
          <p className="text-sm text-neutral-400 mt-1">Monitor agency cash flow, issue billing, and record settlements.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Issue Invoice
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-xs uppercase font-medium">Total Revenue Settled</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <span className="text-3xl font-bold text-white">₹{summary?.total_revenue.toLocaleString() || '0'}</span>
        </div>

        <div className="bg-[#111] border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-xs uppercase font-medium">Pending Payments</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-3xl font-bold text-white">₹{summary?.pending_revenue.toLocaleString() || '0'}</span>
        </div>

        <div className="bg-[#111] border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 mb-2">
            <span className="text-xs uppercase font-medium">Overdue Accounts</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-3xl font-bold text-white">₹{summary?.overdue_revenue.toLocaleString() || '0'}</span>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-neutral-500 bg-white/5">
              <th className="p-4 font-medium">Invoice ID</th>
              <th className="p-4 font-medium">Client ID</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Due Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  No invoices recorded yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">INV-{inv.id.substring(0, 8).toUpperCase()}</td>
                  <td className="p-4 text-sm text-neutral-400">{inv.client_id.substring(0, 8)}...</td>
                  <td className="p-4 text-sm font-semibold text-white">₹{inv.amount.toLocaleString()}</td>
                  <td className="p-4 text-sm text-neutral-400">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      inv.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      inv.status === 'Overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {inv.status !== 'Paid' && (
                      <button 
                        onClick={() => handleMarkPaid(inv.id)}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out / Modal for Issuing Invoices */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={16} /> Issue New Invoice
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleIssueInvoice} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                  Select Project
                </label>
                <select 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- No Project (Direct to Client) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {!projectId && (
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                    Client ID (Manual)
                  </label>
                  <input
                    type="text"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter Client ID manually"
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#e5e5e5] transition-colors flex items-center gap-1.5"
                >
                  <Send size={13} />
                  {submitting ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
