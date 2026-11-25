import { AchievementProgress, EMPTY_ACHIEVEMENT_PROGRESS } from './achievements';
import { CaseState, ChatThread, EmailItem, FSNode, WindowState } from './types';
import { readCloudBlob, withSaveLock, writeCloudBlob } from './saveStore';

export const SAVE_SLOT_COUNT = 3;
const CURRENT_VERSION = 1;
const LOCAL_SESSION_KEY = 'frosted-ashes:session:v1';

export type LoginAccount = 'poppy' | 'black';

interface FullCloudPayload {
  version: number;
  saves: (SaveData | null)[];
  achievements: AchievementProgress;
  /** 自动会话快照：刷新 / 切后台被重载时用来恢复现场 */
  session?: SessionSnapshot | null;
  /** 一次性标记（如尤宁邮件 toast 是否弹过） */
  flags?: Record<string, boolean>;
  /** 玩家已登录过的账户列表（用于聊天/邮箱快捷切换） */
  accounts?: LoginAccount[];
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

/** 自动会话快照：和手动存档同构，但不含成就（成就单独持久化，避免互相覆盖） */
export interface SessionSnapshot {
  version: 1;
  savedAt: string;
  chapter: number;
  discoveredClues: string[];
  caseState: CaseState;
  timelinePlacements: Record<string, number>;
  fsNodes: FSNode[];
  emails: EmailItem[];
  chats: ChatThread[];
  chapterFails: Record<number, boolean>;
  elapsedSeconds: number;
  musicUnlocked: boolean;
  musicTrack: number;
  windows: WindowState[];
  activeWindowId: string | null;
}

export type SaveSlots = (SaveData | null)[];

function emptyPayload(): FullCloudPayload {
  return {
    version: CURRENT_VERSION,
    saves: Array.from({ length: SAVE_SLOT_COUNT }, () => null),
    achievements: { ...EMPTY_ACHIEVEMENT_PROGRESS },
    session: null,
    flags: {},
    accounts: [],
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

function normalizeSession(value: unknown): SessionSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<SessionSnapshot>;
  if (v.version !== 1) return null;
  if (!v.caseState || typeof v.caseState !== 'object') return null;
  if (!Array.isArray(v.fsNodes) || !Array.isArray(v.emails) || !Array.isArray(v.chats)) {
    return null;
  }
  return {
    version: 1,
    savedAt: typeof v.savedAt === 'string' ? v.savedAt : new Date(0).toISOString(),
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
    chapterFails: v.chapterFails && typeof v.chapterFails === 'object' ? v.chapterFails : {},
    elapsedSeconds: typeof v.elapsedSeconds === 'number' ? v.elapsedSeconds : 0,
    musicUnlocked: !!v.musicUnlocked,
    musicTrack: typeof v.musicTrack === 'number' ? v.musicTrack : 0,
    windows: Array.isArray(v.windows) ? v.windows : [],
    activeWindowId: typeof v.activeWindowId === 'string' ? v.activeWindowId : null,
  };
}

function normalizePayload(raw: unknown): FullCloudPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<FullCloudPayload>;
  if (!Array.isArray(r.saves)) return null;
  const accounts: LoginAccount[] = Array.isArray(r.accounts)
    ? (r.accounts.filter((a) => a === 'poppy' || a === 'black') as LoginAccount[])
    : [];
  return {
    version: typeof r.version === 'number' ? r.version : CURRENT_VERSION,
    saves: Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => normalizeSlot(r.saves?.[i])),
    achievements: {
      ...EMPTY_ACHIEVEMENT_PROGRESS,
      ...(r.achievements ?? {}),
    },
    session: normalizeSession(r.session),
    flags: r.flags && typeof r.flags === 'object' ? { ...r.flags } : {},
    accounts,
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

// ---- 对外 API（全部串行化，避免读改写互相覆盖） ----

export async function readSaveSlots(): Promise<SaveSlots> {
  return withSaveLock(async () => (await loadPayload()).saves);
}

export async function writeSaveSlot(index: number, data: SaveData): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    if (index < 0 || index >= p.saves.length) return;
    p.saves[index] = data;
    await savePayload(p);
  });
}

export async function removeSaveSlot(index: number): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    if (index < 0 || index >= p.saves.length) return;
    p.saves[index] = null;
    await savePayload(p);
  });
}

export async function readAchievementProgress(): Promise<AchievementProgress> {
  return withSaveLock(async () => (await loadPayload()).achievements);
}

export async function writeAchievementProgress(progress: AchievementProgress): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    p.achievements = progress;
    await savePayload(p);
  });
}

// ---- 自动会话快照 ----

export async function readSessionSnapshot(): Promise<SessionSnapshot | null> {
  return withSaveLock(async () => (await loadPayload()).session ?? null);
}

export async function writeSessionSnapshot(snapshot: SessionSnapshot): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    p.session = snapshot;
    await savePayload(p);
  });
}

export async function clearSessionSnapshot(): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    if (!p.session) return;
    p.session = null;
    await savePayload(p);
  });
}

// ---- sessionStorage 同步兜底（页面被卸载前来不及等云写入） ----

export function readLocalSessionSnapshot(): SessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLocalSessionSnapshot(snapshot: SessionSnapshot): void {
  try {
    sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // 存储不可用或超限时忽略，云快照仍然生效
  }
}

export function clearLocalSessionSnapshot(): void {
  try {
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignore
  }
}

// ---- flags（一次性标记） ----

export async function getFlag(key: string): Promise<boolean> {
  return withSaveLock(async () => {
    const p = await loadPayload();
    return !!(p.flags && p.flags[key]);
  });
}

export async function setFlag(key: string, value: boolean): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    p.flags = p.flags ?? {};
    p.flags[key] = value;
    await savePayload(p);
  });
}

// ---- accounts（已登录过的账户列表） ----

export async function readLoggedInAccounts(): Promise<LoginAccount[]> {
  return withSaveLock(async () => {
    const p = await loadPayload();
    return p.accounts ?? [];
  });
}

export async function writeLoggedInAccounts(accounts: LoginAccount[]): Promise<void> {
  await withSaveLock(async () => {
    const p = await loadPayload();
    p.accounts = accounts;
    await savePayload(p);
  });
}
