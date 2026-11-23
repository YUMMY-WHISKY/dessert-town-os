import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Power, Radio } from 'lucide-react';
import { RadioChannel } from '../../os/types';
import { soundEngine } from '../../os/sound';
import { RichText } from '../RichText';

interface RadioAppProps {
  channels: RadioChannel[];
  onListen: (channelId: string) => void;
}

const MIN_FREQ = 88;
const MAX_FREQ = 108;
const TOLERANCE = 0.6;

function freqToPercent(freq: number): number {
  return Math.min(96, Math.max(4, ((freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * 100));
}

export const RadioApp: React.FC<RadioAppProps> = ({ channels, onListen }) => {
  const [freq, setFreq] = useState(MIN_FREQ);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [tuning, setTuning] = useState(false);

  const match = useMemo(() => {
    const hits = channels
      .filter((c) => Math.abs(Number(c.frequency) - freq) <= TOLERANCE)
      .sort((a, b) => b.chapter - a.chapter);
    return hits[0] ?? null;
  }, [channels, freq]);

  const active = channels.find((c) => c.id === activeId) ?? null;

  // 调到某个频道就记一次「听过」
  useEffect(() => {
    if (activeId) onListen(activeId);
  }, [activeId, onListen]);

  const nearest = useMemo(() => {
    if (channels.length === 0) return null;
    return channels
      .map((c) => ({ c, d: Math.abs(Number(c.frequency) - freq) }))
      .sort((a, b) => a.d - b.d)[0];
  }, [channels, freq]);

  const strength = nearest ? Math.max(0, Math.min(1, 1 - nearest.d / 2)) : 0;

  useEffect(() => {
    setActiveId(match?.id ?? null);
    setVisibleCount(0);
    if (!match) {
      setTuning(false);
      return;
    }
    setTuning(true);
    soundEngine.playRadioStatic(0.5);
    const t = window.setTimeout(() => {
      setTuning(false);
      setVisibleCount(1);
    }, 500);
    return () => window.clearTimeout(t);
    // 只在「锁定到哪个频道」变化时重新调台，避免自身 setState 把计时器清掉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  useEffect(() => {
    if (!active || visibleCount === 0 || visibleCount >= active.lines.length) return;
    const t = window.setTimeout(() => {
      soundEngine.playRadioTick();
      setVisibleCount((n) => n + 1);
    }, 900);
    return () => window.clearTimeout(t);
  }, [active, visibleCount]);

  const step = (delta: number) => {
    soundEngine.playClick();
    setFreq((f) => Math.min(MAX_FREQ, Math.max(MIN_FREQ, +(f + delta).toFixed(1))));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFF8FB]">
      {/* 收音机外壳 */}
      <div className="p-4">
        <div className="rounded-2xl border-[2.5px] border-[#3A2D28] bg-gradient-to-b from-[#E3C39C] to-[#C9A277] shadow-[4px_4px_0_#3A2D28] p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-14 rounded-xl border-2 border-[#3A2D28] bg-[#B98F63] overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(180deg, rgba(58,45,40,0.35) 0 2px, transparent 2px 6px)',
                }}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center">
                <div
                  className="w-1 h-3.5 bg-[#3A2D28] rounded-full origin-bottom -translate-y-1"
                  style={{ transform: `rotate(${((freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * 300 - 150}deg) translateY(-4px)` }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setFreq(MIN_FREQ);
                  setActiveId(null);
                  setVisibleCount(0);
                }}
                aria-label="关机"
                className="w-9 h-9 rounded-full bg-[#FBCFE8] border-2 border-[#3A2D28] flex items-center justify-center cartoon-btn"
              >
                <Power className="w-4 h-4 text-[#3A2D28]" />
              </button>
            </div>
          </div>

          {/* 频率刻度 */}
          <div className="mt-3 relative h-6 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {['88', '92', '96', '100', '104', '108'].map((f) => (
                <span key={f} className="text-[9px] font-bold text-[#8B6B4A] font-mono-tabular">
                  {f}
                </span>
              ))}
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#DC2626] transition-[left] duration-150"
              style={{ left: `${freqToPercent(freq)}%` }}
            />
          </div>

          {/* 调频 */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-0.2)}
              aria-label="向左微调"
              className="w-8 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center cartoon-btn"
            >
              <ChevronLeft className="w-4 h-4 text-[#3A2D28]" />
            </button>

            <input
              type="range"
              min={MIN_FREQ}
              max={MAX_FREQ}
              step={0.1}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              aria-label="调频旋钮"
              className="flex-1 accent-[#3A2D28] cursor-pointer"
            />

            <button
              type="button"
              onClick={() => step(0.2)}
              aria-label="向右微调"
              className="w-8 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center cartoon-btn"
            >
              <ChevronRight className="w-4 h-4 text-[#3A2D28]" />
            </button>

            <span className="w-16 text-right text-xs font-black text-[#3A2D28] font-mono-tabular tabular-nums">
              {freq.toFixed(1)}
            </span>
          </div>

          {/* 信号格 */}
          <div className="mt-2 flex items-center justify-end gap-1">
            <span className="text-[9px] font-bold text-[#6B4E36] mr-1">信号</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-1.5 rounded-sm transition-colors ${
                  strength * 5 > i ? 'bg-[#3A2D28]' : 'bg-[#3A2D28]/20'
                }`}
                style={{ height: `${6 + i * 3}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 字幕区 */}
      <div className="flex-1 min-h-0 mx-4 mb-3 rounded-2xl border-2 border-[#3A2D28] bg-[#FFFDF7] p-3 overflow-y-auto cartoon-scroll flex flex-col">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Radio className="w-7 h-7 text-[#C4B5A5] mb-2" />
            <p className="text-xs font-bold text-[#6E5A52] leading-relaxed text-center max-w-[240px]">
              慢慢拧动旋钮。信号格亮起来的时候，停下来。
            </p>
            <p className="text-[10px] text-[#A99A8C] mt-1 tabular-nums">
              当前 {freq.toFixed(1)} MHz
            </p>
          </div>
        ) : tuning ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-[#6E5A52] font-mono-tabular">—— 沙沙沙 ——</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#8B7A6B] tabular-nums">
              {active.frequency} MHz · {active.name}
            </p>
            {active.lines.slice(0, visibleCount).map((line, idx) => (
              <div key={idx}>
                <p className="text-xs text-[#3A2D28] leading-relaxed">
                  <RichText text={line.text} />
                </p>
              </div>
            ))}
            {visibleCount < active.lines.length ? (
              <p className="text-[11px] text-[#9AA6C7] pt-1">……</p>
            ) : (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(1)}
                  className="text-[11px] font-bold text-[#6E5A52] underline"
                >
                  重播这段
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
