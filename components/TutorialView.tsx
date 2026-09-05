import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GuideOrientation, GuideWrapUp } from './tutorial/GuideOrientation';
import { TUTORIALS } from '../constants';
import { saveApp, useSavedApps, toTutorial } from '../services/library';
import { getGuideContent, verifyApplicationExistence, getCapabilities, ApiError } from '../services/geminiService';
import { AIResponse, Tutorial, ExploringMode, Category } from '../types';
import PageMeta from './PageMeta';
import { osForTutorial } from './commandDetection';
import { knownFlagSummary } from '../services/commandJournal';
import { usePreferences } from '../services/preferences';
import TopicPicker from './tutorial/TopicPicker';
import GuideSidebar from './tutorial/GuideSidebar';
import StepPanel from './tutorial/StepPanel';
import DoubtHub from './tutorial/DoubtHub';
import { useTutorialProgress } from './tutorial/useTutorialProgress';
import { useStepImage } from './tutorial/useStepImage';
import {
  ApiKeyRequired,
  GeneratingGuide,
  GuideError,
  InvalidTarget,
  ModelsBusy,
  RateLimited,
  VerifyingTarget,
} from './tutorial/StatusScreens';

interface TutorialViewProps {
  onAskDoubt: (question: string, topic?: string) => void;
}

/**
 * Container for one application's guides.
 *
 * The URL is the source of truth for which guide is being read: topic, version
 * and mode are query parameters, so a guide can be linked, bookmarked and
 * reloaded. Previously they were component state, which meant a refresh dropped
 * you back on the topic picker and no guide could be shared.
 *
 * Fetching is driven by a single effect watching those parameters, rather than
 * three call sites each remembering to re-fetch.
 */
