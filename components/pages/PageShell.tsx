import React from 'react';
import PageMeta from '../PageMeta';

/** Shared frame for the standalone content pages, so they share one rhythm. */
const PageShell: React.FC<{
  icon: string;
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}> = ({ icon, eyebrow, title, intro, children }) => (
  <div className="max-w-5xl mx-auto space-y-20 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
    {/* Every content page gets its own title/description for search and shares. */}
    <PageMeta title={title} description={intro} />
    <header className="text-center space-y-8">
      <div className="w-28 h-28 rounded-[3rem] bg-white mx-auto flex items-center justify-center text-6xl shadow-[0_25px_60px_-15px_rgba(245,158,11,0.3)] border-8 border-amber-50">
        <span aria-hidden="true">{icon}</span>
      </div>
      <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em]">{eyebrow}</p>
      <h1 className="text-6xl md:text-7xl font-black text-stone-900 tracking-tighter leading-none">{title}</h1>
      <p className="text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed font-medium">{intro}</p>
    </header>
    {children}
  </div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-10">
    <div className="flex items-center gap-8">
      <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tighter whitespace-nowrap">{title}</h2>
      <div className="h-[2px] flex-1 bg-amber-100/60" />
    </div>
    {children}
  </section>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[3rem] p-10 border-4 border-amber-50/60 shadow-sm ${className}`}>{children}</div>
);

export default PageShell;
