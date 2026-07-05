'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, MessagesSquare, Loader2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getWsUrl } from '@/lib/api';

interface Project {
  id: string;
  name: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type?: 'admin' | 'client';
  content: string;
  created_at: string;
}

export default function ClientMessages() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('client_token') : null);

  const WS_URL =
    activeProjectId && getToken()
      ? getWsUrl(`/ws/chat/${activeProjectId}?token=${getToken()}`)
      : null;

  const { messages: wsMessages, sendMessage: sendWsMessage } = useWebSocket(WS_URL);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (wsMessages.length === 0) return;
    const last = wsMessages[wsMessages.length - 1];
    if (last?.type === 'chat_message' && last.content) {
      setMessages((prev) => {
        // Avoid duplicate if we sent this ourselves
        const isDupe = prev.some(
          (m) => m.content === last.content && m.sender_type === 'admin' && Date.now() - new Date(m.created_at).getTime() < 5000
        );
        if (isDupe) return prev;
        return [
          ...prev,
          {
            id: `ws_${Date.now()}`,
            sender_id: last.sender || 'admin',
            sender_type: 'admin',
            content: last.content,
            created_at: last.created_at || new Date().toISOString(),
          },
        ];
      });
    }
  }, [wsMessages]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/client/projects`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data: Project[] = await res.json();
          setProjects(data);
          if (data.length > 0) setActiveProjectId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch message history
  useEffect(() => {
    if (!activeProjectId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/client/projects/${activeProjectId}/messages`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data.reverse());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchMessages();
  }, [activeProjectId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeProjectId) return;
    setSending(true);
    const optimisticMsg: Message = {
      id: `optimistic_${Date.now()}`,
      sender_id: 'me',
      sender_type: 'client',
      content: newMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    const content = newMessage;
    setNewMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/client/projects/${activeProjectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const saved: Message = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? { ...saved, sender_type: 'client' } : m))
        );
        sendWsMessage({ sender: 'Client', content, created_at: saved.created_at });
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="animate-pulse h-7 w-40 bg-white/5 rounded-xl" />
        <div className="flex-1 animate-pulse bg-[#0d0d0d] border border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="pb-4 border-b border-white/5 mb-4 shrink-0">
        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Communication</span>
        <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Project Messages</h1>
      </div>

      {projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessagesSquare className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
            <p className="text-sm text-neutral-500">No active projects yet.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          {/* Project Tabs */}
          {projects.length > 1 && (
            <div className="flex border-b border-white/5 overflow-x-auto shrink-0">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectId(p.id)}
                  className={`px-5 py-3.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeProjectId === p.id
                      ? 'border-violet-500 text-white'
                      : 'border-transparent text-neutral-500 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <MessagesSquare className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-400">No messages yet</p>
                  <p className="text-xs text-neutral-600 mt-0.5">Send a message to start the conversation with your team.</p>
                </div>
              </div>
            ) : (
              groupedMessages.map(({ date, msgs }) => (
                <div key={date}>
                  {/* Date Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">{date}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="space-y-4">
                    {msgs.map((msg) => {
                      const isClient = msg.sender_type === 'client' || msg.sender_id === 'me';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 items-end ${isClient ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isClient
                                ? 'bg-violet-500/20 text-violet-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {isClient ? 'C' : 'M'}
                          </div>

                          {/* Bubble */}
                          <div className={`max-w-[75%] ${isClient ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <span className={`text-[9px] font-mono text-neutral-600 ${isClient ? 'text-right' : 'text-left'}`}>
                              {isClient ? 'You' : 'MechStrek Team'} · {formatTime(msg.created_at)}
                            </span>
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isClient
                                  ? 'bg-violet-600 text-white rounded-br-sm'
                                  : 'bg-[#1a1a2e] border border-white/8 text-neutral-200 rounded-bl-sm'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5 bg-[#111] shrink-0">
            <form onSubmit={handleSend} className="flex items-end gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                disabled={sending}
                rows={1}
                className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none leading-relaxed"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="text-[9px] font-mono text-neutral-700 mt-1.5 ml-1">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
