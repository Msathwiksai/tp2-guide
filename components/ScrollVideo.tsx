import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';

const ScrollVideo: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [80, -80]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [1, 1, 1] : [0.94, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.25, 1, 1, 0.25]);

  return (
    <section ref={sectionRef} className="relative min-h-[70vh] overflow-hidden rounded-[3rem] bg-stone-950 shadow-2xl" aria-label="AI learning experience">
      <motion.video style={{ y, scale, opacity }} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/media/robot-using-laptop.mp4" type="video/mp4" />
      </motion.video>
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/50 to-transparent" />
      <motion.div className="relative z-10 flex min-h-[70vh] max-w-2xl flex-col justify-center p-8 text-white md:p-16" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.6 }}>
        <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-amber-400">Scroll to explore</p>
        <h2 className="text-4xl font-black tracking-tighter sm:text-6xl">Learning that moves at your pace.</h2>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-xl">Explore clear, version-aware guides while the interface responds fluidly to how you move through the library.</p>
      </motion.div>
    </section>
  );
};

export default ScrollVideo;
