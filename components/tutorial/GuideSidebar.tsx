import React from 'react';
import { ExploringMode, GuideStep, Tutorial } from '../../types';

interface Props {
  tutorial: Tutorial;
  selectedTopic: string;
  selectedVersion: string;
  exploringMode: ExploringMode;
  steps: GuideStep[];
  activeStep: number;
  completedSteps: Set<number>;
  onSelectStep: (index: number) => void;
  onBackToTopics: () => void;
  onBackHome: () => void;
  onToggleMode: () => void;
}

/** Sticky rail: breadcrumb, guide identity, progress, and step navigation. */
const GuideSidebar: React.FC<Props> = ({
  tutorial,
  selectedTopic,
  selectedVersion,
  exploringMode,
  steps,
  activeStep,
  completedSteps,
  onSelectStep,
  onBackToTopics,
  onBackHome,
  onToggleMode,
}) => {
  const expert = exploringMode === ExploringMode.EXPERT;
  const progress = steps.length ? (completedSteps.size / steps.length) * 100 : 0;

  return (
    <aside className="lg:w-96 flex-shrink-0">
      <div className="sticky top-28 space-y-10">
        {/* Two levels, because this used to say "The Library" while actually
            returning to the topic list for the current app. */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBackToTopics}
            className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-amber-600 transition-all flex items-center gap-4 group"
          >
            <span className="bg-white w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm" aria-hidden="true">←</span>
            {tutorial.name} Topics
          </button>
          <span className="text-stone-300 font-black" aria-hidden="true">/</span>
          <button
            onClick={onBackHome}
            className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-amber-600 transition-all"
          >
            All Guides
          </button>
        </nav>

        <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border-[4px] border-amber-50/50 overflow-hidden relative">
          <h2 className="text-3xl font-black text-stone-900 leading-tight mb-4">{tutorial.name}</h2>
          <div className="flex flex-col gap-3">
            <div className={`inline-block px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border w-fit shadow-sm ${expert ? 'bg-amber-950 text-amber-400 border-amber-900' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              {selectedTopic}
            </div>
            <div className="flex gap-2">
              <div className="inline-block px-4 py-2 bg-stone-50 rounded-2xl text-[10px] font-black text-stone-400 uppercase tracking-widest w-fit border border-stone-100">
                v{selectedVersion}
              </div>
              <button
                onClick={onToggleMode}
                className={`inline-block px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest w-fit transition-transform hover:scale-110 shadow-lg ${expert ? 'bg-stone-900' : 'bg-amber-500'}`}
              >
                {exploringMode}
              </button>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Mastery Progress</span>
              <span className={`text-sm font-black ${expert ? 'text-amber-600' : 'text-amber-500'}`}>{Math.round(progress)}%</span>
            </div>
            <div
              className="h-4 w-full bg-stone-50 rounded-full overflow-hidden shadow-inner border border-stone-100"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Steps completed"
            >
              <div
                className={`h-full transition-all duration-1000 ease-out ${expert ? 'bg-amber-950 shadow-[0_0_20px_rgba(120,53,15,0.4)]' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="bg-white rounded-[3.5rem] shadow-sm border-[4px] border-amber-50/50 overflow-hidden" aria-label="Guide steps">
          <div className="p-8 bg-amber-50/30 border-b border-amber-50 font-black text-stone-900 text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full animate-pulse ${expert ? 'bg-amber-950' : 'bg-amber-500'}`} aria-hidden="true" />
            Elite Curriculum
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => onSelectStep(idx)}
                aria-current={activeStep === idx ? 'step' : undefined}
                className={`w-full p-8 text-left transition-all flex gap-5 border-b border-amber-50/30 last:border-0 ${
                  activeStep === idx
                    ? `${expert ? 'bg-amber-950' : 'bg-amber-500'} text-white scale-[1.02] shadow-2xl z-10`
                    : 'hover:bg-amber-50/50 text-stone-500'
                }`}
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
  );
};

export default GuideSidebar;
