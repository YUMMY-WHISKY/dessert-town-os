import React, { useMemo, useState } from 'react';
import { Clock, Link2, RotateCcw, Snowflake, Stamp } from 'lucide-react';
import { TimelineCard, TimelineEvidence } from '../../os/types';
import { soundEngine } from '../../os/sound';

interface TimelineAppProps {
  cards: TimelineCard[];
  evidence: TimelineEvidence[];
  chapter: number;
  solved: boolean;
  placements: Record<string, number>;
  discoveredClues: string[];
  onPlacementsChange: (next: Record<string, number>) => void;
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
  onSubmitResult?: (chapter: number, ok: boolean) => void;
}

const TOTAL_MIN = 60;

function minuteLabel(min: number): string {
  const t = 14 * 60 + Math.round(min);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clampMinute(guess: number): number {
  return Math.round(Math.min(TOTAL_MIN, Math.max(0, guess)));
}

/** 判定：点卡精确到分钟；区间卡按 start–end 覆盖 */
function isCorrect(card: TimelineCard, minute: number, chapter: number): boolean {
  const range = card.acceptRange && card.acceptRange.chapter === chapter ? card.acceptRange : null;
  if (range) return minute >= range.from && minute <= range.to;
  if (card.kind === 'span') return minute >= card.start && minute <= card.end;
  return minute === card.start;
}

export const TimelineApp: React.FC<TimelineAppProps> = ({
  cards,
  evidence,
  chapter,
  solved,
  placements,
  discoveredClues,
  onPlacementsChange,
  onDiscoverClue,
  onFlag,
  onSubmitResult,
}) => {
  const [hover, setHover] = useState<{ cardId: string; minute: number } | null>(null);
  const [inspectedEvidence, setInspectedEvidence] = useState<TimelineEvidence | null>(null);
  const [judged, setJudged] = useState<{ chapter: number; ok: boolean; message: string } | null>(null);

  const placedCount = useMemo(
    () => cards.filter((c) => placements[c.id] !== undefined).length,
    [cards, placements]
  );
  const allPlaced = cards.length > 0 && placedCount === cards.length;
  const submitted = solved || (judged?.ok === true && judged.chapter === chapter);

  const placeCard = (card: TimelineCard, minute: number) => {
    if (submitted) return;
    soundEngine.playClick();
    // 区间卡吸附到真实起点：否则左边界会跟着点击位置跑，整条卡飞出轨道
    const target = card.kind === 'span' ? card.start : minute;
    onPlacementsChange({ ...placements, [card.id]: clampMinute(target) });
    setJudged(null);
  };

  const handleLaneClick = (e: React.MouseEvent<HTMLDivElement>, card: TimelineCard) => {
    if (submitted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    placeCard(card, ratio * TOTAL_MIN);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, card: TimelineCard) => {
    e.preventDefault();
    if (submitted) return;
    const id = e.dataTransfer.getData('text/plain');
    if (id && id !== card.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    placeCard(card, ratio * TOTAL_MIN);
  };

  const handleReset = () => {
    if (submitted) return;
    soundEngine.playClick();
    onPlacementsChange({});
    setJudged(null);
  };

  const handleSubmit = () => {
    if (submitted || cards.length === 0) return;
    const missing = cards.filter((c) => placements[c.id] === undefined).length;
    if (missing > 0) {
      soundEngine.playError();
      setJudged({ chapter, ok: false, message: `还有 ${missing} 张证词没有放到时间线上。` });
      return;
    }
    const wrong = cards.filter((c) => !isCorrect(c, placements[c.id], chapter)).length;
    if (wrong > 0) {
      soundEngine.playError();
      onSubmitResult?.(chapter, false);
      setJudged({ chapter, ok: false, message: `有 ${wrong} 张位置不对，再核对一下。` });
      return;
    }
    onSubmitResult?.(chapter, true);
    if (chapter === 1) {
      soundEngine.playVictory();
      onFlag('timeline_ch1_closed');
    } else {
      soundEngine.playClueFound();
      onFlag('timeline_break_1');
      onFlag('timeline_break_2');
      onFlag('timeline_break_3');
      onFlag('timeline_ch2_solved');
    }
    setJudged({ chapter, ok: true, message: '' });
  };

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFF]">
        <p className="text-sm font-black text-[#3A2D28] mb-1">白板上还没有证词</p>
        <p className="text-xs text-[#6E5A52] max-w-xs leading-relaxed">
          现在收集到的说法太少了，摆不出时间轴。等有人开始互相矛盾的时候再来。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F8FAFF]">
      {/* 顶部工具条 */}
      <div className="px-3 py-2 bg-[#EEF2FF] border-b-2 border-[#3A2D28] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-[#4338CA] shrink-0" />
          <span className="text-xs font-black text-[#3A2D28] truncate">
            {chapter === 1
              ? '把每条证词放到它发生的时间上 · 最后点击提交判定'
              : '时间线断了。重摆每一张，最后点击提交判定'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-[#6E5A52] tabular-nums">
            {placedCount}/{cards.length}
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitted}
            className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重排</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll px-5 py-3">
        {chapter >= 2 ? (
          <div className="mb-3 p-2.5 rounded-xl bg-[#FFE4E9] border-2 border-[#3A2D28] flex items-start gap-2">
            <Link2 className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-[#3A2D28] leading-relaxed">
              新证据加入：钱是空头预授权，抽屉 14:25 才被打开，米露在 14:20–14:27 不在后厨。
              第一章的时间线已经断裂，重摆。
            </p>
          </div>
        ) : null}

        {/* 精确刻度尺：与每行轨道同宽对齐 */}
        <div className="flex gap-2 mb-1">
          <div className="w-24 shrink-0" />
          <div className="relative flex-1 h-10 select-none">
            {Array.from({ length: 61 }).map((_, m) => {
              const major = m % 15 === 0;
              const five = m % 5 === 0;
              return (
                <span
                  key={m}
                  style={{ left: `${(m / TOTAL_MIN) * 100}%` }}
                  className={`absolute bottom-0 w-px ${
                    major ? 'h-4 bg-[#4338CA]' : five ? 'h-2.5 bg-[#818CF8]' : 'h-1 bg-[#C7D2FE]'
                  }`}
                />
              );
            })}
            {Array.from({ length: 13 }).map((_, i) => {
              const m = i * 5;
              const major = m % 15 === 0;
              const edgeTransform =
                m === 0 ? 'translate-x-0' : m === TOTAL_MIN ? '-translate-x-full' : '-translate-x-1/2';
              return (
                <span
                  key={`label-${m}`}
                  style={{ left: `${(m / TOTAL_MIN) * 100}%` }}
                  className={`absolute top-0 ${edgeTransform} text-[8px] font-bold font-mono-tabular ${
                    major ? 'text-[#3A2D28]' : 'text-[#818CF8]'
                  }`}
                >
                  {minuteLabel(m)}
                </span>
              );
            })}
            {chapter === 1 && submitted ? (
              <span
                style={{ left: `${(25 / TOTAL_MIN) * 100}%` }}
                className="absolute -bottom-1 -translate-x-1/2 flex flex-col items-center"
              >
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] border border-[#3A2D28]" />
              </span>
            ) : null}
          </div>
        </div>

        {/* 每张证词一行 */}
        <div className="space-y-2">
          {cards.map((card) => {
            const start = placements[card.id];
            const done = start !== undefined;
            const span = Math.max(card.end - card.start, 0);
            const widthPct = Math.max(1.5, (span / TOTAL_MIN) * 100);
            const isPoint = card.kind !== 'span';
            const hovering = hover?.cardId === card.id;
            return (
              <div key={card.id} className="flex items-stretch gap-2">
                <div
                  draggable={!submitted}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', card.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`w-24 shrink-0 flex items-center justify-center rounded-lg px-2 py-1 text-center relative ${
                    done ? 'bg-[#F6EFE2]' : 'bg-[#EEF2FF] cursor-grab active:cursor-grabbing'
                  } ${submitted ? 'opacity-70' : ''}`}
                >
                  <span className="text-[11px] font-black text-[#3A2D28] leading-tight">
                    {card.who}
                  </span>
                </div>

                <div
                  onClick={(e) => handleLaneClick(e, card)}
                  onDragOver={(e) => {
                    if (submitted) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => handleDrop(e, card)}
                  onMouseMove={(e) => {
                    if (submitted || done) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                    setHover({ cardId: card.id, minute: ratio * TOTAL_MIN });
                  }}
                  onMouseLeave={() => setHover(null)}
                  className={`relative flex-1 h-12 rounded-xl border-2 transition-colors ${
                    done
                      ? 'bg-[#FFFDF7] border-[#3A2D28]'
                      : 'bg-[#FFFDF7]/60 border-dashed border-[#C7D2FE] hover:border-[#6366F1] cursor-crosshair'
                  } ${submitted ? 'opacity-70' : ''}`}
                >
                  {/* 5 分钟网格 */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex-1 border-r border-[#EEF2FF]" />
                    ))}
                  </div>

                  {/* 悬停时间指针 */}
                  {!done && hovering ? (
                    <>
                      <span
                        style={{ left: `${(hover!.minute / TOTAL_MIN) * 100}%` }}
                        className="absolute top-0 bottom-0 w-px bg-[#DC2626] pointer-events-none"
                      />
                      <span
                        style={{ left: `${(hover!.minute / TOTAL_MIN) * 100}%` }}
                        className={`absolute -top-2 ${
                          hover!.minute < 3
                            ? 'translate-x-0'
                            : hover!.minute > 57
                              ? '-translate-x-full'
                              : '-translate-x-1/2'
                        } px-1 py-0.5 rounded bg-[#3A2D28] text-[#FFFDF7] text-[8px] font-bold font-mono-tabular whitespace-nowrap pointer-events-none z-20`}
                      >
                        {minuteLabel(hover!.minute)}
                      </span>
                    </>
                  ) : null}

                  {done ? (
                    <div
                      style={{
                        left: `${(start / TOTAL_MIN) * 100}%`,
                        width: isPoint ? undefined : `${widthPct}%`,
                      }}
                      className={
                        isPoint
                          ? 'absolute top-1 bottom-1 -translate-x-1/2 px-2 rounded-md bg-[#E5E7EB] border-2 border-[#3A2D28] flex items-center justify-center shadow-[2px_2px_0_#3A2D28]'
                          : 'absolute top-1 bottom-1 rounded-md bg-[#E5E7EB] border-2 border-[#3A2D28] flex items-center justify-center shadow-[2px_2px_0_#3A2D28]'
                      }
                    >
                      <span className="text-[9px] font-black text-[#3A2D28] font-mono-tabular whitespace-nowrap">
                        {minuteLabel(start)}
                        {span > 0 ? `–${minuteLabel(start + span)}` : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#9AA6C7] pointer-events-none">
                      点击或把左侧卡拖到这一行的时间位置
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 提交判定 */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitted || !allPlaced}
            className={`cartoon-btn px-3 py-2 rounded-xl text-xs font-black ${
              submitted ? 'bg-[#D1FAE5] text-[#3A2D28]' : 'bg-[#FFB830] text-[#3A2D28]'
            } disabled:opacity-40`}
          >
            {submitted ? '时间线已提交' : allPlaced ? '提交时间线' : `还差 ${cards.length - placedCount} 张`}
          </button>
          {judged && !judged.ok ? (
            <p className="text-[11px] font-bold text-[#DC2626]">{judged.message}</p>
          ) : (
            <p className="text-[11px] font-bold text-[#6E5A52]">
              全部放好后再提交；位置不对可以继续调整。
            </p>
          )}
        </div>

        {/* 第一章结案 */}
        {chapter === 1 && submitted ? (
          <div className="mt-3 p-3 rounded-xl bg-[#D1FAE5] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] flex items-start gap-2.5">
            <Stamp className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-[#3A2D28]">
                时间线闭合：布莱克进店、离开，期间配方消失。结案。
              </p>
              <p className="text-[11px] font-bold text-[#6E5A52] mt-0.5">
                但刻度上还留着一个没有对应证词的灰点——14:25。
              </p>
            </div>
          </div>
        ) : null}

        {/* 第二章断点 */}
        {chapter >= 2 ? (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-[#C7D2FE]">
            <p className="text-xs font-black text-[#3A2D28] mb-2 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#DC2626]" />
              <span>时间轴上的断点</span>
            </p>
            {submitted ? (
              <div className="space-y-2">
                <BreakRow
                  index={1}
                  open
                  text="布莱克 14:21 离开，抽屉 14:25 才被打开——开门的人不是他。"
                />
                <BreakRow
                  index={2}
                  open
                  text="烤箱 14:20 就响了，米露却说一直在后厨——她的证词有 7 分钟是空的。"
                />
                <BreakRow
                  index={3}
                  open
                  text="14:25 抽屉被打开，14:29 冷链箱被推到后门；17:30 阿柴取走时，箱子从 3.6 kg 变成 4.8 kg，多了 1.2 公斤。波比在里面塞了东西。"
                />
              </div>
            ) : (
              <p className="text-[10px] font-bold text-[#8B7A6B] leading-relaxed p-2.5 rounded-xl bg-[#F6EFE2] border-2 border-dashed border-[#D8CBB8]">
                每张证词都放对之后，断点才会显形。
              </p>
            )}

            <div className="mt-3 pt-3 border-t-2 border-dashed border-[#C7D2FE]">
              <p className="text-xs font-black text-[#3A2D28] mb-1.5 flex items-center gap-1.5">
                <Snowflake className="w-4 h-4 text-[#2563EB]" />
                <span>冷链证物袋</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {evidence.map((ev) => {
                  const found = discoveredClues.includes(ev.clueId);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        if (!found) return;
                        soundEngine.playClick();
                        setInspectedEvidence(ev);
                        onDiscoverClue(ev.clueId);
                      }}
                      className={`px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] text-[10px] font-bold ${
                        found
                          ? 'bg-[#DBEAFE] text-[#3A2D28] hover:bg-[#BFDBFE]'
                          : 'bg-[#F6EFE2] text-[#9A8C82] border-dashed'
                      }`}
                    >
                      {found ? ev.label : '尚未取得'}
                    </button>
                  );
                })}
              </div>
              {inspectedEvidence ? (
                <p className="mt-1.5 text-[10px] font-bold text-[#6E5A52] leading-relaxed">
                  {inspectedEvidence.label}：{inspectedEvidence.detail}
                </p>
              ) : null}
            </div>

            {submitted ? (
              <div className="mt-3 p-3 rounded-xl bg-[#D1FAE5] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28]">
                <p className="text-xs font-black text-[#3A2D28] mb-1">重排完成</p>
                <p className="text-[11px] font-bold text-[#4A3A32] leading-relaxed">
                  14:21 之后，布莱克的名字从时间线上消失了。14:25 到 14:33 之间，只剩波比一个人。
                  配方不是被偷的，是被装进冷链箱运走的。
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const BreakRow: React.FC<{ index: number; open: boolean; text: string }> = ({
  index,
  open,
  text,
}) => (
  <div
    className={`p-2.5 rounded-xl border-2 text-[11px] font-bold leading-relaxed ${
      open
        ? 'bg-[#D1FAE5] border-[#3A2D28] text-[#3A2D28]'
        : 'bg-[#F6EFE2] border-dashed border-[#D8CBB8] text-[#9A8C82]'
    }`}
  >
    <span className="inline-block w-2 h-2 rounded-full bg-[#DC2626] mr-1.5 align-middle" />
    断点 {index}：{open ? text : '这里有一段说不通——把时间线重摆之后再来看。'}
  </div>
);
