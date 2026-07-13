'use client';

import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronLeft, ChevronRight, User, Dumbbell, Zap, Coffee, Vault } from 'lucide-react';
import { fetchPortfolioProjects, PortfolioProject } from '@/lib/api';

/* ═══════════════════════════════════════════════════════════
   CATEGORY DEFINITIONS
   ═══════════════════════════════════════════════════════════ */
const categories = [
  {
    key: 'event',
    label: 'Events',
    icon: Zap,
    desc: 'Live experiences & tech events',
    accent: '#f59e0b',
    glow: '#f59e0b33',
  },
  {
    key: 'gym',
    label: 'Gyms',
    icon: Dumbbell,
    desc: 'Fitness brands & fight clubs',
    accent: '#ef4444',
    glow: '#ef444433',
  },
  {
    key: 'cafe',
    label: 'Cafes',
    icon: Coffee,
    desc: 'Coffee shops & bistros',
    accent: '#d97706',
    glow: '#d9770633',
  },
  {
    key: 'portfolio',
    label: 'Portfolios',
    icon: User,
    desc: 'Personal brands & creative showcases',
    accent: '#a78bfa',
    glow: '#a78bfa33',
  },
  {
    key: 'ecommerce',
    label: 'E-Commerce',
    icon: Vault,
    desc: 'Confidential Next-Gen Builds',
    accent: '#10b981',
    glow: '#10b98133',
  },
];

/* ═══════════════════════════════════════════════════════════
   PROJECT DATA
   ═══════════════════════════════════════════════════════════ */
const projects = [
  {
    id: 5,
    title: 'Xion',
    type: 'event',
    category: 'Event / Tech',
    desc: 'Advanced robotics platform showcasing cutting-edge AI integration with a cinematic visual experience. Built with a focus on immersive motion design and futuristic aesthetics.',
    url: 'https://xion26-neurobotix.vercel.app/home',
    tags: ['Next.js', 'AI', 'Tailwind'],
    accent: '#f59e0b',
  },
  {
    id: 4,
    title: 'Eight Limbs Fight Club',
    type: 'gym',
    category: 'Sports / Brand',
    desc: 'A cinematic MMA & Muay Thai brand experience — bold hero, dynamic fight-night atmosphere, class schedules, and a raw energy that captures the spirit of combat sports.',
    url: 'https://final-fight-club.vercel.app/',
    tags: ['Next.js', 'GSAP', 'Tailwind'],
    accent: '#ef4444',
  },
  {
    id: 6,
    title: 'Aashish Niranjan',
    type: 'portfolio',
    category: 'Portfolio',
    desc: 'Embedded Systems portfolio with Interactive UI and Cyber-Engineer Aesthetic.',
    url: 'https://aashishniranjanb.vercel.app/',
    tags: ['Next.js', 'Tailwind', 'Framer Motion'],
    accent: '#a78bfa',
  },
  {
    id: 1,
    title: 'Shri Portfolio',
    type: 'portfolio',
    category: 'Portfolio',
    desc: 'Modern developer portfolio with immersive animations and a sleek dark aesthetic.',
    url: 'https://shri-portfolio-chi.vercel.app/',
    tags: ['React', 'GSAP', 'Framer Motion'],
    accent: '#60a5fa',
  },
  {
    id: 2,
    title: 'Shyam Portfolio',
    type: 'portfolio',
    category: 'Portfolio',
    desc: 'Creative personal portfolio with bold typography and smooth transitions.',
    url: 'https://shyam-portfolio-coral.vercel.app/',
    tags: ['Next.js', 'Tailwind', 'Three.js'],
    accent: '#34d399',
  },
  {
    id: 3,
    title: 'Vignesh Portfolio',
    type: 'portfolio',
    category: 'Portfolio',
    desc: 'Distinctive portfolio with unique layout patterns and cutting-edge visual effects.',
    url: 'https://vignesh-ramakrishnan-portfolio123.vercel.app/',
    tags: ['React', 'GSAP'],
    accent: '#fb923c',
  },
  {
    id: 7,
    title: 'Lubna Shireen',
    type: 'portfolio',
    category: 'Portfolio',
    desc: 'A sleek and elegant creative portfolio with smooth interactions, rich typography, and a refined visual narrative.',
    url: 'https://lubna-shireen-porfolio.vercel.app/',
    tags: ['Next.js', 'Tailwind', 'Framer Motion'],
    accent: '#f472b6',
  },
  {
    id: 8,
    title: 'BC Cafe',
    type: 'cafe',
    category: 'Cafe / Web',
    desc: 'An immersive digital experience for a modern cafe. Features a warm, inviting aesthetic with smooth transitions and a dynamic menu layout.',
    url: 'https://aashishstack.github.io/bc-cafe-web/',
    tags: ['HTML', 'Web Design', 'UI/UX'],
    accent: '#d97706',
  },
  {
    id: 9,
    title: 'Project Nebula',
    type: 'ecommerce',
    category: 'Confidential / E-Commerce',
    desc: 'A next-generation premium e-commerce platform currently in stealth development. Pushing the boundaries of spatial UI to deliver a "woah" experience.',
    url: '#',
    tags: ['Next.js', 'WebGL', 'Classified'],
    accent: '#10b981',
  },
];

