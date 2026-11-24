import React, { useState } from 'react';
import { Archive, KeyRound, Search, Stamp } from 'lucide-react';
import { ArchiveDrawer } from '../../os/types';
import { soundEngine } from '../../os/sound';
import { RichText } from '../RichText';

interface ArchiveAppProps {
  drawers: ArchiveDrawer[];
  discoveredClues: string[];
  locked?: boolean;
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
}

export const ArchiveApp: React.FC<ArchiveAppProps> = ({
  drawers,
  discoveredClues,
  locked = false,
  onDiscoverClue,
  onFlag,
}) => {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);

  const selected = drawers.find((d) => d.id === selectedId) ?? null;
  const isOpen = selected ? unlocked.includes(selected.id) : false;

  const handleSelect = (drawer: ArchiveDrawer) => {
    soundEngine.playClick();
    setSelectedId(drawer.id);
    setCode('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const normalized = code.trim().replace(/\s/g, '');
    if (normalized === selected.code) {
      soundEngine.playUnlock();
      setUnlocked((prev) => [...prev, selected.id]);
      setCode('');
      if (selected.flag) onFlag(selected.flag);
    } else {
      soundEngine.playError();
      setShake(true);
      window.setTimeout(() => setShake(false), 320);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex bg-[#FFFDF7]">
      {locked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Archive className="w-9 h-9 text-[#0E7490] mb-2" />
          <p className="text-sm font-black text-[#3A2D28] mb-1">档案室尚未开放调阅</p>
          <p className="text-xs text-[#6E5A52] max-w-xs leading-relaxed">
            管理员说，要等警局出具正式的调阅申请。先把手头的案子理清楚吧。
          </p>
        </div>
      ) : (
        <>
      {/* 档案柜 */}
      <aside className="w-40 shrink-0 p-3 bg-[#E6FAFD] border-r-2 border-[#3A2D28] overflow-y-auto cartoon-scroll">
        <h3 className="text-xs font-black text-[#0E7490] mb-2 flex items-center gap-1.5">
          <Archive className="w-4 h-4" />
          <span>档案抽屉</span>
        </h3>
        <div className="space-y-2">
          {drawers.map((d) => {
            const opened = unlocked.includes(d.id);
            const active = selectedId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleSelect(d)}
                className={`w-full text-left px-2.5 py-2 rounded-xl border-2 transition-colors ${
                  active
                    ? 'bg-[#A5F3FC] border-[#3A2D28] shadow-[2px_2px_0_#3A2D28]'
                    : 'bg-[#FFFDF7] border-[#3A2D28]/40 hover:border-[#3A2D28]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#3A2D28] font-mono-tabular">
                    {d.year}
                  </span>
                  {opened ? (
                    <span className="text-[9px] font-black text-[#059669]">已开</span>
                  ) : (
                    <KeyRound className="w-3 h-3 text-[#6E5A52]" />
                  )}
                </div>
                <p className="text-[10px] text-[#6E5A52] leading-tight mt-0.5 line-clamp-2">
                  {opened ? d.headline : '调阅编号未知'}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 阅读区 */}
      <div className="flex-1 min-w-0 p-4 overflow-y-auto cartoon-scroll">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Search className="w-9 h-9 text-[#0E7490] mb-2" />
            <p className="text-sm font-black text-[#3A2D28]">选一个抽屉</p>
            <p className="text-xs text-[#6E5A52] mt-1 max-w-xs leading-relaxed">
              每个抽屉都有一串调阅编号。编号不会写在抽屉上，它藏在别的地方。
            </p>
          </div>
        ) : isOpen ? (
          <article
            className={`max-w-2xl mx-auto p-5 rounded-lg border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] ${
              shake ? 'animate-[shake_0.28s_ease-in-out]' : ''
            }`}
            style={{
              backgroundColor: '#FBF3DF',
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent 0 26px, rgba(150,120,70,0.12) 26px 27px)',
            }}
          >
            <div className="flex items-center justify-between border-b-2 border-[#3A2D28] pb-2 mb-3">
              <span className="text-[11px] font-bold text-[#6E5A52]">{selected.dateline}</span>
              <span className="rotate-[-6deg] px-2 py-0.5 border-2 border-[#DC2626] text-[#DC2626] text-[10px] font-black rounded flex items-center gap-1">
                <Stamp className="w-3 h-3" />
                {selected.stamp}
              </span>
            </div>
            <h2 className="text-lg font-black text-[#3A2D28] leading-snug mb-3">
              {selected.headline}
            </h2>
            <div className="space-y-2">
              {selected.paragraphs.map((p, i) => (
                <p key={i} className="text-xs text-[#4A3A32] leading-6 text-justify">
                  <RichText text={p} />
                </p>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-[#8B7A6B] text-right">
              编号 {selected.code}
            </p>
            {selected.extraClueId ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClueFound();
                  onDiscoverClue(selected.extraClueId!);
                  onFlag(selected.extraClueId!);
                }}
                className="cartoon-btn w-full mt-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[11px] font-black text-[#3A2D28]"
              >
                {discoveredClues.includes(selected.extraClueId)
                  ? '已经看过了'
                  : selected.extraLabel ?? '再仔细看一遍'}
              </button>
            ) : null}
          </article>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className={`w-full max-w-sm rounded-2xl bg-[#FFFDF7] border-[2.5px] border-[#3A2D28] shadow-[4px_4px_0_#3A2D28] p-5 ${
                shake ? 'animate-[shake_0.28s_ease-in-out]' : ''
              }`}
            >
              <h3 className="text-sm font-black text-[#3A2D28] mb-1">
                {selected.year} 年 · 调阅编号
              </h3>
              <p className="text-[11px] text-[#6E5A52] leading-relaxed mb-3">
                抽屉锁住了。编号是「年份-四位数字」的格式，四位数字来自当年的某一天。
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例如 2006-0000"
                className="w-full px-3 py-2 text-sm rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] font-mono-tabular text-[#3A2D28] focus:outline-none focus:bg-white mb-2"
              />
              <button
                type="submit"
                className="cartoon-btn w-full py-2 rounded-xl bg-[#A5F3FC] text-xs font-black text-[#3A2D28]"
              >
                调阅
              </button>
            </form>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
