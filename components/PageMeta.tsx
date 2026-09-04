import { useEffect } from 'react';

const SITE = 'Tp2 Guide';
const DEFAULT_DESCRIPTION =
  'Step-by-step software guides generated for the exact version you have installed.';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets the document title, description and canonical URL per route.
 *
 * Every route previously shared one static title, so search results and link
 * previews were identical no matter which page was shared. Done imperatively
 * rather than with a helmet library to avoid another dependency.
 */
const PageMeta: React.FC<{ title: string; description?: string }> = ({
  title,
  description = DEFAULT_DESCRIPTION,
}) => {
  useEffect(() => {
    const full = title === SITE ? `${SITE} — Version-aware software tutorials` : `${title} — ${SITE}`;
    document.title = full;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', full);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    // Canonical prevents the same content being indexed under several URLs.
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + window.location.pathname;

    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical.href);
  }, [title, description]);

  return null;
};

export default PageMeta;
