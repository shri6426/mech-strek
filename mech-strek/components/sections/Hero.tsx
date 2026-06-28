'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

/* ═══════════════════════════════════════════════════════════
   CINEMATIC HERO — "We Build Websites That People Remember"
   
   Timeline (~7 s on desktop, instant on reduced-motion):
     0.0 s  Blueprint grid fades in
     0.3 s  Browser frame draws via SVG stroke animation
     1.2 s  Skeleton loaders shimmer inside browser
     2.6 s  Skeleton → real website content (staggered)
     4.5 s  Camera zoom, UI glow bloom
     5.5 s  Final headline types in
     6.5 s  CTA buttons appear
   ═══════════════════════════════════════════════════════════ */

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const browserRef = useRef<HTMLDivElement>(null);
  const svgFrameRef = useRef<SVGRectElement>(null);
  const svgBarRef = useRef<SVGRectElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);
  const websiteRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ── Detect reduced-motion & mobile ── */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
  }, []);

  /* ── Main GSAP timeline ── */
  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Measure SVG stroke lengths
      const framePerimeter = svgFrameRef.current
        ? (svgFrameRef.current as SVGRectElement).getTotalLength?.()
        : 1600;
      const barPerimeter = svgBarRef.current
        ? (svgBarRef.current as SVGRectElement).getTotalLength?.()
        : 400;

      // Set initial states
      gsap.set(svgFrameRef.current, {
        strokeDasharray: framePerimeter,
        strokeDashoffset: framePerimeter,
      });
      gsap.set(svgBarRef.current, {
        strokeDasharray: barPerimeter,
        strokeDashoffset: barPerimeter,
      });
      gsap.set(skeletonRef.current, { opacity: 0 });
      gsap.set(websiteRef.current, { opacity: 0 });
      gsap.set(headlineRef.current, { opacity: 0, y: 30 });
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.8 });

      // Phase 0: Blueprint grid
      tl.fromTo(
        gridRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        0
      );

      // Phase 1: Draw browser frame
      tl.to(
        svgFrameRef.current,
        { strokeDashoffset: 0, duration: isMobile ? 0.8 : 1.2, ease: 'power2.inOut' },
        0.3
      );
      tl.to(
        svgBarRef.current,
        { strokeDashoffset: 0, duration: isMobile ? 0.5 : 0.8, ease: 'power2.inOut' },
        0.5
      );
      // Browser bar dots
      tl.fromTo(
        '.browser-dot',
        { scale: 0 },
        { scale: 1, stagger: 0.08, duration: 0.3 },
        1.0
      );
      // URL bar
      tl.fromTo(
        '.url-bar',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.4, transformOrigin: 'left' },
        1.1
      );

      // Phase 2: Skeleton loaders
      tl.to(
        skeletonRef.current,
        { opacity: 1, duration: 0.4 },
        isMobile ? 1.3 : 1.5
      );

      // Phase 3: Website content reveal
      tl.to(
        skeletonRef.current,
        { opacity: 0, duration: 0.3 },
        isMobile ? 2.2 : 2.8
      );
      tl.to(
        websiteRef.current,
        { opacity: 1, duration: 0.5 },
        isMobile ? 2.4 : 3.0
      );
      // Stagger website inner elements
      tl.fromTo(
        '.site-el',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.4 },
        isMobile ? 2.5 : 3.1
      );

      // Phase 4: Camera zoom & glow
      tl.to(
        cameraRef.current,
        { scale: isMobile ? 1.02 : 1.06, duration: 1.2, ease: 'power2.inOut' },
        isMobile ? 3.2 : 4.0
      );
      tl.to(
        glowRef.current,
        { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' },
        isMobile ? 3.5 : 4.3
      );

      // Phase 5: Headline
      tl.to(
        headlineRef.current,
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        isMobile ? 3.8 : 5.0
      );

      // Phase 6: CTA buttons
      tl.to(
        ctaRef.current,
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        isMobile ? 4.3 : 5.8
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, isMobile]);

  /* ── Reduced motion: show everything immediately ── */
  if (prefersReducedMotion) {
    return (
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display font-black leading-[0.95] tracking-tight text-white mb-6" style={{ fontSize: 'clamp(36px, 6vw, 80px)' }}>
            We Build Websites That{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#D946EF]">People Remember.</span>
          </h1>
          <p className="text-lg text-[#a69fba] max-w-lg mx-auto mb-10 leading-relaxed">
            From blueprint to brilliance — we craft premium digital experiences that convert visitors into customers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary bg-gradient-to-r from-[#0EA5E9] to-[#D946EF] text-white border-0">
              Start Your Project →
            </button>
            <button onClick={() => document.querySelector('#portfolio')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary">
              View Our Work
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── Blueprint Grid Background ── */}
      <div
        ref={gridRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Cross marks at intersections */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(14,165,233,0.12) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Glow bloom behind browser ── */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none"
        style={{
          width: '700px',
          height: '500px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          background: 'radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, rgba(217,70,239,0.08) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── Camera wrapper (zooms) ── */}
      <div
        ref={cameraRef}
        className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-8"
      >
        {/* ── Browser Frame ── */}
        <div ref={browserRef} className="relative mx-auto w-full">
          {/* SVG stroke-animated border */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 800 480"
            fill="none"
            preserveAspectRatio="none"
            style={{ zIndex: 2 }}
          >
            <rect
              ref={svgFrameRef}
              x="1" y="1" width="798" height="478" rx="16"
              stroke="rgba(14,165,233,0.5)"
              strokeWidth="1.5"
              fill="none"
            />
            <rect
              ref={svgBarRef}
              x="1" y="1" width="798" height="44" rx="16"
              stroke="rgba(14,165,233,0.3)"
              strokeWidth="1"
              fill="none"
            />
          </svg>

          {/* Actual browser shell */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0a0a0f',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* ── Title bar ── */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex gap-1.5">
                <div className="browser-dot w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57', transform: 'scale(0)' }} />
                <div className="browser-dot w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e', transform: 'scale(0)' }} />
                <div className="browser-dot w-2.5 h-2.5 rounded-full" style={{ background: '#28c840', transform: 'scale(0)' }} />
              </div>
              <div
                className="url-bar flex-1 mx-3 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', transform: 'scaleX(0)' }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500/60 flex-shrink-0" />
                <span className="text-[10px] text-[#555] truncate">yourwebsite.com</span>
              </div>
            </div>

            {/* ── Browser body ── */}
            <div className="relative" style={{ height: isMobile ? '220px' : '360px', background: '#0a0a0f' }}>
              {/* Skeleton loaders */}
              <div ref={skeletonRef} className="absolute inset-0 p-4 sm:p-6 space-y-4">
                {/* Skeleton nav */}
                <div className="flex items-center justify-between">
                  <div className="skeleton-bar w-20 sm:w-28 h-3 rounded" />
                  <div className="flex gap-3">
                    <div className="skeleton-bar w-10 sm:w-14 h-2.5 rounded hidden sm:block" />
                    <div className="skeleton-bar w-10 sm:w-14 h-2.5 rounded hidden sm:block" />
                    <div className="skeleton-bar w-10 sm:w-14 h-2.5 rounded hidden sm:block" />
                    <div className="skeleton-bar w-16 sm:w-20 h-6 rounded-md" />
                  </div>
                </div>
                {/* Skeleton hero */}
                <div className="pt-4 sm:pt-8 space-y-3">
                  <div className="skeleton-bar w-4/5 h-5 sm:h-8 rounded" />
                  <div className="skeleton-bar w-3/5 h-5 sm:h-8 rounded" />
                  <div className="skeleton-bar w-2/3 h-2.5 sm:h-3 rounded mt-4" />
                  <div className="skeleton-bar w-1/2 h-2.5 sm:h-3 rounded" />
                </div>
                {/* Skeleton buttons */}
                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <div className="skeleton-bar w-24 sm:w-32 h-8 sm:h-10 rounded-lg" />
                  <div className="skeleton-bar w-20 sm:w-28 h-8 sm:h-10 rounded-lg" />
                </div>
                {/* Skeleton cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <div className="skeleton-bar h-12 sm:h-20 rounded-lg" />
                  <div className="skeleton-bar h-12 sm:h-20 rounded-lg" />
                  <div className="skeleton-bar h-12 sm:h-20 rounded-lg" />
                </div>
              </div>

              {/* ── Real website content ── */}
              <div ref={websiteRef} className="absolute inset-0 p-4 sm:p-6">
                {/* Mini nav */}
                <div className="site-el flex items-center justify-between mb-6 sm:mb-10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gradient-to-br from-[#0EA5E9] to-[#D946EF]" />
                    <span className="text-[10px] sm:text-xs font-bold text-white">YourBrand</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-[8px] sm:text-[10px] text-[#666] hidden sm:inline">Home</span>
                    <span className="text-[8px] sm:text-[10px] text-[#666] hidden sm:inline">About</span>
                    <span className="text-[8px] sm:text-[10px] text-[#666] hidden sm:inline">Work</span>
                    <div className="px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[9px] font-semibold text-black bg-white">Contact</div>
                  </div>
                </div>

                {/* Mini hero text */}
                <div className="site-el mb-3 sm:mb-5">
                  <div className="font-display font-black text-white leading-tight" style={{ fontSize: isMobile ? '14px' : 'clamp(16px, 2.2vw, 28px)' }}>
                    Build something
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#D946EF]">extraordinary.</span>
                  </div>
                </div>
                <div className="site-el flex gap-1 sm:gap-2 text-[7px] sm:text-[9px] text-[#888] mb-4 sm:mb-6">
                  <span>Fast.</span>
                  <span>Modern.</span>
                  <span>Responsive.</span>
                </div>

                {/* Mini buttons */}
                <div className="site-el flex gap-2 mb-4 sm:mb-6">
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[10px] font-semibold text-black bg-gradient-to-r from-[#0EA5E9] to-[#D946EF] shadow-[0_0_16px_rgba(14,165,233,0.4)]">
                    Get Started →
                  </div>
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[10px] text-[#aaa] border border-white/10">
                    Learn More
                  </div>
                </div>

                {/* Mini feature cards */}
                <div className="site-el grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { icon: '⚡', label: 'Lightning Fast', color: '#0EA5E9' },
                    { icon: '🎨', label: 'Beautiful UI', color: '#D946EF' },
                    { icon: '📱', label: 'Responsive', color: '#34d399' },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="p-2 sm:p-3 rounded-lg border"
                      style={{
                        background: `${card.color}08`,
                        borderColor: `${card.color}22`,
                      }}
                    >
                      <div className="text-xs sm:text-sm mb-1">{card.icon}</div>
                      <div className="text-[7px] sm:text-[9px] font-medium text-white/80">{card.label}</div>
                      <div className="mt-1 sm:mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: `${card.color}15` }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: card.color }}
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 1.5, delay: 3.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glow overlay inside browser */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 30% 20%, rgba(14,165,233,0.06) 0%, transparent 60%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Headline below browser ── */}
      <div ref={headlineRef} className="relative z-20 text-center px-6 mt-8 sm:mt-12">
        <h1
          className="font-display font-black leading-[0.95] tracking-tight text-white mb-4"
          style={{ fontSize: 'clamp(32px, 5.5vw, 72px)' }}
        >
          We Build Websites That{' '}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] via-[#a78bfa] to-[#D946EF]">
            People Remember.
          </span>
        </h1>
        <p className="text-sm sm:text-lg text-[#a69fba] max-w-lg mx-auto leading-relaxed">
          From blueprint to brilliance — we craft premium digital experiences that convert visitors into customers.
        </p>
      </div>

      {/* ── CTA Buttons ── */}
      <div ref={ctaRef} className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10 pb-16">
        <button
          onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-primary bg-gradient-to-r from-[#0EA5E9] to-[#D946EF] text-white border-0 hover:opacity-90 shadow-[0_0_24px_rgba(14,165,233,0.3)] hover:shadow-[0_0_36px_rgba(217,70,239,0.5)] transition-all duration-300"
        >
          Start Your Project →
        </button>
        <button
          onClick={() => document.querySelector('#portfolio')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-secondary backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10"
        >
          View Our Work
        </button>
      </div>

      {/* Subtle bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-30"
        style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }}
      />
    </section>
  );
}
