import React from 'react';
import { ExploringMode } from '../../types';

/**
 * The full-page states TutorialView can be in before (or instead of) showing a
 * guide. All presentational: they take callbacks and render, holding no state.
 */

const Shell: React.FC<{
  icon: string;
  title: string;
  children: React.ReactNode;
  alert?: boolean;
  tight?: boolean;
}> = ({ icon, title, children, alert, tight }) => (
  <div
    className={`max-w-3xl mx-auto ${tight ? 'py-32 space-y-10' : 'py-40 space-y-12'} text-center animate-in zoom-in-95 duration-700`}
    role={alert ? 'alert' : undefined}
  >
    <div className="text-8xl" aria-hidden="true">{icon}</div>
    <h1 className="text-6xl font-black text-stone-900 tracking-tighter">{title}</h1>
    {children}
  </div>
);

const primaryButton =
  'bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-stone-900 transition-all';
const secondaryButton =
  'bg-stone-100 text-stone-500 px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all border border-stone-200';

/** The key is valid; every model is overloaded upstream. */
export const ModelsBusy: React.FC<{ onRetry: () => void; onChooseAnother: () => void }> = ({
  onRetry,
  onChooseAnother,
}) => (
  <Shell icon="🌊" title="Models Are Busy" alert>
    <div className="text-xl text-stone-500 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-200 shadow-xl space-y-6">
      <p>Every available AI model reported <span className="text-amber-600 font-black">high demand</span> just now.</p>
      <p className="text-sm uppercase tracking-widest font-black text-stone-500">
        This is common on the free tier, where requests are deprioritised under load. Nothing is wrong with your setup — waiting a few seconds usually clears it.
      </p>
    </div>
    <div className="flex flex-wrap gap-6 justify-center">
      <button onClick={onRetry} className={primaryButton}>Retry Now</button>
      <button onClick={onChooseAnother} className={secondaryButton}>Choose Another Topic</button>
    </div>
  </Shell>
);

/** No GEMINI_API_KEY on the server, so nothing can be generated at all. */
export const ApiKeyRequired: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell icon="🔑" title="API Key Required" alert tight>
    <p className="text-xl text-stone-400 font-medium leading-relaxed">
      The server has no <code className="text-stone-900 font-black font-mono text-base">GEMINI_API_KEY</code>,
      so guides, images, and chat cannot be generated. This is a one-time setup step.
    </p>
    <div className="bg-stone-950 rounded-[3rem] p-10 text-left space-y-6 border-4 border-stone-800">
      <ol className="space-y-6">
        {[
          <>Get a key from <span className="text-amber-400 font-mono">aistudio.google.com/apikey</span></>,
          <div className="space-y-3 flex-1" key="env">
            <span className="text-white/70 font-medium text-sm leading-relaxed block">
              Create <span className="text-amber-400 font-mono">.env.local</span> in the project root:
            </span>
            <pre className="bg-black/50 rounded-xl p-4 text-amber-300 font-mono text-[11px] overflow-x-auto"><code>GEMINI_API_KEY=your_key_here</code></pre>
          </div>,
          <>Restart the dev server — <span className="text-amber-400 font-mono">npm run dev</span></>,
        ].map((content, i) => (
          <li key={i} className="flex gap-5 items-start">
            <span className="w-8 h-8 flex-shrink-0 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">
              {i + 1}
            </span>
            <span className="text-white/70 font-medium text-sm leading-relaxed">{content}</span>
          </li>
        ))}
      </ol>
    </div>
    <button onClick={onRetry} className={primaryButton}>I&apos;ve added the key — retry</button>
  </Shell>
);

/** Our own limiter or the provider's returned 429. */
export const RateLimited: React.FC<{ onRetry: () => void; onHome: () => void }> = ({ onRetry, onHome }) => (
  <Shell icon="⏳" title="Cooldown Required">
    <div className="text-2xl text-stone-400 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-200 shadow-xl">
      <p className="mb-6">The AI engine has hit its temporary <span className="text-amber-600 font-black">Rate Limit</span>.</p>
      <p className="text-sm uppercase tracking-widest font-black text-stone-500">
        This happens on the free tier when requests are too frequent. Please wait 60 seconds before trying again.
      </p>
    </div>
    <div className="flex gap-6 justify-center">
      <button onClick={onRetry} className={primaryButton}>Retry Now</button>
      <button onClick={onHome} className={secondaryButton}>Back to Home</button>
    </div>
  </Shell>
);

/** The named software could not be confirmed to exist. */
export const InvalidTarget: React.FC<{ target: string; reason: string; onHome: () => void }> = ({
  target,
  reason,
  onHome,
}) => (
  <Shell icon="🚫" title="Invalid Target">
    <p className="text-2xl text-stone-400 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-50">
      We could not verify <span className="text-stone-900 font-black">&ldquo;{target}&rdquo;</span> as a legitimate application.
      <br /><br />
      <span className="text-sm uppercase tracking-widest font-black text-amber-600">AI Logic: {reason}</span>
    </p>
    <button
      onClick={onHome}
      className="bg-stone-900 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-amber-500 transition-all"
    >
      Return to Library
    </button>
  </Shell>
);

/** Anything else that went wrong. Never render nothing — that reads as a broken page. */
export const GuideError: React.FC<{
  message: string;
  onRetry?: () => void;
  onChooseAnother: () => void;
}> = ({ message, onRetry, onChooseAnother }) => (
  <Shell icon="⚠️" title="Something Went Wrong" alert>
    <p className="text-xl text-stone-500 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-50">
      {message}
    </p>
    <div className="flex flex-wrap gap-6 justify-center">
      {onRetry && <button onClick={onRetry} className={primaryButton}>Try Again</button>}
      <button onClick={onChooseAnother} className={secondaryButton}>Choose Another Topic</button>
    </div>
  </Shell>
);

export const VerifyingTarget: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-60 gap-10 animate-in fade-in duration-500" role="status">
    <div className="relative">
      <div className="w-24 h-24 border-[8px] border-amber-50 rounded-full" />
      <div className="absolute top-0 w-24 h-24 border-[8px] border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="text-center">
      <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Reality Verification Engaged</h2>
      <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.4em] mt-3 animate-pulse">Scanning Software Database</p>
    </div>
  </div>
);

export const GeneratingGuide: React.FC<{ exploringMode: ExploringMode }> = ({ exploringMode }) => {
  const expert = exploringMode === ExploringMode.EXPERT;
  return (
    <div className="flex flex-col items-center justify-center py-52 gap-10" role="status">
      <div className="relative">
        <div className="w-32 h-32 border-[12px] border-amber-50 rounded-full" />
        <div className={`absolute top-0 w-32 h-32 border-[12px] border-t-transparent rounded-full animate-spin shadow-2xl ${expert ? 'border-amber-950' : 'border-amber-500'}`} />
      </div>
      <div className="text-center space-y-4">
        <p className="text-4xl font-black text-stone-900 tracking-tighter">Assembling Curriculum...</p>
        <p className={`font-black animate-pulse text-xs uppercase tracking-[0.4em] ${expert ? 'text-amber-600' : 'text-amber-500'}`}>
          Premium Intelligence Engaged
        </p>
      </div>
    </div>
  );
};
