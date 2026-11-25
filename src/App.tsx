﻿/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Compass } from 'lucide-react';
import {
  createFile,
  createFolder,
  moveToTrash,
  permanentDelete,
  renameNode,
  restoreFromTrash,
  unlockNode,
  updateFileContent,
} from './os/filesystem';
import {
  ARCHIVE_DRAWERS,
  CHAPTERS,
  ENDING_TEXT,
  INITIAL_CHATS,
  INITIAL_CLUES,
  INITIAL_EMAILS,
  INITIAL_FS_NODES,
  mergeSeedChats,
  RADIO_CHANNELS,
  RELATION_EDGES,
  RELATION_NODES,
  ROOT_IDS,
  TIMELINE_CARDS,
  TIMELINE_EVIDENCE,
  WALLPAPER_URL,
} from './os/seedData';
import {
  checkChapterAnswers,
  createInitialCaseState,
  evaluateCombine,
  resolveEnding,
  scoreCase,
  visibleChats,
  visibleEmails,
  visibleNodes,
} from './os/caseProgress';
import {
  readSaveSlots,
  removeSaveSlot,
  writeSaveSlot,
  readAchievementProgress,
  writeAchievementProgress,
  readSessionSnapshot,
  writeSessionSnapshot,
  clearSessionSnapshot,
  readLocalSessionSnapshot,
  writeLocalSessionSnapshot,
  clearLocalSessionSnapshot,
  getFlag,
  setFlag,
  SaveData,
  SaveSlots,
  SessionSnapshot,
  SAVE_SLOT_COUNT,
} from './os/saveGame';
import {
  ACHIEVEMENTS,
  AchievementProgress,
  EMPTY_ACHIEVEMENT_PROGRESS,
  evaluateAchievements,
} from './os/achievements';
import { soundEngine } from './os/sound';
import {
  AppId,
  CaseState,
  ChatThread,
  EmailItem,
  EndingId,
  FinalAccusation,
  FSNode,
  GamePhase,
  WindowState,
} from './os/types';
import { AppIcon, TrashIcon } from './components/CartoonIcons';
import { CollectProvider } from './components/RichText';
import { DesktopPet } from './components/DesktopPet';
import { StartMenu } from './components/StartMenu';
import { Taskbar } from './components/Taskbar';
import { TitleLockScreen } from './components/TitleLockScreen';
import { VictoryModal } from './components/VictoryModal';
import { WindowFrame } from './components/WindowFrame';
import { ArchiveApp } from './components/apps/ArchiveApp';
import { AchievementsApp } from './components/apps/AchievementsApp';
import { BrowserApp } from './components/apps/BrowserApp';
import { CatPetApp } from './components/apps/CatPetApp';
import { FilingApp } from './components/apps/FilingApp';
import { ChatApp } from './components/apps/ChatApp';
import { ClueBoardApp } from './components/apps/ClueBoardApp';
import { FileExplorerApp } from './components/apps/FileExplorerApp';
import { MailApp } from './components/apps/MailApp';
import { MusicBoxApp } from './components/apps/MusicBoxApp';
import { NotepadApp } from './components/apps/NotepadApp';
import { PhotoViewerApp } from './components/apps/PhotoViewerApp';
import { RadioApp } from './components/apps/RadioApp';
import { RelationsApp } from './components/apps/RelationsApp';
import { TimelineApp } from './components/apps/TimelineApp';

interface DesktopShortcut {
  id: string;
  label: string;
  appId: AppId;
  folderId?: string;
  fileId?: string;
  isTrash?: boolean;
}

const DESKTOP_SHORTCUTS: DesktopShortcut[] = [  { id: 'sc_explorer', label: '我的电脑', appId: 'explorer', folderId: ROOT_IDS.COMPUTER },
  { id: 'sc_trash', label: '回收站', appId: 'explorer', folderId: ROOT_IDS.TRASH, isTrash: true },
  { id: 'sc_mail', label: '喵喵信箱', appId: 'mail' },
  { id: 'sc_chat', label: '汪汪聊天', appId: 'chat' },
  { id: 'sc_photos', label: '图画看图', appId: 'photos' },
  { id: 'sc_browser', label: 'PawNet 浏览器', appId: 'browser' },
  { id: 'sc_timeline', label: '时间线白板', appId: 'timeline' },
  { id: 'sc_radio', label: '甜点镇广播', appId: 'radio' },
  { id: 'sc_relations', label: '人物关系板', appId: 'relations' },
  { id: 'sc_archive', label: '镇档案室', appId: 'archive' },
  { id: 'sc_filing', label: '旧东西', appId: 'filing' },
  { id: 'sc_pet', label: '煤球的小屋', appId: 'pet' },
  { id: 'sc_music', label: '甜点八音盒', appId: 'music' },
  { id: 'sc_achievements', label: '成就徽章', appId: 'achievements' },
];

/**
 * 人物不再是「读到就收」，而是在文本里点击名字才收。
 * 见 components/RichText.tsx。
 */

const DEFAULT_WINDOW_SPECS: Record<AppId, { title: string; width: number; height: number }> = {
  explorer: { title: '文件管理器', width: 760, height: 500 },
  notepad: { title: '记事本', width: 540, height: 420 },
  photos: { title: '图画看图', width: 720, height: 540 },
  mail: { title: '喵喵信箱', width: 700, height: 470 },
  chat: { title: '汪汪聊天', width: 640, height: 470 },
  music: { title: '甜点八音盒', width: 430, height: 430 },
  clueboard: { title: '破案手账', width: 800, height: 550 },
  achievements: { title: '成就徽章', width: 680, height: 540 },
  browser: { title: 'PawNet 浏览器', width: 760, height: 520 },
  pet: { title: '煤球的小屋', width: 480, height: 440 },
  timeline: { title: '时间线白板', width: 920, height: 540 },
  radio: { title: '甜点镇广播', width: 480, height: 440 },
  relations: { title: '人物关系板', width: 800, height: 560 },
  archive: { title: '镇档案室', width: 740, height: 540 },
  filing: { title: '旧东西', width: 620, height: 540 },
};

