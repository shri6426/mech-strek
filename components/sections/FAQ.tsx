'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const faqs = [
  { q: 'How much does a website cost?', a: 'Every project is unique. A basic landing page starts from ₹15,000, while a full business website typically ranges from ₹30,000–₹80,000. We provide a detailed quote after our free discovery call.' },
  { q: 'How long does it take?', a: 'A landing page can be ready in 5–7 days. A full business website typically takes 2–4 weeks depending on complexity and revision rounds.' },
  { q: 'Can you redesign my existing website?', a: 'Absolutely. We audit your current site, identify opportunities, and rebuild it with modern design while preserving your SEO authority.' },
  { q: 'Will my website work on phones and tablets?', a: 'Yes — every website we build is fully responsive and tested on real devices across all screen sizes.' },
  { q: 'Do you provide ongoing maintenance?', a: 'Yes. We offer monthly plans covering updates, security patches, performance monitoring, backups, and priority support.' },
  { q: 'What technologies do you use?', a: 'Primarily React, Next.js, and Tailwind CSS for web apps, GSAP and Framer Motion for animations, and Shopify or WooCommerce for e-commerce.' },
  { q: 'Can I manage my website myself?', a: 'Yes. We can integrate a CMS like Sanity or Contentful that lets you update content without touching code. Training included.' },
  { q: 'Do you help with SEO?', a: 'Every website is built with SEO best practices — semantic HTML, proper meta tags, Core Web Vitals optimisation, and fast load times.' },
];

function Item({ faq, i }: { faq: typeof faqs[0]; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 gap-6 text-left group"
      >
        <span className="text-sm font-medium text-white">{faq.q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <Plus size={15} className="text-[#555] group-hover:text-white transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="pb-5 text-sm text-[#666] leading-relaxed max-w-2xl">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-tag mb-5"
            >
              FAQ
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display font-black text-4xl lg:text-5xl text-white leading-tight mb-6"
            >
              Common questions
            </motion.h2>
            <motion.a
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              href="#contact"
              onClick={e => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="text-sm text-[#666] hover:text-white transition-colors"
            >
              Ask us anything →
            </motion.a>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 lg:col-start-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {faqs.map((f, i) => <Item key={f.q} faq={f} i={i} />)}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
