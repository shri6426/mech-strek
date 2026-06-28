'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function About() {
  return (
    <section id="about" className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Logo — centered above everything */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-14"
        >
          <div className="relative flex items-center justify-center">
            {/* Subtle glow */}
            <div
              className="absolute rounded-full"
              style={{
                inset: '-40px',
                background: 'radial-gradient(circle, rgba(200,200,220,0.07) 0%, transparent 70%)',
              }}
            />
            <Image
              src="/logo.png"
              alt="Mech Strek Logo"
              width={180}
              height={180}
              className="object-contain relative z-10"
              style={{ filter: 'brightness(0) invert(1) opacity(0.88)' }}
            />
          </div>
        </motion.div>

        {/* Heading + text below */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left: Heading */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="section-tag mb-6"
            >
              About Us
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display font-black text-4xl lg:text-5xl text-white leading-tight mb-6"
            >
              Crafting Digital Experiences
            </motion.h2>
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-6 lg:col-start-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6 text-[#888] leading-relaxed"
            >
              <p>
                At <strong className="text-white">Mech Strek</strong>, we craft modern, fast, and visually engaging websites that help businesses stand out online. Our focus is on clean design, seamless user experiences, and responsive development that works flawlessly across every device.
              </p>
              <p>
                Whether you're starting from scratch or refreshing an existing website, we turn ideas into digital experiences that leave a lasting impression.
              </p>
              <p>
                We believe that a website is more than just code and pixels—it is the digital storefront of your business. That's why we blend creativity with cutting-edge technology to ensure your brand not only looks exceptional but performs beautifully in today's competitive landscape.
              </p>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
