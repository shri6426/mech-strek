'use client';

import { useState, useEffect } from 'react';
import { fetchServices, fetchFaqItems, ServiceItem, FaqItem } from '@/lib/api';
import { Layers, HelpCircle, Plus } from 'lucide-react';

export default function AdminServicesCMSPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchServices(), fetchFaqItems()])
      .then(([serviceData, faqData]) => {
        setServices(serviceData);
        setFaqs(faqData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      {/* Services Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Services Catalog CMS</h1>
            <p className="text-xs text-neutral-400 mt-1">Manage active studio offerings and service descriptions</p>
          </div>
          <button className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all">
            <Plus size={14} /> Add Service
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500 font-mono">Loading service items...</div>
        ) : (
          <div className="space-y-3">
            {services.map((service, i) => (
              <div key={service.id || i} className="p-4 rounded-xl bg-[#111] border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-white">{service.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">{service.description}</p>
                </div>
                {service.price_label && (
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 text-neutral-300 border border-white/10">
                    {service.price_label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">FAQ CMS</h2>
            <p className="text-xs text-neutral-400 mt-1">Manage interactive accordions for client questions</p>
          </div>
          <button className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all">
            <Plus size={14} /> Add FAQ Item
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500 font-mono">Loading FAQ items...</div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.id || i} className="p-4 rounded-xl bg-[#111] border border-white/5 space-y-2">
                <h4 className="font-semibold text-sm text-white">Q: {faq.question}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">A: {faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
