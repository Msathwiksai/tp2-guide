import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Changing this resets the boundary — used to recover on navigation. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Without a boundary, any render-time exception unmounts the whole React tree
 * and leaves a blank white page with no way back — the user cannot even
 * navigate away. This catches it, shows something actionable, and resets
 * automatically when the route changes.
 *
 * Must be a class: there is no hook equivalent of componentDidCatch.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Render error caught by boundary:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    // Recover when the user navigates somewhere else.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="max-w-3xl mx-auto py-40 text-center space-y-12 animate-in zoom-in-95 duration-700" role="alert">
        <div className="text-8xl" aria-hidden="true">💥</div>
        <h1 className="text-6xl font-black text-stone-900 tracking-tighter">Something Broke</h1>
        <p className="text-xl text-stone-400 font-medium leading-relaxed bg-white p-12 rounded-[3rem] border-4 border-amber-50">
          An unexpected error stopped this page from rendering. The rest of the app still works.
        </p>
        <details className="bg-stone-950 rounded-[2rem] p-8 text-left max-w-2xl mx-auto">
          <summary className="text-amber-400 font-black uppercase tracking-widest text-[10px] cursor-pointer">
            Technical details
          </summary>
          <pre className="mt-6 text-amber-300/80 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
        <div className="flex flex-wrap gap-6 justify-center">
          <button
            onClick={() => this.setState({ error: null })}
            className="bg-amber-500 text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-stone-900 transition-all"
          >
            Try Again
          </button>
          <a
            href="#/"
            onClick={() => this.setState({ error: null })}
            className="bg-stone-100 text-stone-500 px-14 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all border border-stone-200"
          >
            Back to the Library
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
