'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { User, ShieldCheck, ChevronDown } from 'lucide-react';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Process', href: '#process' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const scroll = (href: string) => {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 40);

      if (y <= 60) {
        setHidden(false);
      } else if (y < lastScrollY.current - 5) {
        setHidden(false);
      } else if (y > lastScrollY.current + 5) {
        setHidden(true);
      }

      lastScrollY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  const navHidden = hidden && !mobileOpen;

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: navHidden ? '-100%' : 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-[9999]"
        style={{
          background: scrolled
            ? 'rgba(8, 8, 12, 0.20)'
            : 'rgba(8, 8, 12, 0.20)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(28px) saturate(200%) brightness(1.05)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%) brightness(1.05)',
          boxShadow: scrolled
            ? '0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.25)'
            : '0 1px 0 rgba(255,255,255,0.04)',
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            onClick={e => { 
              if (pathname === '/') {
                e.preventDefault(); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }
            }}
            className="flex items-center gap-3 group"
          >
            <Image
              src="/logo.png"
              alt="Mech Strek Logo"
              width={42}
              height={42}
              className="object-contain transition-all duration-300"
              style={{
                filter: 'brightness(0) invert(1) opacity(0.85)',
              }}
            />
            <span className="font-display font-black text-xl text-white tracking-tight leading-none">
              Mech Strek
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link
                key={l.label}
                href={`/${l.href}`}
                onClick={e => { 
                  if (pathname === '/') {
                    e.preventDefault(); 
                    scroll(l.href); 
                  }
                }}
                className="text-sm text-[#888] hover:text-white transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA & Login Dropdown */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-all flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-neutral-400" /> Access Portal <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {loginDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <Link
                    href="/portal"
                    onClick={() => setLoginDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Client Portal</div>
                      <div className="text-[10px] text-neutral-500">Track projects & invoices</div>
                    </div>
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setLoginDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-red-400">Admin Studio</div>
                      <div className="text-[10px] text-neutral-500">Manage agency operations</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/#contact"
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  scroll('#contact');
                }
              }}
              className="btn-primary text-xs px-4 py-2"
            >
              Start Project
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              className="block w-5 h-px bg-white"
              style={{ transformOrigin: 'center' }}
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-5 h-px bg-white"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
              className="block w-5 h-px bg-white"
              style={{ transformOrigin: 'center' }}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9998] md:hidden flex flex-col justify-center px-8"
            style={{ background: '#080808' }}
          >
            <div className="space-y-6">
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/${l.href}`}
                    onClick={e => { 
                      if (pathname === '/') {
                        e.preventDefault(); 
                        scroll(l.href); 
                      }
                      setMobileOpen(false); 
                    }}
                    className="text-2xl font-display font-bold text-[#888] hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href="/portal"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-3 rounded-xl bg-white/5 text-white font-semibold text-base border border-white/10"
                >
                  Client Portal
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-3 rounded-xl bg-red-500/10 text-red-400 font-semibold text-base border border-red-500/20"
                >
                  Admin Studio
                </Link>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => { scroll('#contact'); setMobileOpen(false); }}
                  className="btn-primary mt-2"
                >
                  Start a Project
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
