import { useSyncExternalStore } from 'react';

/**
 * User preferences, stored per browser.
 *
 * Defaults are chosen for the free tier, where images and video have no quota
 * at all — so nothing expensive happens unless it is asked for. Someone running
 * this with billing enabled can flip them and get the automatic behaviour.
 */

const STORAGE_KEY = 'tp2:prefs:v1';
const CHANGE_EVENT = 'tp2:prefs-changed';

export interface Preferences {
  /** Generate a step illustration automatically instead of on request. */
  autoImages: boolean;
  /** Start guides tailored to what the journal says you already know. */
  tailorByDefault: boolean;
  /** Record commands met while reading, not just ones looked up. */
  trackEncounters: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  autoImages: false,
  tailorByDefault: false,
  trackEncounters: true,
};

// useSyncExternalStore compares snapshots by reference, so the parsed object is
// cached and only replaced on an actual write. Returning a fresh object each
// read would loop forever.
let cache: Preferences | null = null;

function load(): Preferences {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    cache = DEFAULT_PREFERENCES;
  }
  return cache;
}

export function getPreferences(): Preferences {
  return load();
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  const next = { ...load(), [key]: value };
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the choice still applies for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resetPreferences(): void {
  cache = DEFAULT_PREFERENCES;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored, or storage blocked.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void): () => void {
  // A write in another tab bypasses this tab's cache, so it must be dropped
  // before notifying or the reader would keep serving stale values.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

/** Live preferences: components re-render when they change, in any tab. */
export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, () => DEFAULT_PREFERENCES);
}
