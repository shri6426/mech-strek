'use client';

import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';
import Image from 'next/image';

const links = {
  Services: ['Business Websites', 'E-commerce', 'Landing Pages', 'Portfolio Sites', 'Booking Systems'],
  Company:  ['About', 'Portfolio', 'Process', 'FAQ', 'Contact'],
};

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="Mech Strek Logo"
                width={52}
                height={52}
                className="object-contain flex-shrink-0"
                style={{ filter: 'brightness(0) invert(1) opacity(0.8)' }}
              />
              <span className="font-display font-black text-2xl text-white leading-none">Mech Strek</span>
            </div>
            <p className="text-sm text-[#555] leading-relaxed mb-5 max-w-xs">
              We build premium websites that grow businesses and leave lasting impressions.
            </p>
            <a href="mailto:mechstrek@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors">
              <Mail size={13} />
              mechstrek@gmail.com
            </a>
          </div>

          {/* Links */}
          <div className="lg:col-span-7 lg:col-start-6 grid grid-cols-2 gap-8">
            {Object.entries(links).map(([cat, items]) => (
              <div key={cat}>
                <div className="text-xs text-[#444] uppercase tracking-widest mb-4">{cat}</div>
                <ul className="space-y-2.5">
                  {items.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm text-[#666] hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="divider mb-6" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-12">
          <p className="text-xs text-[#444]">© {new Date().getFullYear()} Mech Strek.</p>
          <p className="text-xs text-[#333]">Crafted for the web.</p>
        </div>
      </div>

      {/* ═══ Powered by Mech Strek — cinematic sign-off ═══ */}
      <div className="relative overflow-hidden py-16">
        {/* Gradient divider line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), rgba(217,70,239,0.4), transparent)',
          }}
        />

        {/* Giant watermark logo behind */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <Image
            src="/logo.png"
            alt=""
            width={400}
            height={400}
            className="object-contain select-none"
            style={{
              filter: 'brightness(0) invert(1) opacity(0.025)',
            }}
            aria-hidden
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4">
          {/* Glowing pulse dot */}
          <div className="relative">
            <span
              className="block w-2 h-2 rounded-full animate-pulse"
              style={{
                background: 'linear-gradient(135deg, #0EA5E9, #D946EF)',
                boxShadow: '0 0 12px rgba(14,165,233,0.6), 0 0 24px rgba(217,70,239,0.3)',
              }}
            />
          </div>

          {/* Powered by text */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-[#444]">
              Powered by
            </span>
          </div>

          {/* Brand name with gradient */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Mech Strek"
              width={32}
              height={32}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1) opacity(0.7)' }}
            />
            <span
              className="font-display font-black text-2xl sm:text-3xl tracking-tight"
              style={{ color: '#a78bfa' }}
            >
              Mech Strek
            </span>
          </div>

          {/* Tagline */}
          <p className="text-[10px] sm:text-xs text-[#333] tracking-widest uppercase mt-1">
            Engineering the future of the web
          </p>
        </div>
      </div>
    </footer>
  );
}
