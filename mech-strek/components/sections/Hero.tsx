'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface HandPos { x: number; y: number; }

/* ── Scanlines overlay ── */
function Scanlines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 3,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
      }}
    />
  );
}

/* ── Retro Win95-style window frame ── */
function RetroWindow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '2px solid rgba(255,255,255,0.85)',
        background: 'rgba(0,0,0,0.96)',
        boxShadow: '4px 4px 0px rgba(255,255,255,0.15)',
        width: '100%',
        maxWidth: '640px',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          borderBottom: '2px solid rgba(255,255,255,0.85)',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#b91c1c', fontWeight: 600, letterSpacing: '0.2em' }}>
          MECH_STREK.EXE
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['─', '□', '✕'].map((sym, i) => (
            <div
              key={i}
              style={{
                width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.45)',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'monospace',
                fontSize: 9,
              }}
            >
              {sym}
            </div>
          ))}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '24px 28px' }}>{children}</div>
    </div>
  );
}

export default function Hero() {
  const leftHandRef  = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);
  const posRef       = useRef<HandPos>({ x: 0, y: 0 });
  const targetRef    = useRef<HandPos>({ x: 0, y: 0 });
  const rafRef       = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const tick = useCallback(() => {
    posRef.current.x = lerp(posRef.current.x, targetRef.current.x, 0.06);
    posRef.current.y = lerp(posRef.current.y, targetRef.current.y, 0.06);
    const px = posRef.current.x;
    const py = posRef.current.y;
    if (leftHandRef.current) {
      leftHandRef.current.style.transform = `translate(${-px * 20}px, ${-py * 25}px)`;
    }
    if (rightHandRef.current) {
      rightHandRef.current.style.transform = `translate(${px * 20}px, ${-py * 25}px)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  /* Mouse tracking */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      targetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  /* Device orientation for mobile */
  useEffect(() => {
    if (!isMobile) return;
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      targetRef.current.x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 25));
      targetRef.current.y = Math.max(-1, Math.min(1, ((e.beta ?? 0) - 40) / 30));
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [isMobile]);

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Scanlines />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* ── Left hand ── comes from bottom-left, reaches toward center */}
      <div
        ref={leftHandRef}
        style={{
          position: 'absolute',
          left: isMobile ? '-15vw' : '-10vw',
          bottom: isMobile ? '5%' : '8%',
          width: isMobile ? '72vw' : '55vw',
          maxWidth: 680,
          zIndex: 4,
          pointerEvents: 'none',
          willChange: 'transform',
          animation: 'floatLeft 5s ease-in-out infinite alternate',
        }}
      >
        <Image
          src="/left-hand.png"
          alt=""
          width={680}
          height={400}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />
      </div>

      {/* ── Right hand ── comes from bottom-right, reaches toward center */}
      <div
        ref={rightHandRef}
        style={{
          position: 'absolute',
          right: isMobile ? '-15vw' : '-10vw',
          bottom: isMobile ? '5%' : '8%',
          width: isMobile ? '72vw' : '55vw',
          maxWidth: 680,
          zIndex: 4,
          pointerEvents: 'none',
          willChange: 'transform',
          animation: 'floatRight 5s ease-in-out infinite alternate',
          animationDelay: '0.7s',
        }}
      >
        <Image
          src="/left-hand.png"
          alt=""
          width={680}
          height={400}
          style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
          priority
        />
      </div>

      {/* ── Main content — sits in center on top of hands ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 1280,
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 64,
          paddingBottom: 80,
        }}
      >
        <RetroWindow>
          {/* Blinking cursor prompt */}
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>C:\MECHSTREK&gt;</span>
            <span style={{ display: 'inline-block', width: 7, height: 13, background: 'rgba(255,255,255,0.8)', animation: 'blink 1s step-end infinite' }} />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: 'clamp(26px, 5vw, 54px)',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            MECH{' '}
            <em style={{ fontStyle: 'italic', color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.9)' }}>
              STREK
            </em>
          </h1>

          {/* Tagline */}
          <p style={{ fontFamily: 'monospace', fontSize: 'clamp(12px, 2vw, 16px)', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em', marginBottom: 12 }}>
            &gt; WE BUILD WEBSITES PEOPLE REMEMBER.
          </p>
          
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
             <span><span style={{color: '#d946ef'}}>*</span> INITIATING NEURAL LINK... <span style={{color: '#fff'}}>[OK]</span></span>
             <span><span style={{color: '#d946ef'}}>*</span> OVERRIDING DEFAULT AESTHETICS... <span style={{color: '#fff'}}>[OK]</span></span>
             <span><span style={{color: '#d946ef'}}>*</span> AWAITING USER COMMAND_</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', marginBottom: 20 }} />

          {/* Stats / System Modules */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
            {[{ num: '01', label: 'IMMERSIVE' }, { num: '02', label: 'PERFORMANCE' }, { num: '03', label: 'REVENUE' }].map(s => (
              <div key={s.num} style={{ fontFamily: 'monospace' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 26px)' }}>SYS.{s.num}</div>
                <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10, letterSpacing: '0.15em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
                padding: '12px 24px', background: '#ffffff', color: '#000000',
                border: '2px solid #ffffff', letterSpacing: '0.1em',
                boxShadow: '3px 3px 0px rgba(255,255,255,0.25)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#000'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#000'; }}
            >
              START YOUR PROJECT →
            </button>
            <button
              onClick={() => document.querySelector('#portfolio')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                fontFamily: 'monospace', fontSize: 12,
                padding: '12px 24px', background: 'transparent', color: 'rgba(255,255,255,0.7)',
                border: '2px solid rgba(255,255,255,0.3)', letterSpacing: '0.1em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.8)'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}
            >
              VIEW OUR WORK
            </button>
          </div>
        </RetroWindow>
      </div>

      {/* Bottom fade to blend into next section */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to top, #000000, transparent)',
          zIndex: 20, pointerEvents: 'none',
        }}
      />

      {/* CSS keyframe animations */}
      <style>{`
        @keyframes floatLeft {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(-18px); }
        }
        @keyframes floatRight {
          0%   { transform: translateY(-10px); }
          100% { transform: translateY(10px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </section>
  );
}