
import React from 'react';
import { NavLink } from 'react-router-dom';

interface HeaderProps {
  onHome: () => void;
  onGetStarted: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-bold text-[10px] uppercase tracking-[0.2em] transition-colors ${
    isActive ? 'text-amber-600' : 'text-stone-500 hover:text-amber-600'
  }`;

const Header: React.FC<HeaderProps> = ({ onHome, onGetStarted }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-amber-100/50 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <button 
          onClick={onHome}
          className="flex items-center gap-3 font-black text-2xl text-stone-900 hover:scale-105 transition-transform"
        >
          <span className="bg-amber-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">🎓</span>
          <span className="tracking-tighter">Tp2 Guide</span>
        </button>
        
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onHome} className="text-stone-500 hover:text-amber-600 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors">Explorer</button>
          <NavLink to="/tips" className={navLinkClass}>Tips</NavLink>
          <NavLink to="/docs" className={navLinkClass}>Docs</NavLink>
          <NavLink to="/community" className={navLinkClass}>Community</NavLink>
          <div className="h-4 w-[1px] bg-amber-100"></div>
          <button 
            onClick={onGetStarted}
            className="bg-amber-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 shadow-lg shadow-amber-100 transition-all active:scale-95"
          >
            Get Started
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