function createInitialWindows(): WindowState[] {
  return [];
}

/**
 * 图片素材在构建时被内联成 base64，单个文件几百 KB。
 * 存档里只保留节点结构，读档时再按节点 id 从初始数据补回图片，避免存档过大。
 */
function stripImageUrls(nodes: FSNode[]): FSNode[] {
  return nodes.map((node) => {
    if (!node.imageUrl) return node;
    const { imageUrl: _imageUrl, ...rest } = node;
    return rest;
  });
}

function hydrateImageUrls(nodes: FSNode[]): FSNode[] {
  const initialById = new Map(INITIAL_FS_NODES.map((node) => [node.id, node]));
  return nodes.map((node) => {
    if (node.imageUrl) return node;
    const seeded = initialById.get(node.id);
    return seeded?.imageUrl ? { ...node, imageUrl: seeded.imageUrl } : node;
  });
}

function sessionTime(snapshot: SessionSnapshot | null): number {
  if (!snapshot) return -1;
  const time = Date.parse(snapshot.savedAt);
  return Number.isNaN(time) ? -1 : time;
}

/** 云快照和本地兜底取较新的那份 */
function pickNewerSession(
  cloud: SessionSnapshot | null,
  local: SessionSnapshot | null
): SessionSnapshot | null {
  if (!cloud) return local;
  if (!local) return cloud;
  return sessionTime(local) > sessionTime(cloud) ? local : cloud;
}

