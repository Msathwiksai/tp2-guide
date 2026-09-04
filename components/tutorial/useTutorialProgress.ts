import { useCallback, useEffect, useState } from 'react';

/** localStorage throws outright in some privacy modes, so every access is guarded. */
function readProgress(key: string | null): Set<number> {
  if (!key) return new Set();
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Completed-step tracking, persisted per guide identity.
 *
 * `key` must identify one specific generated guide (app + topic + version +
 * mode): step numbers are meaningless outside the guide they came from.
 * Passing null disables persistence, for when no topic is selected yet.
 */
export function useTutorialProgress(key: string | null) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => readProgress(key));

  // Resetting during render is React's documented pattern for reacting to an
  // identity change. Doing this in an effect triggers a cascading second render.
  const [restoredKey, setRestoredKey] = useState<string | null>(key);
  if (key !== restoredKey) {
    setRestoredKey(key);
    setCompletedSteps(readProgress(key));
  }

  useEffect(() => {
    if (!key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify([...completedSteps]));
    } catch {
      // Storage unavailable or full — progress simply is not persisted.
    }
  }, [key, completedSteps]);

  const toggleStep = useCallback((index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return { completedSteps, toggleStep };
}
