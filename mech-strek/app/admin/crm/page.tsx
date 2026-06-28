'use client';

import { useState, useEffect } from 'react';
import { fetchAdminInquiries, updateInquiryStatus, InquiryItem } from '@/lib/api';
import { 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw, 
  Plus, 
  DollarSign, 
  Briefcase, 
  X, 
  ChevronRight,
  User,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Pipeline columns and metadata
const COLUMNS: { id: InquiryItem['status']; label: string; color: string }[] = [
  { id: 'NEW', label: 'Lead', color: 'border-blue-500/20 text-blue-400' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/20 text-amber-400' },
  { id: 'MEETING_SCHEDULED', label: 'Meeting Scheduled', color: 'border-purple-500/20 text-purple-400' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-indigo-500/20 text-indigo-400' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-pink-500/20 text-pink-400' },
  { id: 'CONVERTED', label: 'Won', color: 'border-emerald-500/20 text-emerald-400' },
  { id: 'PROJECT', label: 'Project', color: 'border-teal-500/20 text-teal-400' },
  { id: 'ARCHIVED', label: 'Archived', color: 'border-neutral-500/20 text-neutral-400' }
];

export default function LeadCRM() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<InquiryItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminInquiries();
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load inquiries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: any, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: InquiryItem['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    if (!id) return;

    // Find current status
    const item = inquiries.find(x => x.id === id);
    if (!item || item.status === targetStatus) return;

    // Optimistic update
    setInquiries(prev => prev.map(x => x.id === id ? { ...x, status: targetStatus } : x));
    setUpdatingId(id);

    try {
      await updateInquiryStatus(id, targetStatus);
    } catch (err) {
      // Revert on error
      setInquiries(prev => prev.map(x => x.id === id ? { ...x, status: item.status } : x));
      alert('Failed to update pipeline stage');
    } finally {
      setUpdatingId(null);
    }
  };

  // Click-to-move trigger for mobile & non-mouse devices
  const moveLeadTo = async (lead: InquiryItem, targetStatus: InquiryItem['status']) => {
    if (lead.status === targetStatus) return;
    setInquiries(prev => prev.map(x => x.id === lead.id ? { ...x, status: targetStatus } : x));
    setUpdatingId(lead.id);
    if (selectedLead?.id === lead.id) {
      setSelectedLead({ ...lead, status: targetStatus });
    }

    try {
      await updateInquiryStatus(lead.id, targetStatus);
    } catch (err) {
      setInquiries(prev => prev.map(x => x.id === lead.id ? { ...x, status: lead.status } : x));
      if (selectedLead?.id === lead.id) {
        setSelectedLead(lead);
      }
      alert('Failed to update pipeline stage');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white">Lead CRM</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Drag and drop pipeline to manage incoming clients and convert them to active projects.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          disabled={loading}
          className="p-2 rounded-xl bg-[#0d0d0d] border border-white/5 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="text-xs text-neutral-500 font-mono">Syncing CRM pipeline...</div>
        </div>
      ) : (
        /* Board Area - scrollable horizontally */
        <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin select-none">
          <div className="flex gap-4 min-w-[1600px] h-[calc(100vh-180px)]">
            {COLUMNS.map(col => {
              const colInquiries = inquiries.filter(x => x.status === col.id);
              
              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="w-80 flex flex-col bg-[#080808] border border-white/5 rounded-2xl p-4 space-y-4 h-full"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded-full border ${col.color}`}>
                        {col.label}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        ({colInquiries.length})
                      </span>
                    </div>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {colInquiries.map(lead => (
                      <motion.div
                        key={lead.id}
                        layoutId={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-4 rounded-xl bg-[#0d0d0d] border hover:border-white/10 transition-colors cursor-grab active:cursor-grabbing space-y-3 relative group ${
                          updatingId === lead.id ? 'opacity-40 pointer-events-none' : 'border-white/5'
                        } ${draggingId === lead.id ? 'opacity-20' : ''}`}
                      >
                        {/* Name & Budget */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-xs text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {lead.name}
                          </h3>
                          <span className="text-[10px] font-mono text-emerald-400 font-medium whitespace-nowrap bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {lead.budget}
                          </span>
                        </div>

                        {/* Business name */}
                        {lead.business && (
                          <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 font-medium">
                            <Building size={11} className="text-neutral-500" />
                            <span className="line-clamp-1">{lead.business}</span>
                          </div>
                        )}

                        {/* Description details snippet */}
                        <p className="text-[10px] text-neutral-500 leading-normal line-clamp-2 bg-[#060606] p-2 rounded-lg border border-white/5 font-mono">
                          {lead.details}
                        </p>

                        {/* Footer details */}
                        <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={9} />
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {colInquiries.length === 0 && (
                      <div className="h-28 rounded-xl border border-dashed border-white/5 flex items-center justify-center">
                        <span className="text-[10px] text-neutral-600 font-mono">Drop cards here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drawer Overlay for Lead Details */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0c0c0c] border-l border-white/10 z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase tracking-wider">
                    Lead Details
                  </span>
                  <h2 className="text-lg font-semibold text-white mt-1">
                    {selectedLead.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-[#080808] p-4 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-500">Business</span>
                    <div className="text-xs text-white font-medium flex items-center gap-1.5">
                      <Building size={12} className="text-neutral-400" />
                      {selectedLead.business || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-500">Estimated Budget</span>
                    <div className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <DollarSign size={12} />
                      {selectedLead.budget}
                    </div>
                  </div>
                </div>

                {/* Contact options */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white">Contact Channels</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#080808] border border-white/5 hover:border-white/10 transition-colors text-xs text-neutral-300 hover:text-white"
                    >
                      <div className="flex items-center gap-3">
                        <Mail size={13} className="text-neutral-400" />
                        <span>{selectedLead.email}</span>
                      </div>
                      <ChevronRight size={12} className="text-neutral-500" />
                    </a>

                    {selectedLead.phone && (
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#080808] border border-white/5 hover:border-white/10 transition-colors text-xs text-neutral-300 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <Phone size={13} className="text-neutral-400" />
                          <span>{selectedLead.phone}</span>
                        </div>
                        <ChevronRight size={12} className="text-neutral-500" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Requirements detail */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white">Project Requirements</h3>
                  <div className="p-4 rounded-xl bg-[#080808] border border-white/5 text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedLead.details}
                  </div>
                </div>

                {/* Stage switcher (mobile / fallback support) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white">Pipeline Stage</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {COLUMNS.map(col => (
                      <button
                        key={col.id}
                        onClick={() => moveLeadTo(selectedLead, col.id)}
                        className={`px-3 py-2 rounded-lg text-left text-[11px] font-medium border transition-all flex items-center justify-between ${
                          selectedLead.status === col.id
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-semibold'
                            : 'bg-[#080808] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <span>{col.label}</span>
                        {selectedLead.status === col.id && <CheckCircle2 size={10} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
