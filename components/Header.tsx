import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface HeaderProps {
  onHome: () => void;
  onGetStarted: () => void;
}

const NAV_LINKS = [
  { to: '/tips', label: 'Tips' },
  { to: '/commands', label: 'Commands' },
  { to: '/journal', label: 'Journal' },
  { to: '/docs', label: 'Docs' },
  { to: '/community', label: 'Community' },
  { to: '/settings', label: 'Settings' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-bold text-[10px] uppercase tracking-[0.2em] transition-colors ${
    isActive ? 'text-amber-600' : 'text-stone-500 hover:text-amber-600'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-colors ${
    isActive ? 'bg-amber-500 text-white' : 'text-stone-600 hover:bg-amber-50'
  }`;

const Header: React.FC<HeaderProps> = ({ onHome, onGetStarted }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Navigating away should never leave the menu covering the page. Closed
  // during render rather than in an effect, which would cost a second render.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      // Return focus to the control that opened it, or keyboard users are lost.
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Move focus into the panel when it opens so it is reachable by keyboard.
  useEffect(() => {
    if (menuOpen) panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-amber-100/50 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <button
          onClick={onHome}
          className="flex items-center gap-3 font-black text-xl sm:text-2xl text-stone-900 hover:scale-105 transition-transform min-w-0"
        >
          <span className="bg-amber-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0" aria-hidden="true">🎓</span>
          <span className="tracking-tighter truncate">Tp2 Guide</span>
        </button>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main">
          <button onClick={onHome} className="text-stone-500 hover:text-amber-600 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors">Explorer</button>
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>{link.label}</NavLink>
          ))}
          <div className="h-4 w-[1px] bg-amber-100" />
          <button
            onClick={onGetStarted}
            className="bg-amber-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 shadow-lg shadow-amber-100 transition-all active:scale-95"
          >
            Get Started
          </button>
        </nav>

        {/* Below md the nav is hidden entirely; without this every page beyond
            the home screen was unreachable on a phone. */}
        <button
          ref={toggleRef}
          onClick={() => setMenuOpen(open => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden w-12 h-12 rounded-2xl border-2 border-amber-100 flex flex-col items-center justify-center gap-1.5 flex-shrink-0 hover:border-amber-400 transition-colors"
        >
          <span className={`block w-5 h-0.5 bg-stone-700 transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-stone-700 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-stone-700 transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-20 bg-stone-900/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            ref={panelRef}
            className="md:hidden relative bg-white border-t border-amber-100 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <nav className="container mx-auto px-4 py-6 space-y-2" aria-label="Main">
              <button
                onClick={() => { setMenuOpen(false); onHome(); }}
                className="block w-full text-left px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-stone-600 hover:bg-amber-50 transition-colors"
              >
                Explorer
              </button>
              {NAV_LINKS.map(link => (
                <NavLink key={link.to} to={link.to} className={mobileLinkClass}>
                  {link.label}
                </NavLink>
              ))}
              <button
                onClick={() => { setMenuOpen(false); onGetStarted(); }}
                className="w-full bg-amber-500 text-white px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-900 transition-all mt-4"
              >
                Get Started
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
