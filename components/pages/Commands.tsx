import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { explainCommand, ApiError } from '../../services/geminiService';
import { CommandExplanation, CommandOS, CommandPart } from '../../types';
import PageShell, { Card, Section } from './PageShell';

const OS_OPTIONS: CommandOS[] = ['Linux', 'macOS', 'Windows'];

/** Starting points, so the page is useful before you know what to ask. */
const STARTERS: Record<CommandOS, string[]> = {
  Linux: ['rm -rf build', 'chmod -R 755 public', 'grep -rin "TODO" src', 'tar -xzvf archive.tar.gz', 'ps aux | grep node'],
  macOS: ['ls -lah', 'sudo chown -R $USER /usr/local', 'find . -name "*.log" -delete', 'brew install --cask docker'],
  Windows: ['dir /s /b', 'Get-ChildItem -Recurse -Filter *.log', 'del /f /q temp.txt', 'Remove-Item -Recurse -Force .\\dist'],
};

/** Each token kind gets its own colour so the shape of a command is scannable. */
const KIND_STYLES: Record<CommandPart['kind'], { chip: string; label: string }> = {
  command: { chip: 'bg-stone-900 text-white border-stone-900', label: 'Command' },
  subcommand: { chip: 'bg-stone-700 text-white border-stone-700', label: 'Subcommand' },
  flag: { chip: 'bg-amber-500 text-white border-amber-500', label: 'Flag' },
  value: { chip: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Value' },
  path: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Path' },
  operator: { chip: 'bg-stone-100 text-stone-600 border-stone-300', label: 'Operator' },
};

const RISK_STYLES = {
  safe: { badge: 'bg-emerald-500', label: 'Safe to run', icon: '✅' },
  caution: { badge: 'bg-amber-500', label: 'Use with care', icon: '⚠️' },
  destructive: { badge: 'bg-red-600', label: 'Destructive', icon: '🛑' },
} as const;

const Breakdown: React.FC<{ result: CommandExplanation }> = ({ result }) => {
  const risk = RISK_STYLES[result.risk] ?? RISK_STYLES.caution;

  return (
    <div className="space-y-10">
      <Card className="!p-0 overflow-hidden">
        <div className="bg-stone-950 p-8 flex flex-wrap items-center gap-5">
          <code className="font-mono text-amber-300 text-lg break-all flex-1 min-w-[200px]">
            {result.normalized}
          </code>
          <span className={`${risk.badge} text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap`}>
            {risk.icon} {risk.label}
          </span>
        </div>
        <div className="p-10 space-y-4">
          <p className="text-2xl font-black text-stone-900 tracking-tight leading-snug">{result.summary}</p>
          <p className="text-stone-500 font-medium leading-relaxed">{result.plainEnglish}</p>
          {result.riskNote && (
            <p className="text-sm font-bold text-red-700 bg-red-50 border-2 border-red-100 rounded-2xl p-5 leading-relaxed">
              {result.riskNote}
            </p>
          )}
        </div>
      </Card>

      {result.parts.length > 0 && (
        <Section title="What each part means">
          <div className="space-y-4">
            {result.parts.map((part, i) => {
              const style = KIND_STYLES[part.kind] ?? KIND_STYLES.value;
              return (
                <Card key={i} className="!p-6 flex flex-col sm:flex-row gap-6 items-start hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-3 sm:w-64 flex-shrink-0">
                    <code className={`${style.chip} border-2 font-mono font-black px-4 py-2 rounded-xl text-sm break-all`}>
                      {part.token}
                    </code>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{style.label}</span>
                  </div>
                  <p className="text-stone-600 font-medium leading-relaxed flex-1">{part.meaning}</p>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {result.commonFlags.length > 0 && (
        <Section title="Other flags you'll see with this">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.commonFlags.map((f, i) => (
              <Card key={i} className="!p-6 flex gap-5 items-start">
                <code className="bg-stone-900 text-amber-400 font-mono font-black px-3 py-1.5 rounded-lg text-xs flex-shrink-0">
                  {f.flag}
                </code>
                <p className="text-stone-500 font-medium text-sm leading-relaxed">{f.meaning}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {result.examples.length > 0 && (
        <Section title="Example uses">
          <div className="space-y-4">
            {result.examples.map((ex, i) => (
              <Card key={i} className="!p-0 overflow-hidden">
                <pre className="bg-stone-950 px-8 py-5 overflow-x-auto">
                  <code className="font-mono text-amber-300 text-sm">{ex.command}</code>
                </pre>
                <p className="px-8 py-5 text-stone-500 font-medium text-sm leading-relaxed">{ex.description}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {result.cautions && result.cautions.length > 0 && (
        <Section title="Before you run it">
          <Card className="border-red-100 bg-red-50/40">
            <ul className="space-y-4">
              {result.cautions.map((c, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="text-lg flex-shrink-0" aria-hidden="true">⚠️</span>
                  <span className="text-stone-700 font-medium text-sm leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </div>
  );
};

const Commands: React.FC = () => {
  // ?command= and ?os= let guide steps and chat answers deep-link straight to
  // an explanation, and make any explanation shareable.
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedCommand = searchParams.get('command') || '';
  const linkedOs = OS_OPTIONS.find(o => o === searchParams.get('os')) || 'Linux';

  const [os, setOs] = useState<CommandOS>(linkedOs);
  const [input, setInput] = useState(linkedCommand);
  const [result, setResult] = useState<CommandExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const run = useCallback(async (command: string, forOs: CommandOS) => {
    const trimmed = command.trim();
    if (!trimmed) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const explanation = await explainCommand(trimmed, forOs);
      if (requestId !== requestIdRef.current) return;
      setResult(explanation);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setResult(null);
      if (err instanceof ApiError && err.isUpstreamBusy) {
        setError('All AI models are busy right now — this is common on the free tier. Try again in a moment.');
      } else if (err instanceof ApiError && err.isUnavailable) {
        setError('The server has no API key configured, so commands cannot be explained yet.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not explain that command.');
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Mirror the URL into the form during render — the documented pattern for
  // reacting to an identity change without a cascading second render.
  const linkKey = `${linkedCommand}|${linkedOs}`;
  const [syncedLink, setSyncedLink] = useState(linkKey);
  if (linkKey !== syncedLink) {
    setSyncedLink(linkKey);
    setInput(linkedCommand);
    setOs(linkedOs);
  }

  // The lookup itself is a genuine side effect — fetching in response to the
  // URL naming a command — so it stays in an effect. The rule fires because
  // `run` sets a loading flag before its first await, which is exactly what a
  // fetch should do; suppressed here rather than contorting the data flow.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (linkedCommand) run(linkedCommand, linkedOs);
  }, [linkedCommand, linkedOs, run]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Writes to the URL; the effect above performs the lookup. */
  const submit = (command: string, forOs: CommandOS) => {
    const trimmed = command.trim();
    if (!trimmed) return;
    if (trimmed === linkedCommand && forOs === linkedOs) {
      run(trimmed, forOs); // Same URL — re-run directly.
      return;
    }
    setSearchParams({ command: trimmed, os: forOs });
  };

  return (
    <PageShell
      icon="⌨️"
      eyebrow="Resource Hub"
      title="Command Explainer"
      intro="Paste any terminal command and get a plain-English breakdown of every flag — because -r means recursive in one command and reverse in another."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {OS_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => { setOs(option); if (input.trim()) submit(input, option); }}
              aria-pressed={os === option}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                os === option ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-stone-400 border-2 border-amber-50 hover:border-amber-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <form
          onSubmit={e => { e.preventDefault(); submit(input, os); }}
          className="relative"
        >
          <label htmlFor="command-input" className="sr-only">Command to explain</label>
          <input
            id="command-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="e.g. rm -rf build"
            className="w-full h-24 bg-white rounded-[2.5rem] px-10 pr-44 font-mono text-xl font-bold text-stone-900 shadow-2xl border-2 border-amber-50 focus:ring-[12px] focus:ring-amber-100/50 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-4 top-4 bottom-4 px-10 bg-amber-500 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg hover:bg-stone-900 disabled:opacity-40 disabled:hover:bg-amber-500"
          >
            {loading ? 'Reading…' : 'Explain'}
          </button>
        </form>

        <div className="flex flex-wrap gap-3 justify-center">
          {STARTERS[os].map(sample => (
            <button
              key={sample}
              onClick={() => { setInput(sample); submit(sample, os); }}
              className="font-mono text-[11px] font-bold px-4 py-2 rounded-xl bg-white border-2 border-amber-50 text-stone-500 hover:border-amber-300 hover:text-stone-900 transition-all"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-8" role="status">
          <div className="relative">
            <div className="w-20 h-20 border-[6px] border-amber-50 rounded-full" />
            <div className="absolute top-0 w-20 h-20 border-[6px] border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 animate-pulse">
            Taking the command apart
          </p>
        </div>
      )}

      {error && !loading && (
        <Card className="text-center py-16 border-amber-200" >
          <div className="text-5xl mb-6" aria-hidden="true">⚠️</div>
          <p className="text-stone-600 font-bold leading-relaxed max-w-lg mx-auto" role="alert">{error}</p>
        </Card>
      )}

      {result && !loading && <Breakdown result={result} />}

      {!result && !loading && !error && (
        <Card className="text-center py-20">
          <div className="text-6xl mb-6" aria-hidden="true">🔍</div>
          <p className="text-stone-400 font-black text-[10px] uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Paste a command above, or pick one of the examples, to see what every part of it does
          </p>
        </Card>
      )}
    </PageShell>
  );
};

export default Commands;