/* ═══════════════════════════════════════════════════════════
   BROWSER MOCKUP
   ═══════════════════════════════════════════════════════════ */
const barSets = [
  ['#3d2d0a', '#2e2108', '#1f1505'],
  ['#4a0d0d', '#360909', '#250505'],
  ['#2d1f55', '#1e1545', '#1a1040'],
  ['#4a0d35', '#36091f', '#250613'],
  ['#0d2545', '#081b35', '#051228'],
  ['#0d3d2e', '#0a2e22', '#081f17'],
  ['#4a2205', '#351804', '#240f02'],
];

function BrowserMockup({
  url, accent, bars, hovered, tall,
}: {
  url: string; accent: string; bars: string[]; hovered: boolean; tall?: boolean;
}) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#080808' }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3a3a3a' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3a3a3a' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3a3a3a' }} />
        </div>
        <div className="flex-1 mx-2 flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent + '88' }} />
          <span className="text-[9px] truncate" style={{ color: '#4a4a4a' }}>{url.replace('https://', '')}</span>
        </div>
        <div className="w-3 h-3 opacity-30"><ExternalLink size={12} color="#888" /></div>
      </div>
      <div className={`relative overflow-hidden p-4 space-y-3 ${tall ? 'h-52 sm:h-64' : 'h-36 sm:h-44'}`} style={{ background: '#090909' }}>
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-3/5 rounded" style={{ background: bars[0] }} />
          <div className="h-2 w-full rounded" style={{ background: bars[1] }} />
          <div className="h-2 w-4/5 rounded" style={{ background: bars[2] }} />
        </div>
        <div className="flex gap-2 items-center pt-1">
          <div className="h-7 w-20 rounded-md" style={{ background: accent + '44' }} />
          <div className="h-7 w-16 rounded-md border" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#111' }} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[0, 1, 2].map(n => (
            <div key={n} className="h-12 rounded-lg"
              style={{ background: n === 0 ? bars[0] : bars[2], border: '1px solid rgba(255,255,255,0.04)' }} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #090909, transparent)' }} />
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: accent, color: '#000', boxShadow: `0 4px 24px ${accent}66` }}>
            <ExternalLink size={12} /> View Live
          </a>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHOWCASE CARD
   ═══════════════════════════════════════════════════════════ */