export default function App() {
  // 从开机动画开始，输入开机口令后进入桌面
  const [phase, setPhase] = useState<GamePhase>('title');
  const [fsNodes, setFsNodes] = useState<FSNode[]>(INITIAL_FS_NODES);
  const [emails, setEmails] = useState<EmailItem[]>(INITIAL_EMAILS);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [caseState, setCaseState] = useState<CaseState>(createInitialCaseState);
  const [timelinePlacements, setTimelinePlacements] = useState<Record<string, number>>({});
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [windows, setWindows] = useState<WindowState[]>(createInitialWindows);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const [muted, setMuted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicTrack, setMusicTrack] = useState(0);

  /** 煤球抓文件还原任务：DesktopPet 完成后才真正 restore */
  const [pendingRestoreJob, setPendingRestoreJob] = useState<{
    fileId: string;
    fileName: string;
  } | null>(null);
  const [musicUnlocked, setMusicUnlocked] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [achievements, setAchievements] =
    useState<AchievementProgress>(EMPTY_ACHIEVEMENT_PROGRESS);
  const [chapterFails, setChapterFails] = useState<Record<number, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveSlots, setSaveSlots] = useState<SaveSlots>(
    Array.from({ length: SAVE_SLOT_COUNT }, () => null)
  );
  const [victoryInfo, setVictoryInfo] = useState<{
    score: number;
    summary: string;
    ending: EndingId;
    open: boolean;
  } | null>(null);

  const topZRef = useRef(12);
  const toastTimerRef = useRef<number | null>(null);
  /** 云存档读取完成前不要写回，否则会用初始状态覆盖已有存档 */
  const hydratedRef = useRef(false);
  /** 计时器每秒刷新，但不希望它触发快照写入，所以用 ref 记录最新值 */
  const elapsedRef = useRef(0);
  /** 云存档读取较慢时，玩家可能已经进入桌面，此时不要再拿旧快照覆盖当前状态 */
  const phaseRef = useRef<GamePhase>('title');

  // 启动时加载云存档：手动存档槽、成就、自动会话快照
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [slots, ach, cloudSession] = await Promise.all([
        readSaveSlots(),
        readAchievementProgress(),
        readSessionSnapshot(),
      ]);
      if (cancelled) return;
      const session = pickNewerSession(cloudSession, readLocalSessionSnapshot());
      setSaveSlots(slots);
      setAchievements(ach);
      if (session && phaseRef.current === 'title') {
        setFsNodes(hydrateImageUrls(session.fsNodes));
        setEmails(session.emails);
        setChats(mergeSeedChats(session.chats));
        setCaseState(session.caseState);
        setTimelinePlacements(session.timelinePlacements);
        setDiscoveredClues(session.discoveredClues);
        setChapterFails(session.chapterFails);
        setElapsedSeconds(session.elapsedSeconds);
        elapsedRef.current = session.elapsedSeconds;
        setMusicUnlocked(session.musicUnlocked);
        setMusicTrack(session.musicTrack);
        setWindows(session.windows);
        setActiveWindowId(session.activeWindowId);
        topZRef.current = session.windows.reduce(
          (max, w) => Math.max(max, w.zIndex),
          12
        );
      }
      hydratedRef.current = true;
    })();
    return () => { cancelled = true; };
  }, []);

  // 计时器：每秒 +1，同时同步给快照用的 ref
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    phaseRef.current = phase;
    document.body.dataset.state = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const showToast = useCallback((msg: string, options?: { silent?: boolean }) => {
    if (!options?.silent) soundEngine.playNotify();
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  }, []);

  // 进入桌面时只提示「收到新邮件」，不自动打开信箱（只弹一次）
  useEffect(() => {
    if (phase !== 'playing') return;
    let cancelled = false;
    getFlag('yl_toast_shown').then((shown) => {
      if (cancelled || shown) return;
      const timer = window.setTimeout(() => {
        showToast('喵喵信箱收到新邮件：尤宁《案件交接令》');
        setFlag('yl_toast_shown', true).catch(() => {});
      }, 1500);
      return () => window.clearTimeout(timer);
    });
    return () => { cancelled = true; };
  }, [phase, showToast]);

  // 成就进度持久化（跨「从头再查一次」保留）
  // 必须等云存档读取完成后再写，否则首次挂载会用空进度覆盖线上成就
  useEffect(() => {
    if (!hydratedRef.current) return;
    writeAchievementProgress(achievements).catch(() => {});
  }, [achievements]);

  /** 构造当前会话快照（不含成就，成就单独持久化） */
  const buildSessionSnapshot = useCallback(
    (): SessionSnapshot => ({
      version: 1,
      savedAt: new Date().toISOString(),
      chapter: caseState.chapter,
      discoveredClues,
      caseState,
      timelinePlacements,
      fsNodes: stripImageUrls(fsNodes),
      emails,
      chats,
      chapterFails,
      elapsedSeconds: elapsedRef.current,
      musicUnlocked,
      musicTrack,
      // 关闭的窗口只用于保留运行时内部状态，刷新后无法恢复，不写进快照
      windows: windows.filter((w) => !w.closed),
      activeWindowId,
    }),
    [
      caseState,
      discoveredClues,
      timelinePlacements,
      fsNodes,
      emails,
      chats,
      chapterFails,
      musicUnlocked,
      musicTrack,
      windows,
      activeWindowId,
    ]
  );

  const flushSessionSnapshot = useCallback(() => {
    if (!hydratedRef.current) return;
    const snapshot = buildSessionSnapshot();
    // 同步兜底先落地，云写入失败或被页面卸载打断也能保住现场
    writeLocalSessionSnapshot(snapshot);
    writeSessionSnapshot(snapshot).catch(() => {});
  }, [buildSessionSnapshot]);

  // 状态变化后延迟写入快照，避免连续操作时频繁读写云存档
  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = window.setTimeout(flushSessionSnapshot, 1500);
    return () => window.clearTimeout(timer);
  }, [flushSessionSnapshot]);

  // 切后台 / 刷新 / 关闭页面前立刻落一份快照
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSessionSnapshot();
    };
    window.addEventListener('pagehide', flushSessionSnapshot);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushSessionSnapshot);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [flushSessionSnapshot]);

  // 状态变化时检查是否有新成就
  useEffect(() => {
    const newly = evaluateAchievements({
      flags: caseState.flags,
      discoveredClues,
      chapterAnswers: caseState.chapterAnswers,
      ending: caseState.ending,
      totalClues: INITIAL_CLUES.length,
      progress: achievements,
    });
    if (newly.length === 0) return;
    setAchievements((prev) => {
      const add = newly.filter((id) => !prev.unlocked.includes(id));
      if (add.length === 0) return prev;
      return { ...prev, unlocked: [...prev.unlocked, ...add] };
    });
    const names = newly
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id)
      .join('、');
    showToast(`成就解锁：${names}`, { silent: true });
    soundEngine.playAchievement();
  }, [
    caseState.flags,
    caseState.chapterAnswers,
    caseState.ending,
    discoveredClues,
    achievements,
    showToast,
  ]);

  const handleFlag = useCallback((flag: string) => {
    setCaseState((prev) =>
      prev.flags[flag] ? prev : { ...prev, flags: { ...prev.flags, [flag]: true } }
    );
  }, []);

  /** 电台听过某个频道 */
  const handleRadioListen = useCallback((channelId: string) => {
    setAchievements((prev) =>
      prev.radioChannels.includes(channelId)
        ? prev
        : { ...prev, radioChannels: [...prev.radioChannels, channelId] }
    );
  }, []);

  /** 投喂煤球累计次数 */
  const handleFeedPet = useCallback(() => {
    setAchievements((prev) => ({ ...prev, feeds: prev.feeds + 1 }));
  }, []);

  /** 打开聊天会话（用于「宁可错杀一千不可放过一个」） */
  const handleReadThread = useCallback((thread: ChatThread) => {
    setChats((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread: 0 } : t))
    );
    setAchievements((prev) =>
      prev.openedChats.includes(thread.id)
        ? prev
        : { ...prev, openedChats: [...prev.openedChats, thread.id] }
    );
  }, []);

  /** 读过邮件 */
  const handleMarkEmailRead = useCallback((emailId: string) => {
    setEmails((prev) => prev.map((m) => (m.id === emailId ? { ...m, read: true } : m)));
  }, []);

  /** 浏览过网页视图（用于「你咋这么八卦」） */
  const handleBrowserView = useCallback((view: string) => {
    setAchievements((prev) =>
      prev.browserViews.includes(view)
        ? prev
        : { ...prev, browserViews: [...prev.browserViews, view] }
    );
  }, []);

  /** 时间线提交结果（用于「老实交代！穷举了多少次？」） */
  const handleTimelineSubmit = useCallback((_chapterId: number, ok: boolean) => {
    setAchievements((prev) => {
      if (ok) {
        return prev.timelineFirstTry || prev.timelineAttempts > 0
          ? prev
          : { ...prev, timelineFirstTry: true };
      }
      return { ...prev, timelineAttempts: prev.timelineAttempts + 1 };
    });
  }, []);

  /** 在文本里点中某个人的名字，才把他记进关系板 */
  const collectCharacter = useCallback(
    (nodeId: string) => {
      const name = RELATION_NODES.find((n) => n.id === nodeId)?.name;
      if (!name) return;
      if (caseState.flags[`met_${nodeId}`]) return;
      setCaseState((prev) =>
        prev.flags[`met_${nodeId}`]
          ? prev
          : { ...prev, flags: { ...prev.flags, [`met_${nodeId}`]: true } }
      );
      showToast(`关系板新增人物：${name}`);
    },
    [caseState.flags, showToast]
  );

  const discoverClue = useCallback(
    (clueId?: string) => {
      if (!clueId) return;
      setCaseState((prev) =>
        prev.flags[clueId] ? prev : { ...prev, flags: { ...prev.flags, [clueId]: true } }
      );
      setDiscoveredClues((prev) => {
        if (prev.includes(clueId)) return prev;
        const clue = INITIAL_CLUES.find((c) => c.id === clueId);
        soundEngine.playClueFound();
        if (clue) showToast(`发现新线索：${clue.title}`, { silent: true });
        return [...prev, clueId];
      });
    },
    [showToast]
  );

  const handleCombine = useCallback(
    (a: string, b: string, relation: string) => {
      const res = evaluateCombine(a, b, relation);
      if (!res.result) return res;
      discoverClue(res.result);
      setAchievements((prev) => ({
        ...prev,
        combines: prev.combines + 1,
        relations: prev.relations.includes(relation)
          ? prev.relations
          : [...prev.relations, relation],
      }));
      setCaseState((prev) => ({
        ...prev,
        derivedClues: prev.derivedClues.includes(res.result!)
          ? prev.derivedClues
          : [...prev.derivedClues, res.result!],
      }));
      return res;
    },
    [discoverClue]
  );

  const focusWindow = useCallback((winId: string) => {
    topZRef.current += 1;
    const nextZ = topZRef.current;
    setWindows((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, minimized: false, closed: false, zIndex: nextZ } : w))
    );
    setActiveWindowId(winId);
  }, []);

  const openApp = useCallback(
    (appId: AppId, options?: { folderId?: string; fileId?: string; title?: string }) => {
      soundEngine.playOpenWindow();
      setStartMenuOpen(false);

      // 文本/图片查看器允许同时打开多个文件；同一个文件再次打开只聚焦
      const isMultiFile =
        (appId === 'notepad' || appId === 'photos') && !!options?.fileId;
      const matches = windows.filter(
        (w) => w.appId === appId && (!isMultiFile || w.fileId === options!.fileId)
      );
      // 优先复用已打开的窗口；没有的话复用被关闭但保留挂载的实例，内容才不会重置
      const existing = matches.find((w) => !w.closed) ?? matches[0];
      if (existing) {
        topZRef.current += 1;
        const nextZ = topZRef.current;
        setWindows((prev) =>
          prev.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  minimized: false,
                  closed: false,
                  zIndex: nextZ,
                  ...(isMultiFile
                    ? {}
                    : {
                        x: Math.max(12, Math.round((window.innerWidth - w.width) / 2)),
                        y: Math.max(12, Math.round((window.innerHeight - 56 - w.height) / 2)),
                      }),
                  folderId: options?.folderId ?? w.folderId,
                  fileId: options?.fileId ?? w.fileId,
                  title: options?.title ?? w.title,
                }
              : w
          )
        );
        setActiveWindowId(existing.id);
        return;
      }

      const spec = DEFAULT_WINDOW_SPECS[appId];
      topZRef.current += 1;
      const newWin: WindowState = {
        id: `win_${appId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        appId,
        title: options?.title ?? spec.title,
        x: Math.max(12, Math.round((window.innerWidth - spec.width) / 2)),
        y: Math.max(12, Math.round((window.innerHeight - 56 - spec.height) / 2)),
        width: spec.width,
        height: spec.height,
        minimized: false,
        maximized: false,
        zIndex: topZRef.current,
        folderId: options?.folderId,
        fileId: options?.fileId,
      };
      setWindows((prev) => [...prev, newWin]);
      setActiveWindowId(newWin.id);
    },
    [windows]
  );

  const handleOpenNode = useCallback(
    (node: FSNode) => {
      if (node.type === 'text') {
        openApp('notepad', { fileId: node.id, title: node.name });
      } else if (node.type === 'image') {
        openApp('photos', { fileId: node.id, title: node.name });
      } else {
        openApp('explorer', { folderId: node.id });
      }
    },
    [openApp]
  );

  const handleCloseWindow = useCallback((winId: string) => {
    soundEngine.playCloseWindow();
    // 关闭只隐藏不卸载，重新打开同一应用时沿用之前的界面状态
    setWindows((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, closed: true, minimized: false } : w))
    );
    setActiveWindowId((prev) => (prev === winId ? null : prev));
  }, []);

  const handleMinimizeWindow = useCallback((winId: string) => {
    soundEngine.playClick();
    setWindows((prev) => prev.map((w) => (w.id === winId ? { ...w, minimized: true } : w)));
    setActiveWindowId((prev) => (prev === winId ? null : prev));
  }, []);

  const handleToggleMaximize = useCallback((winId: string) => {
    soundEngine.playClick();
    setWindows((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, maximized: !w.maximized } : w))
    );
  }, []);

  const handleMoveWindow = useCallback((winId: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === winId ? { ...w, x, y } : w)));
  }, []);

  const handleResizeWindow = useCallback((winId: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === winId ? { ...w, width, height } : w)));
  }, []);

  const handleTaskbarSelectWindow = useCallback(
    (winId: string) => {
      const target = windows.find((w) => w.id === winId);
      if (!target) return;
      if (target.minimized || activeWindowId !== winId) {
        focusWindow(winId);
      } else {
        handleMinimizeWindow(winId);
      }
    },
    [windows, activeWindowId, focusWindow, handleMinimizeWindow]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      if (!next && musicPlaying) {
        soundEngine.startMusic(musicTrack);
      }
      return next;
    });
  }, [musicPlaying, musicTrack]);

  const handleToggleMusicPlay = useCallback(() => {
    setMusicPlaying((prev) => {
      const next = !prev;
      if (next && !muted) {
        soundEngine.startMusic(musicTrack);
      } else {
        soundEngine.stopMusic();
      }
      return next;
    });
  }, [muted, musicTrack]);

  const handleSelectTrack = useCallback(
    (idx: number) => {
      setMusicTrack(idx);
      setMusicPlaying(true);
      if (!muted) {
        soundEngine.startMusic(idx);
      }
    },
    [muted]
  );

  /** 自由输入提问：不做关键词匹配，只回该会话的默认反应 */
  const handleSendReply = useCallback(
    (threadId: string, text: string) => {
      soundEngine.playClick();
      const thread = chats.find((t) => t.id === threadId);
      if (!thread) return;

      setChats((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  { id: `msg_${Date.now()}`, sender: 'me', text, time: '15:10' },
                ],
              }
            : t
        )
      );

      window.setTimeout(() => {
        setChats((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: `msg_${Date.now()}_r`,
                      sender: 'them',
                      text: thread.fallbackReply ?? '（对方没有回应）',
                      time: '15:11',
                    },
                  ],
                }
              : t
          )
        );
      }, 720);
    },
    [chats]
  );

  const handleStartGame = useCallback(() => {
    soundEngine.playOpenWindow();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setPhase('playing');
  }, []);

  const handleResetCase = useCallback(() => {
    soundEngine.stopMusic();
    // 重新开案：丢掉旧快照，避免刷新后又被恢复回来
    clearLocalSessionSnapshot();
    clearSessionSnapshot().catch(() => {});
    setMusicPlaying(false);
    setMusicUnlocked(false);
    elapsedRef.current = 0;
    setFsNodes(INITIAL_FS_NODES);
    setEmails(INITIAL_EMAILS);
    setChats(INITIAL_CHATS);
    setCaseState(createInitialCaseState());
    setTimelinePlacements({});
    setDiscoveredClues([]);
    setChapterFails({});
    setWindows(createInitialWindows());
    setActiveWindowId(null);
    setElapsedSeconds(0);
    setVictoryInfo(null);
    setToastMessage(null);
    setPhase('playing');
    setFlag('yl_toast_shown', false).catch(() => {});
    showToast('案件已重置。喵喵信箱收到新邮件：尤宁《案件交接令》');
  }, [showToast]);

  const handleSaveSlot = useCallback(
    (index: number) => {
      const data: SaveData = {
        version: 1,
        savedAt: new Date().toISOString(),
        chapter: caseState.chapter,
        discoveredClues,
        caseState,
        timelinePlacements,
        fsNodes: stripImageUrls(fsNodes),
        emails,
        chats,
        achievements,
        chapterFails,
        elapsedSeconds,
        musicUnlocked,
        musicTrack,
      };
      (async () => {
        await writeSaveSlot(index, data);
        const slots = await readSaveSlots();
        setSaveSlots(slots);
      })();
      showToast(`已保存到存档 ${index + 1}`);
    },
    [
      caseState,
      discoveredClues,
      timelinePlacements,
      fsNodes,
      emails,
      chats,
      achievements,
      chapterFails,
      elapsedSeconds,
      musicUnlocked,
      musicTrack,
      showToast,
    ]
  );

  const handleLoadSlot = useCallback(
    (index: number) => {
      const data = saveSlots[index];
      if (!data) {
        showToast('这个存档是空的');
        return;
      }
      soundEngine.stopMusic();
      setMusicPlaying(false);
      setFsNodes(hydrateImageUrls(data.fsNodes));
      setEmails(data.emails);
      setChats(mergeSeedChats(data.chats));
      setCaseState(data.caseState);
      setTimelinePlacements(data.timelinePlacements);
      setDiscoveredClues(data.discoveredClues);
      setAchievements(data.achievements);
      setChapterFails(data.chapterFails);
      setElapsedSeconds(data.elapsedSeconds);
      setMusicUnlocked(data.musicUnlocked);
      setMusicTrack(data.musicTrack);
      setWindows([]);
      setActiveWindowId(null);
      setSelectedShortcutId(null);
      setPendingRestoreJob(null);
      setVictoryInfo(null);
      setStartMenuOpen(false);
      setPhase('playing');
      showToast(`已读取存档 ${index + 1}`);
    },
    [showToast]
  );

  const handleDeleteSlot = useCallback(
    (index: number) => {
      (async () => {
        await removeSaveSlot(index);
        const slots = await readSaveSlots();
        setSaveSlots(slots);
      })();
      showToast(`已删除存档 ${index + 1}`);
    },
    [showToast]
  );

  const handleChapterAnswer = useCallback(
    (chapterId: number, answers: Record<string, string>) => {
      const def = CHAPTERS.find((c) => c.id === chapterId);
      if (!def || !def.conclusion) {
        return { ok: false, feedback: '没有找到这一章。', advanced: false };
      }

      // 章节锁：线索或关键步骤没齐，结论表单不判题
      const missingClues = (def.requiresClues ?? []).filter(
        (id) => !discoveredClues.includes(id)
      );
      const missingFlags = (def.requiresFlags ?? []).filter(
        (flag) => !caseState.flags[flag]
      );
      if (missingClues.length > 0 || missingFlags.length > 0) {
        return {
          ok: false,
          feedback: '这一章的结论还压不住。线索或关键步骤还没有齐。',
          advanced: false,
        };
      }

      const graded = checkChapterAnswers(chapterId, answers);
      if (!graded.ok) {
        soundEngine.playError();
        setChapterFails((prev) => (prev[chapterId] ? prev : { ...prev, [chapterId]: true }));
        const feedback =
          graded.wrongCount >= graded.total
            ? '整页都对不上。可能从一开始方向就偏了。'
            : '有地方对不上，但手账不会告诉你是哪一处。';
        return { ok: false, feedback, advanced: false };
      }

      soundEngine.playClueFound();
      if (!chapterFails[chapterId]) {
        setAchievements((prev) => ({
          ...prev,
          firstTry: { ...prev.firstTry, [chapterId]: true },
        }));
      }
      const nextChapter = Math.min(5, chapterId + 1);
      setCaseState((prev) => ({
        ...prev,
        chapter: Math.max(prev.chapter, nextChapter),
        chapterAnswers: { ...prev.chapterAnswers, [chapterId]: answers },
      }));
      if (nextChapter === 2) {
        // 新证据加入，第一章的时间线作废，必须重排
        setTimelinePlacements({});
      }

      // 新章节出现的会话自动标未读，桌面聊天图标会亮红点
      setChats((prev) =>
        prev.map((t) =>
          (t.chapter ?? 1) === nextChapter ? { ...t, unread: Math.max(t.unread, 1) } : t
        )
      );

      if (chapterId < 5) {
        const openings: Record<number, string> = {
          2: '聊天、邮件和浏览器都冒出了新说法',
          3: '桌面多了波比的便利贴，镇档案室开放调阅',
          4: '浏览器和论坛翻出了旧闻',
        };
        const msg = openings[nextChapter];
        if (msg) {
          showToast(msg);
          // 同时发一封系统邮件存档，避免玩家错过 3.6 秒的顶部提示
          const mailId = `mail_system_ch${nextChapter}`;
          const subjects: Record<number, string> = {
            2: '新的说法',
            3: '新的线索来源',
            4: '旧闻',
          };
          setEmails((prev) =>
            prev.some((m) => m.id === mailId)
              ? prev
              : [
                  ...prev,
                  {
                    id: mailId,
                    from: '小橘侦探社 · 系统',
                    fromRole: '自动通知',
                    to: '小橘探长',
                    subject: subjects[nextChapter] ?? '更新',
                    timestamp: '刚刚',
                    folder: 'inbox',
                    read: false,
                    starred: false,
                    chapter: nextChapter,
                    account: 'detective',
                    body: ['探长：', '', `${msg}。`, '', '记得回去翻一遍。'].join('\n'),
                  },
                ]
          );
        }
      }
      return { ok: true, feedback: def.conclusion.successText, advanced: true };
    },
    [showToast, chapterFails, discoveredClues, caseState.flags]
  );

  const handleSignClosure = useCallback(() => {
    soundEngine.playVictory();
    const ending: EndingId = 'C';
    setAchievements((prev) =>
      prev.endingsSeen.includes('C')
        ? prev
        : { ...prev, endingsSeen: [...prev.endingsSeen, 'C'] }
    );
    setCaseState((prev) => ({
      ...prev,
      ending,
      flags: { ...prev.flags, ending_C: true, signed_closure: true },
    }));
    setVictoryInfo({
      score: scoreCase(discoveredClues, INITIAL_CLUES.length),
      summary: ENDING_TEXT.C.body[0],
      ending,
      open: true,
    });
    setPhase('gameover');
  }, [discoveredClues]);

  const handleFinalSubmit = useCallback(
    (acc: FinalAccusation) => {
      const ending = resolveEnding(acc);
      if (!ending) {
        soundEngine.playError();
        return {
          solved: false,
          ending: null,
          feedback:
            '结案报告被打回来了。时间、手法、动机或证据，有一项和手里的材料对不上。',
        };
      }

      soundEngine.playVictory();
      setAchievements((prev) =>
        prev.endingsSeen.includes(ending)
          ? prev
          : { ...prev, endingsSeen: [...prev.endingsSeen, ending] }
      );
      setCaseState((prev) => ({
        ...prev,
        ending,
        flags: { ...prev.flags, [`ending_${ending}`]: true },
      }));
      setVictoryInfo({
        score: scoreCase(discoveredClues, INITIAL_CLUES.length),
        summary: ENDING_TEXT[ending].body[0],
        ending,
        open: true,
      });
      setPhase('gameover');
      return { solved: true, ending, feedback: '结案报告已提交。' };
    },
    [discoveredClues]
  );

  if (phase === 'title') {
    return <TitleLockScreen onStart={handleStartGame} />;
  }

  const trashCount = fsNodes.filter((n) => n.inTrash).length;
  // 按当前案件进度逐章解锁内容
  const contentChapter: number = caseState.chapter;
  const visNodes = visibleNodes(fsNodes, contentChapter);
  const metCharacters = RELATION_NODES.filter((n) => caseState.flags[`met_${n.id}`]).map(
    (n) => n.id
  );
  const visEmails = visibleEmails(emails, contentChapter);
  const visChats = visibleChats(chats, contentChapter);
  const archiveDrawers = ARCHIVE_DRAWERS;
  // 桌面红点只统计侦探账户，切到波比/布莱克账户不影响桌面
  const unreadMailCount = visEmails.filter(
    (m) => (m.account ?? 'detective') === 'detective' && !m.read
  ).length;
  const unreadChatCount = visChats.filter(
    (t) => (t.account ?? 'detective') === 'detective' && t.unread > 0
  ).length;

  return (
    <CollectProvider
      value={{
        collectClue: discoverClue,
        collectCharacter,
        collectFlag: handleFlag,
        discoveredClues,
        metCharacters,
        flags: caseState.flags,
      }}
    >
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#CFE9FF]"
      onClick={(e) => {
        if ((e.target as HTMLElement).dataset.desktopBackdrop === 'true') {
          setSelectedShortcutId(null);
          setStartMenuOpen(false);
        }
      }}
    >
      <img
        src={WALLPAPER_URL}
        alt="甜点镇卡通桌面壁纸"
        referrerPolicy="no-referrer"
        data-desktop-backdrop="true"
        className="absolute inset-0 w-full h-full object-cover select-none"
      />

      {/* 桌面图标 */}
      <main
        aria-label="桌面图标工作区"
        data-desktop-backdrop="true"
        className="relative z-10 h-[calc(100vh-56px)] w-full p-3"
      >
        <div className="grid grid-flow-col grid-rows-5 gap-2.5 w-fit">
          {DESKTOP_SHORTCUTS.map((sc) => {
            const selected = selectedShortcutId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selected) {
                    if (sc.fileId) {
                      const file = fsNodes.find((n) => n.id === sc.fileId);
                      if (file) handleOpenNode(file);
                    } else {
                      openApp(sc.appId, { folderId: sc.folderId });
                    }
                  } else {
                    setSelectedShortcutId(sc.id);
                    setStartMenuOpen(false);
                  }
                }}
                onDoubleClick={() => {
                  if (sc.fileId) {
                    const file = fsNodes.find((n) => n.id === sc.fileId);
                    if (file) handleOpenNode(file);
                  } else {
                    openApp(sc.appId, { folderId: sc.folderId });
                  }
                }}
                className={`w-[106px] p-2 rounded-2xl border-2 flex flex-col items-center gap-1 text-center transition-colors ${
                  selected
                    ? 'bg-[#FFE29A]/95 border-[#3A2D28] shadow-[3px_3px_0px_#3A2D28]'
                    : 'bg-[#FFFDF7]/60 border-transparent hover:bg-[#FFFDF7]/90 hover:border-[#3A2D28]'
                }`}
              >
                {sc.isTrash ? (
                  <TrashIcon hasItems={trashCount > 0} className="w-11 h-11" />
                ) : (
                  <div className="relative">
                    <AppIcon appId={sc.appId} className="w-11 h-11" />
                    {sc.appId === 'mail' && unreadMailCount > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#DC2626] text-[#FFFDF7] text-[9px] font-black flex items-center justify-center border border-[#FFFDF7] tabular-nums">
                        {unreadMailCount > 99 ? '99+' : unreadMailCount}
                      </span>
                    ) : null}
                    {sc.appId === 'chat' && unreadChatCount > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#DC2626] text-[#FFFDF7] text-[9px] font-black flex items-center justify-center border border-[#FFFDF7] tabular-nums">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    ) : null}
                  </div>
                )}
                <span className="text-[11px] font-bold text-[#3A2D28] leading-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                  {sc.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 任务便签 */}
        <aside
          aria-label="桌面任务便签"
          className="hidden md:flex flex-col justify-between absolute top-4 right-4 w-60 rounded-2xl bg-[#FEF08A] border-[2.5px] border-[#3A2D28] shadow-[4px_4px_0px_#3A2D28] p-3.5"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b-2 border-dashed border-[#CA8A04]">
              <span className="text-[11px] font-black text-[#3A2D28] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>探索任务便签</span>
              </span>
              <span className="text-[11px] font-black text-[#3A2D28] tabular-nums">
                {discoveredClues.length}/{INITIAL_CLUES.length}
              </span>
            </div>
            <p className="text-[11px] text-[#3A2D28] leading-relaxed mb-2.5">
              翻查文件、照片、信箱与聊天记录。
            </p>
          </div>
          <button
            type="button"
            onClick={() => openApp('clueboard')}
            className="cartoon-btn w-full py-1.5 px-3 rounded-xl bg-[#FFFDF7] text-[11px] font-bold text-[#3A2D28]"
          >
            打开破案手账
          </button>
        </aside>
      </main>

      {/* 线索提示 */}
      {toastMessage ? (
        <div
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[950] px-3.5 py-1.5 rounded-2xl bg-[#D1FAE5] border-[2.5px] border-[#3A2D28] shadow-[4px_4px_0px_#3A2D28] flex items-center gap-2 text-[11px] font-black text-[#3A2D28]"
        >
          <Bell className="w-3.5 h-3.5 text-[#059669]" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* 窗口 */}
      {windows.map((win) => (
        <WindowFrame
          key={win.id}
          win={win}
          isActive={win.id === activeWindowId}
          onFocus={focusWindow}
          onClose={handleCloseWindow}
          onMinimize={handleMinimizeWindow}
          onToggleMaximize={handleToggleMaximize}
          onMove={handleMoveWindow}
          onResize={handleResizeWindow}
        >
          {win.appId === 'explorer' ? (
            <FileExplorerApp
              nodes={visNodes}
              initialFolderId={win.folderId ?? ROOT_IDS.DOCUMENTS}
              onOpenNode={handleOpenNode}
              onCreateFolder={(parentId, name) => {
                setFsNodes((prev) => createFolder(prev, parentId, name).nodes);
              }}
              onCreateFile={(parentId, name, content) => {
                setFsNodes((prev) => createFile(prev, parentId, name, content).nodes);
              }}
              onRenameNode={(nodeId, newName) => {
                setFsNodes((prev) => renameNode(prev, nodeId, newName));
              }}
              onMoveToTrash={(nodeId) => {
                setFsNodes((prev) => moveToTrash(prev, nodeId));
              }}
              onRequestRestore={(nodeId) => {
                const target = fsNodes.find((n) => n.id === nodeId);
                if (!target) return;
                setPendingRestoreJob({ fileId: nodeId, fileName: target.name });
                // 通知煤球开始工作
                showToast('煤球来了，帮你把文件碎片叼回来～', { silent: true });
              }}
              onPermanentDelete={(nodeId) => {
                setFsNodes((prev) => permanentDelete(prev, nodeId));
              }}
              onUnlockNode={(nodeId, passcode) => {
                const res = unlockNode(fsNodes, nodeId, passcode);
                if (res.success) {
                  setFsNodes(res.nodes);
                  soundEngine.playClueFound();
                } else {
                  soundEngine.playError();
                }
                return res.success;
              }}
            />
          ) : null}

          {win.appId === 'notepad' ? (
            <NotepadApp
              nodes={visNodes}
              activeFileId={win.fileId}
              onSelectFile={(fileId) => {
                setWindows((prev) =>
                  prev.map((w) => (w.id === win.id ? { ...w, fileId } : w))
                );
              }}
              onSaveFile={(fileId, content) => {
                setFsNodes((prev) => updateFileContent(prev, fileId, content));
                soundEngine.playClick();
              }}
              onCreateNewNote={(name, content) => {
                const res = createFile(fsNodes, ROOT_IDS.DOCUMENTS, name, content);
                setFsNodes(res.nodes);
                return res.created;
              }}
              onFlag={handleFlag}
            />
          ) : null}

          {win.appId === 'photos' ? (
            <PhotoViewerApp
              nodes={visNodes}
              activeFileId={win.fileId}
              chapter={contentChapter}
              discoveredClues={discoveredClues}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
            />
          ) : null}

          {win.appId === 'mail' ? (
            <MailApp
              emails={visEmails}
              onMarkRead={handleMarkEmailRead}
              onToggleStar={(emailId) => {
                setEmails((prev) =>
                  prev.map((m) => (m.id === emailId ? { ...m, starred: !m.starred } : m))
                );
              }}
              onFlag={handleFlag}
              onDownloadAttachment={(fileId) => {
                const node = fsNodes.find((n) => n.id === fileId);
                if (!node) return;
                setFsNodes((prev) =>
                  prev.map((n) =>
                    n.id === fileId
                      ? { ...n, parentId: ROOT_IDS.DOWNLOADS }
                      : n
                  )
                );
                showToast(`下载完成：${node.name} 已进入下载文件夹`);
              }}
            />
          ) : null}

          {win.appId === 'chat' ? (
            <ChatApp
              threads={visChats}
              chapter={contentChapter}
              onReadThread={handleReadThread}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
              onSendReply={handleSendReply}
            />
          ) : null}

          {win.appId === 'music' ? (
            <MusicBoxApp
              isPlaying={musicPlaying}
              trackIndex={musicTrack}
              muted={muted}
              chapter={contentChapter}
              unlocked={musicUnlocked}
              discoveredClues={discoveredClues}
              onTogglePlay={handleToggleMusicPlay}
              onSelectTrack={handleSelectTrack}
              onUnlockMusic={() => {
                setMusicUnlocked(true);
                handleFlag('music_unlocked');
                showToast('隐藏曲目《店庆夜》已解锁', { silent: true });
              }}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
            />
          ) : null}

          {win.appId === 'clueboard' ? (
            <ClueBoardApp
              caseState={caseState}
              discoveredClues={discoveredClues}
              clues={INITIAL_CLUES}
              chapters={CHAPTERS}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
              onCombine={handleCombine}
              onChapterAnswer={handleChapterAnswer}
              onFinalSubmit={handleFinalSubmit}
              onSignClosure={handleSignClosure}
            />
          ) : null}

          {win.appId === 'achievements' ? (
            <AchievementsApp progress={achievements} />
          ) : null}

          {win.appId === 'browser' ? (
            <BrowserApp chapter={contentChapter} onView={handleBrowserView} />
          ) : null}

          {win.appId === 'pet' ? (
            <CatPetApp
              chapter={contentChapter}
              clues={INITIAL_CLUES}
              caseState={caseState}
              discoveredClues={discoveredClues}
              onFlag={handleFlag}
              onFeed={handleFeedPet}
            />
          ) : null}

          {win.appId === 'timeline' ? (
            <TimelineApp
              cards={TIMELINE_CARDS.filter(
                (c) =>
                  c.chapter <= contentChapter &&
                  (!c.untilChapter || contentChapter < c.untilChapter)
              )}
              evidence={TIMELINE_EVIDENCE.filter((e) => e.chapter <= contentChapter)}
              chapter={contentChapter}
              solved={
                contentChapter === 1
                  ? !!caseState.flags.timeline_ch1_closed
                  : !!caseState.flags.timeline_ch2_solved
              }
              placements={timelinePlacements}
              discoveredClues={discoveredClues}
              onPlacementsChange={setTimelinePlacements}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
              onSubmitResult={handleTimelineSubmit}
            />
          ) : null}

          {win.appId === 'radio' ? (
            <RadioApp
              channels={RADIO_CHANNELS.filter((c) => c.chapter <= contentChapter)}
              onListen={handleRadioListen}
            />
          ) : null}

          {win.appId === 'relations' ? (
            <RelationsApp
              nodes={RELATION_NODES}
              edgeDefs={RELATION_EDGES}
              discoveredClues={discoveredClues}
              collectedIds={metCharacters}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
            />
          ) : null}

          {win.appId === 'archive' ? (
            <ArchiveApp
              drawers={archiveDrawers}
              discoveredClues={discoveredClues}
              locked={contentChapter < 3}
              onDiscoverClue={discoverClue}
              onFlag={handleFlag}
            />
          ) : null}

          {win.appId === 'filing' ? (
            <FilingApp
              chapter={contentChapter}
              discoveredClues={discoveredClues}
              onDiscoverClue={discoverClue}
            />
          ) : null}

        </WindowFrame>
      ))}

      <DesktopPet
        chapter={caseState.chapter}
        onOpenPet={() => openApp('pet')}
        fetchJob={pendingRestoreJob}
        onFetchComplete={(fileId, fileName) => {
          setFsNodes((prev) => restoreFromTrash(prev, fileId));
          setPendingRestoreJob(null);
          showToast(`煤球叼回来了！「${fileName}」已还原到原文件夹`);
        }}
        onFetchFailed={() => {
          setPendingRestoreJob(null);
          showToast('煤球没赶上…文件还在回收站里');
        }}
      />

      <StartMenu
        open={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        onOpenApp={openApp}
        onLockScreen={() => {
          soundEngine.stopMusic();
          setMusicPlaying(false);
          setPhase('title');
        }}
        onResetCase={handleResetCase}
        saveSlots={saveSlots}
        onSaveSlot={handleSaveSlot}
        onLoadSlot={handleLoadSlot}
        onDeleteSlot={handleDeleteSlot}
      />

      <Taskbar
        windows={windows}
        activeWindowId={activeWindowId}
        startMenuOpen={startMenuOpen}
        muted={muted}
        cluesFound={discoveredClues.length}
        totalClues={INITIAL_CLUES.length}
        chapter={caseState.chapter}
        onToggleStartMenu={() =>
          setStartMenuOpen((open) => {
            if (!open) {
              readSaveSlots().then(setSaveSlots).catch(() => {});
            }
            return !open;
          })
        }
        onSelectWindow={handleTaskbarSelectWindow}
        onOpenApp={(appId) => openApp(appId)}
        onToggleMute={handleToggleMute}
      />

      {victoryInfo?.open ? (
        <VictoryModal
          cluesFound={discoveredClues.length}
          totalClues={INITIAL_CLUES.length}
          elapsedSeconds={elapsedSeconds}
          score={victoryInfo.score}
          summary={victoryInfo.summary}
          ending={victoryInfo.ending}
          onRestart={handleResetCase}
          onContinueExploring={() => {
            setVictoryInfo((prev) => (prev ? { ...prev, open: false } : null));
            setPhase('playing');
          }}
        />
      ) : null}
    </div>
    </CollectProvider>
  );
}
