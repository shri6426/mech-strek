'use client';

import { Mail } from 'lucide-react';

const links = {
  Services: ['Business Websites', 'E-commerce', 'Landing Pages', 'Portfolio Sites', 'Booking Systems'],
  Company:  ['About', 'Portfolio', 'Process', 'FAQ', 'Contact'],
};

export default function Footer() {
  return (
    <footer className="py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="font-display font-black text-xl text-white mb-3">Mech Strek</div>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[#444]">© {new Date().getFullYear()} Mech Strek.</p>
          <p className="text-xs text-[#333]">Crafted for the web.</p>
        </div>
      </div>
    </footer>
  );
}
