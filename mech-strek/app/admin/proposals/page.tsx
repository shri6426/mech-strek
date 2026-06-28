'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Plus, FileText, Send, X, Trash2 } from 'lucide-react';

interface ProposalScopeItem {
  id?: string;
  title: string;
  description?: string;
  price: number;
}

interface Proposal {
  id: string;
  client_id: string;
  title: string;
  status: string;
  total_amount: number;
  created_at: string;
  scope_items: ProposalScopeItem[];
}

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [scopeItems, setScopeItems] = useState<ProposalScopeItem[]>([
    { title: '', description: '', price: 0 }
  ]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await apiFetch<Proposal[]>('/proposals/admin');
        setProposals(data);
      } catch (err) {
        console.error("Failed to load proposals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch<Proposal>(`/proposals/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setProposals(proposals.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<Proposal>('/proposals/admin', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          title: title,
          notes: notes,
          valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
          scope_items: scopeItems.filter(i => i.title && i.price >= 0)
        })
      });
      setProposals([res, ...proposals]);
      
      // Reset
      setShowModal(false);
      setClientId('');
      setTitle('');
      setNotes('');
      setValidUntil('');
      setScopeItems([{ title: '', description: '', price: 0 }]);
    } catch (err) {
      alert("Failed to create proposal");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addScopeItem = () => {
    setScopeItems([...scopeItems, { title: '', description: '', price: 0 }]);
  };

  const removeScopeItem = (idx: number) => {
    setScopeItems(scopeItems.filter((_, i) => i !== idx));
  };

  const updateScopeItem = (idx: number, field: keyof ProposalScopeItem, value: any) => {
    const updated = [...scopeItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setScopeItems(updated);
  };

  if (loading) return <div className="text-white">Loading proposals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Proposal Management</h1>
          <p className="text-sm text-neutral-400 mt-1">Draft, send, and track client project proposals.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Proposal
        </button>
      </div>

      <div className="grid gap-4">
        {proposals.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center text-neutral-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No proposals created yet.</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-white">{proposal.title}</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    proposal.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    proposal.status === 'SENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                  }`}>
                    {proposal.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">Client ID: {proposal.client_id.substring(0, 8)} | {proposal.scope_items.length} Scope Items</p>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <span className="text-xl font-bold text-white">₹{proposal.total_amount.toLocaleString()}</span>
                  <p className="text-[10px] text-neutral-500 uppercase">Total Quote</p>
                </div>

                <div className="flex gap-2">
                  {proposal.status === 'DRAFT' && (
                    <button 
                      onClick={() => handleUpdateStatus(proposal.id, 'SENT')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3 h-3" /> Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-out / Modal for Creating Proposal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={16} /> Draft New Proposal
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <form id="proposalForm" onSubmit={handleCreateProposal} className="space-y-6">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Proposal Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Website Redesign"
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Client ID</label>
                    <input
                      type="text"
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Client reference ID"
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Valid Until</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Cover Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Introduction to client..."
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 h-20"
                  />
                </div>

                {/* Scope Builder */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Scope of Work</label>
                    <button type="button" onClick={addScopeItem} className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                      <Plus size={12} /> Add Deliverable
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {scopeItems.map((item, idx) => (
                      <div key={idx} className="bg-[#181818] border border-white/5 p-4 rounded-xl flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            required
                            placeholder="Deliverable Title"
                            value={item.title}
                            onChange={(e) => updateScopeItem(idx, 'title', e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Brief Description (optional)"
                            value={item.description}
                            onChange={(e) => updateScopeItem(idx, 'description', e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="w-32 space-y-3">
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Price (₹)"
                            value={item.price}
                            onChange={(e) => updateScopeItem(idx, 'price', Number(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                          {scopeItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeScopeItem(idx)}
                              className="w-full p-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex justify-center items-center gap-1.5"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-xs text-white font-mono font-bold py-2">
                    Total: ₹{scopeItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0).toLocaleString()}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-[#0d0d0d]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="proposalForm"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#e5e5e5] transition-colors flex items-center gap-1.5"
              >
                {submitting ? 'Generating...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
