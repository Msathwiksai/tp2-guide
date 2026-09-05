import React from 'react';
import { AIResponse } from '../../types';

/**
 * Everything the generator produces that is not a step.
 *
 * All of this was already being generated, paid for in tokens and latency, and
 * then dropped: only `steps` ever reached the screen, so a guide read as a list
 * of instructions with no explanation of what the software is for or when you
 * would reach for it. Rendering it costs nothing extra per guide.
 *
 * Every section is conditional, because the honest answer for some software is
 * that a section does not apply — a protocol has no keyboard shortcuts, and
 * something shipped with the OS is not installed.
 */
export function GuideOrientation({ guide }: { guide: AIResponse }) {
  const whenToUse = guide.whenToUse?.filter(Boolean) ?? [];
  const shortcuts = guide.commonShortcuts?.filter(s => s?.key && s?.action) ?? [];
  const hasOrientation = guide.whatItIs || whenToUse.length > 0 || guide.howYouGetIt;

  if (!hasOrientation) return null;

  return (
    <section className="space-y-8">
      {/* A cached guide and a freshly generated one looked identical, so there
          was no way to tell whether opening one had spent anything. */}
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
        {guide.fromCache
          ? '⚡ Loaded from cache — no AI call, nothing spent'
          : '✨ Freshly generated'}
        {guide.sources?.length ? ` · checked against ${guide.sources.length} live pages` : ''}
      </p>
      {guide.whatItIs && (
        <div className="rounded-3xl border border-amber-200/70 bg-amber-50/60 p-8 dark:border-amber-500/20 dark:bg-amber-500/5">
          {/* Deliberately not "What <app> is": the text describes the topic
              within the app, so naming the app here misdescribed it. */}
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
            What this actually is
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-800 dark:text-slate-200">
            {guide.whatItIs}
          </p>
        </div>
      )}

      {whenToUse.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            When you would reach for it
          </h2>
          <ul className="mt-4 space-y-3">
            {whenToUse.map((use, i) => (
              <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{use}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guide.howYouGetIt && (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            How you get it
          </h2>
          <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">{guide.howYouGetIt}</p>
        </div>
      )}

      {shortcuts.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Shortcuts worth knowing
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 rounded-xl bg-slate-100/70 px-4 py-3 dark:bg-slate-800/50">
                <dt className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{shortcut.key}</dt>
                <dd className="text-right text-sm text-slate-600 dark:text-slate-400">{shortcut.action}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

/**
 * The pages this guide was grounded in.
 *
 * Shown because a generated guide asks the reader to trust it, and a list of
 * real pages they can check is the only honest basis for that. These URLs come
 * from the search itself, not from the model, so they are safe to link.
 */
export function GuideSources({ guide }: { guide: AIResponse }) {
  const sources = guide.sources?.filter(s => s?.url && s?.title) ?? [];
  if (sources.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 dark:border-slate-700 dark:bg-slate-900/40">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Checked against these pages
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Read while writing this guide. Verify anything destructive here first.
      </p>
      <ul className="mt-4 space-y-2">
        {sources.map((source, i) => (
          <li key={i}>
            <a
              href={source.url}
              target="_blank"
              // noreferrer as well as noopener: these are third-party pages the
              // reader did not choose, so they should not receive a referrer.
              rel="noopener noreferrer"
              className="text-sm text-amber-700 underline decoration-amber-300 underline-offset-4 hover:decoration-amber-600 dark:text-amber-400"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Checklist and FAQs, shown after the steps rather than before them. */
export function GuideWrapUp({ guide }: { guide: AIResponse }) {
  const checklist = guide.beginnerChecklist?.filter(Boolean) ?? [];
  const faqs = guide.faqs?.filter(f => f?.question && f?.answer) ?? [];
  if (checklist.length === 0 && faqs.length === 0) return null;

  return (
    <section className="space-y-8">
      {checklist.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Before you start
          </h2>
          <ul className="mt-4 space-y-3">
            {checklist.map((item, i) => (
              <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {faqs.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Questions people hit here
          </h2>
          <dl className="mt-4 space-y-5">
            {faqs.map((faq, i) => (
              <div key={i}>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">{faq.question}</dt>
                <dd className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
