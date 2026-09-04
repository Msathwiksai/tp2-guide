import React from 'react';
import { Link } from 'react-router-dom';
import PageShell, { Card, Section } from './PageShell';

interface CommunityProps {
  onAskDoubt: (question: string) => void;
}

type Channel = { icon: string; title: string; body: string; to?: string; action?: 'mentor' };

const CHANNELS: Channel[] = [
  { icon: '💬', title: 'Ask the AI mentor', body: 'The fastest answer available right now. Context-aware, available on every page, and it knows which guide you are reading.', action: 'mentor' },
  { icon: '📚', title: 'Browse the library', body: 'Curated guides across operating systems, creative tools, developer tooling, and more — each one version-aware.', to: '/' },
  { icon: '📖', title: 'Read the docs', body: 'How generation works, what Standard and Expert change, and where generated instruction can be wrong.', to: '/docs' },
  { icon: '⚡', title: 'Universal shortcuts', body: 'The keystrokes and habits that carry across nearly every application you will open.', to: '/tips' },
];

const GUIDELINES = [
  { title: 'Verify destructive steps', body: 'Guides are generated. Before deleting data, editing a registry, or changing permissions, confirm against the vendor’s own documentation.' },
  { title: 'Share the version', body: 'Menus move between releases. “Settings moved” is far more useful phrased as “in 4.2 this lives under Edit → Preferences”.' },
  { title: 'Report what was wrong', body: 'If a step does not match your build, tell the mentor which step and which version. That context is what makes the correction useful.' },
];

const Community: React.FC<CommunityProps> = ({ onAskDoubt }) => (
  <PageShell
    icon="🤝"
    eyebrow="Concierge"
    title="Community"
    intro="Where to get help, how to ask well, and the ground rules that keep generated guidance trustworthy."
  >
    <Section title="Get help">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CHANNELS.map(channel => {
          const inner = (
            <>
              <div className="text-4xl mb-6" aria-hidden="true">{channel.icon}</div>
              <h3 className="font-black text-xl text-stone-900 mb-4 tracking-tight">{channel.title}</h3>
              <p className="text-stone-400 leading-relaxed font-medium text-sm">{channel.body}</p>
            </>
          );
          const className =
            'block text-left bg-white rounded-[3rem] p-10 border-4 border-amber-50/60 shadow-sm hover:border-amber-200 hover:-translate-y-1 transition-all w-full';

          return channel.action === 'mentor' ? (
            <button
              key={channel.title}
              onClick={() => onAskDoubt('I would like help getting started with Tp2 Guide.')}
              className={className}
            >
              {inner}
            </button>
          ) : (
            <Link key={channel.title} to={channel.to!} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </Section>

    <Section title="Asking well">
      <div className="space-y-5">
        {GUIDELINES.map((rule, i) => (
          <Card key={rule.title} className="flex gap-8 items-start">
            <span className="w-12 h-12 flex-shrink-0 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-black text-lg text-stone-900 mb-3 tracking-tight">{rule.title}</h3>
              <p className="text-stone-400 leading-relaxed font-medium text-sm">{rule.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>

    <Card className="bg-amber-950 border-amber-900 text-center space-y-8">
      <div className="text-5xl" aria-hidden="true">✋</div>
      <h2 className="text-3xl font-black text-white tracking-tighter">Found something wrong?</h2>
      <p className="text-amber-100/40 font-medium max-w-lg mx-auto leading-relaxed">
        Generated guides drift as software updates. Telling the mentor exactly which step and version failed is the
        single most useful thing you can do.
      </p>
      <button
        onClick={() => onAskDoubt('I found a step in a guide that does not match my version. Here is what happened: ')}
        className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-stone-900 transition-all shadow-2xl"
      >
        Report an inaccuracy
      </button>
    </Card>
  </PageShell>
);

export default Community;
