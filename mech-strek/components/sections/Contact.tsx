'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, CheckCircle2, ChevronDown } from 'lucide-react';
import { submitContactForm } from '@/lib/api';

const budgets = ['Under ₹20,000', '₹20,000–₹40,000', '₹40,000–₹80,000', '₹80,000–₹1,50,000', '₹1,50,000+', "Let's discuss"];

interface Form { name: string; business: string; email: string; phone: string; details: string; budget: string; }

function Field({ label, name, type = 'text', value, onChange, required }: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[#555] uppercase tracking-widest">{label}{required && ' *'}</label>
      <input
        type={type} name={name} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full px-0 py-2.5 bg-transparent text-white text-sm border-b border-[rgba(255,255,255,0.1)] outline-none placeholder-[#333] focus:border-white transition-colors duration-200"
      />
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState<Form>({ name: '', business: '', email: '', phone: '', details: '', budget: '' });
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [textFocused, setTextFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const set = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await submitContactForm({
        name: form.name,
        business: form.business || undefined,
        email: form.email,
        phone: form.phone || undefined,
        details: form.details,
        budget: form.budget || "Let's discuss",
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4"
          >
            <div className="section-tag mb-5">Contact</div>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-white leading-tight mb-6">
              Let&apos;s build something incredible.
            </h2>
            <p className="text-sm text-[#666] leading-relaxed mb-10">
              Tell us about your project and we&apos;ll bring it to life. Free consultation, no strings attached.
            </p>

            <div className="space-y-4 mb-10">
              <a href="mailto:mechstrek@gmail.com" className="flex items-center gap-3 text-sm text-[#666] hover:text-white transition-colors group">
                <Mail size={14} className="flex-shrink-0" />
                mechstrek@gmail.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-3 text-sm text-[#666] hover:text-white transition-colors group">
                <Phone size={14} className="flex-shrink-0" />
                +91 98765 43210
              </a>
            </div>

            <div className="space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px' }}>
              <div className="text-xs text-[#444] uppercase tracking-widest mb-3">What happens next</div>
              {['We review within 24 hours', 'Free 30-min discovery call', 'Custom proposal & timeline', 'Project kickoff!'].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-[#666]">
                  <span className="text-xs font-mono text-[#333] w-4">{i + 1}.</span>
                  {s}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 lg:col-start-6"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-start py-12 gap-4"
                >
                  <CheckCircle2 size={32} className="text-white" />
                  <h3 className="font-display font-black text-2xl text-white">Message received.</h3>
                  <p className="text-sm text-[#666]">We&apos;ll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Your Name" name="name" value={form.name} onChange={set('name')} required />
                    <Field label="Business Name" name="business" value={form.business} onChange={set('business')} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Email" name="email" type="email" value={form.email} onChange={set('email')} required />
                    <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={set('phone')} />
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#555] uppercase tracking-widest">Project Details *</label>
                    <textarea
                      required rows={4}
                      value={form.details}
                      onChange={e => set('details')(e.target.value)}
                      onFocus={() => setTextFocused(true)}
                      onBlur={() => setTextFocused(false)}
                      className="w-full px-0 py-2.5 bg-transparent text-white text-sm border-b outline-none resize-none placeholder-[#333] transition-colors duration-200"
                      style={{ borderBottomColor: textFocused ? 'white' : 'rgba(255,255,255,0.1)' }}
                    />
                  </div>

                  {/* Budget */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs text-[#555] uppercase tracking-widest">Budget Range</label>
                    <button
                      type="button"
                      onClick={() => setBudgetOpen(!budgetOpen)}
                      className="w-full flex items-center justify-between py-2.5 bg-transparent text-sm border-b border-[rgba(255,255,255,0.1)] text-left"
                    >
                      <span style={{ color: form.budget ? 'white' : '#333' }}>{form.budget || 'Select range'}</span>
                      <motion.div animate={{ rotate: budgetOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} className="text-[#555]" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {budgetOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 z-50 mt-1 rounded-lg overflow-hidden"
                          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          {budgets.map(b => (
                            <button
                              key={b} type="button"
                              onClick={() => { set('budget')(b); setBudgetOpen(false); }}
                              className="w-full px-4 py-3 text-sm text-[#888] hover:text-white hover:bg-white/5 text-left transition-colors"
                            >
                              {b}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-60 mt-2"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border border-black/30 border-t-black rounded-full"
                      />
                    ) : 'Send Message →'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