const TutorialView: React.FC<TutorialViewProps> = ({ onAskDoubt }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const safeId = useMemo(() => {
    try { return decodeURIComponent(id || ''); }
    catch { return null; }
  }, [id]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  // A missing GEMINI_API_KEY used to surface as a generic "Request failed",
  // which gives no hint that the fix is a one-line config file.
  const [setupNeeded, setSetupNeeded] = useState(false);
  // Distinct from setupNeeded: the key works, every model is just overloaded.
  const [busyError, setBusyError] = useState(false);
  const [customAppInfo, setCustomAppInfo] = useState<{ name: string; exists: boolean } | null>(null);
  const savedApps = useSavedApps();

  const tutorial = useMemo(() => {
    const staticTut = TUTORIALS.find(t => t.id === id);
    if (staticTut) return staticTut;

    // A previously synthesised app carries its real category, versions and
    // icon, so reopening one does not fall back to the generic placeholder.
    const saved = savedApps.find(app => app.id === id);
    if (saved) return toTutorial(saved);

    return {
      id: id || 'custom',
      name: customAppInfo?.name || safeId || 'Custom Software',
      category: Category.PRODUCTIVITY,
      description: `AI-Synthesized guide for ${customAppInfo?.name || safeId || 'your custom application'}.`,
      icon: '⚙️',
      color: 'bg-stone-900',
      popularTopics: ['Installation Guide', 'Interface Basics', 'Updating Procedures'],
      advancedTopics: ['Technical Configuration', 'Performance Tuning'],
      versions: ['Current'],
    } as Tutorial;
  }, [id, safeId, customAppInfo, savedApps]);

  // --- URL-derived state -----------------------------------------------------
  const selectedTopic = searchParams.get('topic');
  // Validated against the tutorial's own versions, so a hand-edited or stale
  // link cannot generate a macOS guide for "Windows 11".
  const versionParam = searchParams.get('version');
  const selectedVersion =
    versionParam && tutorial.versions.includes(versionParam)
      ? versionParam
      : tutorial.versions[0] || '';
  const exploringMode =
    searchParams.get('mode') === ExploringMode.EXPERT ? ExploringMode.EXPERT : ExploringMode.STANDARD;
  // Opt-in, and in the URL so a tailored guide is still linkable.
  const prefs = usePreferences();
  // The URL wins when it says either way; the preference only sets the default.
  const tailorParam = searchParams.get('tailored');
  const tailored = tailorParam === null ? prefs.tailorByDefault : tailorParam === '1';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<AIResponse | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [customDoubt, setCustomDoubt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // Bumped to re-run the fetch when the URL has not changed (a retry).
  const [retryNonce, setRetryNonce] = useState(0);
  // Asked once: the video button is hidden unless the server can actually do it.
  const [videoEnabled, setVideoEnabled] = useState(false);

  const guideRequestIdRef = useRef(0);

  const guideKey = selectedTopic
    ? `tp2:progress:${id}:${selectedTopic}:${selectedVersion}:${exploringMode}`
    : null;

  const { completedSteps, toggleStep } = useTutorialProgress(guideKey);
  const stepImage = useStepImage({
    guide,
    activeStep,
    appName: tutorial?.name || '',
    version: selectedVersion,
    guideKey,
  });

  /** Writes guide selection to the URL; the fetch effect reacts to it. */
  const updateGuideParams = useCallback(
    (next: { topic?: string | null; version?: string; mode?: ExploringMode }) => {
      setSearchParams(
        prev => {
          const params = new URLSearchParams(prev);
          if ('topic' in next) {
            if (next.topic) params.set('topic', next.topic);
            else params.delete('topic');
          }
          if (next.version) params.set('version', next.version);
          if (next.mode) params.set('mode', next.mode);
          return params;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    getCapabilities().then(caps => { if (!cancelled) setVideoEnabled(caps.video); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const isStatic = TUTORIALS.some(t => t.id === id);
    if (!isStatic && safeId) {
      let cancelled = false;
      const checkRealism = async () => {
        try {
          setIsVerifying(true);
          setVerificationError(null);
          setQuotaError(false);
          const result = await verifyApplicationExistence(safeId);
          if (!cancelled && result.exists) {
            const name = result.correctedName || safeId;
            setCustomAppInfo({ name, exists: true });
            // Recorded here rather than after generation: verification is the
            // call that established the app is real, and its category is what
            // the library needs. Without this the app vanished with the URL and
            // the same calls were paid for again on the next visit.
            saveApp({
              id: id || safeId,
              name,
              category: (result.category as Category) || Category.PRODUCTIVITY,
              icon: result.icon || '⚙️',
              versions: result.versions?.length ? result.versions : ['Current'],
            });
          } else if (!cancelled) {
            setVerificationError(result.reason || 'The target software could not be verified.');
          }
        } catch (err) {
          if (cancelled) return;
          if (err instanceof ApiError && err.isUnavailable) setSetupNeeded(true);
          else if (err instanceof ApiError && err.isUpstreamBusy) setBusyError(true);
          else if (err instanceof ApiError && err.isRateLimited) setQuotaError(true);
          else setError(err instanceof Error ? err.message : 'Verification failed.');
        } finally {
          if (!cancelled) setIsVerifying(false);
        }
      };
      checkRealism();
      return () => { cancelled = true; };
    }
  }, [id, safeId]);

  // Single fetch path: whenever the URL names a guide, load it.
  useEffect(() => {
    if (!selectedTopic || verificationError || isVerifying) return;

    const requestId = ++guideRequestIdRef.current;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setQuotaError(false);
        setBusyError(false);
        const content = await getGuideContent(
          tutorial.name,
          selectedTopic,
          selectedVersion,
          exploringMode,
          tailored ? { known: knownFlagSummary() } : undefined,
        );
        // Guards against an earlier, slower request overwriting a newer one.
        if (cancelled || requestId !== guideRequestIdRef.current) return;
        setGuide(content);
        setActiveStep(0);
      } catch (err) {
        if (cancelled || requestId !== guideRequestIdRef.current) return;
        if (err instanceof ApiError && err.isUnavailable) setSetupNeeded(true);
        else if (err instanceof ApiError && err.isUpstreamBusy) setBusyError(true);
        else if (err instanceof ApiError && err.isRateLimited) setQuotaError(true);
        else setError(err instanceof Error ? err.message : 'Failed to load topic details. Please try again.');
      } finally {
        if (!cancelled && requestId === guideRequestIdRef.current) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTopic, selectedVersion, exploringMode, tailored, tutorial.name, verificationError, isVerifying, retryNonce]);

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    updateGuideParams({ version: e.target.value });

  const toggleTailoring = () => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      // Written explicitly either way, so a toggle always overrides the default.
      params.set('tailored', tailored ? '0' : '1');
      return params;
    });
  };

  const toggleExploringMode = () =>
    updateGuideParams({
      mode: exploringMode === ExploringMode.STANDARD ? ExploringMode.EXPERT : ExploringMode.STANDARD,
    });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      updateGuideParams({ topic: searchQuery.trim(), version: selectedVersion, mode: exploringMode });
      setSearchQuery('');
    }
  };

  const handleDoubtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDoubt.trim()) return;
    // The topic travels as context, not inside the question text.
    onAskDoubt(customDoubt, selectedTopic ?? undefined);
    setCustomDoubt('');
  };

  const retryCurrentTopic = () => setRetryNonce(n => n + 1);
  const backToTopics = () => {
    setGuide(null);
    updateGuideParams({ topic: null });
  };

  // Ordered by specificity: the most actionable diagnosis wins.
  if (busyError) {
    return <ModelsBusy onRetry={() => { setBusyError(false); retryCurrentTopic(); }} onChooseAnother={() => { setBusyError(false); backToTopics(); }} />;
  }
  if (setupNeeded) {
    return <ApiKeyRequired onRetry={() => { setSetupNeeded(false); retryCurrentTopic(); }} />;
  }
  if (quotaError) {
    return <RateLimited onRetry={() => { setQuotaError(false); retryCurrentTopic(); }} onHome={() => navigate('/')} />;
  }
  if (isVerifying) {
    return <VerifyingTarget />;
  }
  if (verificationError) {
    return <InvalidTarget target={safeId || 'this application'} reason={verificationError} onHome={() => navigate('/')} />;
  }
  if (error) {
    return (
      <GuideError
        message={error}
        onRetry={selectedTopic ? retryCurrentTopic : undefined}
        onChooseAnother={() => { setError(null); backToTopics(); }}
      />
    );
  }

  if (!selectedTopic) {
    return (
      <TopicPicker
        tutorial={tutorial}
        selectedVersion={selectedVersion}
        exploringMode={exploringMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onVersionChange={handleVersionChange}
        onToggleMode={toggleExploringMode}
        onSelectTopic={topic => updateGuideParams({ topic, version: selectedVersion, mode: exploringMode })}
        onBackHome={() => navigate('/')}
      />
    );
  }

  if (loading || !guide) return <GeneratingGuide exploringMode={exploringMode} />;

  const currentStep = guide.steps[activeStep];
  if (!currentStep) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-16 pb-40 animate-in slide-in-from-bottom-12 duration-700">
      {/* "<topic> in <app> <version>" is close to what someone would actually
          type into a search engine. */}
      <PageMeta
        title={`${selectedTopic} in ${tutorial.name} ${selectedVersion}`}
        description={guide.overview?.slice(0, 160) || `A step-by-step guide to ${selectedTopic} in ${tutorial.name} ${selectedVersion}.`}
      />

      <GuideSidebar
        tutorial={tutorial}
        selectedTopic={selectedTopic}
        selectedVersion={selectedVersion}
        exploringMode={exploringMode}
        steps={guide.steps}
        activeStep={activeStep}
        completedSteps={completedSteps}
        onSelectStep={setActiveStep}
        onBackToTopics={backToTopics}
        onBackHome={() => navigate('/')}
        onToggleMode={toggleExploringMode}
        tailored={tailored}
        onToggleTailoring={toggleTailoring}
      />

      <div className="flex-1 space-y-16">
        {/* Shown only on the first step: it is orientation for the guide, not
            for one step, and repeating it above every step would bury them. */}
        {activeStep === 0 && <GuideOrientation guide={guide} />}
        <StepPanel
          step={currentStep}
          stepKey={`${selectedTopic}-${activeStep}`}
          activeStep={activeStep}
          totalSteps={guide.steps.length}
          exploringMode={exploringMode}
          commandOs={osForTutorial(tutorial.name)}
          appName={tutorial.name}
          videoEnabled={videoEnabled}
          imageUrl={stepImage.imageUrl}
          isGeneratingImage={stepImage.isGenerating}
          imageFailed={stepImage.failed}
          onRetryImage={stepImage.retry}
          onGenerateImage={stepImage.generate}
          onImageError={stepImage.handleImageError}
          isCompleted={completedSteps.has(activeStep)}
          onToggleComplete={() => toggleStep(activeStep)}
          onPrev={() => setActiveStep(prev => prev - 1)}
          onNext={() => setActiveStep(prev => prev + 1)}
        />

        {/* Checklist and FAQs land on the last step, where someone is either
            finished or stuck — which is when a FAQ is worth reading. */}
        {activeStep === guide.steps.length - 1 && <GuideWrapUp guide={guide} />}

        <DoubtHub
          exploringMode={exploringMode}
          value={customDoubt}
          onChange={setCustomDoubt}
          onSubmit={handleDoubtSubmit}
        />
      </div>
    </div>
  );
};

export default TutorialView;
