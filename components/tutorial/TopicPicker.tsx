import React from 'react';
import { ExploringMode, Tutorial } from '../../types';
import PageMeta from '../PageMeta';

interface Props {
  tutorial: Tutorial;
  selectedVersion: string;
  exploringMode: ExploringMode;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onVersionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToggleMode: () => void;
  onSelectTopic: (topic: string) => void;
  onBackHome: () => void;
}

/** Landing screen for one application: pick a version, mode, and topic. */
const TopicPicker: React.FC<Props> = ({
  tutorial,
  selectedVersion,
  exploringMode,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onVersionChange,
  onToggleMode,
  onSelectTopic,
  onBackHome,
}) => {
  const expert = exploringMode === ExploringMode.EXPERT;
  const topics = expert ? tutorial.advancedTopics : tutorial.popularTopics;

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 animate-in fade-in slide-in-from-top-4 duration-1000">
      <PageMeta
        title={`${tutorial.name} guides`}
        description={`Version-aware ${tutorial.name} tutorials covering ${tutorial.popularTopics.slice(0, 3).join(', ')} and more.`}
      />

      {/* This screen previously had no way back — the only exit was the header
          logo, which is not obvious as a navigation control. */}
      <nav aria-label="Breadcrumb">
        <button
          onClick={onBackHome}
          className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-amber-600 transition-all flex items-center gap-4 group"
        >
          <span className="bg-white w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm" aria-hidden="true">←</span>
          All Guides
        </button>
      </nav>

      <div className="text-center">
        <div className="w-32 h-32 rounded-[3.5rem] bg-white mx-auto flex items-center justify-center text-7xl mb-10 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.3)] rotate-3 border-8 border-amber-50 transition-all hover:scale-110 hover:-rotate-3">
          {tutorial.icon}
        </div>
        <h1 className="text-7xl font-black text-stone-900 mb-6 tracking-tighter">Inside {tutorial.name}</h1>
        <p className="text-2xl text-stone-400 max-w-3xl mx-auto leading-relaxed font-medium mb-12">
          Select a specialized path or use our AI to analyze a specific feature for version {selectedVersion}.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 bg-white p-10 rounded-[4rem] shadow-sm border-[6px] border-amber-50/30 max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <label htmlFor="version-select" className="text-[10px] font-black text-amber-600/50 uppercase tracking-[0.3em]">
              Environment Version
            </label>
            <select
              id="version-select"
              value={selectedVersion}
              onChange={onVersionChange}
              className="appearance-none bg-amber-50/30 border-2 border-amber-100/50 px-10 py-4 rounded-3xl text-stone-900 font-black tracking-tight hover:border-amber-500 transition-all cursor-pointer outline-none min-w-[200px] text-center text-xs shadow-inner"
            >
              {tutorial.versions.map(v => (
                <option key={v} value={v}>Version {v}</option>
              ))}
            </select>
          </div>

          <div className="w-[1px] h-16 bg-amber-100/50 hidden sm:block" />

          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black text-amber-600/50 uppercase tracking-[0.3em]">Mastery Level</span>
            <button
              onClick={onToggleMode}
              className={`flex items-center gap-4 px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl ${expert ? 'bg-amber-950 text-amber-400' : 'bg-amber-500 text-white shadow-amber-200'}`}
            >
              <span className="text-xl" aria-hidden="true">{expert ? '💎' : '🌱'}</span>
              {exploringMode} View
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <form onSubmit={onSearchSubmit} className="relative group">
          <label htmlFor="feature-search" className="sr-only">Analyze a specific feature</label>
          <input
            id="feature-search"
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            placeholder={`Analyze any ${expert ? 'deep technical ' : ''}feature...`}
            className={`w-full h-24 bg-white rounded-[2.5rem] px-12 text-2xl font-bold text-stone-900 shadow-2xl focus:ring-[12px] outline-none transition-all pr-40 border-2 border-amber-50 ${expert ? 'focus:ring-amber-950/5' : 'focus:ring-amber-100/50'}`}
          />
          <button
            type="submit"
            className={`absolute right-4 top-4 bottom-4 px-10 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${expert ? 'bg-amber-950 hover:bg-stone-800' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            Consult AI
          </button>
        </form>
      </div>

      <div className="space-y-16">
        <div className="flex items-center gap-10">
          <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter">
            {expert ? 'Expert Architectures' : 'Standard Curricula'}
          </h2>
          <div className="h-[2px] flex-1 bg-amber-100/50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <button
            onClick={() => onSelectTopic('Absolute Basics & Key Interface Items')}
            className={`group p-12 rounded-[4rem] border-[6px] transition-all text-left relative overflow-hidden ${expert ? 'bg-amber-950 text-white border-stone-800 hover:border-amber-400' : 'bg-white text-stone-900 border-amber-50 hover:border-amber-500 shadow-sm hover:shadow-2xl'}`}
          >
            <div className="text-6xl mb-8 group-hover:scale-125 transition-transform duration-500" aria-hidden="true">🏁</div>
            <h3 className="text-3xl font-black mb-4">Core Essentials</h3>
            <p className={`${expert ? 'text-amber-100/40' : 'text-stone-400'} text-sm leading-relaxed font-medium`}>
              The VIP foundation for {tutorial.name} {selectedVersion}.
            </p>
          </button>

          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => onSelectTopic(topic)}
              className={`group p-12 rounded-[4rem] border-[6px] transition-all text-left relative overflow-hidden ${expert ? 'bg-amber-900 text-white border-amber-800 hover:border-amber-400' : 'bg-white text-stone-900 border-amber-50 hover:border-amber-500 shadow-sm hover:shadow-2xl'}`}
            >
              <div className="text-6xl mb-8 group-hover:scale-125 transition-transform duration-500" aria-hidden="true">
                {expert ? '🧪' : '✨'}
              </div>
              <h3 className="text-2xl font-black mb-4 leading-tight">{topic}</h3>
              <p className={`${expert ? 'text-amber-100/40' : 'text-stone-400'} text-sm leading-relaxed font-medium`}>
                {expert ? 'Deep architectural dissection.' : 'The golden path to feature mastery.'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicPicker;
