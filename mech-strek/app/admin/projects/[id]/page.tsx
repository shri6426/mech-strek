'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  fetchAdminProjectDetails, 
  fetchAdminProjectTimelines, 
  fetchAdminProjectFiles, 
  uploadAdminProjectFile,
  updateAdminProject,
  fetchAdminProjectMessages,
  postAdminProjectMessage,
  fetchAdminProjectActivities,
  AdminProject,
  AdminTimelineMilestone,
  AdminProjectFile,
  AdminProjectMessage,
  AdminProjectActivity
} from '@/lib/api';
import { 
  Layers, 
  CheckSquare, 
  Calendar, 
  FolderOpen, 
  FileText, 
  FileSignature, 
  MessageSquare, 
  Video, 
  Activity, 
  Settings,
  Plus, 
  Upload, 
  Download, 
  Send, 
  Clock, 
  CheckCircle,
  Building,
  User,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectWorkspace({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [project, setProject] = useState<AdminProject | null>(null);
  const [timelines, setTimelines] = useState<AdminTimelineMilestone[]>([]);
  const [files, setFiles] = useState<AdminProjectFile[]>([]);
  const [messages, setMessages] = useState<AdminProjectMessage[]>([]);
  const [activities, setActivities] = useState<AdminProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // For message sending
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const WS_URL = token ? `ws://localhost:8000/api/v1/ws/chat/${projectId}?token=${token}` : null;
  const { messages: wsMessages, sendMessage: sendWsMessage } = useWebSocket(WS_URL);

  useEffect(() => {
    if (wsMessages.length > 0) {
      const last = wsMessages[wsMessages.length - 1];
      if (last && last.type === 'chat_message' && last.content && last.sender !== 'Team') {
        setMessages((prev) => [
          ...prev,
          {
            id: `ws_${Date.now()}`,
            project_id: projectId,
            sender_id: project?.client_id || 'client',
            message: last.content,
            created_at: last.created_at || new Date().toISOString()
          }
        ]);
      }
    }
  }, [wsMessages, project, projectId]);

  // For file uploading
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For settings form
  const [todayUpdateText, setTodayUpdateText] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadWorkspaceData = async () => {
    try {
      const [projData, timelinesData, filesData, messagesData, activitiesData] = await Promise.all([
        fetchAdminProjectDetails(projectId),
        fetchAdminProjectTimelines(projectId),
        fetchAdminProjectFiles(projectId),
        fetchAdminProjectMessages(projectId),
        fetchAdminProjectActivities(projectId)
      ]);
      setProject(projData);
      setTimelines(timelinesData);
      setFiles(filesData);
      setMessages(messagesData.reverse()); // Show oldest first for chat flow
      setActivities(activitiesData);
      setTodayUpdateText(projData.today_update || '');
      setProgressVal(projData.progress_percent || 0);
    } catch (err) {
      console.error('Failed to load workspace', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [projectId]);

  useEffect(() => {
    // Scroll to bottom of chat when new message loads
    if (activeTab === 'messages') {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const msg = await postAdminProjectMessage(projectId, newMsg.trim());
      sendWsMessage({ sender: 'Team', content: newMsg.trim(), created_at: new Date().toISOString() });
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const uploadedFile = await uploadAdminProjectFile(projectId, file);
      setFiles(prev => [uploadedFile, ...prev]);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await updateAdminProject(projectId, {
        today_update: todayUpdateText,
        progress_percent: Number(progressVal)
      });
      setProject(updated);
      alert('Project updated successfully');
    } catch (err) {
      alert('Failed to update project settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-neutral-500 font-mono">Syncing workspace assets...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 rounded-2xl bg-[#0d0d0d] border border-white/5 text-center text-xs text-neutral-500 font-mono">
        Project Workspace not found.
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'files', label: 'Files', icon: FolderOpen },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
        <Link href="/admin/projects" className="hover:text-white transition-colors">
          PROJECTS
        </Link>
        <ChevronRight size={10} />
        <span className="text-neutral-300">{project.name}</span>
      </div>

      {/* Title & overall progress bar */}
      <div className="pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white">
            {project.name}
          </h1>
          <p className="text-xs text-neutral-400">
            {project.description || 'Comprehensive project delivery workspace'}
          </p>
        </div>

        {/* Progress percent indicator */}
        <div className="w-56 space-y-1.5 bg-[#0d0d0d] p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>COMPLETION</span>
            <span className="text-white font-bold">{project.progress_percent}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs navigation list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                activeTab === tab.id
                  ? 'bg-white text-black border-transparent font-bold'
                  : 'text-neutral-400 hover:text-white bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[40vh]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Greeting status banner */}
            <div className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/5 space-y-4">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Today's Summary
              </span>
              <div className="text-white font-medium text-sm leading-relaxed">
                {project.today_update ? `"${project.today_update}"` : 'No daily status updates posted yet. Update this in settings.'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/5 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Milestones</h3>
                <div className="space-y-2 text-xs">
                  {timelines.slice(0, 3).map(tl => (
                    <div key={tl.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <span className={tl.is_completed ? 'text-neutral-500 line-through' : 'text-neutral-200'}>{tl.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                        tl.is_completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-neutral-400 border-white/10'
                      }`}>{tl.is_completed ? 'Done' : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/5 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Project Deliverables</h3>
                <div className="space-y-2 text-xs">
                  {files.slice(0, 3).map(f => (
                    <div key={f.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <span className="text-neutral-300 font-mono truncate max-w-[150px]">{f.file_name}</span>
                      <a href={f.file_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Download <Download size={10} />
                      </a>
                    </div>
                  ))}
                  {files.length === 0 && <div className="text-neutral-500 text-center py-4">No deliverables uploaded.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Project Timeline & Milestones</h2>
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 p-6 divide-y divide-white/5">
              {timelines.map((tl, idx) => (
                <div key={tl.id} className="flex items-start justify-between py-4 first:pt-0 last:pb-0 gap-4">
                  <div className="flex gap-4">
                    <div className="pt-0.5">
                      {tl.is_completed ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-neutral-600 flex items-center justify-center text-[8px] text-neutral-400 font-bold">{idx + 1}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-xs font-semibold ${tl.is_completed ? 'text-neutral-500 line-through' : 'text-white'}`}>
                        {tl.title}
                      </h4>
                      {tl.description && (
                        <p className="text-[11px] text-neutral-500 font-mono leading-relaxed">{tl.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                    {new Date(tl.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Secure Vault</h2>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2"
                >
                  <Upload size={12} />
                  {uploading ? 'Uploading...' : 'Upload Deliverable'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 p-5">
              <div className="space-y-3">
                {files.map(f => (
                  <div 
                    key={f.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen size={14} className="text-neutral-400" />
                      <div className="space-y-0.5">
                        <div className="text-xs text-white font-medium truncate max-w-[250px]">
                          {f.file_name}
                        </div>
                        <div className="text-[9px] text-neutral-500 font-mono uppercase">
                          {f.file_type} • {new Date(f.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-[10px] font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                    >
                      Download <Download size={11} />
                    </a>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="text-center py-12 text-xs text-neutral-500 font-mono">
                    No files currently in this vault.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 flex flex-col h-[50vh] overflow-hidden">
            {/* Messages display container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map(msg => {
                const isAdmin = msg.sender_id !== project.client_id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[70%] space-y-1 ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`p-3 rounded-xl text-xs leading-normal ${
                      isAdmin 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-[#151515] text-neutral-200 border border-white/5 rounded-bl-none'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[8px] text-neutral-500 font-mono">
                      {isAdmin ? 'You' : 'Client'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Send secure message to client team..."
                className="flex-1 bg-[#090909] border border-white/5 text-xs text-white rounded-xl px-4 py-2.5 outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                disabled={sendingMsg}
                className="p-2.5 rounded-xl bg-white text-black hover:bg-[#e5e5e5] transition-colors disabled:opacity-50"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Activity Logs</h2>
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/5 p-6">
              <div className="relative border-l border-white/10 pl-5 ml-2.5 space-y-6">
                {activities.map(act => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-[#1c1c1e] border-2 border-blue-500" />
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white">{act.action}</div>
                      <p className="text-[11px] text-neutral-400 font-mono">{act.details}</p>
                      <span className="text-[9px] text-neutral-500 font-mono block">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-6 text-xs text-neutral-500 font-mono">
                    No activity records found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-lg bg-[#0d0d0d] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Project Configuration</h2>
            
            {/* Status input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                Today's Daily Status Text
              </label>
              <textarea
                value={todayUpdateText}
                onChange={(e) => setTodayUpdateText(e.target.value)}
                placeholder="What did the team complete today? (visible on client dashboard)"
                className="w-full bg-[#080808] border border-white/5 text-xs text-white rounded-xl p-3 h-24 outline-none focus:border-white/20 transition-colors font-mono"
              />
            </div>

            {/* Progress percent input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                Completion Progress Percentage
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="flex-1 accent-white"
                />
                <span className="text-sm text-white font-mono font-bold w-12 text-right">
                  {progressVal}%
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary text-xs px-4 py-2"
            >
              {savingSettings ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
