import { useCallback, useEffect, useRef, useState } from 'react';
import { generateStepImage } from '../../services/geminiService';
import { AIResponse } from '../../types';

interface Options {
  guide: AIResponse | null;
  activeStep: number;
  appName: string;
  version: string;
  /** Identifies the current guide; changing it discards images from the last one. */
  guideKey: string | null;
}

/**
 * Generates an illustration for the active step, one request per step.
 *
 * Which steps have been requested is tracked in a ref rather than derived from
 * the image state, because this hook writes that state — depending on it would
 * either loop or read a stale value.
 */
export function useStepImage({ guide, activeStep, appName, version, guideKey }: Options) {
  const [images, setImages] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const requestedRef = useRef<Set<string>>(new Set());

  // Discard the previous guide's images when the guide identity changes,
  // otherwise step 0 of a new guide briefly shows the old guide's picture.
  // The requested-set is deliberately NOT cleared here: refs must not be
  // touched during render, and it does not need clearing because every request
  // key is already namespaced by guideKey, so old entries can never collide.
  const [loadedKey, setLoadedKey] = useState<string | null>(guideKey);
  if (guideKey !== loadedKey) {
    setLoadedKey(guideKey);
    setImages({});
    setFailed(false);
  }

  useEffect(() => {
    const step = guide?.steps[activeStep];
    if (!step) return;

    const requestKey = `${guideKey}:${activeStep}:${retryCount}`;
    if (requestedRef.current.has(requestKey)) return;
    requestedRef.current.add(requestKey);

    let cancelled = false;
    (async () => {
      setIsGenerating(true);
      setFailed(false);
      try {
        const url = await generateStepImage(appName, version, step.title, step.visualCue || '');
        if (cancelled) return;
        if (url) setImages(prev => ({ ...prev, [activeStep]: url }));
        else setFailed(true);
      } catch (err) {
        if (!cancelled) setFailed(true);
        console.error('Step image generation failed', err);
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [guide, activeStep, appName, version, guideKey, retryCount]);

  const retry = useCallback(() => setRetryCount(n => n + 1), []);

  /** The server cache is in memory, so a restart makes issued URLs 404. */
  const handleImageError = useCallback((index: number) => {
    setImages(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setFailed(true);
  }, []);

  return {
    imageUrl: images[activeStep],
    isGenerating,
    failed,
    retry,
    handleImageError,
  };
}
