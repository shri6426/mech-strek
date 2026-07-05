'use client';

import { useEffect, useState } from 'react';
import { apiFetch, getWsUrl } from '@/lib/api';
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle, X, Send } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string; // TODO, IN_PROGRESS, REVIEW, DONE
  priority: string; // LOW, MEDIUM, HIGH, URGENT
  task_type?: string;
}

interface Project {
  id: string;
  name: string;
}

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'border-neutral-700 text-neutral-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/30 text-blue-400' },
  { key: 'REVIEW', label: 'Under Review', color: 'border-yellow-500/30 text-yellow-400' },
  { key: 'DONE', label: 'Completed', color: 'border-green-500/30 text-green-400' }
];

export default function AdminKanbanPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const WS_URL = token ? getWsUrl(`/ws/kanban?token=${token}`) : null;
  const { messages: wsMessages, sendMessage: sendWsMessage } = useWebSocket(WS_URL);

  useEffect(() => {
    if (wsMessages.length > 0) {
      const last = wsMessages[wsMessages.length - 1];
      if (last && last.type === 'task_updated' && last.task_id) {
        // If it's a status update, update existing task
        setTasks((prev) => {
          const exists = prev.some(t => t.id === last.task_id);
          if (exists) {
            return prev.map(t => t.id === last.task_id ? { ...t, status: last.status } : t);
          }
          return prev;
        });
      } else if (last && last.type === 'task_created' && last.task) {
        setTasks((prev) => {
          const exists = prev.some(t => t.id === last.task.id);
          if (!exists) {
            return [last.task, ...prev];
          }
          return prev;
        });
      }
    }
  }, [wsMessages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, projectsData] = await Promise.all([
          apiFetch<TaskItem[]>('/pm/tasks'),
          apiFetch<Project[]>('/admin/portal/projects')
        ]);
        setTasks(tasksData);
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setProjectId(projectsData[0].id);
        }
      } catch (err) {
        console.error("Failed to load Kanban data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const moveTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await apiFetch<TaskItem>(`/pm/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      sendWsMessage({ type: 'task_updated', task_id: taskId, status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to transition task", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<TaskItem>('/pm/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority,
          project_id: projectId,
          status: 'TODO'
        })
      });
      setTasks([res, ...tasks]);
      sendWsMessage({ type: 'task_created', task: res });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
    } catch (err) {
      alert("Failed to create task");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-white">Loading Kanban engine...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agency Kanban Board</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage project execution, task assignments, and sprint statuses.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className="bg-white/5 px-2 py-0.5 rounded text-xs text-neutral-400 font-semibold">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-[#181818] p-4 rounded-xl border border-white/5 space-y-3 hover:border-white/20 transition-colors group">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-white text-sm leading-snug">{task.title}</h3>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {task.task_type === 'TICKET' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Ticket
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          task.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                          task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-neutral-500/20 text-neutral-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    {task.description && <p className="text-xs text-neutral-400 line-clamp-2">{task.description}</p>}

                    {/* Move Status Action Controls */}
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-neutral-500">
                      <span className="text-[10px]">Proj: {task.project_id.substring(0, 4)}</span>
                      <select
                        value={task.status}
                        onChange={(e) => moveTaskStatus(task.id, e.target.value)}
                        className="bg-[#222] text-neutral-300 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={16} /> Create Kanban Task
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Login Page"
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Project Workspace</label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about task execution..."
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
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
                  <Send size={12} />
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
