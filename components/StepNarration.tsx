import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Spoken narration for a guide step, via the browser's built-in SpeechSynthesis.
 *
 * Deliberately not a server-side TTS call: this is free, instant, works offline,
 * and doesn't consume the Gemini rate-limit budget that the guide and image
 * endpoints already compete for.
 */

interface StepNarrationProps {
  title: string;
  description: string;
  tips?: string[];
  /** Changing this stops playback — used to cancel when the step changes. */
  stepKey: string | number;
}

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const StepNarration: React.FC<StepNarrationProps> = ({ title, description, tips, stepKey }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canSpeak] = useState(supported);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported()) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // Stop when the step changes or the component unmounts. speechSynthesis is a
  // global singleton, so without this the previous step keeps talking.
  useEffect(() => stop, [stepKey, stop]);

  const speak = () => {
    if (!canSpeak) return;

    const script = [
      title,
      description,
      ...(tips?.length ? ['Tips.', ...tips] : []),
    ].join('. ');

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (!supported()) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  if (!canSpeak) {
    return (
      <div className="flex items-center gap-4 px-8 py-5 bg-stone-50 rounded-[2rem] border-2 border-stone-100">
        <span className="text-2xl opacity-30">🔇</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
          Audio narration isn&apos;t supported in this browser
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 px-8 py-5 bg-amber-50/40 rounded-[2rem] border-2 border-amber-100">
      <span className="text-2xl" aria-hidden="true">🎧</span>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700 mr-auto">
        Listen to this step
      </p>

      {!isSpeaking ? (
        <button
          onClick={speak}
          className="flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all active:scale-95"
        >
          ▶ Play Explanation
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={togglePause}
            className="flex items-center gap-2 bg-white text-stone-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-amber-200 hover:border-amber-500 transition-all active:scale-95"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={stop}
            aria-label="Stop narration"
            className="bg-amber-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-900 transition-all active:scale-95"
          >
            ⏹ Stop
          </button>
        </div>
      )}
    </div>
  );
};

export default StepNarration;
