'use client';

import { useRef, useState, ReactNode, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  strength?: number;
}

export default function MagneticButton({
  children,
  className = '',
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  strength = 30,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.5 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * (strength / 50));
    mouseY.set((e.clientY - centerY) * (strength / 50));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const baseClasses = {
    primary: `
      relative overflow-hidden font-semibold text-white
      bg-gradient-to-r from-indigo-600 to-purple-600
      hover:from-indigo-500 hover:to-purple-500
      shadow-glow-blue hover:shadow-glow-purple
    `,
    secondary: `
      relative overflow-hidden font-semibold text-white
      bg-white/5 hover:bg-white/10
      border border-white/10 hover:border-white/20
    `,
    outline: `
      relative overflow-hidden font-semibold
      bg-transparent border border-indigo-500/50 hover:border-indigo-500
      text-indigo-400 hover:text-indigo-300
    `,
  };

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm rounded-xl',
    md: 'px-7 py-3.5 text-base rounded-2xl',
    lg: 'px-9 py-4.5 text-lg rounded-2xl',
  };

  const content = (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className="inline-block"
    >
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className={`
          magnetic-btn cursor-none inline-flex items-center gap-2 transition-all duration-300
          ${baseClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        <span className="relative z-10">{children}</span>
      </motion.button>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}
