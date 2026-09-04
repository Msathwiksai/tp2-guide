import { CommandExplanation, CommandOS } from '../types';

/**
 * A local record of every command you have looked up.
 *
 * This is the part a chatbot cannot do: it remembers you across sessions, so
 * explanations can stop re-teaching what you already know and highlight only
 * what is new. Stored in localStorage — no account, nothing leaves the browser.
 */

const STORAGE_KEY = 'tp2:journal:v1';
/**
 * Bounded so the record cannot grow without limit; oldest lookups drop first.
 * Each entry now holds a full explanation (a few KB), and localStorage is only
 * ~5MB, so this is deliberately far below the 500 a summary-only record allowed.
 */
const MAX_ENTRIES = 200;

export interface JournalEntry {
  command: string;
  os: CommandOS;
  /** First token, e.g. "chmod" — flags are tracked against this. */
  base: string;
  risk: string;
  summary: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  /**
   * The full explanation, so re-opening a command you already looked up is
   * instant, costs nothing, and works with no network at all.
   */
  explanation?: CommandExplanation;
}

export interface JournalFlag {
  base: string;
  flag: string;
  meaning: string;
  /**
   * Deliberately two counters. Meeting a flag in a guide is not the same as
   * having had it explained, and only the latter may suppress teaching — if
   * scrolling past a step counted as understanding, tailoring would hide
   * explanations for things the reader never actually read.
   */
  explainedCount: number;
  encounteredCount: number;
  firstSeen: number;
  lastSeen: number;
}

export interface Journal {
  version: 2;
  entries: Record<string, JournalEntry>;
  /**
   * Keyed by `base::flag`, never by flag alone. `-r` means recursive in `rm`
   * and reverse in `sort`, so knowing one tells you nothing about the other.
   */
  flags: Record<string, JournalFlag>;
}

const empty = (): Journal => ({ version: 2, entries: {}, flags: {} });

/** v1 tracked a single `count`; everything in it came from an explanation. */
interface LegacyFlag { base: string; flag: string; meaning: string; count: number; firstSeen: number; lastSeen: number }

function migrate(parsed: { version?: number; entries?: Journal['entries']; flags?: Record<string, LegacyFlag> }): Journal {
  const flags: Journal['flags'] = {};
  for (const [key, value] of Object.entries(parsed.flags ?? {})) {
    flags[key] = {
      base: value.base,
      flag: value.flag,
      meaning: value.meaning,
      explainedCount: value.count ?? 0,
      encounteredCount: 0,
      firstSeen: value.firstSeen,
      lastSeen: value.lastSeen,
    };
  }
  return { version: 2, entries: parsed.entries ?? {}, flags };
}

/** localStorage throws outright in some privacy modes, so every access is guarded. */
export function readJournal(): Journal {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    if (!parsed?.entries || !parsed?.flags) return empty();
    // Upgrade rather than discard: losing someone's record on a schema bump
    // would be the worst possible outcome for a feature built on history.
    if (parsed.version === 1) return migrate(parsed);
    if (parsed.version !== 2) return empty();
    return parsed as Journal;
  } catch {
    return empty();
  }
}

function writeJournal(journal: Journal): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
  } catch {
    // Most likely the quota was exceeded now that entries carry full
    // explanations. Drop the oldest half and try once more rather than
    // silently losing every future write.
    try {
      const keys = Object.keys(journal.entries)
        .sort((a, b) => journal.entries[a].lastSeen - journal.entries[b].lastSeen);
      keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => delete journal.entries[k]);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
    } catch {
      // Storage genuinely unavailable — the journal just does not persist.
    }
  }
}

/**
 * A previously saved explanation, if there is one. Returning this instead of
 * calling the API makes a repeat lookup instant and free.
 */
export function getSavedExplanation(
  os: CommandOS,
  command: string,
): { explanation: CommandExplanation; savedAt: number } | null {
  const entry = readJournal().entries[entryKey(os, command.trim())];
  if (!entry?.explanation) return null;
  return { explanation: entry.explanation, savedAt: entry.lastSeen };
}

export const entryKey = (os: CommandOS, command: string) => `${os}::${command}`;
export const flagKey = (base: string, flag: string) => `${base}::${flag}`;

/** The command word a flag belongs to. */
export function baseOf(command: string): string {
  const tokens = command.trim().split(/\s+/);
  // `sudo rm -rf` is really about rm, not sudo.
  const first = tokens[0]?.toLowerCase() ?? '';
  if ((first === 'sudo' || first === 'doas') && tokens[1]) return tokens[1].toLowerCase();
  return first;
}

/**
 * How familiar each flag in this explanation already is, read *before* the
 * lookup is recorded — otherwise everything would always look familiar.
 */
export function familiarityFor(explanation: CommandExplanation): Record<string, number> {
  const journal = readJournal();
  const base = baseOf(explanation.normalized);
  const seen: Record<string, number> = {};
  for (const part of explanation.parts) {
    if (part.kind !== 'flag') continue;
    seen[part.token] = journal.flags[flagKey(base, part.token)]?.explainedCount ?? 0;
  }
  return seen;
}

