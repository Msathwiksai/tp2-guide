import React from 'react';
import { ExploringMode } from '../../types';

interface Props {
  exploringMode: ExploringMode;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Free-text question box that hands the query to the floating AI mentor. */
const DoubtHub: React.FC<Props> = ({ exploringMode, value, onChange, onSubmit }) => {
  const expert = exploringMode === ExploringMode.EXPERT;

  return (
    <section
      id="doubt-hub"
      className={`bg-white rounded-[5rem] shadow-2xl border-[8px] overflow-hidden transition-all ${expert ? 'border-amber-950/5' : 'border-amber-50'}`}
    >
      <div className={`p-16 text-white relative ${expert ? 'bg-amber-950' : 'bg-stone-900'}`}>
        <div className="max-w-3xl relative z-10">
          <h2 className="text-6xl font-black mb-8 tracking-tighter">Feature Doubt?</h2>
          <form onSubmit={onSubmit} className="relative group">
            <label htmlFor="doubt-input" className="sr-only">Ask a question about this feature</label>
            <input
              id="doubt-input"
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="e.g. How do I optimize this specific workflow?"
              className="w-full h-28 bg-white rounded-[3rem] px-12 text-stone-900 text-2xl font-bold shadow-2xl outline-none pr-48 border-4 border-transparent focus:border-amber-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-5 top-5 bottom-5 px-12 text-white bg-amber-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all hover:bg-stone-900"
            >
              Consult AI
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default DoubtHub;
