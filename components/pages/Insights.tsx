import React, { useState } from 'react';
import PageShell, { Card, Section } from './PageShell';

interface Article {
  id: string;
  tag: string;
  title: string;
  standfirst: string;
  readingTime: string;
  body: string[];
}

const ARTICLES: Article[] = [
  {
    id: 'version-drift',
    tag: 'Method',
    title: 'Why version drift breaks most tutorials',
    standfirst: 'A tutorial goes wrong the moment a vendor moves a menu, and it is almost never the author’s fault.',
    readingTime: '4 min',
    body: [
      'A tutorial encodes two things: a concept and a path. The concept — what a layer mask is, what a container does — ages slowly. The path — “open Edit, then Preferences, then Performance” — ages the moment a vendor reorganises a menu.',
      'Most written guides fuse the two. They teach the concept through the path, so when the path breaks, the concept becomes unreachable for the reader who needed it most: the one who cannot yet infer where the setting moved.',
      'Version-aware generation separates them. The concept is stable and can be stated once. The path is regenerated against a specific release, so the instruction you read matches the build you actually have open.',
      'This is also why selecting your version is not a cosmetic filter. It is the input that determines whether the steps are real.',
    ],
  },
  {
    id: 'expert-mode',
    tag: 'Product',
    title: 'What “Expert” actually changes',
    standfirst: 'Not a longer guide. A different assumption about what you already know.',
    readingTime: '3 min',
    body: [
      'Standard mode assumes you have not seen the interface. It spends its budget on orientation: where things live, what the vocabulary means, what the golden path looks like when nothing goes wrong.',
      'Expert mode assumes orientation is wasted on you. It spends the same budget on configuration, automation, and failure modes — the things that only surface once you are using the tool under real load.',
      'The distinction matters because the failure modes are where most time is actually lost. Knowing where the preferences panel lives takes a minute to learn. Knowing which preference silently degrades performance at scale takes a week to discover.',
    ],
  },
  {
    id: 'verify',
    tag: 'Safety',
    title: 'Treat generated steps as a hypothesis',
    standfirst: 'Generated instruction is excellent at structure and unreliable about specifics. Use it accordingly.',
    readingTime: '3 min',
    body: [
      'Language models are strong at the shape of a task — the order of operations, what depends on what, which concepts you need first. They are weaker on exact labels, because labels are arbitrary facts rather than reasoning.',
      'In practice that means the sequence of steps is usually right and the menu name is sometimes wrong. For most tasks that is fine: you can find a renamed button. For destructive operations it is not.',
      'The rule worth adopting: anything that deletes data, edits a registry, alters permissions, or touches production gets verified against the vendor’s own documentation before you run it. Everything else, try it — undo is cheap and it teaches faster than reading.',
    ],
  },
];

const Insights: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = ARTICLES.find(a => a.id === openId) ?? null;

  if (open) {
    return (
      <PageShell icon="📝" eyebrow={open.tag} title={open.title} intro={open.standfirst}>
        <Card className="space-y-8 !p-12 md:!p-16">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">{open.readingTime} read</p>
          {open.body.map((para, i) => (
            <p key={i} className="text-lg text-stone-500 leading-relaxed font-medium">{para}</p>
          ))}
        </Card>
        <div className="text-center">
          <button
            onClick={() => setOpenId(null)}
            className="bg-stone-900 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all shadow-2xl"
          >
            ← All insights
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      icon="💡"
      eyebrow="Resource Hub"
      title="Insights"
      intro="Short pieces on why software instruction goes stale, and how to read generated guidance well."
    >
      <Section title="Latest">
        <div className="space-y-6">
          {ARTICLES.map(article => (
            <button
              key={article.id}
              onClick={() => setOpenId(article.id)}
              className="w-full text-left bg-white rounded-[3rem] p-10 md:p-12 border-4 border-amber-50/60 shadow-sm hover:border-amber-200 hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                  {article.tag}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">{article.readingTime} read</span>
              </div>
              <h3 className="text-3xl font-black text-stone-900 mb-4 tracking-tighter leading-tight group-hover:text-amber-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-stone-400 leading-relaxed font-medium">{article.standfirst}</p>
            </button>
          ))}
        </div>
      </Section>
    </PageShell>
  );
};

export default Insights;
