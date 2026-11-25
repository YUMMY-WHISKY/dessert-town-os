import React, { useRef, useState } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { WindowState } from '../os/types';
import { AppIcon } from './CartoonIcons';

const MIN_W = 280;
const MIN_H = 200;

interface WindowFrameProps {
  win: WindowState;
  isActive: boolean;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onToggleMaximize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  children,
}) => {
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeState = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  // 最小化 / 关闭都只隐藏不卸载，重新打开时应用内部状态还在
  const hidden = win.minimized || !!win.closed;

  const handlePointerDownTitle = (e: React.PointerEvent<HTMLDivElement>) => {
    if (win.maximized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus(win.id);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveTitle = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const nextX = Math.max(-win.width + 160, Math.min(window.innerWidth - 160, dragState.current.origX + dx));
    const nextY = Math.max(8, Math.min(window.innerHeight - 100, dragState.current.origY + dy));
    onMove(win.id, nextX, nextY);
  };

  const handlePointerUpTitle = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    dragState.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // ---- resize 手柄 ----
  const handlePointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (win.maximized) return;
    onFocus(win.id);
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: win.width,
      origH: win.height,
    };
    setResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeState.current) return;
    const dx = e.clientX - resizeState.current.startX;
    const dy = e.clientY - resizeState.current.startY;
    const nextW = Math.min(
      Math.max(MIN_W, resizeState.current.origW + dx),
      window.innerWidth - 16
    );
    const nextH = Math.min(
      Math.max(MIN_H, resizeState.current.origH + dy),
      window.innerHeight - 76
    );
    onResize(win.id, nextW, nextH);
  };

  const handlePointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeState.current) return;
    resizeState.current = null;
    setResizing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const headerTint: Record<WindowState['appId'], string> = {
    explorer: 'bg-[#FFE29A]',
    notepad: 'bg-[#FEF3C7]',
    photos: 'bg-[#BAE6FD]',
    mail: 'bg-[#FFE4E9]',
    chat: 'bg-[#A7F3D0]',
    music: 'bg-[#DDD6FE]',
    clueboard: 'bg-[#FED7AA]',
    achievements: 'bg-[#FDE68A]',
    browser: 'bg-[#BFDBFE]',
    pet: 'bg-[#FEE2E2]',
    timeline: 'bg-[#C7D2FE]',
    radio: 'bg-[#FBCFE8]',
    relations: 'bg-[#D9F99D]',
    archive: 'bg-[#A5F3FC]',
    filing: 'bg-[#FDE68A]',
  };

  const frameStyle: React.CSSProperties = win.maximized
    ? {
        left: 8,
        top: 8,
        width: 'calc(100vw - 16px)',
        height: 'calc(100vh - 72px)',
        zIndex: win.zIndex,
      }
    : {
        left: `clamp(8px, ${win.x}px, max(8px, calc(100vw - min(${win.width}px, calc(100vw - 16px)) - 8px)))`,
        top: `clamp(8px, ${win.y}px, max(8px, calc(100vh - min(${win.height}px, calc(100vh - 76px)) - 68px)))`,
        width: `min(${win.width}px, calc(100vw - 16px))`,
        height: `min(${win.height}px, calc(100vh - 76px))`,
        zIndex: win.zIndex,
      };

  return (
    <section
      role="dialog"
      aria-label={win.title}
      aria-hidden={hidden || undefined}
      onMouseDown={() => onFocus(win.id)}
      style={hidden ? { ...frameStyle, display: 'none' } : frameStyle}
      className={`fixed flex flex-col rounded-2xl bg-[#FFFDF7] border-[2.5px] border-[#3A2D28] overflow-hidden transition-shadow duration-150 ${
        isActive
          ? 'shadow-[6px_6px_0px_#3A2D28]'
          : 'shadow-[3px_3px_0px_rgba(58,45,40,0.45)] opacity-[0.98]'
      }`}
    >
      {/* Window Title Bar */}
      <div
        onPointerDown={handlePointerDownTitle}
        onPointerMove={handlePointerMoveTitle}
        onPointerUp={handlePointerUpTitle}
        onDoubleClick={() => onToggleMaximize(win.id)}
        className={`flex items-center justify-between px-3 py-2 border-b-[2.5px] border-[#3A2D28] select-none ${
          headerTint[win.appId]
        } ${win.maximized ? 'cursor-default' : dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AppIcon appId={win.appId} className="w-5 h-5 shrink-0" />
          <h2 className="text-sm font-bold text-[#3A2D28] truncate">{win.title}</h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onMinimize(win.id)}
            aria-label={`最小化 ${win.title}`}
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#F3E8D2] transition-colors focus-visible:outline-2 focus-visible:outline-[#3A2D28]"
          >
            <Minus className="w-3.5 h-3.5 text-[#3A2D28]" strokeWidth={2.8} />
          </button>
          <button
            type="button"
            onClick={() => onToggleMaximize(win.id)}
            aria-label={win.maximized ? `还原 ${win.title}` : `最大化 ${win.title}`}
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#F3E8D2] transition-colors focus-visible:outline-2 focus-visible:outline-[#3A2D28]"
          >
            {win.maximized ? (
              <Maximize2 className="w-3.5 h-3.5 text-[#3A2D28]" strokeWidth={2.5} />
            ) : (
              <Square className="w-3 h-3 text-[#3A2D28]" strokeWidth={2.8} />
            )}
          </button>
          <button
            type="button"
            onClick={() => onClose(win.id)}
            aria-label={`关闭 ${win.title}`}
            className="w-7 h-7 rounded-lg bg-[#FF758F] border-2 border-[#3A2D28] flex items-center justify-center hover:bg-[#FF5C7A] transition-colors focus-visible:outline-2 focus-visible:outline-[#3A2D28]"
          >
            <X className="w-3.5 h-3.5 text-[#3A2D28]" strokeWidth={2.8} />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7] overflow-hidden relative">
        {children}
        {/* 右下角 resize 手柄（最大化时隐藏） */}
        {!win.maximized && (
          <div
            onPointerDown={handlePointerDownResize}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            aria-label="调整窗口大小"
            className={`absolute right-0 bottom-0 w-5 h-5 cursor-se-resize ${
              resizing ? 'bg-[#F3E8D2]' : 'bg-[#3A2D28]/5 hover:bg-[#F3E8D2]'
            } rounded-tl-lg z-10`}
          >
            <svg viewBox="0 0 20 20" className="w-full h-full text-[#3A2D28] opacity-70" fill="currentColor">
              <path d="M14 14h4v4h-4zM9 14h3v3h-3zM14 9h4v3h-4z" />
            </svg>
          </div>
        )}
      </div>
    </section>
  );
};
