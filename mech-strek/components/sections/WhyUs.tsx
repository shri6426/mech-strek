'use client';

import { motion } from 'framer-motion';
import { Zap, Monitor, Palette, Sparkles, Search, Shield, TrendingUp, Brush } from 'lucide-react';

const features = [
  { icon: Zap,         title: 'Lightning Fast',       desc: 'Optimized for 95+ Lighthouse scores and sub-second load times.' },
  { icon: Monitor,     title: 'Fully Responsive',      desc: 'Pixel-perfect across every screen — mobile to ultrawide.' },
  { icon: Palette,     title: 'Modern UI/UX',          desc: 'Interfaces that guide users and maximize engagement.' },
  { icon: Sparkles,    title: 'Animations',            desc: 'Smooth, purposeful motion that makes your site feel alive.' },
  { icon: Search,      title: 'SEO Optimized',         desc: 'Best practices baked in — rank higher, attract more traffic.' },
  { icon: Shield,      title: 'Secure & Scalable',     desc: 'Enterprise-grade security and infrastructure that grows with you.' },
  { icon: TrendingUp,  title: 'Built for Growth',      desc: 'Conversion-focused design that turns visitors into customers.' },
  { icon: Brush,       title: 'Custom Designed',       desc: 'No templates. Every pixel crafted for your brand.' },
];

export default function WhyUs() {
  return (
    <section id="why-us" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="section-tag mb-6"
            >
              Why Choose Us
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display font-black text-4xl lg:text-5xl text-white leading-tight"
            >
              Everything your website needs
            </motion.h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-8 flex items-end">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-sm text-[#666] leading-relaxed"
            >
              We combine cutting-edge technology with thoughtful design to build websites that perform, convert, and last.
            </motion.p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="p-6 group transition-colors duration-200"
              style={{ background: '#080808' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#111')}
              onMouseLeave={e => (e.currentTarget.style.background = '#080808')}
            >
              <f.icon size={18} className="text-[#555] mb-4 group-hover:text-white transition-colors duration-200" strokeWidth={1.5} />
              <div className="text-sm font-semibold text-white mb-2">{f.title}</div>
              <div className="text-xs text-[#555] leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
