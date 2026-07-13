'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LoadingScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[999999] flex flex-col items-end justify-end p-10"
          style={{ background: '#080808' }}
        >
          {/* Centered logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <Image
                src="/logo.png"
                alt="Mech Strek"
                width={100}
                height={100}
                className="object-contain"
                style={{ filter: 'brightness(0) invert(1) opacity(0.9)' }}
              />
              <span className="font-display font-black text-3xl text-white tracking-tight">
                Mech Strek
              </span>
            </motion.div>
          </div>

          {/* Loading bar bottom */}
          <div className="w-full max-w-xs">
            <div className="text-xs text-[#555] uppercase tracking-widest mb-4">Loading</div>
            <div className="h-px w-full bg-[#1a1a1a] overflow-hidden">
              <div className="loading-bar" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
