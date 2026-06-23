'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, UtensilsCrossed, Dumbbell, Megaphone, User, CalendarCheck, ShoppingBag, RefreshCw, Wrench } from 'lucide-react';

const services = [
  { icon: Building2,     title: 'Business Websites',   desc: 'Professional sites that build trust and generate leads.' },
  { icon: UtensilsCrossed, title: 'Restaurant Websites', desc: 'Menus, reservations, and online ordering built in.' },
  { icon: Dumbbell,      title: 'Gym Websites',         desc: 'Class schedules, memberships, trainer profiles.' },
  { icon: Megaphone,     title: 'Landing Pages',        desc: 'Conversion-focused pages that turn ads into customers.' },
  { icon: User,          title: 'Portfolio Websites',   desc: 'Striking portfolios for designers, developers, creatives.' },
  { icon: CalendarCheck, title: 'Booking Systems',      desc: 'Smart booking for salons, clinics, coaches.' },
  { icon: ShoppingBag,   title: 'E-commerce Stores',    desc: 'Full-featured stores with cart and secure checkout.' },
  { icon: RefreshCw,     title: 'Website Redesigns',    desc: 'Transform outdated sites into modern experiences.' },
  { icon: Wrench,        title: 'Maintenance',          desc: 'Ongoing care — updates, security, performance.' },
];

export default function Services() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="services" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-tag mb-5"
            >
              Services
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display font-black text-4xl lg:text-5xl text-white leading-tight"
            >
              What we build
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm text-[#666] max-w-xs leading-relaxed sm:text-right"
          >
            From simple landing pages to complex web applications — every project delivered with precision.
          </motion.p>
        </div>

        {/* Service list */}
        <div>
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group flex items-center justify-between py-5 transition-all duration-200"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                borderTop: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div className="flex items-center gap-6">
                <span className="text-xs text-[#444] font-mono w-6 text-right flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <s.icon
                  size={16}
                  strokeWidth={1.5}
                  className="text-[#444] group-hover:text-white transition-colors duration-200 flex-shrink-0"
                />
                <span className="font-display font-bold text-xl text-white group-hover:text-white transition-colors">
                  {s.title}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span
                  className="text-sm text-[#555] max-w-xs text-right leading-relaxed hidden md:block transition-opacity duration-200"
                  style={{ opacity: hovered === i ? 1 : 0 }}
                >
                  {s.desc}
                </span>
                <span
                  className="text-[#444] group-hover:text-white transition-all duration-200"
                  style={{ transform: hovered === i ? 'translateX(4px)' : 'none' }}
                >
                  →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
