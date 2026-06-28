'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Plus, Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  task_type: string;
  created_at: string;
}

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  useEffect(() => {
    const fetchProjectsAndTickets = async () => {
      try {
        const projects = await apiFetch<any[]>('/client/projects');
        if (projects.length > 0) {
          const pid = projects[0].id;
          setProjectId(pid);
          
          const data = await apiFetch<ProjectTask[]>(`/client/projects/${pid}/tickets`);
          setTickets(data);
        }
      } catch (err) {
        console.error("Failed to load tickets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectsAndTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      const newTicket = await apiFetch<ProjectTask>(`/client/projects/${projectId}/tickets`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          project_id: projectId
        })
      });
      setTickets([newTicket, ...tickets]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('MEDIUM');
    } catch (err) {
      console.error("Failed to create ticket", err);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading Support Center...</div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-500" />
            Support Center
          </h1>
          <p className="text-neutral-400 mt-2">Log bugs, request features, or get help with your project.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-[#111] rounded-2xl border border-white/5">
            <p className="text-neutral-500">No support tickets found.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="bg-[#111] p-6 rounded-2xl border border-white/10 flex justify-between items-start gap-4 hover:border-white/20 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{ticket.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    ticket.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-neutral-500/20 text-neutral-400'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">{ticket.description}</p>
                <div className="text-xs text-neutral-500 font-medium">
                  Created on {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  ticket.status === 'DONE' ? 'bg-green-500/10 text-green-400' :
                  ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {ticket.status === 'DONE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                   ticket.status === 'IN_PROGRESS' ? <Clock className="w-3.5 h-3.5" /> : 
                   <AlertCircle className="w-3.5 h-3.5" />}
                  {ticket.status.replace('_', ' ')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#181818] w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                <textarea 
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Priority</label>
                <select 
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">Low (Minor tweak)</option>
                  <option value="MEDIUM">Medium (Standard request)</option>
                  <option value="HIGH">High (Important feature)</option>
                  <option value="URGENT">Urgent (Critical bug)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
