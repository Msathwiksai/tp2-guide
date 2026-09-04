import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageMeta from '../PageMeta';

/** Without this, any unknown or stale link rendered a completely blank page. */
const NotFound: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <div className="max-w-3xl mx-auto py-40 text-center space-y-12 animate-in zoom-in-95 duration-700">
      {/* Without this the 404 inherited the previous route's title, so search
          engines and share previews would mislabel a missing page. */}
      <PageMeta title="Page not found" description="This page does not exist on Tp2 Guide." />
      <div className="text-8xl" aria-hidden="true">🧭</div>
      <h1 className="text-7xl font-black text-stone-900 tracking-tighter">Page Not Found</h1>
      <p className="text-xl text-stone-400 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-50">
        Nothing lives at <code className="text-stone-900 font-black font-mono text-base">{pathname}</code>.
        It may have moved, or the link may be out of date.
      </p>
      <div className="flex flex-wrap gap-6 justify-center">
        <Link
          to="/"
          className="bg-stone-900 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-amber-500 transition-all"
        >
          Back to the Library
        </Link>
        <Link
          to="/docs"
          className="bg-stone-100 text-stone-500 px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all border border-stone-200"
        >
          Read the Docs
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
