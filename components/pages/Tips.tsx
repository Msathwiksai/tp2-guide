import React, { useMemo, useState } from 'react';
import { GLOBAL_BASICS } from '../../constants';
import PageShell, { Card, Section } from './PageShell';

const WORKFLOW_TIPS = [
  { icon: '⌨️', title: 'Learn the command palette first', body: 'Most modern apps hide one behind Ctrl/Cmd + K or Ctrl + Shift + P. It is usually faster than any menu and it teaches you the app’s vocabulary as you type.' },
  { icon: '🪟', title: 'Snap windows instead of dragging', body: 'Win + Arrow on Windows, or Control + Arrow with Rectangle-style tools on macOS. Two keystrokes replace a whole minute of mouse fiddling.' },
  { icon: '🔍', title: 'Search, don’t navigate', body: 'Jumping to a file through the OS launcher (Win key, or Cmd + Space) beats clicking through folders almost every time.' },
  { icon: '↩️', title: 'Trust undo, then verify', body: 'Undo is the cheapest way to learn an unfamiliar feature. Try the scary button, look at what changed, undo it.' },
  { icon: '📋', title: 'Use clipboard history', body: 'Win + V on Windows keeps your last several copies. It removes the constant tab-switching that copying one item at a time forces.' },
  { icon: '🧭', title: 'Rename before you organise', body: 'Consistent file names make folders almost unnecessary, and they survive being moved between machines and tools.' },
];

const CATEGORIES = ['All', 'Universal Shortcuts', 'Workflow Habits'] as const;

const Tips: React.FC = () => {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>('All');

  const shortcuts = useMemo(
    () => GLOBAL_BASICS.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.keys.toLowerCase().includes(query.toLowerCase())
    ),
    [query],
  );

  const habits = useMemo(
    () => WORKFLOW_TIPS.filter(tip =>
      tip.title.toLowerCase().includes(query.toLowerCase()) ||
      tip.body.toLowerCase().includes(query.toLowerCase())
    ),
    [query],
  );

  const showShortcuts = tab === 'All' || tab === 'Universal Shortcuts';
  const showHabits = tab === 'All' || tab === 'Workflow Habits';
  const nothingFound = (!showShortcuts || !shortcuts.length) && (!showHabits || !habits.length);

  return (
    <PageShell
      icon="⚡"
      eyebrow="Mastery Shortcuts"
      title="Tips"
      intro="The small set of habits and keystrokes that transfer across almost every application you will ever open."
    >
      <div className="space-y-8">
        <label htmlFor="tips-search" className="sr-only">Search tips</label>
        <input
          id="tips-search"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tips and shortcuts..."
          className="w-full h-20 bg-white rounded-[2.5rem] px-10 text-xl font-bold text-stone-900 shadow-sm border-2 border-amber-50 focus:ring-8 focus:ring-amber-100/50 focus:border-amber-200 outline-none transition-all"
        />
        <div className="flex flex-wrap gap-3 justify-center">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setTab(c)}
              aria-pressed={tab === c}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                tab === c ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-stone-400 border-2 border-amber-50 hover:border-amber-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {showShortcuts && shortcuts.length > 0 && (
        <Section title="Universal Shortcuts">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortcuts.map(item => (
              <Card key={item.title} className="hover:border-amber-200 transition-colors">
                <div className="text-4xl mb-5" aria-hidden="true">{item.icon}</div>
                <div className="font-black text-lg text-stone-900 mb-3">{item.title}</div>
                <code className="text-amber-600 font-black font-mono text-[11px] px-3 py-1.5 bg-amber-50/60 rounded-lg inline-block border border-amber-100">
                  {item.keys}
                </code>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {showHabits && habits.length > 0 && (
        <Section title="Workflow Habits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {habits.map(tip => (
              <Card key={tip.title} className="hover:border-amber-200 transition-colors">
                <div className="text-4xl mb-5" aria-hidden="true">{tip.icon}</div>
                <h3 className="font-black text-xl text-stone-900 mb-4 tracking-tight">{tip.title}</h3>
                <p className="text-stone-400 leading-relaxed font-medium text-sm">{tip.body}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {nothingFound && (
        <Card className="text-center py-20">
          <div className="text-6xl mb-6" aria-hidden="true">🔍</div>
          <p className="text-stone-400 font-black text-[10px] uppercase tracking-widest">
            No tips match &ldquo;{query}&rdquo;
          </p>
        </Card>
      )}
    </PageShell>
  );
};

export default Tips;
