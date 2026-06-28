'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { gsap } from 'gsap';

const stats = [
  { value: 20, suffix: '+', label: 'Projects Completed' },
  { value: 100, suffix: '%', label: 'Responsive Design' },
  { value: 99, suffix: '%', label: 'Client Satisfaction' },
  { value: 24, suffix: '/7', label: 'Support' },
];

function Stat({ s, i }: { s: typeof stats[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !numRef.current) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: s.value,
      duration: 1.8,
      delay: i * 0.1,
      ease: 'power2.out',
      onUpdate() {
        if (numRef.current) numRef.current.textContent = Math.round(obj.val).toString();
      },
    });
  }, [inView, s.value, i]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: i * 0.1 }}
    >
      <div className="font-display font-black text-white leading-none"
        style={{ fontSize: 'clamp(48px, 6vw, 80px)' }}>
        <span ref={numRef}>0</span><span>{s.suffix}</span>
      </div>
      <div className="text-sm text-[#555] mt-2">{s.label}</div>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section
      className="py-24"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#0c0c0c',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((s, i) => <Stat key={s.label} s={s} i={i} />)}
        </div>
      </div>
    </section>
  );
}
