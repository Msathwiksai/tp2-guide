import React, { useEffect, useState } from 'react';
import PageShell, { Card, Section } from './PageShell';
import { getCapabilities } from '../../services/geminiService';
import {
  Preferences,
  resetPreferences,
  setPreference,
  usePreferences,
} from '../../services/preferences';

interface Choice {
  key: keyof Preferences;
  title: string;
  on: string;
  off: string;
  /** Shown when this deployment cannot honour the setting anyway. */
  unavailableNote?: string;
}

const CHOICES: Choice[] = [
  {
    key: 'autoImages',
    title: 'Step illustrations',
    on: 'Generate a picture for every step automatically, without being asked.',
    off: 'Only generate a picture when you ask for one. Costs nothing until you do.',
    unavailableNote: 'Image generation has no free tier, so this needs a billing-enabled key.',
  },
  {
    key: 'tailorByDefault',
    title: 'Tailor guides to your journal',
    on: 'New guides start tailored, skipping flags you have already had explained.',
    off: 'Guides start untailored. You can still tailor any guide from its sidebar.',
  },
  {
    key: 'trackEncounters',
    title: 'Record commands you read',
    on: 'Commands met while reading a guide are added to your journal as "seen".',
    off: 'Only commands you explicitly look up are recorded.',
  },
];

const Toggle: React.FC<{
  choice: Choice;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}> = ({ choice, value, disabled, onChange }) => (
  <Card className={`!p-8 ${disabled ? 'opacity-60' : ''}`}>
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex-1 min-w-[220px]">
        <h3 className="font-black text-xl text-stone-900 tracking-tight mb-2">{choice.title}</h3>
        <p className="text-stone-400 font-medium text-sm leading-relaxed">
          {value ? choice.on : choice.off}
        </p>
        {disabled && choice.unavailableNote && (
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-3 leading-relaxed">
            {choice.unavailableNote}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={choice.title}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`w-20 h-11 rounded-full flex-shrink-0 transition-all relative ${
          value ? 'bg-amber-500' : 'bg-stone-200'
        } ${disabled ? 'cursor-not-allowed' : 'hover:opacity-90'}`}
      >
        <span
          className={`absolute top-1 w-9 h-9 bg-white rounded-full shadow-md transition-all ${
            value ? 'left-10' : 'left-1'
          }`}
        />
      </button>
    </div>
  </Card>
);

/**
 * Preferences live here rather than being decided for the reader: what makes
 * sense on a free key (nothing expensive unless asked) is not what a
 * billing-enabled user would choose.
 */
const Settings: React.FC = () => {
  const prefs = usePreferences();
  const [imagesAvailable, setImagesAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCapabilities().then(caps => { if (!cancelled) setImagesAvailable(caps.images); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageShell
      icon="⚙️"
      eyebrow="Your setup"
      title="Settings"
      intro="How much the app does on its own. Defaults assume a free key, where anything billable stays off until you ask for it."
    >
      <Section title="Preferences">
        <div className="space-y-5">
          {CHOICES.map(choice => (
            <Toggle
              key={choice.key}
              choice={choice}
              value={prefs[choice.key]}
              disabled={choice.key === 'autoImages' && !imagesAvailable}
              onChange={value => setPreference(choice.key, value)}
            />
          ))}
        </div>
      </Section>

      <Card className="bg-stone-50 border-stone-100 flex flex-wrap items-center gap-6">
        <p className="text-stone-400 text-sm font-medium leading-relaxed flex-1 min-w-[240px]">
          Stored in this browser only, alongside your journal. Nothing here is sent anywhere.
        </p>
        <button
          onClick={resetPreferences}
          className="bg-white text-stone-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-stone-200 hover:border-amber-400 hover:text-stone-900 transition-all"
        >
          Reset to defaults
        </button>
      </Card>
    </PageShell>
  );
};

export default Settings;
