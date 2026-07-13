'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  { n: '01', title: 'Discovery',    desc: 'We deep-dive into your brand, goals, target audience, and competitors to define a winning strategy.' },
  { n: '02', title: 'Planning',     desc: 'Creating the architecture, sitemap, and wireframes to ensure a logical and intuitive user flow.' },
  { n: '03', title: 'UI/UX Design', desc: 'Crafting a premium, pixel-perfect visual design with interactive prototypes.' },
  { n: '04', title: 'Development',  desc: 'Writing clean code using the best technology stack for speed, scalability, and security.' },
  { n: '05', title: 'Testing',      desc: 'Rigorous cross-device, performance, and QA checks to guarantee a flawless experience.' },
  { n: '06', title: 'Launch',       desc: 'Zero-downtime deployment, configuring SSL, CDN, and final SEO optimizations.' },
];

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center']
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="process" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        
        {/* Centered Heading */}
        <div className="text-center mb-20 flex flex-col items-center">
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
            className="text-sm text-[#666] leading-relaxed max-w-xl"
          >
            A proven, transparent process that keeps you informed at every stage — from first call to final launch.
          </motion.p>
        </div>

        {/* Timeline Container */}
        <div className="relative" ref={containerRef}>
          {/* Static background line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.05] -translate-x-1/2" />
          
          {/* Animated fill line */}
          <motion.div 
            className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[1px] bg-red-700 -translate-x-1/2 origin-top"
            style={{ scaleY: lineHeight }}
          />

          <div className="space-y-12 md:space-y-0">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;
              return (
                <div key={s.n} className="relative flex flex-col md:flex-row items-center md:py-12">
                  
                  {/* Node Circle */}
                  <motion.div 
                    initial={{ backgroundColor: '#080808', borderColor: 'rgba(255,255,255,0.2)' }}
                    whileInView={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c', boxShadow: '0 0 12px rgba(185,28,28,0.6)' }}
                    viewport={{ margin: '1000px 0px -50% 0px' }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-[20px] md:left-1/2 w-4 h-4 rounded-full border-2 -translate-x-1/2 z-10" 
                  />

                  {/* Desktop Empty Space for alignment */}
                  <div className={`hidden md:block w-1/2 ${isEven ? 'order-2' : 'order-1'}`} />

                  {/* Card Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? 'md:pr-16 md:text-right order-1' : 'md:pl-16 md:text-left order-2'}`}
                  >
                    <div className="relative p-8 md:p-10 rounded-2xl bg-[#0c0c0c] border border-white/[0.04] overflow-hidden group hover:border-white/[0.08] hover:bg-white/[0.02] transition-colors duration-500">
                      
                      {/* Large Background Number */}
                      <div 
                        className={`absolute -top-4 ${isEven ? 'right-4' : 'left-4'} text-[120px] font-black text-white/[0.02] pointer-events-none font-display leading-none`}
                      >
                        {s.n}
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
                          {s.title}
                        </h3>
                        <p className={`text-[#777] text-sm leading-relaxed max-w-sm ml-auto mr-auto md:mx-0 ${isEven ? 'md:ml-auto' : 'md:mr-auto'}`}>
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
