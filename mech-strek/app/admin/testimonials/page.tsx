'use client';

import { useState, useEffect } from 'react';
import { fetchTestimonials, Testimonial } from '@/lib/api';
import { MessageSquareQuote, Plus, Star } from 'lucide-react';

export default function AdminTestimonialsCMSPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials()
      .then(data => setTestimonials(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials CMS</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage client reviews and social proof ratings</p>
        </div>

        <button
          onClick={() => alert('New testimonial dialog functionality')}
          className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Plus size={14} />
          Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 font-mono">Loading testimonials...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="p-5 rounded-2xl bg-[#111] border border-white/5 space-y-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} size={12} className="text-white fill-white" />
                ))}
              </div>
              <p className="text-xs text-neutral-300 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{t.author}</div>
                  <div className="text-[10px] text-neutral-500">{t.role}, {t.company}</div>
                </div>
                <span className="text-emerald-400 font-mono text-[10px]">Published</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
