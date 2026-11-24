import { AchievementProgress, EMPTY_ACHIEVEMENT_PROGRESS } from './achievements';
import { CaseState, ChatThread, EmailItem, FSNode } from './types';
import { readCloudBlob, writeCloudBlob } from './saveStore';

export const SAVE_SLOT_COUNT = 3;
const CURRENT_VERSION = 1;

interface FullCloudPayload {
  version: number;
  saves: (SaveData | null)[];
  achievements: AchievementProgress;
}

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

function emptyPayload(): FullCloudPayload {
  return {
    version: CURRENT_VERSION,
    saves: Array.from({ length: SAVE_SLOT_COUNT }, () => null),
    achievements: { ...EMPTY_ACHIEVEMENT_PROGRESS },
  };
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

function normalizePayload(raw: unknown): FullCloudPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<FullCloudPayload>;
  if (!Array.isArray(r.saves)) return null;
  return {
    version: typeof r.version === 'number' ? r.version : CURRENT_VERSION,
    saves: Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => normalizeSlot(r.saves?.[i])),
    achievements: {
      ...EMPTY_ACHIEVEMENT_PROGRESS,
      ...(r.achievements ?? {}),
    },
  };
}

/** 内部：读云 blob */
async function loadPayload(): Promise<FullCloudPayload> {
  const raw = await readCloudBlob();
  if (raw && raw.version === CURRENT_VERSION) {
    const p = normalizePayload(raw);
    if (p) return p;
  }
  return emptyPayload();
}

async function savePayload(p: FullCloudPayload): Promise<void> {
  await writeCloudBlob(p as any);
}

// ---- 对外 API ----

export async function readSaveSlots(): Promise<SaveSlots> {
  const p = await loadPayload();
  return p.saves;
}

export async function writeSaveSlot(index: number, data: SaveData): Promise<void> {
  const p = await loadPayload();
  if (index < 0 || index >= p.saves.length) return;
  p.saves[index] = data;
  await savePayload(p);
}

export async function removeSaveSlot(index: number): Promise<void> {
  const p = await loadPayload();
  if (index < 0 || index >= p.saves.length) return;
  p.saves[index] = null;
  await savePayload(p);
}

export async function readAchievementProgress(): Promise<AchievementProgress> {
  const p = await loadPayload();
  return p.achievements;
}

export async function writeAchievementProgress(progress: AchievementProgress): Promise<void> {
  const p = await loadPayload();
  p.achievements = progress;
  await savePayload(p);
}
