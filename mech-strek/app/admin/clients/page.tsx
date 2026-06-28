'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Users, Plus, Key, Copy, CheckCircle, Mail, Clock, X, Link as LinkIcon } from 'lucide-react';

interface Client {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface InviteResponse {
  user_id: string;
  email: string;
  full_name: string;
  magic_link: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form & Invite State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await apiFetch<Client[]>('/admin/clients');
        setClients(data);
      } catch (err) {
        console.error("Failed to load clients", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<InviteResponse>('/admin/portal/clients/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          full_name: fullName
        })
      });
      setClients([
        {
          id: res.user_id,
          email: res.email,
          full_name: res.full_name,
          created_at: new Date().toISOString()
        },
        ...clients
      ]);
      setGeneratedLink(res.magic_link);
      setEmail('');
      setFullName('');
    } catch (err) {
      alert("Failed to invite client. Email might already be in use.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGeneratedLink(null);
  };

  if (loading) return <div className="text-white">Loading clients directory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Management</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage client access, identities, and portal passwords.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Invite Client
        </button>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-neutral-500 bg-white/5">
              <th className="p-4 font-medium">Client Info</th>
              <th className="p-4 font-medium">Client ID</th>
              <th className="p-4 font-medium">Joined Date</th>
              <th className="p-4 font-medium text-right">Access</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No clients registered.</p>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/30">
                        {client.full_name ? client.full_name.charAt(0) : client.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{client.full_name || 'Unnamed Client'}</p>
                        <p className="text-xs text-neutral-400 flex items-center gap-1">
                          <Mail size={10} /> {client.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-white/5 px-2 py-1 rounded w-fit border border-white/10">
                      {client.id.substring(0, 8)}...
                      <button 
                        onClick={() => handleCopy(client.id)}
                        className="hover:text-white transition-colors"
                        title="Copy Full ID"
                      >
                        {copiedId === client.id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto">
                      <Key size={12} /> Reset Pass
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={16} /> Invite Client
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-neutral-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {generatedLink ? (
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center text-center space-y-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-2">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="text-md font-bold text-white">Client Invited Successfully</h3>
                  <p className="text-xs text-neutral-400">A magic login token has been generated. Share this URL with the client for passwordless access.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Magic Login Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="bg-black border border-white/10 rounded-lg p-2.5 text-xs text-neutral-300 outline-none flex-1 font-mono select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="bg-white text-black hover:bg-neutral-200 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@acme.com"
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-[10px] text-blue-400">
                    This automatically provisions a client account. They can log in immediately via passwordless Magic Link.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#e5e5e5] transition-colors"
                  >
                    {submitting ? 'Inviting...' : 'Invite Client'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
