import { useCallback, useEffect, useRef, useState } from 'react';
import { generateStepImage } from '../../services/geminiService';
import { AIResponse } from '../../types';
import { usePreferences } from '../../services/preferences';

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

  // Abandon an in-flight request when the reader moves to another step.
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; };
  }, [activeStep, guideKey]);

  /**
   * Generation is explicit, never automatic.
   *
   * Illustrations have no free tier, so auto-generating one per viewed step
   * fired a request that could only fail — spending the rate-limit budget on
   * nothing. Most steps are also perfectly clear from the text, so an image is
   * worth paying for only when the reader says the text was not enough.
   */
  const generate = useCallback(async () => {
    const step = guide?.steps[activeStep];
    if (!step) return;

    setIsGenerating(true);
    setFailed(false);
    try {
      const url = await generateStepImage(appName, version, step.title, step.visualCue || '');
      if (cancelledRef.current) return;
      if (url) setImages(prev => ({ ...prev, [activeStep]: url }));
      else setFailed(true);
    } catch (err) {
      if (!cancelledRef.current) setFailed(true);
      console.error('Step image generation failed', err);
    } finally {
      if (!cancelledRef.current) setIsGenerating(false);
    }
  }, [guide, activeStep, appName, version]);

  const retry = useCallback(() => {
    setRetryCount(n => n + 1);
    generate();
  }, [generate]);

  // Opt-in via settings: someone with billing enabled may genuinely prefer the
  // picture to be there already. Off by default, because on a free key this
  // fires a request per step that can only fail.
  const { autoImages } = usePreferences();
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Fetching in response to the step changing is a genuine side effect; the
    // rule fires only because `generate` sets a loading flag before its await.
    if (!autoImages) return;
    if (images[activeStep] || isGenerating || failed) return;
    generate();
  }, [autoImages, activeStep, images, isGenerating, failed, generate]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    generate,
    /** True once an image exists or generation has been attempted for this step. */
    attempted: isGenerating || failed || !!images[activeStep] || retryCount > 0,
    imageUrl: images[activeStep],
    isGenerating,
    failed,
    retry,
    handleImageError,
  };
}
