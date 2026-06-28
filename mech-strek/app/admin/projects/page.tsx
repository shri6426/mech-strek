'use client';

import { useState, useEffect } from 'react';
import { fetchAdminProjects, AdminProject } from '@/lib/api';
import { 
  Briefcase, 
  ArrowRight, 
  Clock, 
  Calendar,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsList() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchAdminProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-neutral-500 font-mono">Loading active projects...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PAUSED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-white/5 text-neutral-300 border-white/10';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="pb-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white">
            Projects Workspace
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage your active client projects, timelines, team communications, and deliverables.
          </p>
        </div>
      </div>

      {/* Grid of Projects */}
      {projects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0d0d0d] border border-white/5 text-center text-xs text-neutral-500 font-mono">
          No active projects found. Go to Proposals to accept a proposal and create a project automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/admin/projects/${proj.id}`}
              className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4 hover:translate-y-[-1px] group"
            >
              <div className="space-y-2">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                    {proj.name}
                  </h3>
                  <span className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(proj.status)}`}>
                    {proj.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided for this project workspace.'}
                </p>
              </div>

              {/* Progress & dates */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>PROGRESS</span>
                    <span>{proj.progress_percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>
                      {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 hover:text-white transition-colors">
                    Workspace <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
