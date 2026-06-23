import Hero from '@/components/sections/Hero';
import WhyUs from '@/components/sections/WhyUs';
import Services from '@/components/sections/Services';
import Portfolio from '@/components/sections/Portfolio';
import Process from '@/components/sections/Process';
import Testimonials from '@/components/sections/Testimonials';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <WhyUs />
      <Services />
      <Portfolio />
      <Process />
      <Testimonials />
      <FAQ />
      <Contact />
    </>
  );
}
