import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell, { Card, Section } from './PageShell';
import { clearJournal, encounteredOnly, journalStats, readJournal } from '../../services/commandJournal';

const RISK_DOT: Record<string, string> = {
  safe: 'bg-emerald-500',
  caution: 'bg-amber-500',
  destructive: 'bg-red-600',
};

const relative = (timestamp: number): string => {
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
};

/**
 * The record of commands you have looked up.
 *
 * Everything here is read from localStorage — no account, and nothing has left
 * the browser. It is the part of the app a chatbot cannot replicate: it knows
 * what you have already been told.
 */
const Journal: React.FC = () => {
  // Held as state rather than memoised: the journal lives in localStorage, so
  // a memo has no dependency that could tell it the data changed.
  const [journal, setJournal] = useState(readJournal);
  const [query, setQuery] = useState('');

  const stats = useMemo(() => journalStats(journal), [journal]);
  const unexplained = useMemo(() => encounteredOnly(journal), [journal]);

  const entries = useMemo(() => {
    const all = Object.values(journal.entries).sort((a, b) => b.lastSeen - a.lastSeen);
    const q = query.trim().toLowerCase();
    return q ? all.filter(e => e.command.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)) : all;
  }, [journal, query]);

  const isEmpty = Object.keys(journal.entries).length === 0 && unexplained.length === 0;

  return (
    <PageShell
      icon="📓"
      eyebrow="Your record"
      title="Command Journal"
      intro="Every command you have looked up, kept on this device. Explanations use it to stop re-teaching what you already know."
    >
      {isEmpty ? (
        <Card className="text-center py-20 space-y-8">
          <div className="text-6xl" aria-hidden="true">📓</div>
          <p className="text-stone-400 font-black text-[10px] uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Nothing here yet — look up a command and it will start building
          </p>
          <Link
            to="/commands"
            className="inline-block bg-stone-900 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all shadow-2xl"
          >
            Explain a command
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Commands', value: stats.commands },
              { label: 'Lookups', value: stats.lookups },
              { label: 'Flags explained', value: stats.flags },
            ].map(stat => (
              <Card key={stat.label} className="text-center !p-8">
                <div className="text-5xl font-black text-stone-900 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 mt-3">{stat.label}</div>
              </Card>
            ))}
          </div>

          {stats.stillLearning.length > 0 && (
            <Section title="Flags you keep checking">
              <p className="text-stone-400 font-medium text-sm -mt-4 leading-relaxed">
                Looked up three or more times. Same flag on a different command counts separately,
                because the meaning changes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.stillLearning.map(flag => (
                  <Card key={`${flag.base}::${flag.flag}`} className="!p-6 flex gap-5 items-start">
                    <code className="bg-amber-500 text-white font-mono font-black px-3 py-1.5 rounded-lg text-xs flex-shrink-0 whitespace-nowrap">
                      {flag.base} {flag.flag}
                    </code>
                    <div className="flex-1">
                      <p className="text-stone-500 font-medium text-sm leading-relaxed">{flag.meaning}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mt-2">
                        Checked {flag.explainedCount}×
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {unexplained.length > 0 && (
            <Section title="Met in guides, never explained">
              <p className="text-stone-400 font-medium text-sm -mt-4 leading-relaxed">
                Flags you have been shown while reading, but never looked up. These are
                deliberately not treated as known — being shown something is not the same
                as understanding it.
              </p>
              <div className="flex flex-wrap gap-3">
                {unexplained.slice(0, 24).map(flag => (
                  <Link
                    key={`${flag.base}::${flag.flag}`}
                    to={`/commands?command=${encodeURIComponent(`${flag.base} ${flag.flag}`)}&os=Linux`}
                    className="font-mono text-[11px] font-bold px-4 py-2 rounded-xl bg-white border-2 border-amber-100 text-stone-500 hover:border-amber-400 hover:text-stone-900 transition-all"
                  >
                    {flag.base} {flag.flag}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section title="Everything you've looked up">
            <label htmlFor="journal-search" className="sr-only">Search your journal</label>
            <input
              id="journal-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search your commands..."
              className="w-full h-16 bg-white rounded-[2rem] px-8 font-mono text-sm font-bold text-stone-900 shadow-sm border-2 border-amber-50 focus:ring-8 focus:ring-amber-100/50 outline-none transition-all"
            />

            <div className="space-y-3">
              {entries.map(entry => (
                <Link
                  key={`${entry.os}::${entry.command}`}
                  to={`/commands?command=${encodeURIComponent(entry.command)}&os=${entry.os}`}
                  className="block bg-white rounded-[2rem] p-6 border-4 border-amber-50/60 shadow-sm hover:border-amber-200 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RISK_DOT[entry.risk] ?? 'bg-stone-300'}`}
                      title={entry.risk}
                      aria-label={`Risk: ${entry.risk}`}
                    />
                    <code className="font-mono font-black text-stone-900 text-sm break-all">{entry.command}</code>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-auto whitespace-nowrap">
                      {entry.os} · {entry.count}× · {relative(entry.lastSeen)}
                    </span>
                  </div>
                  <p className="text-stone-400 font-medium text-sm mt-3 leading-relaxed">{entry.summary}</p>
                </Link>
              ))}
              {entries.length === 0 && (
                <Card className="text-center py-12">
                  <p className="text-stone-400 font-black text-[10px] uppercase tracking-widest">
                    Nothing matches &ldquo;{query}&rdquo;
                  </p>
                </Card>
              )}
            </div>
          </Section>

          <Card className="bg-stone-50 border-stone-100 flex flex-wrap items-center gap-6">
            <p className="text-stone-400 text-sm font-medium leading-relaxed flex-1 min-w-[240px]">
              Stored only in this browser. Clearing site data, or opening the site elsewhere,
              means starting fresh.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Delete your command journal? This cannot be undone.')) {
                  clearJournal();
                  setJournal(readJournal());
                }
              }}
              className="bg-white text-stone-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-stone-200 hover:border-red-300 hover:text-red-600 transition-all"
            >
              Clear journal
            </button>
          </Card>
        </>
      )}
    </PageShell>
  );
};

export default Journal;
