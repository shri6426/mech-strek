'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAICopilotResponse, fetchAdminProjects, AdminProject } from '@/lib/api';
import { MessageSquare, X, Send, Sparkles, BrainCircuit, ArrowUpRight, Folder, FilePlus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  workflow?: {
    label: string;
    href?: string;
    action?: () => void;
  };
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      sender: 'ai', 
      text: "Hi Aashish! I'm your MechOS AI agent. I can help generate proposals, estimate scope budgets, create invoices, or trace project tasks. What action are we triggering?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Hide AI Assistant on login pages
  if (pathname.includes('/login')) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const lower = userText.toLowerCase();
      let workflow: ChatMessage['workflow'] | undefined;

      // 1. Detect Invoice Action
      if (lower.includes('invoice') || lower.includes('bill')) {
        workflow = {
          label: 'Open Invoices Manager',
          href: '/admin/invoices'
        };
      }
      // 2. Detect Proposal Action
      else if (lower.includes('proposal') || lower.includes('quote')) {
        workflow = {
          label: 'Create New Proposal',
          href: '/admin/proposals'
        };
      }
      // 3. Detect Projects Action
      else if (lower.includes('project') || lower.includes('workspace')) {
        workflow = {
          label: 'Browse Active Projects',
          href: '/admin/projects'
        };
      }
      // 4. Detect CRM / Leads Action
      else if (lower.includes('lead') || lower.includes('crm') || lower.includes('inquiry')) {
        workflow = {
          label: 'Check CRM Pipelines',
          href: '/admin/crm'
        };
      }

      // Call Backend AI Engine
      const res = await fetchAICopilotResponse(userText);
      
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: res.reply,
          workflow
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { sender: 'ai', text: "Apologies Aashish, I encountered an operational sync error with the AI module. Let me try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = (wf: NonNullable<ChatMessage['workflow']>) => {
    if (wf.href) {
      router.push(wf.href);
      setIsOpen(false);
    } else if (wf.action) {
      wf.action();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999]">
      <AnimatePresence>
        {isOpen ? (
          /* Main Chat Window */
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="w-80 h-[450px] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3"
          >
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                  <BrainCircuit size={13} className="animate-pulse" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">Ask MechOS</div>
                  <div className="text-[9px] text-neutral-400">Connected AI Assistant</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div key={idx} className={`space-y-1.5 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] text-left ${
                    msg.sender === 'user'
                      ? 'bg-white text-black rounded-br-none'
                      : 'bg-[#151515] text-neutral-200 border border-white/5 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Trigger workflow links */}
                  {msg.workflow && (
                    <div className="pt-1">
                      <button
                        onClick={() => executeWorkflow(msg.workflow!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] font-semibold transition-all"
                      >
                        {msg.workflow.label}
                        <ArrowUpRight size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-left space-y-1">
                  <div className="inline-block p-3 rounded-2xl bg-[#151515] border border-white/5 text-xs text-neutral-500 font-mono">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to trigger workflows..."
                className="flex-1 bg-[#090909] border border-white/5 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-white text-black hover:bg-[#e5e5e5] transition-colors disabled:opacity-50"
              >
                <Send size={13} />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-12 h-12 rounded-full bg-white text-black hover:bg-[#e5e5e5] shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          boxShadow: '0 0 15px rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        <Sparkles size={18} className="animate-spin-slow text-black" />
      </button>
    </div>
  );
}
