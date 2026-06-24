'use client';

import { useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const projects = [
  {
    id: 6,
    title: 'Aashish Niranjan',
    category: 'Portfolio',
    desc: 'Clean, interactive developer portfolio showcasing expertise and projects.',
    url: 'https://aashish-niranjan.vercel.app/',
    tags: ['Next.js', 'Tailwind', 'Framer Motion'],
  },
  {
    id: 5,
    title: 'Xion',
    category: 'Robotics / AI',
    desc: 'Advanced robotics platform showcasing cutting-edge AI integration.',
    url: 'https://xion26-neurobotix.vercel.app/home',
    tags: ['Next.js', 'AI', 'Tailwind'],
  },
  {
    id: 1,
    title: 'Shri Portfolio',
    category: 'Portfolio',
    desc: 'Modern developer portfolio with immersive animations and a sleek dark aesthetic.',
    url: 'https://shri-portfolio-chi.vercel.app/',
    tags: ['React', 'GSAP', 'Framer Motion'],
  },
  {
    id: 2,
    title: 'Shyam Portfolio',
    category: 'Portfolio',
    desc: 'Creative personal portfolio with bold typography and smooth transitions.',
    url: 'https://shyam-portfolio-coral.vercel.app/',
    tags: ['Next.js', 'Tailwind', 'Three.js'],
  },
  {
    id: 3,
    title: 'Vignesh Portfolio',
    category: 'Portfolio',
    desc: 'Distinctive portfolio with unique layout patterns and cutting-edge visual effects.',
    url: 'https://vignesh-ramakrishnan-portfolio123.vercel.app/',
    tags: ['React', 'GSAP'],
  },
  {
    id: 4,
    title: 'Final Fight Club',
    category: 'Sports / Brand',
    desc: 'High-energy MMA website with cinematic hero and dynamic content.',
    url: 'https://final-fight-club.vercel.app/',
    tags: ['Next.js', 'GSAP', 'Tailwind'],
  },
];

function ProjectCard({ p, i }: { p: typeof projects[0]; i: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    setTilt({ x: -y, y: x });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      style={{
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)',
        transition: hovered ? 'transform 0.1s ease' : 'transform 0.5s ease',
      }}
      className="group p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-xl hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
    >
      {/* Glare effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />

      {/* Preview */}
      <div
        className="relative rounded-xl overflow-hidden mb-5 bg-black/40 border border-white/5"
      >
        {/* Browser bar */}
        <div
          className="flex items-center gap-1.5 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0f0f0f' }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
          <div
            className="ml-3 flex-1 text-[10px] text-[#444] truncate"
            style={{ background: '#191919', borderRadius: '4px', padding: '2px 8px' }}
          >
            {p.url.replace('https://', '')}
          </div>
        </div>

        {/* Preview content */}
        <div className="h-48 p-5 space-y-3 relative overflow-hidden">
          <div className="h-3 w-2/3 rounded-sm bg-[#222]" />
          <div className="h-2 w-full rounded-sm bg-[#1a1a1a]" />
          <div className="h-2 w-5/6 rounded-sm bg-[#1a1a1a]" />
          <div className="h-2 w-4/6 rounded-sm bg-[#1a1a1a]" />
          <div className="flex gap-2 pt-2">
            <div className="h-7 w-24 rounded bg-white/10" />
            <div className="h-7 w-16 rounded bg-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1,2,3].map(n => <div key={n} className="h-14 rounded bg-[#141414]" />)}
          </div>

          {/* Hover overlay */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(8,8,8,0.85)' }}
          >
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm flex items-center gap-2"
            >
              <ExternalLink size={13} />
              View Live
            </a>
          </motion.div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-[#555] mb-1">{p.category}</div>
          <div className="font-display font-bold text-lg text-white">{p.title}</div>
          <p className="text-sm text-[#666] mt-1 leading-relaxed">{p.desc}</p>
        </div>
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#444] hover:text-white transition-colors mt-1 flex-shrink-0 ml-4"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {p.tags.map(t => (
          <span key={t} className="text-[10px] px-2 py-1 rounded text-[#555]"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-tag mb-5"
            >
              Portfolio
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display font-black text-4xl lg:text-5xl text-white leading-tight"
            >
              Work we&apos;re proud of
            </motion.h2>
          </div>
          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            href="#contact"
            onClick={e => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-sm text-[#666] hover:text-white transition-colors flex items-center gap-1 group"
          >
            Start your project <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {projects.map((p, i) => <ProjectCard key={p.id} p={p} i={i} />)}
        </div>
      </div>
    </section>
  );
}
