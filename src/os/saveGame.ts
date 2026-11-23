import { AchievementProgress, EMPTY_ACHIEVEMENT_PROGRESS } from './achievements';
import { CaseState, ChatThread, EmailItem, FSNode } from './types';

export const SAVE_SLOT_COUNT = 3;
const STORAGE_KEY = 'dessert-town-saves-v1';

export interface SaveData {
  version: 1;
  savedAt: string;
  chapter: number;
  discoveredClues: string[];
  caseState: CaseState;
  timelinePlacements: Record<string, number>;
  fsNodes: FSNode[];
  emails: EmailItem[];
  chats: ChatThread[];
  achievements: AchievementProgress;
  chapterFails: Record<number, boolean>;
  elapsedSeconds: number;
  musicUnlocked: boolean;
  musicTrack: number;
}

export type SaveSlots = (SaveData | null)[];

function emptySlots(): SaveSlots {
  return Array.from({ length: SAVE_SLOT_COUNT }, () => null);
}

function normalizeSlot(value: unknown): SaveData | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<SaveData>;
  if (v.version !== 1) return null;
  if (!v.caseState || typeof v.caseState !== 'object') return null;
  if (!Array.isArray(v.fsNodes) || !Array.isArray(v.emails) || !Array.isArray(v.chats)) {
    return null;
  }
  return {
    version: 1,
    savedAt: typeof v.savedAt === 'string' ? v.savedAt : new Date().toISOString(),
    chapter: typeof v.chapter === 'number' ? v.chapter : v.caseState.chapter ?? 1,
    discoveredClues: Array.isArray(v.discoveredClues) ? v.discoveredClues : [],
    caseState: v.caseState,
    timelinePlacements:
      v.timelinePlacements && typeof v.timelinePlacements === 'object'
        ? v.timelinePlacements
        : {},
    fsNodes: v.fsNodes,
    emails: v.emails,
    chats: v.chats,
    achievements: { ...EMPTY_ACHIEVEMENT_PROGRESS, ...(v.achievements ?? {}) },
    chapterFails: v.chapterFails && typeof v.chapterFails === 'object' ? v.chapterFails : {},
    elapsedSeconds: typeof v.elapsedSeconds === 'number' ? v.elapsedSeconds : 0,
    musicUnlocked: !!v.musicUnlocked,
    musicTrack: typeof v.musicTrack === 'number' ? v.musicTrack : 0,
  };
}

export function readSaveSlots(): SaveSlots {
  if (typeof window === 'undefined') return emptySlots();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySlots();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptySlots();
    return emptySlots().map((_, index) => normalizeSlot(parsed[index]));
  } catch {
    return emptySlots();
  }
}

export function writeSaveSlot(index: number, data: SaveData): void {
  if (typeof window === 'undefined') return;
  const slots = readSaveSlots();
  if (index < 0 || index >= slots.length) return;
  slots[index] = data;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    // 忽略隐私模式或容量不足导致的写入失败
  }
}

export function removeSaveSlot(index: number): void {
  if (typeof window === 'undefined') return;
  const slots = readSaveSlots();
  if (index < 0 || index >= slots.length) return;
  slots[index] = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    // 忽略写入失败
  }
}
