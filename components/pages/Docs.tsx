import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell, { Card, Section } from './PageShell';

const SECTIONS = [
  {
    id: 'start',
    icon: '🚀',
    title: 'Getting started',
    body: 'Search the library for the software you use, pick a version, then choose a topic. Tp2 Guide generates a step-by-step curriculum for that exact combination rather than a generic article.',
    steps: [
      'Type a product name in the search box on the home page.',
      'If it is not in the curated library, use “Create Guide” to synthesise one.',
      'Pick your exact version — instructions differ meaningfully between releases.',
      'Work through the modules; mark each one complete to track progress.',
    ],
  },
  {
    id: 'versions',
    icon: '🎯',
    title: 'Why versions matter',
    body: 'Menus move between releases. A guide that says “Preferences → Advanced” is wrong the moment the vendor reorganises settings. Selecting a version constrains generation to what that build actually shipped.',
  },
  {
    id: 'modes',
    icon: '💎',
    title: 'Standard vs Expert',
    body: 'Standard explains the golden path with the assumption you have not seen the interface before. Expert skips orientation and goes to configuration, automation, and the failure modes that only show up at scale.',
  },
  {
    id: 'audio',
    icon: '🎧',
    title: 'Audio narration',
    body: 'Every step can be read aloud using your browser’s built-in speech engine. It runs locally, works offline, and costs nothing — useful when you are following along in another window.',
  },
  {
    id: 'limits',
    icon: '⚠️',
    title: 'Limits and accuracy',
    body: 'Guides are generated, not hand-written. They are good at structure and orientation and can still be wrong about specific menu labels. Treat destructive steps — deleting data, editing a registry, changing permissions — as advice to verify, not instructions to run blindly.',
  },
];

const Docs: React.FC = () => {
  const [open, setOpen] = useState<string | null>('start');

  return (
    <PageShell
      icon="📖"
      eyebrow="Resource Hub"
      title="Documentation"
      intro="How Tp2 Guide generates instruction, what the controls do, and where the limits are."
    >
      <Section title="Guide">
        <div className="space-y-5">
          {SECTIONS.map(section => {
            const expanded = open === section.id;
            return (
              <Card key={section.id} className="!p-0 overflow-hidden">
                <h3>
                  <button
                    onClick={() => setOpen(expanded ? null : section.id)}
                    aria-expanded={expanded}
                    aria-controls={`panel-${section.id}`}
                    className="w-full flex items-center gap-6 p-8 text-left hover:bg-amber-50/40 transition-colors"
                  >
                    <span className="text-3xl" aria-hidden="true">{section.icon}</span>
                    <span className="font-black text-xl text-stone-900 tracking-tight flex-1">{section.title}</span>
                    <span className={`text-2xl text-amber-500 transition-transform ${expanded ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
                  </button>
                </h3>
                {expanded && (
                  <div id={`panel-${section.id}`} className="px-8 pb-10 pl-24 space-y-6">
                    <p className="text-stone-500 leading-relaxed font-medium">{section.body}</p>
                    {section.steps && (
                      <ol className="space-y-4">
                        {section.steps.map((step, i) => (
                          <li key={i} className="flex gap-5 items-start">
                            <span className="w-7 h-7 flex-shrink-0 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                              {i + 1}
                            </span>
                            <span className="text-stone-500 font-medium text-sm leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      <Card className="text-center space-y-8 bg-stone-900 border-stone-800">
        <h2 className="text-3xl font-black text-white tracking-tighter">Ready to start?</h2>
        <p className="text-amber-100/40 font-medium max-w-md mx-auto">
          Browse the curated library, or type any software name to synthesise a guide.
        </p>
        <Link
          to="/"
          className="inline-block bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-stone-900 transition-all shadow-2xl"
        >
          Open the Library
        </Link>
      </Card>
    </PageShell>
  );
};

export default Docs;
