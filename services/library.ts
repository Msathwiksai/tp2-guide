import { useSyncExternalStore } from 'react';
import { Category, Tutorial } from '../types';

/**
 * Applications the reader has synthesised, kept so the library grows.
 *
 * Generating a guide for software that is not in the built-in list costs a
 * verification call and a generation call. Before this, none of that was
 * recorded: the app vanished the moment the URL changed, its category page
 * still read "0 curated guides", and coming back meant paying for the same
 * calls again. Anything already bought should stay bought.
 *
 * Stored per browser, alongside the command journal, for the same reason: there
 * are no accounts, so there is nowhere else to put it.
 */
const STORAGE_KEY = 'tp2:library:v1';

export type SavedApp = {
  id: string;
  name: string;
  category: Category;
  icon: string;
  versions: string[];
  /** Epoch ms, used to show the newest first. */
  addedAt: number;
};

const listeners = new Set<() => void>();
// useSyncExternalStore compares snapshots by reference, so the parsed array is
// cached and only rebuilt when the underlying storage actually changes.
let cache: SavedApp[] | null = null;
const EMPTY: SavedApp[] = [];

function read(): SavedApp[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(isSavedApp) : EMPTY;
  } catch {
    // Throws outright in some privacy modes, so a failure to read is normal.
    cache = EMPTY;
  }
  return cache;
}

function isSavedApp(value: unknown): value is SavedApp {
  const app = value as SavedApp;
  return !!app && typeof app.id === 'string' && typeof app.name === 'string' && Array.isArray(app.versions);
}

function write(apps: SavedApp[]): void {
  cache = apps;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch {
    // Full or blocked storage should not break the guide the reader is reading.
  }
  listeners.forEach(listener => listener());
}

export function getSavedApps(): SavedApp[] {
  return read();
}

/**
 * Records an app, or refreshes what is known about one already saved.
 *
 * Re-saving keeps the original `addedAt` so the library does not reshuffle
 * every time someone reopens an old guide.
 */
export function saveApp(app: Omit<SavedApp, 'addedAt'>): void {
  if (!app.id || !app.name) return;
  const existing = read();
  const previous = existing.find(saved => saved.id === app.id);
  const next = [
    { ...app, addedAt: previous?.addedAt ?? Date.now() },
    ...existing.filter(saved => saved.id !== app.id),
  ];
  write(next);
}

export function removeApp(id: string): void {
  write(read().filter(app => app.id !== id));
}

export function clearLibrary(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the caller cannot fix a storage failure either.
  }
  listeners.forEach(listener => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    // Drop the cached snapshot before notifying, or another tab's write is
    // announced while this tab still serves the stale array.
    cache = null;
    callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSavedApps(): SavedApp[] {
  return useSyncExternalStore(subscribe, getSavedApps, () => EMPTY);
}

/** Shapes a saved app into the same record the built-in library uses. */
export function toTutorial(app: SavedApp): Tutorial {
  return {
    id: app.id,
    name: app.name,
    category: app.category,
    description: `Synthesised guide for ${app.name}.`,
    icon: app.icon || '⚙️',
    color: 'bg-stone-900',
    popularTopics: ['Getting started', 'Core features', 'Common problems'],
    advancedTopics: ['Configuration', 'Performance tuning'],
    versions: app.versions.length ? app.versions : ['Current'],
  };
}
