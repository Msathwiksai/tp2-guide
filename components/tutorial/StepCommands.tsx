import React, { useEffect, useMemo, useState } from 'react';
import { CommandOS } from '../../types';
import { CommandChip } from '../CommandText';
import { familiarityForCommand, recordEncounter } from '../../services/commandJournal';

interface Props {
  commands: string[];
  os: CommandOS;
}

/**
 * The commands a step uses, annotated with what the reader already knows.
 *
 * Everything here is answered from the local journal — no requests. A flag you
 * have met before with this command is marked as known and not re-explained;
 * one you have not is called out. If the full explanation is already cached,
 * it can be read inline without leaving the step.
 */
const StepCommands: React.FC<Props> = ({ commands, os }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Read once per command list. The journal only changes when the reader
  // explains something elsewhere, so a fresh read on mount is enough.
  const familiarity = useMemo(
    () => Object.fromEntries(commands.map(c => [c, familiarityForCommand(os, c)])),
    [commands, os],
  );

  // Reading a step counts as meeting its commands — recorded after the
  // familiarity snapshot above, so this render still shows the prior state
  // rather than immediately marking everything as seen.
  useEffect(() => {
    recordEncounter(os, commands);
  }, [commands, os]);

  return (
    <div className="mb-10 bg-stone-950 rounded-[2rem] p-8 space-y-5">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
        Commands in this step
      </p>

      <ul className="space-y-5">
        {commands.map((command, i) => {
          const info = familiarity[command];
          const newFlags = info.flags.filter(f => !f.known);
          const knownFlags = info.flags.filter(f => f.known);
          const isOpen = expanded === command;

          return (
            <li key={i} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <CommandChip command={command} os={os} className="!text-sm !px-4 !py-2" />
                {info.seenCount > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    ✓ Explained before
                  </span>
                )}
              </div>

              {info.flags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pl-1">
                  {/* Three states, not two: met-but-never-explained is its own
                      thing, and must not be mistaken for understood. */}
                  {newFlags.map(f => (
                    <span
                      key={f.flag}
                      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        f.encountered ? 'bg-amber-500/25 text-amber-300' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {f.encountered ? `seen, not explained: ${f.flag}` : `new: ${f.flag}`}
                    </span>
                  ))}
                  {knownFlags.map(f => (
                    <span
                      key={f.flag}
                      title={f.meaning}
                      className="text-[9px] font-black uppercase tracking-widest bg-white/10 text-white/50 px-2.5 py-1 rounded-md"
                    >
                      ✓ {f.flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Cached explanations are readable inline: no navigation, no request. */}
              {info.explanation && (
                <div className="pl-1">
                  <button
                    onClick={() => setExpanded(isOpen ? null : command)}
                    aria-expanded={isOpen}
                    className="text-[9px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 underline decoration-dotted underline-offset-4"
                  >
                    {isOpen ? 'Hide your saved notes' : 'Read your saved notes'}
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-3 bg-white/5 rounded-2xl p-5">
                      <p className="text-white/70 text-sm font-medium leading-relaxed">
                        {info.explanation.plainEnglish}
                      </p>
                      <ul className="space-y-2">
                        {info.explanation.parts
                          .filter(p => p.kind === 'flag')
                          .map((p, k) => (
                            <li key={k} className="flex gap-3 items-start">
                              <code className="bg-amber-500 text-white font-mono font-black px-2 py-0.5 rounded text-[11px] flex-shrink-0">
                                {p.token}
                              </code>
                              <span className="text-white/50 text-xs leading-relaxed">{p.meaning}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[9px] font-black uppercase tracking-widest text-white/25">
        Tap a command for the full breakdown
      </p>
    </div>
  );
};

export default StepCommands;
