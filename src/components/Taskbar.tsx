import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Search } from 'lucide-react';
import { AppId, WindowState } from '../os/types';
import { AppIcon, PawEmblem } from './CartoonIcons';

interface TaskbarProps {
  windows: WindowState[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  muted: boolean;
  cluesFound: number;
  totalClues: number;
  chapter: number;
  onToggleStartMenu: () => void;
  onSelectWindow: (winId: string) => void;
  onOpenApp: (appId: AppId) => void;
  onToggleMute: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  activeWindowId,
  startMenuOpen,
  muted,
  cluesFound,
  totalClues,
  chapter,
  onToggleStartMenu,
  onSelectWindow,
  onOpenApp,
  onToggleMute,
}) => {
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026/11/21',
    };
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: '2026/11/21',
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const pinnedApps: { appId: AppId; label: string }[] = [
    { appId: 'explorer', label: '文件管理器' },
    { appId: 'mail', label: '喵喵信箱' },
    { appId: 'chat', label: '汪汪聊天' },
    { appId: 'photos', label: '图画看图' },
    { appId: 'timeline', label: '时间线白板' },
    { appId: 'archive', label: '镇档案室' },
    { appId: 'clueboard', label: '破案手账' },
  ];

  return (
    <footer
      aria-label="系统任务栏"
      className="fixed bottom-0 left-0 right-0 h-14 z-[800] bg-[#FFFDF7] border-t-[2.5px] border-[#3A2D28] px-3 flex items-center justify-between gap-3"
    >
      {/* Left: Start Button + Quick Launch Pins */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleStartMenu}
          aria-expanded={startMenuOpen}
          aria-label="打开开始菜单"
          className={`cartoon-btn px-3.5 py-1.5 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 ${
            startMenuOpen ? 'bg-[#FFA90A]' : 'bg-[#FFB830]'
          } text-[#3A2D28]`}
        >
          <PawEmblem className="w-5 h-5" />
          <span>开始</span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l-2 border-[#E5D8C5]">
          {pinnedApps.map((item) => (
            <button
              key={item.appId}
              type="button"
              onClick={() => onOpenApp(item.appId)}
              aria-label={`快速启动 ${item.label}`}
              title={item.label}
              className="w-10 h-10 rounded-xl bg-[#F6EFE2] border-2 border-transparent hover:border-[#3A2D28] hover:bg-[#FEF3C7] flex items-center justify-center transition-colors shrink-0"
            >
              <AppIcon appId={item.appId} className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Center: Open Windows Switcher */}
      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto cartoon-scroll py-1">
        {windows.filter((win) => !win.closed).map((win) => {
          const isCurrent = win.id === activeWindowId && !win.minimized;
          return (
            <button
              key={win.id}
              type="button"
              onClick={() => onSelectWindow(win.id)}
              className={`h-9 px-3 rounded-xl border-2 border-[#3A2D28] flex items-center gap-2 text-xs font-bold whitespace-nowrap shrink-0 max-w-[180px] transition-colors ${
                isCurrent
                  ? 'bg-[#FFE29A] text-[#3A2D28] shadow-[2px_2px_0px_#3A2D28]'
                  : 'bg-[#F6EFE2] text-[#6E5A52] hover:bg-[#FEF3C7] hover:text-[#3A2D28]'
              }`}
            >
              <AppIcon appId={win.appId} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{win.title}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Clue Progress Button + Sound + Clock */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden lg:inline-flex px-2 py-1 rounded-lg bg-[#FFF8EB] border-2 border-[#3A2D28] text-[11px] font-black text-[#3A2D28] whitespace-nowrap">
          第 {chapter} 章
        </span>
        <button
          type="button"
          onClick={() => onOpenApp('clueboard')}
          aria-label={`打开破案手账，已收集 ${cluesFound} / ${totalClues} 条线索`}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FED7AA] text-xs font-bold text-[#3A2D28] flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="tabular-nums">
            线索 {cluesFound}/{totalClues}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? '开启音效' : '静音'}
          title={muted ? '开启音效' : '静音'}
          className="w-9 h-9 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#FEF3C7] transition-colors shrink-0"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-[#6E5A52]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#3A2D28]" />
          )}
        </button>

        <div className="hidden sm:flex flex-col items-end justify-center pl-2 border-l-2 border-[#E5D8C5] leading-tight">
          <span className="text-xs font-bold text-[#3A2D28] font-mono-tabular">{clock.time}</span>
          <span className="text-[11px] text-[#6E5A52] font-mono-tabular">{clock.date}</span>
        </div>
      </div>
    </footer>
  );
};
