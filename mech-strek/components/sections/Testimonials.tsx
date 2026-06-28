'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { fetchTestimonials, Testimonial as TestimonialType } from '@/lib/api';

const defaultTestimonials = [
  { name: 'Arjun Mehta',           role: 'CEO, Mehta Consulting',     text: 'Mech Strek delivered a website that completely transformed our online presence. Our leads have doubled since launch.' },
  { name: 'Priya Nair',            role: 'Owner, Spice Route Restaurant', text: 'I was blown away by how professional our restaurant website looks. Online orders have gone through the roof.' },
  { name: 'Karthik Subramaniam',   role: 'Founder, FitZone Gym',      text: 'The team understood exactly what we needed. The membership booking system works flawlessly.' },
  { name: 'Divya Krishnamurthy',   role: 'Photographer & Artist',     text: 'My portfolio is breathtaking. I have been getting enquiries from clients I never imagined reaching before.' },
  { name: 'Ravi Shankar',          role: 'Director, RS Properties',   text: 'Professional, fast, incredibly talented. Our real estate site stands out. The ROI has been phenomenal.' },
  { name: 'Anjali Reddy',          role: 'Marketing Head, TechPulse', text: 'Working with Mech Strek was a delight. Communicative, talented, delivered beyond expectations.' },
];

function Card({ t }: { t: { name: string; role: string; text: string } }) {
  return (
    <div
      className="flex-shrink-0 w-72 p-5 mx-3"
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
      }}
    >
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={10} className="text-white fill-white" />
        ))}
      </div>
      <p className="text-sm text-[#888] leading-relaxed mb-4 line-clamp-4">&ldquo;{t.text}&rdquo;</p>
      <div className="text-sm font-semibold text-white">{t.name}</div>
      <div className="text-xs text-[#555] mt-0.5">{t.role}</div>
    </div>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState(defaultTestimonials);

  useEffect(() => {
    fetchTestimonials()
      .then(res => {
        if (res && res.length > 0) {
          setItems(res.map(item => ({
            name: item.author,
            role: `${item.role}, ${item.company}`,
            text: item.quote
          })));
        }
      })
      .catch(() => {
        // Fall back to default testimonials silently on error
      });
  }, []);

  const duped = [...items, ...items];
  const sliceIndex = Math.floor(items.length / 2);
  return (
    <section className="py-28 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-14">
        <div className="section-tag mb-5">Testimonials</div>
        <h2 className="font-display font-black text-4xl lg:text-5xl text-white leading-tight">
          What our clients say
        </h2>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .marquee-1 { animation: marquee 12s linear infinite; }
        .marquee-2 { animation: marquee 10s linear infinite reverse; }
        @media (min-width: 768px) {
          .marquee-1 { animation: marquee 32s linear infinite; }
          .marquee-2 { animation: marquee 26s linear infinite reverse; }
        }
      `}} />

      {/* Row 1 */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #080808, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(-90deg, #080808, transparent)' }} />
        <div className="flex marquee-1">
          {duped.map((t, i) => <Card key={i} t={t} />)}
        </div>
      </div>

      {/* Row 2 (reverse) */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #080808, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(-90deg, #080808, transparent)' }} />
        <div className="flex marquee-2">
          {[...items.slice(sliceIndex), ...items.slice(sliceIndex), ...items.slice(sliceIndex)].map((t, i) => <Card key={i} t={t} />)}
        </div>
      </div>
    </section>
  );
}
