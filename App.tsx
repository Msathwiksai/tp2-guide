
import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
const TutorialView = lazy(() => import('./components/TutorialView'));
import AIChat from './components/AIChat';
const Tips = lazy(() => import('./components/pages/Tips'));
const Docs = lazy(() => import('./components/pages/Docs'));
const ApiDocs = lazy(() => import('./components/pages/ApiDocs'));
const Community = lazy(() => import('./components/pages/Community'));
const Insights = lazy(() => import('./components/pages/Insights'));
const Legal = lazy(() => import('./components/pages/Legal'));
const NotFound = lazy(() => import('./components/pages/NotFound'));
const Commands = lazy(() => import('./components/pages/Commands'));
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { Tutorial } from './types';
import { TUTORIALS } from './constants';

/**
 * React Router reuses the same component instance when only the :id param
 * changes, so TutorialView kept every piece of state across tutorials — most
 * damagingly `selectedVersion`. Going Windows -> macOS left it as "11": the
 * dropdown *looked* right (the browser falls back to the first option when the
 * value is not in the list) while requests still sent a Windows version.
 * Keying on the id forces a clean remount per tutorial.
 */
/** Shown while a lazily-loaded route chunk is fetched. */
const RouteFallback: React.FC = () => (
  <div className="flex items-center justify-center py-60" role="status" aria-label="Loading page">
    <div className="relative">
      <div className="w-20 h-20 border-[6px] border-amber-50 rounded-full" />
      <div className="absolute top-0 w-20 h-20 border-[6px] border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const KeyedTutorialView: React.FC<{ onAskDoubt: (question: string) => void }> = ({ onAskDoubt }) => {
  const { id } = useParams<{ id: string }>();
  return <TutorialView key={id} onAskDoubt={onAskDoubt} />;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [externalMessage, setExternalMessage] = useState<string | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleSelectTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    navigate(`/tutorial/${tutorial.id}`);
  };

  const askAIDoubt = (question: string) => {
    setExternalMessage(question);
  };

  const scrollToLibrary = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('library-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('library-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdfa] flex flex-col text-stone-900">
      <ScrollToTop />
      <Header
        onHome={() => {
          setSelectedTutorial(null);
          navigate('/');
        }} 
        onGetStarted={scrollToLibrary}
      />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        {/* resetKey clears a caught error as soon as the user navigates away,
            so one broken page never traps them. */}
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                onSelect={handleSelectTutorial} 
                tutorials={TUTORIALS} 
                onWatchDemo={() => setIsDemoOpen(true)}
                onStartCourse={() => handleSelectTutorial(TUTORIALS[0])}
              />
            } 
          />
          <Route
            path="/tutorial/:id"
            element={<KeyedTutorialView onAskDoubt={askAIDoubt} />}
          />
          <Route path="/tips" element={<Tips />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/api" element={<ApiDocs />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/community" element={<Community onAskDoubt={askAIDoubt} />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Demo Modal */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-xl animate-in fade-in duration-500" role="dialog" aria-modal="true" aria-labelledby="demo-title">
          <div className="bg-white rounded-[4rem] w-full max-w-3xl overflow-hidden shadow-[0_50px_150px_-30px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 border-8 border-amber-50">
            <div className="p-16 text-center space-y-8">
              <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center text-5xl mx-auto shadow-inner border border-amber-100 animate-pulse">🎬</div>
              <h2 id="demo-title" className="text-5xl font-black text-stone-900 tracking-tighter leading-none">The Platinum Experience</h2>
              <p className="text-stone-400 text-xl font-medium leading-relaxed">
                Step into a world where technology adapts to you. Our Gemini-powered engine crafts visual masterpieces for any software environment.
              </p>
              <div className="bg-amber-50/30 rounded-[2.5rem] p-10 border border-amber-100 text-left space-y-6">
                <div className="flex gap-5 items-center">
                  <span className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xs font-black shadow-lg shadow-amber-200">01</span>
                  <span className="font-black text-stone-800 text-sm uppercase tracking-widest">Contextual Visual Synthesis</span>
                </div>
                <div className="flex gap-5 items-center">
                  <span className="w-10 h-10 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg">02</span>
                  <span className="font-black text-stone-800 text-sm uppercase tracking-widest">Version-Specific Precision</span>
                </div>
              </div>
              <button 
                onClick={() => setIsDemoOpen(false)}
                className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-900 transition-all shadow-2xl active:scale-95"
              >
                Enter Tp2 Guide
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChat
        activeContext={selectedTutorial?.name || TUTORIALS.find(tutorial => location.pathname.endsWith(`/tutorial/${tutorial.id}`))?.name || "Premium Consulting"} 
        externalMessage={externalMessage}
        onMessageHandled={() => setExternalMessage(null)}
      />

      <footer className="bg-amber-950 text-white py-20 mt-32 relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-20 text-center md:text-left relative z-10">
          <div className="md:col-span-2 space-y-8">
             <div className="font-black text-4xl text-white flex items-center justify-center md:justify-start gap-4 tracking-tighter">
                <span className="bg-amber-500 text-amber-950 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg">🎓</span>
                Tp2 Guide
             </div>
             <p className="text-amber-100/30 text-lg max-w-md font-medium leading-relaxed">Redefining human capability through the seamless integration of AI and educational design. The gold standard for software mastery.</p>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-amber-500 uppercase tracking-[0.4em] text-[10px]">Resource Hub</h4>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-white/50">
              <li><Link to="/docs" className="hover:text-amber-400 transition-colors">Documentation</Link></li>
              <li><Link to="/commands" className="hover:text-amber-400 transition-colors">Command Explainer</Link></li>
              <li><Link to="/api" className="hover:text-amber-400 transition-colors">Elite API</Link></li>
              <li><Link to="/insights" className="hover:text-amber-400 transition-colors">Insights</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-amber-500 uppercase tracking-[0.4em] text-[10px]">Concierge</h4>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-white/50">
              <li><Link to="/community" className="hover:text-amber-400 transition-colors">Support Center</Link></li>
              <li><Link to="/legal" className="hover:text-amber-400 transition-colors">Legal Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 pt-20 border-t border-white/5 text-center text-white/10 text-[8px] font-black uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} Tp2 Guide. Excellence Secured.
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
      </footer>
    </div>
  );
};

export default App;
