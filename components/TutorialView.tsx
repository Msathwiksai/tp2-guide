import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TUTORIALS } from '../constants';
import { getGuideContent, verifyApplicationExistence, ApiError } from '../services/geminiService';
import { AIResponse, Tutorial, ExploringMode, Category } from '../types';
import PageMeta from './PageMeta';
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
  onAskDoubt: (question: string) => void;
}

/**
 * Container for one application's guides. Owns data fetching and decides which
 * screen to show; all rendering lives in ./tutorial/*.
 */
const TutorialView: React.FC<TutorialViewProps> = ({ onAskDoubt }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const tutorial = useMemo(() => {
    const staticTut = TUTORIALS.find(t => t.id === id);
    if (staticTut) return staticTut;

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
  }, [id, safeId, customAppInfo]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<AIResponse | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>(tutorial?.versions[0] || '');
  const [exploringMode, setExploringMode] = useState<ExploringMode>(ExploringMode.STANDARD);
  const [customDoubt, setCustomDoubt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const guideRequestIdRef = useRef(0);

  // Identifies one specific generated guide. Step numbers are only meaningful
  // within the guide they came from, so both progress and images key off this.
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
            setCustomAppInfo({ name: result.correctedName || safeId, exists: true });
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

  const loadTopic = async (topic: string, versionOverride?: string, modeOverride?: ExploringMode) => {
    if (!tutorial || verificationError) return;
    const version = versionOverride || selectedVersion;
    const mode = modeOverride || exploringMode;
    // Guards against an earlier, slower request overwriting a newer one.
    const requestId = ++guideRequestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      setQuotaError(false);
      setBusyError(false);
      setSelectedTopic(topic);
      const content = await getGuideContent(tutorial.name, topic, version, mode);
      if (requestId !== guideRequestIdRef.current) return;
      setGuide(content);
      setActiveStep(0);
    } catch (err) {
      if (requestId !== guideRequestIdRef.current) return;
      if (err instanceof ApiError && err.isUnavailable) setSetupNeeded(true);
      else if (err instanceof ApiError && err.isUpstreamBusy) setBusyError(true);
      else if (err instanceof ApiError && err.isRateLimited) setQuotaError(true);
      else setError(err instanceof Error ? err.message : 'Failed to load topic details. Please try again.');
    } finally {
      if (requestId === guideRequestIdRef.current) setLoading(false);
    }
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = e.target.value;
    setSelectedVersion(newVersion);
    if (selectedTopic) loadTopic(selectedTopic, newVersion);
  };

  const toggleExploringMode = () => {
    const newMode = exploringMode === ExploringMode.STANDARD ? ExploringMode.EXPERT : ExploringMode.STANDARD;
    setExploringMode(newMode);
    if (selectedTopic) loadTopic(selectedTopic, selectedVersion, newMode);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadTopic(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleDoubtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDoubt.trim()) return;
    onAskDoubt(`Doubt about ${selectedTopic} in ${tutorial?.name}: ${customDoubt}`);
    setCustomDoubt('');
  };

  const retryCurrentTopic = () => { if (selectedTopic) loadTopic(selectedTopic); };
  const backToTopics = () => setSelectedTopic(null);

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
  // Must come before the topic-picker guard: loadTopic sets selectedTopic before
  // awaiting, so a failure would otherwise fall through and swallow the message.
  if (error) {
    return (
      <GuideError
        message={error}
        onRetry={selectedTopic ? retryCurrentTopic : undefined}
        onChooseAnother={() => { setError(null); backToTopics(); }}
      />
    );
  }

  if (!selectedTopic && !loading) {
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
        onSelectTopic={loadTopic}
        onBackHome={() => navigate('/')}
      />
    );
  }

  if (loading) return <GeneratingGuide exploringMode={exploringMode} />;
  if (!guide || !selectedTopic) return null;

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
      />

      <div className="flex-1 space-y-16">
        <StepPanel
          step={currentStep}
          stepKey={`${selectedTopic}-${activeStep}`}
          activeStep={activeStep}
          totalSteps={guide.steps.length}
          exploringMode={exploringMode}
          imageUrl={stepImage.imageUrl}
          isGeneratingImage={stepImage.isGenerating}
          imageFailed={stepImage.failed}
          onRetryImage={stepImage.retry}
          onImageError={stepImage.handleImageError}
          isCompleted={completedSteps.has(activeStep)}
          onToggleComplete={() => toggleStep(activeStep)}
          onPrev={() => setActiveStep(prev => prev - 1)}
          onNext={() => setActiveStep(prev => prev + 1)}
        />

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