/** Records one lookup. Safe to call repeatedly for the same command. */
export function recordLookup(explanation: CommandExplanation, os: CommandOS): void {
  const journal = readJournal();
  const now = Date.now();
  const command = explanation.normalized;
  const base = baseOf(command);

  const key = entryKey(os, command);
  const existing = journal.entries[key];
  journal.entries[key] = {
    command,
    os,
    base,
    risk: explanation.risk,
    summary: explanation.summary,
    count: (existing?.count ?? 0) + 1,
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    explanation,
  };

  for (const part of explanation.parts) {
    if (part.kind !== 'flag') continue;
    const fKey = flagKey(base, part.token);
    const prior = journal.flags[fKey];
    journal.flags[fKey] = {
      base,
      flag: part.token,
      meaning: part.meaning,
      explainedCount: (prior?.explainedCount ?? 0) + 1,
      encounteredCount: prior?.encounteredCount ?? 0,
      firstSeen: prior?.firstSeen ?? now,
      lastSeen: now,
    };
  }

  // Evict the least recently seen entries once over the cap.
  const keys = Object.keys(journal.entries);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => journal.entries[a].lastSeen - journal.entries[b].lastSeen)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach(k => delete journal.entries[k]);
  }

  writeJournal(journal);
}

/** Flag-shaped tokens: -r, -rf, --recursive, or Windows-style /s. */
const FLAG_TOKEN = /^(--?[A-Za-z][\w-]*|\/[A-Za-z]{1,3})$/;

const flagsIn = (command: string) => command.trim().split(/\s+/).filter(t => FLAG_TOKEN.test(t));

/**
 * Records that a set of commands was *met* while reading a guide.
 *
 * This never marks anything as understood — it only notes that the reader has
 * been shown it. That distinction is the whole point: it fills the record in
 * from normal reading without ever pretending someone learned something they
 * merely scrolled past.
 */
export function recordEncounter(os: CommandOS, commands: string[]): void {
  if (!commands.length) return;
  const journal = readJournal();
  const now = Date.now();
  let changed = false;

  for (const raw of commands) {
    const command = raw.trim();
    if (!command) continue;
    const base = baseOf(command);

    for (const flag of flagsIn(command)) {
      const key = flagKey(base, flag);
      const prior = journal.flags[key];
      // Once explained, an encounter adds nothing worth a write.
      if (prior?.explainedCount) continue;
      journal.flags[key] = {
        base,
        flag,
        meaning: prior?.meaning ?? '',
        explainedCount: 0,
        encounteredCount: (prior?.encounteredCount ?? 0) + 1,
        firstSeen: prior?.firstSeen ?? now,
        lastSeen: now,
      };
      changed = true;
    }
  }

  if (changed) writeJournal(journal);
}

/** Flags met in guides but never actually explained — worth learning next. */
export function encounteredOnly(journal: Journal): JournalFlag[] {
  return Object.values(journal.flags)
    .filter(f => f.explainedCount === 0 && f.encounteredCount > 0)
    .sort((a, b) => b.encounteredCount - a.encounteredCount);
}

export interface CommandFamiliarity {
  /** Times this exact command has been explained before. */
  seenCount: number;
  /** Present when a full explanation is cached, so no request is needed. */
  explanation?: CommandExplanation;
  flags: { flag: string; known: boolean; encountered: boolean; meaning?: string }[];
}

/**
 * What the reader already knows about one command, answered entirely from
 * local storage. This is what lets a guide skip re-explaining a flag someone
 * has already met, without a network call.
 */
export function familiarityForCommand(os: CommandOS, command: string): CommandFamiliarity {
  const journal = readJournal();
  const trimmed = command.trim();
  const base = baseOf(trimmed);
  const entry = journal.entries[entryKey(os, trimmed)];

  const flags = flagsIn(trimmed).map(flag => {
    const record = journal.flags[flagKey(base, flag)];
    return {
      flag,
      // Only an actual explanation counts as known; merely meeting a flag in a
      // guide is reported separately so nothing claims understanding it lacks.
      known: (record?.explainedCount ?? 0) > 0,
      encountered: (record?.encounteredCount ?? 0) > 0,
      meaning: record?.meaning || undefined,
    };
  });

  return { seenCount: entry?.count ?? 0, explanation: entry?.explanation, flags };
}

export interface KnownFlags {
  base: string;
  flags: string[];
}

/**
 * A compact summary of the flags you already know, for sending to generation.
 *
 * Capped hard: this rides in a prompt and in a cache key, and two readers with
 * the same knowledge should share a cached guide rather than each producing a
 * unique one. Sorted for exactly that reason — key stability.
 */
export function knownFlagSummary(limitBases = 12, limitFlags = 6): KnownFlags[] {
  const journal = readJournal();
  const byBase = new Map<string, { flag: string; lastSeen: number }[]>();

  for (const entry of Object.values(journal.flags)) {
    // Only what was genuinely explained may suppress teaching.
    if (entry.explainedCount === 0) continue;
    const list = byBase.get(entry.base) ?? [];
    list.push({ flag: entry.flag, lastSeen: entry.lastSeen });
    byBase.set(entry.base, list);
  }

  return [...byBase.entries()]
    // Most recently touched command families first, then trimmed.
    .sort((a, b) => Math.max(...b[1].map(f => f.lastSeen)) - Math.max(...a[1].map(f => f.lastSeen)))
    .slice(0, limitBases)
    .map(([base, flags]) => ({
      base,
      flags: flags.map(f => f.flag).sort().slice(0, limitFlags),
    }))
    .sort((a, b) => a.base.localeCompare(b.base));
}

export interface JournalStats {
  commands: number;
  lookups: number;
  flags: number;
  /** Looked up 3+ times — you keep needing to check these. */
  stillLearning: JournalFlag[];
}

export function journalStats(journal: Journal): JournalStats {
  const entries = Object.values(journal.entries);
  const flags = Object.values(journal.flags);
  return {
    commands: entries.length,
    lookups: entries.reduce((sum, e) => sum + e.count, 0),
    flags: flags.filter(f => f.explainedCount > 0).length,
    stillLearning: flags.filter(f => f.explainedCount >= 3).sort((a, b) => b.explainedCount - a.explainedCount).slice(0, 12),
  };
}

export function clearJournal(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — there was nothing stored, or storage is blocked.
  }
}
