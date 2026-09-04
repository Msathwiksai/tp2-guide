import React from 'react';
import PageShell, { Card, Section } from './PageShell';

const TERMS = [
  {
    icon: '🤖',
    title: 'Guides are AI-generated',
    body: 'Every curriculum, illustration, and chat answer on this site is produced by a language model on request. Nothing here is reviewed by a human before you see it, and none of it is affiliated with or endorsed by the vendors whose software it describes.',
  },
  {
    icon: '🔍',
    title: 'Accuracy is not guaranteed',
    body: 'Generated instruction is reliable about structure and can be wrong about specifics — menu names, exact key combinations, and settings that moved between releases. Verify anything destructive against the vendor’s own documentation before running it.',
  },
  {
    icon: '🔐',
    title: 'What is sent and stored',
    body: 'The software name, topic, version, and any question you type are sent to Google’s Gemini API to generate a response. Requests are rate limited per IP address; those IP timestamps are held in memory only and expire within a minute. There are no accounts, no cookies, and no analytics on this site.',
  },
  {
    icon: '🖼️',
    title: 'Generated images',
    body: 'Step illustrations are generated on demand and cached in server memory for a short window so the page can display them. They are evicted automatically and are never written to disk or shared between users.',
  },
  {
    icon: '™️',
    title: 'Trademarks',
    body: 'Product names, logos, and brands are the property of their respective owners and are used here only to identify the software a guide describes. Their use does not imply any affiliation or endorsement.',
  },
  {
    icon: '⚖️',
    title: 'No warranty',
    body: 'This service is provided as-is, without warranty of any kind. You are responsible for what you run on your own systems. Do not rely on generated guidance for safety-critical, legal, medical, or financial decisions.',
  },
];

const Legal: React.FC = () => (
  <PageShell
    icon="⚖️"
    eyebrow="Concierge"
    title="Legal Terms"
    intro="What this service is, what it sends, and what it does not promise. Written to be read rather than skipped."
  >
    <Section title="Terms">
      <div className="space-y-5">
        {TERMS.map(term => (
          <Card key={term.title} className="flex gap-8 items-start">
            <span className="text-4xl flex-shrink-0" aria-hidden="true">{term.icon}</span>
            <div>
              <h3 className="font-black text-xl text-stone-900 mb-3 tracking-tight">{term.title}</h3>
              <p className="text-stone-400 leading-relaxed font-medium">{term.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>

    <Card className="bg-stone-50 border-stone-100 text-center">
      <p className="text-stone-400 text-sm font-medium leading-relaxed max-w-2xl mx-auto">
        This page describes how the software in this repository behaves. It is a plain-language summary written for
        clarity, not a substitute for legal advice — if you deploy this publicly, have a lawyer review your terms.
      </p>
    </Card>
  </PageShell>
);

export default Legal;
