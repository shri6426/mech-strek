'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionHeadingProps {
  badge?: string;
  title: ReactNode;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionHeading({
  badge,
  title,
  subtitle,
  centered = true,
  className = '',
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`${centered ? 'text-center' : ''} ${className}`}
    >
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-500" />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
            {badge}
          </span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-500" />
        </motion.div>
      )}

      <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-6">
        {title}
      </h2>

      {subtitle && (
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
