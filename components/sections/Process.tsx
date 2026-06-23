'use client';

import { motion } from 'framer-motion';
import { Search, FileText, Layout, Code2, TestTube, Rocket, HeartHandshake } from 'lucide-react';

const steps = [
  { n: '01', title: 'Discovery',    desc: 'Understanding your business, goals, and audience.', icon: Search },
  { n: '02', title: 'Planning',     desc: 'Site architecture, features, and timeline.',         icon: FileText },
  { n: '03', title: 'UI/UX Design', desc: 'Every screen crafted in Figma before coding.',       icon: Layout },
  { n: '04', title: 'Development',  desc: 'Clean code with the right technology stack.',         icon: Code2 },
  { n: '05', title: 'Testing',      desc: 'Cross-device, performance, and QA checks.',          icon: TestTube },
  { n: '06', title: 'Launch',       desc: 'Zero-downtime deployment with SSL and CDN.',          icon: Rocket },
  { n: '07', title: 'Support',      desc: 'Ongoing maintenance and feature additions.',          icon: HeartHandshake },
];

export default function Process() {
  return (
    <section id="process" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left sticky heading */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-tag mb-5"
            >
              Our Process
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display font-black text-4xl lg:text-5xl text-white leading-tight mb-6"
            >
              How we make it happen
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm text-[#666] leading-relaxed"
            >
              A proven, transparent process that keeps you informed at every stage — from first call to final launch.
            </motion.p>
          </div>

          {/* Steps */}
          <div className="lg:col-span-7 lg:col-start-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group flex gap-6 py-6"
                style={{ borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-xs font-mono text-[#444]">{s.n}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <s.icon size={14} strokeWidth={1.5} className="text-[#444] group-hover:text-white transition-colors duration-200" />
                    <span className="font-semibold text-white text-base">{s.title}</span>
                  </div>
                  <p className="text-sm text-[#555] leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
