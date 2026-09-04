import React, { useEffect, useRef, useState } from 'react';
import { pollStepVideo, startStepVideo, ApiError } from '../../services/geminiService';

interface Props {
  appName: string;
  stepTitle: string;
  description: string;
  /** Changing this abandons any in-flight job — used when the step changes. */
  stepKey: string;
}

const POLL_MS = 6000;
const MAX_POLLS = 60; // ~6 minutes, past which something is clearly wrong.

/**
 * Optional Veo clip for a step.
 *
 * Never automatic: generation is billable, has no free tier, and takes minutes,
 * so it happens only when someone explicitly asks for it. The result is
 * labelled as an illustration because Veo imagines an interface rather than
 * recording the real one — which matters in an app whose value is accuracy.
 */
const StepVideo: React.FC<Props> = ({ appName, stepTitle, description, stepKey }) => {
  const [status, setStatus] = useState<'idle' | 'working' | 'ready' | 'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // Abandon anything in flight when the step changes.
  const [activeKey, setActiveKey] = useState(stepKey);
  if (stepKey !== activeKey) {
    setActiveKey(stepKey);
    setStatus('idle');
    setVideoUrl(null);
    setError(null);
  }

  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; };
  }, [stepKey]);

  const generate = async () => {
    setStatus('working');
    setError(null);
    try {
      const jobId = await startStepVideo(appName, stepTitle, description);
      for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        await new Promise(resolve => setTimeout(resolve, POLL_MS));
        if (cancelledRef.current) return;
        const job = await pollStepVideo(jobId);
        if (job.status === 'ready' && job.videoUrl) {
          setVideoUrl(job.videoUrl);
          setStatus('ready');
          return;
        }
        if (job.status === 'failed') {
          setError(job.error || 'Video generation failed.');
          setStatus('failed');
          return;
        }
      }
      setError('Generation is taking unusually long. Try again later.');
      setStatus('failed');
    } catch (err) {
      if (cancelledRef.current) return;
      setError(
        err instanceof ApiError && err.status === 501
          ? 'Video generation is turned off on this server.'
          : err instanceof Error ? err.message : 'Video generation failed.',
      );
      setStatus('failed');
    }
  };

  if (status === 'ready' && videoUrl) {
    return (
      <div className="space-y-4">
        <video src={videoUrl} controls playsInline className="w-full rounded-[2rem] bg-stone-950" />
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
          AI-generated illustration — not a recording of the real interface
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-5 px-8 py-5 bg-stone-50 rounded-[2rem] border-2 border-stone-100">
      <span className="text-2xl" aria-hidden="true">🎬</span>
      <div className="mr-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">Video demo</p>
        {status === 'working' && (
          <p className="text-[10px] text-stone-400 font-bold mt-1">Generating — this takes a few minutes</p>
        )}
        {status === 'failed' && error && (
          <p className="text-[10px] text-red-600 font-bold mt-1" role="alert">{error}</p>
        )}
      </div>
      <button
        onClick={generate}
        disabled={status === 'working'}
        className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-40"
      >
        {status === 'working' ? 'Generating…' : status === 'failed' ? 'Try again' : 'Generate demo'}
      </button>
    </div>
  );
};

export default StepVideo;
