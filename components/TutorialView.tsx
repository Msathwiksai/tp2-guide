
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TUTORIALS } from '../constants';
import { getGuideContent, generateStepImage, verifyApplicationExistence, ApiError } from '../services/geminiService';
import { AIResponse, Tutorial, GuideStep, ExploringMode, Category } from '../types';
import StepNarration from './StepNarration';

interface TutorialViewProps {
  onAskDoubt: (question: string) => void;
}

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
      versions: ['Current']
    } as Tutorial;
  }, [id, safeId, customAppInfo]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<AIResponse | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>(tutorial?.versions[0] || '');
  const [exploringMode, setExploringMode] = useState<ExploringMode>(ExploringMode.STANDARD);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  // Bumping this re-runs the image effect; without it a retry can't change the
  // effect's dependencies and would never re-fire.
  const [imageRetry, setImageRetry] = useState(0);
  const [customDoubt, setCustomDoubt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const doubtInputRef = useRef<HTMLInputElement>(null);
  const guideRequestIdRef = useRef(0);

  // Progress is keyed per topic+version+mode, because step numbers only mean
  // anything within one specific generated guide.
  const progressKey = selectedTopic
    ? `tp2:progress:${id}:${selectedTopic}:${selectedVersion}:${exploringMode}`
    : null;

  // Restore on mount / when the guide identity changes. localStorage access is
  // guarded: it throws outright in some privacy modes rather than returning null.
  useEffect(() => {
    if (!progressKey) return;
    try {
      const saved = window.localStorage.getItem(progressKey);
      setCompletedSteps(saved ? new Set(JSON.parse(saved) as number[]) : new Set());
    } catch {
      setCompletedSteps(new Set());
    }
  }, [progressKey]);

  useEffect(() => {
    if (!progressKey) return;
    try {
      window.localStorage.setItem(progressKey, JSON.stringify([...completedSteps]));
    } catch {
      // Storage unavailable or full — progress simply is not persisted.
    }
  }, [progressKey, completedSteps]);

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
            setVerificationError(result.reason || "The target software could not be verified.");
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
      // completedSteps is intentionally NOT reset here — the persistence effect
      // restores saved progress for this guide's key. Clearing it would wipe it.
      setStepImages({});
    } catch (err) {
      if (requestId !== guideRequestIdRef.current) return;
      if (err instanceof ApiError && err.isUnavailable) {
        setSetupNeeded(true);
      } else if (err instanceof ApiError && err.isUpstreamBusy) {
        setBusyError(true);
      } else if (err instanceof ApiError && err.isRateLimited) {
        setQuotaError(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load topic details. Please try again.');
      }
    } finally {
      if (requestId === guideRequestIdRef.current) setLoading(false);
    }
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = e.target.value;
    setSelectedVersion(newVersion);
    if (selectedTopic) {
      loadTopic(selectedTopic, newVersion);
    }
  };

  const toggleExploringMode = () => {
    const newMode = exploringMode === ExploringMode.STANDARD ? ExploringMode.EXPERT : ExploringMode.STANDARD;
    setExploringMode(newMode);
    if (selectedTopic) {
      loadTopic(selectedTopic, selectedVersion, newMode);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadTopic(searchQuery.trim());
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (guide && guide.steps[activeStep] && !stepImages[activeStep]) {
      const step = guide.steps[activeStep];
      const stepIndex = activeStep;
      let cancelled = false;
      const fetchImage = async () => {
        setIsGeneratingImage(true);
        setImageFailed(false);
        try {
          const img = await generateStepImage(tutorial?.name || '', selectedVersion, step.title, step.visualCue || '');
          if (cancelled) return;
          if (img) setStepImages(prev => ({ ...prev, [stepIndex]: img }));
          else setImageFailed(true);
        } catch (err) {
          if (!cancelled) setImageFailed(true);
          console.error('Step image generation failed', err);
        } finally {
          if (!cancelled) setIsGeneratingImage(false);
        }
      };
      fetchImage();
      return () => { cancelled = true; };
    }
  }, [activeStep, guide, tutorial, selectedVersion, imageRetry]);

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCustomDoubtSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customDoubt.trim()) return;
    onAskDoubt(`Doubt about ${selectedTopic} in ${tutorial?.name}: ${customDoubt}`);
    setCustomDoubt('');
  };

  // BUSY UI — the key is valid; every model is just overloaded upstream.
  if (busyError) {
    return (
      <div className="max-w-3xl mx-auto py-40 text-center space-y-12 animate-in zoom-in-95 duration-700" role="alert">
        <div className="text-8xl" aria-hidden="true">🌊</div>
        <h1 className="text-6xl font-black text-stone-900 tracking-tighter">Models Are Busy</h1>
        <div className="text-xl text-stone-500 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-200 shadow-xl space-y-6">
          <p>Every available AI model reported <span className="text-amber-600 font-black">high demand</span> just now.</p>
          <p className="text-sm uppercase tracking-widest font-black text-stone-500">
            This is common on the free tier, where requests are deprioritised under load. Nothing is wrong with your setup — waiting a few seconds usually clears it.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <button
            onClick={() => { setBusyError(false); if (selectedTopic) loadTopic(selectedTopic); }}
            className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-stone-900 transition-all"
          >
            Retry Now
          </button>
          <button
            onClick={() => { setBusyError(false); setSelectedTopic(null); }}
            className="bg-stone-100 text-stone-500 px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all border border-stone-200"
          >
            Choose Another Topic
          </button>
        </div>
      </div>
    );
  }

  // SETUP UI — the server has no API key, so nothing can be generated.
  if (setupNeeded) {
    return (
      <div className="max-w-3xl mx-auto py-32 text-center space-y-10 animate-in zoom-in-95 duration-700" role="alert">
        <div className="text-8xl" aria-hidden="true">🔑</div>
        <h1 className="text-6xl font-black text-stone-900 tracking-tighter">API Key Required</h1>
        <p className="text-xl text-stone-400 font-medium leading-relaxed">
          The server has no <code className="text-stone-900 font-black font-mono text-base">GEMINI_API_KEY</code>,
          so guides, images, and chat cannot be generated. This is a one-time setup step.
        </p>
        <div className="bg-stone-950 rounded-[3rem] p-10 text-left space-y-6 border-4 border-stone-800">
          <ol className="space-y-6">
            <li className="flex gap-5 items-start">
              <span className="w-8 h-8 flex-shrink-0 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">1</span>
              <span className="text-white/70 font-medium text-sm leading-relaxed">
                Get a key from <span className="text-amber-400 font-mono">aistudio.google.com/apikey</span>
              </span>
            </li>
            <li className="flex gap-5 items-start">
              <span className="w-8 h-8 flex-shrink-0 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">2</span>
              <div className="space-y-3 flex-1">
                <span className="text-white/70 font-medium text-sm leading-relaxed block">
                  Create <span className="text-amber-400 font-mono">.env.local</span> in the project root:
                </span>
                <pre className="bg-black/50 rounded-xl p-4 text-amber-300 font-mono text-[11px] overflow-x-auto"><code>GEMINI_API_KEY=your_key_here</code></pre>
              </div>
            </li>
            <li className="flex gap-5 items-start">
              <span className="w-8 h-8 flex-shrink-0 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">3</span>
              <span className="text-white/70 font-medium text-sm leading-relaxed">
                Restart the dev server — <span className="text-amber-400 font-mono">npm run dev</span>
              </span>
            </li>
          </ol>
        </div>
        <button
          onClick={() => { setSetupNeeded(false); if (selectedTopic) loadTopic(selectedTopic); }}
          className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-stone-900 transition-all"
        >
          I&apos;ve added the key — retry
        </button>
      </div>
    );
  }

  // QUOTA ERROR UI
  if (quotaError) {
    return (
      <div className="max-w-3xl mx-auto py-40 text-center space-y-12 animate-in zoom-in-95 duration-700">
        <div className="text-8xl">⏳</div>
        <h1 className="text-6xl font-black text-stone-900 tracking-tighter">Cooldown Required</h1>
        <div className="text-2xl text-stone-400 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-200 shadow-xl">
          <p className="mb-6">The AI engine has hit its temporary <span className="text-amber-600 font-black">Rate Limit</span>.</p>
          <p className="text-sm uppercase tracking-widest font-black text-stone-500">
            This happens on the free tier when requests are too frequent. Please wait 60 seconds before trying again.
          </p>
        </div>
        <div className="flex gap-6 justify-center">
          <button 
            onClick={() => { setQuotaError(false); if(selectedTopic) loadTopic(selectedTopic); }}
            className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-stone-900 transition-all"
          >
            Retry Now
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-stone-100 text-stone-500 px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all border border-stone-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-60 gap-10 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 border-[8px] border-amber-50 rounded-full"></div>
          <div className="absolute top-0 w-24 h-24 border-[8px] border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Reality Verification Engaged</h2>
          <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.4em] mt-3 animate-pulse">Scanning Software Database</p>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="max-w-3xl mx-auto py-40 text-center space-y-12 animate-in zoom-in-95 duration-700">
        <div className="text-8xl">🚫</div>
        <h1 className="text-6xl font-black text-stone-900 tracking-tighter">Invalid Target</h1>
        <p className="text-2xl text-stone-400 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-50">
           We could not verify <span className="text-stone-900 font-black">"{safeId || 'this application'}"</span> as a legitimate application. <br/><br/>
          <span className="text-sm uppercase tracking-widest font-black text-amber-600">AI Logic: {verificationError}</span>
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-stone-900 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-amber-500 transition-all"
        >
          Return to Library
        </button>
      </div>
    );
  }

  // Previously `return null`, which rendered a blank page: loadTopic sets
  // selectedTopic before awaiting, so a failed request fell through the
  // topic-picker guard above and showed nothing at all.
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-40 text-center space-y-12 animate-in zoom-in-95 duration-700" role="alert">
        <div className="text-8xl">⚠️</div>
        <h1 className="text-6xl font-black text-stone-900 tracking-tighter">Something Went Wrong</h1>
        <p className="text-xl text-stone-500 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-50">
          {error}
        </p>
        <div className="flex flex-wrap gap-6 justify-center">
          {selectedTopic && (
            <button
              onClick={() => loadTopic(selectedTopic)}
              className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-stone-900 transition-all"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => { setError(null); setSelectedTopic(null); }}
            className="bg-stone-100 text-stone-500 px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all border border-stone-200"
          >
            Choose Another Topic
          </button>
        </div>
      </div>
    );
  }

  if (!selectedTopic && !loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-16 py-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        {/* This screen previously had no way back — the only exit was the
            header logo, which is not obvious as a navigation control. */}
        <nav aria-label="Breadcrumb">
          <button
            onClick={() => navigate('/')}
            className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-amber-600 transition-all flex items-center gap-4 group"
          >
            <span className="bg-white w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm" aria-hidden="true">←</span>
            All Guides
          </button>
        </nav>

        <div className="text-center">
          <div className={`w-32 h-32 rounded-[3.5rem] bg-white mx-auto flex items-center justify-center text-7xl mb-10 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.3)] rotate-3 border-8 border-amber-50 transition-all hover:scale-110 hover:-rotate-3`}>
            {tutorial.icon}
          </div>
          <h1 className="text-7xl font-black text-stone-900 mb-6 tracking-tighter">Inside {tutorial.name}</h1>
          <p className="text-2xl text-stone-400 max-w-3xl mx-auto leading-relaxed font-medium mb-12">
            Select a specialized path or use our AI to analyze a specific feature for version {selectedVersion}.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 bg-white p-10 rounded-[4rem] shadow-sm border-[6px] border-amber-50/30 max-w-3xl mx-auto">
             <div className="flex flex-col items-center gap-4">
               <label htmlFor="version-select" className="text-[10px] font-black text-amber-600/50 uppercase tracking-[0.3em]">Environment Version</label>
               <div className="relative group">
                 <select
                   id="version-select"
                   value={selectedVersion}
                   onChange={handleVersionChange}
                   className="appearance-none bg-amber-50/30 border-2 border-amber-100/50 px-10 py-4 rounded-3xl text-stone-900 font-black tracking-tight hover:border-amber-500 transition-all cursor-pointer outline-none min-w-[200px] text-center text-xs shadow-inner"
                 >
                   {tutorial.versions.map(v => (
                     <option key={v} value={v}>Version {v}</option>
                   ))}
                 </select>
               </div>
             </div>

             <div className="w-[1px] h-16 bg-amber-100/50 hidden sm:block"></div>

             <div className="flex flex-col items-center gap-4">
               <label className="text-[10px] font-black text-amber-600/50 uppercase tracking-[0.3em]">Mastery Level</label>
               <button 
                onClick={toggleExploringMode}
                className={`flex items-center gap-4 px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 text-amber-400' : 'bg-amber-500 text-white shadow-amber-200'}`}
               >
                 <span className="text-xl">{exploringMode === ExploringMode.EXPERT ? '💎' : '🌱'}</span>
                 {exploringMode} View
               </button>
             </div>
          </div>
        </div>

        {/* Feature Search Engine */}
        <div className="relative max-w-3xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Analyze any ${exploringMode === ExploringMode.EXPERT ? 'deep technical ' : ''}feature...`}
              className={`w-full h-24 bg-white rounded-[2.5rem] px-12 text-2xl font-bold text-stone-900 shadow-2xl focus:ring-[12px] outline-none transition-all pr-40 border-2 border-amber-50 ${exploringMode === ExploringMode.EXPERT ? 'focus:ring-amber-950/5' : 'focus:ring-amber-100/50'}`}
            />
            <button 
              type="submit"
              className={`absolute right-4 top-4 bottom-4 px-10 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 hover:bg-stone-800' : 'bg-amber-500 hover:bg-amber-600'}`}
            >
              Consult AI
            </button>
          </form>
        </div>

        <div className="space-y-16">
           <div className="flex items-center gap-10">
              <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter">
                {exploringMode === ExploringMode.EXPERT ? 'Expert Architectures' : 'Standard Curricula'}
              </h2>
              <div className="h-[2px] flex-1 bg-amber-100/50"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <button 
                onClick={() => loadTopic("Absolute Basics & Key Interface Items")}
                className={`group p-12 rounded-[4rem] border-[6px] transition-all text-left relative overflow-hidden ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 text-white border-stone-800 hover:border-amber-400' : 'bg-white text-stone-900 border-amber-50 hover:border-amber-500 shadow-sm hover:shadow-2xl'}`}
              >
                <div className="text-6xl mb-8 group-hover:scale-125 transition-transform duration-500">🏁</div>
                <h3 className="text-3xl font-black mb-4">Core Essentials</h3>
                <p className={`${exploringMode === ExploringMode.EXPERT ? 'text-amber-100/40' : 'text-stone-400'} text-sm leading-relaxed font-medium`}>
                   The VIP foundation for {tutorial.name} {selectedVersion}.
                </p>
              </button>

              {(exploringMode === ExploringMode.EXPERT ? tutorial.advancedTopics : tutorial.popularTopics).map((topic, i) => (
                <button 
                  key={i}
                  onClick={() => loadTopic(topic)}
                  className={`group p-12 rounded-[4rem] border-[6px] transition-all text-left relative overflow-hidden ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-900 text-white border-amber-800 hover:border-amber-400' : 'bg-white text-stone-900 border-amber-50 hover:border-amber-500 shadow-sm hover:shadow-2xl'}`}
                >
                  <div className="text-6xl mb-8 group-hover:scale-125 transition-transform duration-500">{exploringMode === ExploringMode.EXPERT ? '🧪' : '✨'}</div>
                  <h3 className="text-2xl font-black mb-4 leading-tight">{topic}</h3>
                  <p className={`${exploringMode === ExploringMode.EXPERT ? 'text-amber-100/40' : 'text-stone-400'} text-sm leading-relaxed font-medium`}>
                     {exploringMode === ExploringMode.EXPERT ? 'Deep architectural dissection.' : 'The golden path to feature mastery.'}
                  </p>
                </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-52 gap-10">
        <div className="relative">
          <div className="w-32 h-32 border-[12px] border-amber-50 rounded-full"></div>
          <div className={`absolute top-0 w-32 h-32 border-[12px] border-t-transparent rounded-full animate-spin shadow-2xl ${exploringMode === ExploringMode.EXPERT ? 'border-amber-950' : 'border-amber-500'}`}></div>
        </div>
        <div className="text-center space-y-4">
          <p className="text-4xl font-black text-stone-900 tracking-tighter">Assembling Curriculum...</p>
          <p className={`font-black animate-pulse text-xs uppercase tracking-[0.4em] ${exploringMode === ExploringMode.EXPERT ? 'text-amber-600' : 'text-amber-500'}`}>
             Premium Intelligence Engaged
          </p>
        </div>
      </div>
    );
  }


  if (!guide) return null;

  const progress = (completedSteps.size / guide.steps.length) * 100;
  const currentStep = guide.steps[activeStep];

  return (
    <div className="flex flex-col lg:flex-row gap-16 pb-40 animate-in slide-in-from-bottom-12 duration-700">
      <aside className="lg:w-96 flex-shrink-0">
        <div className="sticky top-28 space-y-10">
          {/* Two levels, because this button used to say "The Library" while
              actually returning to the topic list for the current app. */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-amber-600 transition-all flex items-center gap-4 group"
            >
              <span className="bg-white w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm" aria-hidden="true">←</span>
              {tutorial.name} Topics
            </button>
            <span className="text-stone-300 font-black" aria-hidden="true">/</span>
            <button
              onClick={() => navigate('/')}
              className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-amber-600 transition-all"
            >
              All Guides
            </button>
          </nav>

          <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border-[4px] border-amber-50/50 overflow-hidden relative">
            <h2 className="text-3xl font-black text-stone-900 leading-tight mb-4">{tutorial.name}</h2>
            <div className="flex flex-col gap-3">
               <div className={`inline-block px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border w-fit shadow-sm ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 text-amber-400 border-amber-900' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                 {selectedTopic}
               </div>
               <div className="flex gap-2">
                 <div className="inline-block px-4 py-2 bg-stone-50 rounded-2xl text-[10px] font-black text-stone-400 uppercase tracking-widest w-fit border border-stone-100">
                   v{selectedVersion}
                 </div>
                 <button 
                  onClick={toggleExploringMode}
                  className={`inline-block px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest w-fit transition-transform hover:scale-110 shadow-lg ${exploringMode === ExploringMode.EXPERT ? 'bg-stone-900' : 'bg-amber-500'}`}
                 >
                   {exploringMode}
                 </button>
               </div>
            </div>
            
            <div className="mt-12">
               <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Mastery Progress</span>
                  <span className={`text-sm font-black ${exploringMode === ExploringMode.EXPERT ? 'text-amber-600' : 'text-amber-500'}`}>{Math.round(progress)}%</span>
               </div>
               <div className="h-4 w-full bg-stone-50 rounded-full overflow-hidden shadow-inner border border-stone-100">
                  <div className={`h-full transition-all duration-1000 ease-out ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 shadow-[0_0_20px_rgba(120,53,15,0.4)]' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}`} style={{ width: `${progress}%` }}></div>
               </div>
            </div>
          </div>

          <nav className="bg-white rounded-[3.5rem] shadow-sm border-[4px] border-amber-50/50 overflow-hidden">
             <div className="p-8 bg-amber-50/30 border-b border-amber-50 font-black text-stone-900 text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full animate-pulse ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950' : 'bg-amber-500'}`}></span>
                Elite Curriculum
             </div>
             <div className="max-h-[400px] overflow-y-auto">
                {guide.steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full p-8 text-left transition-all flex gap-5 border-b border-amber-50/30 last:border-0 ${activeStep === idx ? (exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 text-white scale-[1.02] shadow-2xl z-10' : 'bg-amber-500 text-white scale-[1.02] shadow-2xl z-10') : 'hover:bg-amber-50/50 text-stone-500'}`}
                  >
                    <span className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-[10px] font-black ${activeStep === idx ? 'bg-white text-stone-900' : 'bg-stone-100 text-stone-400 border border-stone-200'}`}>
                      {completedSteps.has(idx) ? '✓' : idx + 1}
                    </span>
                    <span className="text-xs font-black leading-tight uppercase tracking-wider">{step.title}</span>
                  </button>
                ))}
             </div>
          </nav>
        </div>
      </aside>

      <div className="flex-1 space-y-16">
        <section className={`bg-white rounded-[4rem] p-12 md:p-20 shadow-sm border-[6px] relative overflow-hidden group/main transition-colors ${exploringMode === ExploringMode.EXPERT ? 'border-amber-950/10' : 'border-amber-50/50'}`}>
           <div className="flex flex-wrap justify-between items-center gap-6 mb-16">
              <div className="flex gap-4">
                <span className={`px-8 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950' : 'bg-amber-500'}`}>
                  Module {activeStep + 1}
                </span>
              </div>
           </div>

           <h1 className="text-6xl md:text-7xl font-black text-stone-900 mb-10 tracking-tighter leading-none">{currentStep.title}</h1>
           <p className="text-2xl text-stone-500 leading-relaxed mb-10 font-medium">{currentStep.description}</p>

           <div className="mb-16">
             <StepNarration
               stepKey={`${selectedTopic}-${activeStep}`}
               title={currentStep.title}
               description={currentStep.description}
               tips={currentStep.tips}
             />
           </div>

           <div className="relative mb-16">
             <div className={`bg-stone-900 rounded-[4rem] overflow-hidden border-[12px] shadow-[0_60px_100px_-30px_rgba(245,158,11,0.2)] aspect-[16/9] flex items-center justify-center relative group/img transition-all ${exploringMode === ExploringMode.EXPERT ? 'border-stone-950' : 'border-white'}`}>
                {stepImages[activeStep] ? (
                  <img
                    src={stepImages[activeStep]}
                    alt={`Illustration for step: ${currentStep.title}`}
                    loading="lazy"
                    // The image cache lives in server memory, so a restart makes
                    // previously-issued URLs 404. Fall back instead of showing
                    // a broken-image icon.
                    onError={() => {
                      setStepImages(prev => { const next = { ...prev }; delete next[activeStep]; return next; });
                      setImageFailed(true);
                    }}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-[2s] ease-out opacity-90 group-hover/img:opacity-100"
                  />
                ) : isGeneratingImage ? (
                  <div className="flex flex-col items-center gap-6 text-stone-500" role="status">
                    <div className={`w-20 h-20 border-[6px] border-stone-800 rounded-full animate-spin ${exploringMode === ExploringMode.EXPERT ? 'border-t-amber-400' : 'border-t-amber-500'}`}></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Refining Visual Intelligence</p>
                  </div>
                ) : (
                  // Previously this spun forever on failure, because the spinner
                  // keyed off the absence of an image rather than actual loading.
                  <div className="flex flex-col items-center gap-6 text-stone-500 px-10 text-center">
                    <div className="text-5xl opacity-40">🖼️</div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                      {imageFailed ? 'Visual unavailable for this step' : 'No visual generated'}
                    </p>
                    {imageFailed && (
                      <button
                        onClick={() => setImageRetry(n => n + 1)}
                        className="text-amber-500 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-amber-400"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
             </div>
           </div>

           {currentStep.actionLabel && (
             <div className={`p-14 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_40px_80px_-20px_rgba(245,158,11,0.2)] mb-16 animate-in zoom-in-95 duration-700 ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950' : 'bg-amber-500 shadow-amber-100'}`}>
                <div className="flex items-center gap-10">
                  <div className="w-24 h-24 bg-white/10 rounded-[3rem] flex items-center justify-center text-6xl backdrop-blur-xl shadow-2xl border border-white/10 rotate-3">🏁</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Mastery Certification Task</p>
                    <h3 className="text-4xl font-black tracking-tighter leading-tight">{currentStep.actionLabel}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => toggleStep(activeStep)}
                  className={`px-16 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 ${completedSteps.has(activeStep) ? 'bg-emerald-500 text-white scale-105' : 'bg-white text-stone-900 hover:bg-stone-50 hover:-translate-y-2'}`}
                >
                  {completedSteps.has(activeStep) ? '✓ Skill Unlocked' : 'Execute Step'}
                </button>
             </div>
           )}

           <div className="flex items-center justify-between pt-16 border-t-2 border-amber-50">
             <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="flex items-center gap-4 text-stone-300 font-black uppercase tracking-[0.3em] text-[10px] hover:text-amber-600 disabled:opacity-0 transition-colors"
             >
                <span className="w-12 h-12 rounded-2xl border-2 border-amber-50 flex items-center justify-center text-lg transition-all group-hover:border-amber-500">←</span> Previous Module
             </button>
             <button
                disabled={activeStep === guide.steps.length - 1}
                onClick={() => setActiveStep(prev => prev + 1)}
                className={`text-white px-20 py-7 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 disabled:opacity-0 ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950 hover:bg-black shadow-stone-200' : 'bg-amber-500 hover:bg-stone-900 shadow-amber-200'}`}
             >
                Next Architecture →
             </button>
           </div>
        </section>

        <section id="doubt-hub" className={`bg-white rounded-[5rem] shadow-2xl border-[8px] overflow-hidden transition-all ${exploringMode === ExploringMode.EXPERT ? 'border-amber-950/5' : 'border-amber-50'}`}>
           <div className={`p-16 text-white relative ${exploringMode === ExploringMode.EXPERT ? 'bg-amber-950' : 'bg-stone-900'}`}>
              <div className="max-w-3xl relative z-10">
                 <h2 className="text-6xl font-black mb-8 tracking-tighter">Feature Doubt?</h2>
                 <form onSubmit={handleCustomDoubtSubmit} className="relative group">
                    <input 
                      ref={doubtInputRef}
                      type="text" 
                      value={customDoubt}
                      onChange={(e) => setCustomDoubt(e.target.value)}
                      placeholder="e.g. How do I optimize this specific workflow?"
                      className="w-full h-28 bg-white rounded-[3rem] px-12 text-stone-900 text-2xl font-bold shadow-2xl outline-none pr-48 border-4 border-transparent focus:border-amber-500 transition-all"
                    />
                    <button type="submit" className="absolute right-5 top-5 bottom-5 px-12 text-white bg-amber-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all">Consult AI</button>
                 </form>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default TutorialView;
