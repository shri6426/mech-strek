'use client';

import { useState, useEffect } from 'react';
import { fetchPortfolioProjects, PortfolioProject } from '@/lib/api';
import { FolderKanban, Plus, ExternalLink } from 'lucide-react';

export default function AdminPortfolioCMSPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioProjects()
      .then(data => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio CMS</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage active showcase projects rendered on mechstrek.in</p>
        </div>

        <button
          onClick={() => alert('New project dialog functionality')}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Plus size={14} />
          Add New Project
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 font-mono">Loading portfolio data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="p-5 rounded-2xl bg-[#111] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-neutral-400 border border-white/10">
                  {project.category}
                </span>
                <span className="text-xs text-neutral-500 font-mono">{project.year}</span>
              </div>
              <h3 className="font-bold text-lg text-white">{project.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-neutral-500">
                <span>Client: <strong className="text-white">{project.client}</strong></span>
                <span className="text-emerald-400 font-mono text-[10px]">Published</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
