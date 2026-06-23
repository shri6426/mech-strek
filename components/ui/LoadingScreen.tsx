'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[999999] flex flex-col items-end justify-end p-10"
          style={{ background: '#080808' }}
        >
          <div className="w-full max-w-xs">
            <div className="text-xs text-[#555] uppercase tracking-widest mb-4">Loading</div>
            <div className="h-px w-full bg-[#1a1a1a] overflow-hidden">
              <div className="loading-bar" />
            </div>
          </div>
          <div className="absolute top-10 left-10">
            <span className="font-display font-black text-2xl text-white tracking-tight">
              Mech Strek
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
