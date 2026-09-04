import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Browsers preserve scroll position across client-side navigations, so moving
 * from a scrolled page to a new route used to land you halfway down it.
 * Resets to the top whenever the path changes (not on search/hash-only edits).
 */
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' });
    // `search` matters too: a guide's topic/version/mode live in the query, so
    // switching guides changes only the query and should still start at the top.
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
