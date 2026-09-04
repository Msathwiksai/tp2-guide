import React from 'react';
import { Link } from 'react-router-dom';
import { CommandOS } from '../types';
import { isLikelyCommand } from './commandDetection';

/**
 * Renders text containing `backticked` spans, turning anything that looks like
 * a shell command into a link to the Command Explainer.
 *
 * The point is that a beginner meets `chmod -R 755 public` mid-guide and has no
 * idea what -R does there; linking it means they never have to leave the step
 * to find out.
 */

const codeClass =
  'bg-stone-900 text-amber-400 px-2 py-0.5 rounded-lg font-mono text-[0.85em] border border-stone-800 font-bold';

export const CommandChip: React.FC<{ command: string; os: CommandOS; className?: string }> = ({
  command,
  os,
  className = '',
}) => (
  <Link
    to={`/commands?command=${encodeURIComponent(command)}&os=${os}`}
    title={`Explain: ${command}`}
    className={`${codeClass} ${className} inline-flex items-center gap-1.5 underline decoration-amber-500/40 decoration-dotted underline-offset-4 hover:bg-amber-500 hover:text-white hover:decoration-white transition-colors`}
  >
    {command}
    <span className="text-[0.7em] opacity-60" aria-hidden="true">↗</span>
    <span className="sr-only">(explain this command)</span>
  </Link>
);

/**
 * Splits on backticks and **bold**, linking command-like code spans.
 * Everything else renders as plain text.
 */
const CommandText: React.FC<{ text: string; os: CommandOS; className?: string }> = ({
  text,
  os,
  className = '',
}) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          const inner = part.slice(1, -1);
          return isLikelyCommand(inner)
            ? <CommandChip key={i} command={inner} os={os} />
            : <code key={i} className={codeClass}>{inner}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={i} className="font-black text-stone-900">{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default CommandText;
