
import React, { useState, useMemo } from 'react';
import { Tutorial, Category } from '../types';
import { GLOBAL_BASICS } from '../constants';
import { useNavigate } from 'react-router-dom';
import ScrollVideo from './ScrollVideo';

// Module scope: rebuilding this inside the component produced a new array
// identity every render, which invalidated the useMemo below on every render.
const CATEGORIES = Object.values(Category);

interface HomeProps {
  tutorials: Tutorial[];
  onSelect: (tutorial: Tutorial) => void;
  onWatchDemo: () => void;
  onStartCourse: () => void;
}

const Home: React.FC<HomeProps> = ({ tutorials, onSelect, onWatchDemo, onStartCourse }) => {
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [customAppName, setCustomAppName] = useState('');
  
  const navigate = useNavigate();

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat =>
      cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  }, [categorySearchQuery]);

  const tutorialsByCategory = useMemo(() => {
    const grouped: Record<string, Tutorial[]> = {};
    
    // First filter by general app/description search query
    const searchFiltered = tutorials.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group the filtered list
    searchFiltered.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });

    return grouped;
  }, [tutorials, searchQuery]);

  const handleCustomSynthesis = (name: string) => {
    if (name.trim()) {
      navigate(`/tutorial/${encodeURIComponent(name.trim())}`);
      setIsAddModalOpen(false);
    }
  };

  const openAddModal = (cat: Category) => {
    setTargetCategory(cat);
    setCustomAppName('');
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      <section className="text-center space-y-10 py-16 md:py-28 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-amber-50 rounded-full border border-amber-100 mb-8 animate-bounce">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">The Gold Standard of Learning</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-black text-stone-900 tracking-tighter leading-[0.9] mb-8">
            Master Tech <br/>
            <span className="text-amber-500 italic font-serif">Perfectly.</span>
          </h1>
          
          <div className="relative max-w-3xl mx-auto mb-12 px-4">
             <div className="absolute inset-0 bg-amber-500/10 blur-[60px] rounded-full -z-10"></div>
             <div className="relative group">
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search library or type any software name..."
                 className="w-full h-24 bg-white rounded-[2.5rem] px-12 text-2xl font-bold text-stone-900 shadow-2xl focus:ring-[12px] focus:ring-amber-100/50 outline-none transition-all border-2 border-amber-50 group-hover:border-amber-200"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-4xl opacity-20">🔍</div>
             </div>
          </div>

          <p className="text-xl md:text-2xl text-stone-400 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
            Professional AI-crafted visual intelligence for every application, OS, and web platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onStartCourse}
              className="w-full sm:w-auto bg-stone-950 text-white px-14 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-amber-500 transition-all hover:-translate-y-1 active:scale-95"
            >
              Begin Excellence
            </button>
            <button 
              onClick={onWatchDemo}
              className="w-full sm:w-auto bg-white text-stone-900 px-14 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-sm border-2 border-stone-100 hover:border-amber-400 transition-all hover:-translate-y-1 active:scale-95"
            >
              The Experience
            </button>
          </div>
        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/50 rounded-full blur-[160px]"></div>
        </div>
      </section>

      <ScrollVideo />

      {/* Library Section */}
      <section id="library-section" className="space-y-32">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-amber-100 pb-12">
          <div className="text-left">
            <h2 className="text-5xl font-black text-stone-900 tracking-tighter">The Library</h2>
            <p className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Browse categories or synthesize new knowledge</p>
          </div>
          
          {/* Category Specific Search */}
          <div className="relative w-full md:w-96 group">
            <input 
              type="text" 
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              placeholder="Filter Categories..."
              className="w-full h-16 bg-white border-2 border-amber-50 rounded-2xl px-12 text-sm font-bold text-stone-900 shadow-sm focus:ring-4 focus:ring-amber-100/50 outline-none transition-all group-hover:border-amber-200"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">📂</div>
            {categorySearchQuery && (
              <button 
                onClick={() => setCategorySearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold hover:bg-stone-200 transition-colors"
                title="Clear Category Filter"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {filteredCategories.map((cat) => {
          const categoryTutorials = tutorialsByCategory[cat] || [];
          if (searchQuery && categoryTutorials.length === 0) return null;

          return (
            <div key={cat} className="space-y-12">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b-2 border-amber-50 pb-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-amber-100">
                    {getCategoryIcon(cat)}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase">{cat}</h2>
                    <p className="text-stone-400 text-xs font-black uppercase tracking-[0.2em]">{categoryTutorials.length} Curated Guides</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => openAddModal(cat)}
                  className="group flex items-center gap-4 px-8 py-4 bg-white rounded-2xl border-2 border-amber-100 text-stone-900 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm active:scale-95"
                >
                  <span className="text-lg bg-amber-50 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-all">+</span>
                  New {cat} Guide
                </button>
              </div>

              {categoryTutorials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  {categoryTutorials.map((tutorial) => (
                    <button
                      key={tutorial.id}
                      onClick={() => onSelect(tutorial)}
                      title={`Open guide for ${tutorial.name}`}
                      className="group flex flex-col bg-white rounded-[3rem] p-10 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(251,191,36,0.3)] transition-all duration-500 border-4 border-transparent hover:border-amber-200 text-left relative overflow-hidden active:scale-[0.98] hover:-translate-y-3"
                    >
                      <div className={`w-20 h-20 rounded-[2rem] bg-stone-50 flex items-center justify-center text-4xl mb-10 shadow-inner group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 border border-stone-100`}>
                        {tutorial.icon}
                      </div>
                      <h3 className="text-2xl font-black text-stone-900 mb-4 tracking-tight leading-tight group-hover:text-amber-600 transition-colors">{tutorial.name}</h3>
                      <p className="text-stone-400 text-xs mb-12 leading-relaxed font-medium line-clamp-2">{tutorial.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <span className="text-[8px] uppercase tracking-widest font-black text-stone-400 px-3 py-1.5 bg-stone-50 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                          {tutorial.versions.length} Versions
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center border-4 border-dashed border-amber-100 rounded-[4rem] bg-amber-50/20">
                  <p className="text-amber-600/50 font-black text-[10px] uppercase tracking-widest">No matching {cat} apps in library</p>
                  <button 
                    onClick={() => openAddModal(cat)}
                    className="mt-6 text-amber-600 font-black text-xs underline decoration-2 underline-offset-4 hover:text-amber-800 transition-colors"
                  >
                    Generate a new guide for this category
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Global Fallback when no apps match and no categories match CATEGORY search */}
        {(filteredCategories.length === 0 || (searchQuery && Object.keys(tutorialsByCategory).length === 0)) && (
          <div className="bg-stone-900 rounded-[4rem] p-20 text-center space-y-10 relative overflow-hidden">
             <div className="relative z-10">
               <div className="text-8xl mb-6">{filteredCategories.length === 0 ? '📂' : '🚀'}</div>
               <h3 className="text-5xl font-black text-white tracking-tighter">
                {filteredCategories.length === 0 ? 'No Categories Found' : 'Initiate Custom Synthesis?'}
               </h3>
               <p className="text-amber-100/40 text-xl max-w-xl mx-auto leading-relaxed">
                 {filteredCategories.length === 0 
                  ? `We couldn't find any categories matching "${categorySearchQuery}". Try a different term or clear the filter.`
                  : `"${searchQuery}" isn't in our curated library, but our AI can synthesize a professional guide for it right now.`
                 }
               </p>
               {filteredCategories.length === 0 ? (
                 <button 
                  onClick={() => setCategorySearchQuery('')}
                  className="mt-12 bg-white text-stone-900 px-16 py-7 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-white transition-all shadow-2xl"
                 >
                   Clear Category Filter
                 </button>
               ) : (
                 <button 
                  onClick={() => handleCustomSynthesis(searchQuery)}
                  className="mt-12 bg-amber-500 text-white px-16 py-7 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-stone-900 transition-all shadow-2xl"
                 >
                   Create Guide for "{searchQuery}"
                 </button>
               )}
             </div>
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
          </div>
        )}
      </section>

      {/* Add Custom Guide Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-xl animate-in fade-in duration-500" role="dialog" aria-modal="true" aria-labelledby="new-guide-title">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_150px_-30px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 border-8 border-amber-50">
            <div className="p-12 md:p-16 space-y-10">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <span className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">⚡</span>
                    <div>
                      <h2 id="new-guide-title" className="text-3xl font-black text-stone-900 tracking-tighter">New Synthesis</h2>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Targeting: {targetCategory}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} aria-label="Close new guide dialog" className="text-3xl font-light text-stone-300 hover:text-stone-900 transition-colors">×</button>
               </div>

               <p className="text-stone-400 font-medium leading-relaxed">
                 Type the name of any real application, operating system, or website. Our AI will verify its existence and synthesize a professional curriculum.
               </p>

               <div className="space-y-6">
                 <input 
                  autoFocus
                  type="text" 
                  value={customAppName}
                  onChange={(e) => setCustomAppName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSynthesis(customAppName)}
                  placeholder="e.g. Blender 4.2, Salesforce, or Arch Linux"
                  className="w-full h-24 bg-stone-50 rounded-[2rem] px-10 text-xl font-bold text-stone-900 border-4 border-transparent focus:border-amber-500 outline-none transition-all shadow-inner"
                 />
                 <button 
                  onClick={() => handleCustomSynthesis(customAppName)}
                  className="w-full h-20 bg-stone-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all shadow-2xl active:scale-[0.98]"
                 >
                   Synthesize Professional Guide
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Basics */}
      <section className="bg-white border-[6px] border-amber-50/50 rounded-[4rem] p-12 md:p-20 shadow-2xl shadow-amber-100/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight flex items-center gap-4">
              <span className="text-amber-500">⚡</span>
              Mastery Shortcuts
            </h2>
            <p className="text-amber-600/60 font-black text-[10px] uppercase tracking-[0.3em] mt-3">Universal efficiency at your fingertips</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {GLOBAL_BASICS.map((item, idx) => (
            <div key={idx} className="group p-8 rounded-[3rem] bg-stone-50 border-2 border-transparent hover:border-amber-200 hover:bg-white transition-all shadow-sm hover:shadow-2xl">
              <div className="text-5xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">{item.icon}</div>
              <div className="font-black text-xl text-stone-900 mb-2">{item.title}</div>
              <div className="text-amber-600 font-black font-mono text-[10px] p-2 bg-amber-50/50 rounded-lg inline-block border border-amber-100/20">
                {item.keys}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const getCategoryIcon = (cat: Category) => {
  switch (cat) {
    case Category.OS: return '🪟';
    case Category.CREATIVE: return '🎨';
    case Category.DESIGN: return '🖌️';
    case Category.OFFICE: return '📊';
    case Category.PRODUCTIVITY: return '📝';
    case Category.DEV: return '💻';
    case Category.COMMUNICATION: return '💬';
    case Category.STREAMING: return '🍿';
    case Category.E_COMMERCE: return '📦';
    case Category.CLOUD: return '☁️';
    case Category.FINANCE: return '💰';
    case Category.SECURITY: return '🛡️';
    case Category.SOCIAL_MEDIA: return '📱';
    case Category.DEVOPS: return '🐳';
    case Category.ENGINEERING: return '📐';
    case Category.COLLABORATION: return '🤝';
    default: return '✨';
  }
};

export default Home;
