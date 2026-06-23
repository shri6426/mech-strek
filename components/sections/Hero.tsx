'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  // Floating elements variants
  const floatingAnimation = {
    y: ['-10px', '10px'],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut',
    },
  };

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center pt-32 pb-16 overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Text Content */}
        <div className="flex-1">
          <motion.div
            variants={fade}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            className="section-tag mb-8 border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full inline-flex"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-ping" />
            Premium Web Design & Development
          </motion.div>

          <motion.h1
            variants={fade}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            transition={{ delay: 0.1 }}
            className="font-display font-black leading-[0.9] tracking-tight text-white mb-6"
            style={{ fontSize: 'clamp(48px, 7vw, 100px)' }}
          >
            We build
            <br />
            digital
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#D946EF]">experiences.</span>
          </motion.h1>
          
          <motion.p
            variants={fade}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#a69fba] max-w-md mb-10 leading-relaxed"
          >
            Transform your vision into reality with interactive, high-performance, and visually stunning websites designed for conversion.
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <button
              onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary bg-gradient-to-r from-[#0EA5E9] to-[#D946EF] text-white border-0 hover:opacity-90 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all duration-300"
            >
              Start Your Project →
            </button>
            <button
              onClick={() => document.querySelector('#portfolio')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10"
            >
              View Our Work
            </button>
          </motion.div>
        </div>

        {/* Right Side: Interactive / Moving / Glassmorphic Elements */}
        <div className="flex-1 relative w-full h-[500px] hidden lg:block perspective-1000">
          <motion.div 
            animate={floatingAnimation} 
            className="absolute top-10 left-10 w-64 p-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl z-20"
            style={{ rotate: -5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              <div>
                <div className="text-sm font-semibold text-white">Modern Design</div>
                <div className="text-xs text-gray-400">Glassmorphism applied</div>
              </div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
              <motion.div 
                className="h-full bg-blue-400"
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-purple-500"
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ duration: 1.5, delay: 0.7 }}
              />
            </div>
          </motion.div>

          <motion.div 
            animate={{
              ...floatingAnimation,
              y: ['10px', '-10px'],
            }}
            transition={{ ...floatingAnimation.transition, delay: 1 }}
            className="absolute bottom-10 right-10 w-72 p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-lg shadow-2xl z-10"
            style={{ rotate: 5 }}
          >
             <div className="flex justify-between items-center mb-6">
                <div className="text-white font-medium">Performance</div>
                <div className="text-[#0EA5E9] font-bold">99/100</div>
             </div>
             <div className="grid grid-cols-4 gap-2">
               {[...Array(12)].map((_, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, scale: 0 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 1 + i * 0.1 }}
                   className="h-8 rounded bg-white/5 border border-white/10"
                 />
               ))}
             </div>
          </motion.div>

          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/10 rounded-full border-dashed opacity-50"
          />
        </div>
      </div>
    </section>
  );
}
