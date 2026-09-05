import React, { useEffect, useState } from 'react';
import { CommandOS } from '../types';

/**
 * Copies a link back to this exact explanation.
 *
 * An explained command previously lived only in the browser that asked for it.
 * The question it answers — "is this safe to run?" — is one people ask each
 * other, so the answer needs to be sendable. The server renders the command and
 * its risk rating into the page's meta tags, so the pasted link previews as the
 * command itself rather than a generic page title.
 */
export function ShareCommand({ command, os }: { command: string; os: CommandOS }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Revert the confirmation on its own; a button stuck reading "Copied" tells
  // the reader nothing about whether a second press worked.
  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(timer);
  }, [state]);

  const url = `${window.location.origin}/commands?command=${encodeURIComponent(command)}&os=${encodeURIComponent(os)}`;

  const copy = async () => {
    try {
      // Only available over HTTPS and localhost, and blocked outright in some
      // privacy modes, so a failure here is expected rather than exceptional.
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-700 transition hover:border-amber-400 hover:text-amber-700"
      >
        {state === 'copied' ? '✓ Link copied' : state === 'failed' ? 'Press Ctrl+C' : '🔗 Copy link to this'}
      </button>
      {/* Shown only on failure, so someone whose browser blocks the clipboard
          can still select the URL by hand instead of losing the link. */}
      {state === 'failed' && (
        <input
          readOnly
          value={url}
          onFocus={event => event.currentTarget.select()}
          aria-label="Link to this explanation"
          className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-700"
        />
      )}
    </div>
  );
}