function ShowcaseCard({ p, barIndex }: { p: typeof projects[0]; barIndex: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const bars = barSets[barIndex % barSets.length];
  const accent = p.accent;

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    setTilt({ x: -y, y: x });
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      key={p.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      style={{
        transform: hovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px) scale(1.005)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)',
        transition: hovered ? 'transform 0.12s ease' : 'transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: hovered
          ? `0 0 0 1px ${accent}44, 0 24px 60px -12px ${accent}33, 0 8px 24px rgba(0,0,0,0.6)`
          : '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
        background: '#0c0c0c',
      }}
      className="group rounded-2xl relative overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-0"
        animate={{
          background: hovered
            ? `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, ${accent}10, transparent 70%)`
            : 'transparent',
        }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="absolute top-0 left-0 right-0 h-px z-10"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }}
      />
      <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        <BrowserMockup url={p.url} accent={accent} bars={bars} hovered={hovered} tall />
        <div className="lg:pl-2">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: accent + '18', border: `1px solid ${accent}35`, color: accent }}>
              ★ Featured
            </span>
            <span className="text-[10px] tracking-widest uppercase" style={{ color: '#444' }}>{p.category}</span>
          </div>
          <div className="font-display font-black text-3xl lg:text-4xl text-white leading-tight mb-3">{p.title}</div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#777' }}>{p.desc}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {p.tags.map(t => (
              <span key={t} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: accent + '15', border: `1px solid ${accent}30`, color: accent + 'bb' }}>
                {t}
              </span>
            ))}
          </div>
          <a href={p.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:scale-105"
            style={{ background: accent, color: '#000', boxShadow: `0 4px 20px ${accent}55` }}>
            <ExternalLink size={14} /> View Live Site
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   THUMBNAIL STRIP ITEM
   ═══════════════════════════════════════════════════════════ */
function Thumbnail({
  p, isActive, onClick,
}: {
  p: typeof projects[0]; isActive: boolean; onClick: () => void;
}) {
  const accent = p.accent;
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-44 sm:w-52 rounded-xl overflow-hidden transition-all duration-300 text-left group"
      style={{
        border: isActive ? `1.5px solid ${accent}` : '1px solid rgba(255,255,255,0.07)',
        background: isActive ? '#0e0e14' : '#0a0a0e',
        boxShadow: isActive ? `0 0 20px ${accent}22, 0 4px 16px rgba(0,0,0,0.4)` : '0 2px 8px rgba(0,0,0,0.3)',
        transform: isActive ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      )}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} />
          <span className="text-[9px] font-medium tracking-widest uppercase truncate"
            style={{ color: isActive ? accent : '#555' }}>
            {p.category}
          </span>
        </div>
        <div className="font-display font-bold text-sm text-white leading-tight mb-1 truncate">{p.title}</div>
        <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: '#555' }}>{p.desc}</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {p.tags.slice(0, 2).map(t => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: isActive ? accent + '15' : 'rgba(255,255,255,0.04)', color: isActive ? accent + 'cc' : '#444' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   CATEGORY PILL TAB
   ═══════════════════════════════════════════════════════════ */
function CategoryTab({
  cat, isActive, count, onClick,
}: {
  cat: typeof categories[0]; isActive: boolean; count: number; onClick: () => void;
}) {
  const Icon = cat.icon;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 overflow-hidden"
      style={{
        border: isActive ? `1.5px solid ${cat.accent}55` : '1px solid rgba(255,255,255,0.07)',
        background: isActive ? `linear-gradient(135deg, ${cat.accent}12, ${cat.accent}06)` : 'rgba(255,255,255,0.02)',
        boxShadow: isActive ? `0 0 32px ${cat.glow}, 0 4px 20px rgba(0,0,0,0.4)` : '0 2px 8px rgba(0,0,0,0.3)',
        minWidth: '160px',
      }}
    >
      {/* Active glow line */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}cc, transparent)` }} />
      )}

      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: isActive ? cat.accent + '22' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isActive ? cat.accent + '44' : 'rgba(255,255,255,0.06)'}`,
        }}>
        <Icon size={18} style={{ color: isActive ? cat.accent : '#555' }} />
      </div>

      {/* Label + count */}
      <div>
        <div className="font-display font-bold text-sm leading-tight"
          style={{ color: isActive ? '#fff' : '#666' }}>
          {cat.label}
        </div>
        <div className="text-[10px] mt-0.5"
          style={{ color: isActive ? cat.accent : '#3a3a3a' }}>
          {count} project{count !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Active dot */}
      {isActive && (
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
          style={{ background: cat.accent, boxShadow: `0 0 6px ${cat.accent}` }} />
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════
   PORTFOLIO SECTION
   ═══════════════════════════════════════════════════════════ */
export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState<string>('event');
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = projects.filter(p => p.type === activeCategory);
  const activeProject = filtered[activeIndex] ?? filtered[0];

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    setActiveIndex(0);
  };

  const prev = () => setActiveIndex(i => (i - 1 + filtered.length) % filtered.length);
  const next = () => setActiveIndex(i => (i + 1) % filtered.length);

  return (
    <section id="portfolio" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
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
              Our work so far
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

        {/* ── Category Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-10"
        >
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            >
              <CategoryTab
                cat={cat}
                isActive={activeCategory === cat.key}
                count={projects.filter(p => p.type === cat.key).length}
                onClick={() => handleCategoryChange(cat.key)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Divider ── */}
        <div className="mb-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

        {/* ── Showcase: one big active project ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <AnimatePresence mode="wait">
            {activeProject && (
              <ShowcaseCard
                key={`${activeProject.id}-${activeCategory}`}
                p={activeProject}
                barIndex={projects.indexOf(activeProject)}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Navigation ── (only if multiple in category) */}
        {filtered.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-between mt-8 mb-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#111', color: '#888' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={next}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#111', color: '#888' }}
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-xs text-[#555] ml-2 font-mono">
                {String(activeIndex + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}
              </span>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {filtered.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActiveIndex(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: i === activeIndex ? p.accent : 'rgba(255,255,255,0.15)',
                    transform: i === activeIndex ? 'scale(1.5)' : 'scale(1)',
                    boxShadow: i === activeIndex ? `0 0 6px ${p.accent}88` : 'none',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Thumbnail strip (only if multiple) ── */}
        {filtered.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
          >
            {filtered.map((p, i) => (
              <Thumbnail
                key={p.id}
                p={p}
                isActive={i === activeIndex}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </motion.div>
        )}

      </div>
    </section>
  );
}
