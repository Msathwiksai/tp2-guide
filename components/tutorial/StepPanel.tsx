import React from 'react';
import { CommandOS, ExploringMode, GuideStep } from '../../types';
import StepNarration from '../StepNarration';
import CommandText from '../CommandText';
import StepVideo from './StepVideo';
import StepCommands from './StepCommands';

interface Props {
  step: GuideStep;
  stepKey: string;
  activeStep: number;
  totalSteps: number;
  exploringMode: ExploringMode;
  /** Which shell the commands in this guide belong to. */
  commandOs: CommandOS;
  /** App name, for the video prompt. */
  appName: string;
  /** Server reports whether Veo is configured; hides the button otherwise. */
  videoEnabled: boolean;
  imageUrl?: string;
  isGeneratingImage: boolean;
  imageFailed: boolean;
  onRetryImage: () => void;
  /** Explicit: nothing is generated until the reader asks. */
  onGenerateImage: () => void;
  onImageError: (index: number) => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/** Illustration slot: the image, its loading state, or an honest empty state. */
const StepIllustration: React.FC<
  Pick<Props, 'step' | 'activeStep' | 'exploringMode' | 'imageUrl' | 'isGeneratingImage' | 'imageFailed' | 'onRetryImage' | 'onGenerateImage' | 'onImageError'>
> = ({ step, activeStep, exploringMode, imageUrl, isGeneratingImage, imageFailed, onRetryImage, onGenerateImage, onImageError }) => {
  const expert = exploringMode === ExploringMode.EXPERT;

  return (
    <div className={`bg-stone-900 rounded-[4rem] overflow-hidden border-[12px] shadow-[0_60px_100px_-30px_rgba(245,158,11,0.2)] aspect-[16/9] flex items-center justify-center relative group/img transition-all ${expert ? 'border-stone-950' : 'border-white'}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Illustration for step: ${step.title}`}
          loading="lazy"
          onError={() => onImageError(activeStep)}
          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-[2s] ease-out opacity-90 group-hover/img:opacity-100"
        />
      ) : isGeneratingImage ? (
        <div className="flex flex-col items-center gap-6 text-stone-500" role="status">
          <div className={`w-20 h-20 border-[6px] border-stone-800 rounded-full animate-spin ${expert ? 'border-t-amber-400' : 'border-t-amber-500'}`} />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Refining Visual Intelligence</p>
        </div>
      ) : (
        // Nothing is generated until asked for. Illustrations are billable and
        // most steps read fine without one, so this is the reader's call.
        <div className="flex flex-col items-center gap-6 text-stone-500 px-10 text-center">
          <div className="text-5xl opacity-40" aria-hidden="true">🖼️</div>
          {imageFailed ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.35em]">
                Visual unavailable for this step
              </p>
              <button
                onClick={onRetryImage}
                className="text-amber-500 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-amber-400"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] max-w-sm leading-relaxed">
                Not clear from the text? Generate a picture of this step.
              </p>
              <button
                onClick={onGenerateImage}
                className="bg-white text-stone-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-xl"
              >
                Show me a picture
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/** The main reading pane for a single step. */
const StepPanel: React.FC<Props> = ({
  step,
  stepKey,
  activeStep,
  totalSteps,
  exploringMode,
  commandOs,
  appName,
  videoEnabled,
  imageUrl,
  isGeneratingImage,
  imageFailed,
  onRetryImage,
  onGenerateImage,
  onImageError,
  isCompleted,
  onToggleComplete,
  onPrev,
  onNext,
}) => {
  const expert = exploringMode === ExploringMode.EXPERT;

  return (
    <section className={`bg-white rounded-[4rem] p-12 md:p-20 shadow-sm border-[6px] relative overflow-hidden group/main transition-colors ${expert ? 'border-amber-950/10' : 'border-amber-50/50'}`}>
      <div className="flex flex-wrap justify-between items-center gap-6 mb-16">
        <span className={`px-8 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl ${expert ? 'bg-amber-950' : 'bg-amber-500'}`}>
          Module {activeStep + 1}
        </span>
      </div>

      <h1 className="text-6xl md:text-7xl font-black text-stone-900 mb-10 tracking-tighter leading-none">{step.title}</h1>
      {/* Commands inside the description link to the explainer, so a beginner
          meeting `chmod -R 755` mid-step never has to leave to find out what
          -R does here. */}
      <p className="text-2xl text-stone-500 leading-relaxed mb-10 font-medium">
        <CommandText text={step.description} os={commandOs} />
      </p>

      {step.commands && step.commands.length > 0 && (
        <StepCommands commands={step.commands} os={commandOs} />
      )}

      {step.tips && step.tips.length > 0 && (
        // Tips were in the data and fed to the narration, but never rendered.
        <div className="mb-10 bg-amber-50/40 border-2 border-amber-100 rounded-[2rem] p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">Tips</p>
          <ul className="space-y-3">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="text-amber-500 font-black flex-shrink-0" aria-hidden="true">•</span>
                <span className="text-stone-600 font-medium leading-relaxed">
                  <CommandText text={tip} os={commandOs} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-16">
        <StepNarration
          stepKey={stepKey}
          title={step.title}
          description={step.description}
          tips={step.tips}
        />
      </div>

      {videoEnabled && (
        <div className="mb-16">
          <StepVideo appName={appName} stepTitle={step.title} description={step.description} stepKey={stepKey} />
        </div>
      )}

      <div className="relative mb-16">
        <StepIllustration
          step={step}
          activeStep={activeStep}
          exploringMode={exploringMode}
          imageUrl={imageUrl}
          isGeneratingImage={isGeneratingImage}
          imageFailed={imageFailed}
          onRetryImage={onRetryImage}
          onGenerateImage={onGenerateImage}
          onImageError={onImageError}
        />
      </div>

      {step.actionLabel && (
        <div className={`p-14 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_40px_80px_-20px_rgba(245,158,11,0.2)] mb-16 animate-in zoom-in-95 duration-700 ${expert ? 'bg-amber-950' : 'bg-amber-500 shadow-amber-100'}`}>
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 bg-white/10 rounded-[3rem] flex items-center justify-center text-6xl backdrop-blur-xl shadow-2xl border border-white/10 rotate-3" aria-hidden="true">🏁</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Mastery Certification Task</p>
              <h3 className="text-4xl font-black tracking-tighter leading-tight">{step.actionLabel}</h3>
            </div>
          </div>
          <button
            onClick={onToggleComplete}
            aria-pressed={isCompleted}
            className={`px-16 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 ${isCompleted ? 'bg-emerald-500 text-white scale-105' : 'bg-white text-stone-900 hover:bg-stone-50 hover:-translate-y-2'}`}
          >
            {isCompleted ? '✓ Skill Unlocked' : 'Execute Step'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-16 border-t-2 border-amber-50">
        <button
          disabled={activeStep === 0}
          onClick={onPrev}
          className="flex items-center gap-4 text-stone-300 font-black uppercase tracking-[0.3em] text-[10px] hover:text-amber-600 disabled:opacity-0 transition-colors"
        >
          <span className="w-12 h-12 rounded-2xl border-2 border-amber-50 flex items-center justify-center text-lg" aria-hidden="true">←</span>
          Previous Module
        </button>
        <button
          disabled={activeStep === totalSteps - 1}
          onClick={onNext}
          className={`text-white px-20 py-7 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 disabled:opacity-0 ${expert ? 'bg-amber-950 hover:bg-black shadow-stone-200' : 'bg-amber-500 hover:bg-stone-900 shadow-amber-200'}`}
        >
          Next Architecture →
        </button>
      </div>
    </section>
  );
};

export default StepPanel;
