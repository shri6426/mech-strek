'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Sparkles, Cpu, ShieldAlert, Send, CheckCircle2, Bot } from 'lucide-react';

interface ScopeItem {
  title: string;
  description: string;
  estimated_hours: number;
  price: number;
}

interface EstimationResult {
  project_title: string;
  summary: string;
  total_hours: number;
  total_price: number;
  scope_items: ScopeItem[];
}

export default function AdminAISudioPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch<EstimationResult>('/ai/estimate', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      });
      setResult(data);
    } catch (err) {
      console.error("Failed to generate AI estimate", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" /> AI Studio & Estimation Engine
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Intelligent scope parsing, automated pricing heuristics, and QA risk auditing.</p>
        </div>
      </div>

      {/* Generator Prompt Box */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" /> Scope & Price Generator
        </h2>
        <p className="text-xs text-neutral-400 mb-4">Describe client requirements to automatically build structured scope items and financial estimates.</p>
        
        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Build an e-commerce platform with Stripe payment integration, real-time inventory filtering, and a customer dashboard..."
            rows={3}
            className="w-full bg-[#181818] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Synthesizing...' : 'Generate Project Scope'}
            </button>
          </div>
        </form>
      </div>

      {/* Estimation Results Display */}
      {result && (
        <div className="bg-[#111] border border-purple-500/30 rounded-2xl p-6 space-y-6 animate-fadeIn">
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-semibold border border-purple-500/20">
                AI Output Generated
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{result.project_title}</h3>
              <p className="text-xs text-neutral-400 mt-1">{result.summary}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-white">₹{result.total_price.toLocaleString()}</span>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">{result.total_hours} Est. Hours</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Itemized Scope & Deliverables</h4>
            <div className="grid gap-3">
              {result.scope_items.map((item, idx) => (
                <div key={idx} className="bg-[#181818] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h5 className="font-semibold text-white text-sm">{item.title}</h5>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">₹{item.price.toLocaleString()}</span>
                    <p className="text-[10px] text-neutral-500">{item.estimated_hours} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
