import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Fish, Sparkles } from 'lucide-react';
import { soundEngine } from '../../os/sound';
import { buildHintPlan } from '../../os/hints';
import { CaseState, ClueItem } from '../../os/types';

interface CatPetAppProps {
  chapter: number;
  clues: ClueItem[];
  caseState: CaseState;
  discoveredClues: string[];
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
  onFeed: () => void;
}

interface Whisper {
  chapter: number;
  needFeed?: number;
  text: string;
  clueId?: string;
  flag?: string;
}

const WHISPERS: Whisper[] = [
  {
    chapter: 1,
    text: '喵呜~ 前厅那摊黑糖浆是我踩的，地上那个爪印是我的，别冤枉我。',
    clueId: 'clue_paw_print',
    flag: 'cat_paw',
  },
  {
    chapter: 1,
    text: '隔壁那只黑猫下午来过。他问波比姐在不在，然后一直往柜台走，爪子抖得厉害。',
    flag: 'cat_stranger',
  },
  {
    chapter: 2,
    text: '呼噜噜……那杯草莓牛奶是我尾巴扫翻的。但我不记得它什么时候倒的，我睡了一觉。',
    flag: 'cat_milk',
  },
  {
    chapter: 2,
    needFeed: 3,
    text: '喵！烤箱 14:20 就响了。米露姐姐以为还早，去了后门搬箱子，回来的时候已经 14:27 了。',
    clueId: 'clue_milu_slip',
    flag: 'cat_oven',
  },
  {
    chapter: 3,
    text: '探长，旧东西里有股旧报纸的味道。波比姐姐按人分成了三摞，不按时间。',
    flag: 'cat_oldstuff',
  },
  {
    chapter: 3,
    needFeed: 5,
    text: '她总在半夜翻那张 1998 年的开业照片。照片背面有她妈妈的字。',
    flag: 'cat_photo',
  },
  {
    chapter: 4,
    text: '波比姐姐昨天抱着我坐了很久。她说「今晚十点之前，会有人来要一个答案」。',
    flag: 'cat_poppy',
  },
  {
    chapter: 4,
    needFeed: 6,
    text: '她把那叠旧档案摊在桌上，一份一份地数。五份都在，只差有人替她把它们摆成一条链。',
    flag: 'cat_archive',
  },
  {
    chapter: 5,
    text: '喵……今晚十点，咕咕要你签结案稿。波比姐姐说，签不签，你自己判断。',
    flag: 'cat_deadline',
  },
];

export const CatPetApp: React.FC<CatPetAppProps> = ({
  chapter,
  clues,
  caseState,
  discoveredClues,
  onDiscoverClue,
  onFlag,
  onFeed,
}) => {
  const [mood, setMood] = useState<'happy' | 'sleepy' | 'curious'>('happy');
  const [feedCount, setFeedCount] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [petted, setPetted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const hintPlan = useMemo(
    () => buildHintPlan(chapter, clues, discoveredClues, caseState),
    [chapter, clues, discoveredClues, caseState]
  );

  // 换章后重新从第一级提示开始
  useEffect(() => {
    setHintLevel(0);
  }, [chapter]);

  const eligible = WHISPERS.filter(
    (w) => w.chapter <= chapter && (w.needFeed ?? 0) <= feedCount
  );
  const current = eligible.length > 0 ? eligible[lineIndex % eligible.length] : null;

  const whisper = petted
    ? '呼噜噜……（煤球舒服得眯起了眼睛，尾巴一圈一圈地绕）'
    : hintLevel > 0
      ? hintPlan.levels[hintLevel - 1]
      : current?.text ?? '喵？';

  const handleFeed = () => {
    soundEngine.playClick();
    onFeed();
    setPetted(false);
    setHintLevel(0);
    setFeedCount((c) => c + 1);
    setMood('happy');
    setLineIndex((i) => i + 1);
    const nextCount = feedCount + 1;
    const nextEligible = WHISPERS.filter(
      (w) => w.chapter <= chapter && (w.needFeed ?? 0) <= nextCount
    );
    const next = nextEligible[(lineIndex + 1) % Math.max(1, nextEligible.length)];
    if (next?.clueId) onDiscoverClue(next.clueId);
    if (next?.flag) onFlag(next.flag);
  };

  const handlePet = () => {
    soundEngine.playTone(880, 0.1, 'sine', 0.05);
    setMood('curious');
    setPetted(true);
    setHintLevel(0);
  };

  const handleHint = () => {
    soundEngine.playTone(660, 0.12, 'sine', 0.05);
    onFlag('used_hint');
    setPetted(false);
    setHintLevel((level) => Math.min(3, level + 1));
  };

  const handleCloseHint = () => {
    soundEngine.playClick();
    setHintLevel(0);
  };

  const handleRecord = () => {
    if (!current?.clueId) return;
    soundEngine.playClueFound();
    onDiscoverClue(current.clueId);
    if (current.flag) onFlag(current.flag);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-5 bg-[#FFFDF7] text-center">
      <div className="relative mb-3">
        <div className="w-24 h-24 rounded-full border-[3px] border-[#3A2D28] bg-[#FEE2E2] shadow-[4px_4px_0_#3A2D28] flex items-center justify-center text-4xl">
          🐱
        </div>
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[#FFB830] border-2 border-[#3A2D28] text-[10px] font-black text-[#3A2D28] flex items-center gap-1">
          <Heart className="w-3 h-3 fill-[#FF758F] text-[#FF758F]" />
          <span>亲密 {feedCount + 1}</span>
        </div>
      </div>

      <h3 className="text-base font-black text-[#3A2D28] mb-0.5">店猫 · 煤球的小屋</h3>
      <p className="text-[11px] text-[#6E5A52] mb-4">
        状态：{mood === 'happy' ? '开心摇尾巴' : '萌萌凝视中'} · 已投喂小鱼干 {feedCount} 条
      </p>

      <div className="max-w-md w-full p-3.5 rounded-2xl bg-[#FEF3C7] border-2 border-[#3A2D28] shadow-[4px_4px_0_#3A2D28] text-[11px] font-bold text-[#3A2D28] leading-relaxed mb-4 min-h-[64px] flex items-center justify-center">
        “{whisper}”
      </div>

      {hintLevel > 0 ? (
        <div className="flex items-center justify-center gap-2 mb-3 text-[10px] font-black text-[#6E5A52]">
          <span className="px-2 py-0.5 rounded-full bg-[#DBEAFE] border border-[#3A2D28]">
            提示 {hintLevel}/3
          </span>
          <span>{hintLevel < 3 ? '还可以再具体一点' : '这次说得够清楚了'}</span>
        </div>
      ) : null}

      {hintLevel === 0 && current?.clueId ? (
        <button
          type="button"
          onClick={handleRecord}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#A7F3D0] text-[11px] font-black text-[#3A2D28] mb-3"
        >
          把这段话记进手账
        </button>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleFeed}
          className="cartoon-btn px-3.5 py-2 rounded-xl bg-[#A7F3D0] text-[11px] font-black text-[#3A2D28] flex items-center gap-1.5"
        >
          <Fish className="w-3.5 h-3.5" />
          <span>投喂小鱼干</span>
        </button>
        <button
          type="button"
          onClick={handlePet}
          className="cartoon-btn px-3.5 py-2 rounded-xl bg-[#FFE29A] text-[11px] font-black text-[#3A2D28] flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>摸摸煤球</span>
        </button>
        <button
          type="button"
          onClick={handleHint}
          disabled={hintLevel >= 3}
          className="cartoon-btn px-3.5 py-2 rounded-xl bg-[#DBEAFE] text-[11px] font-black text-[#3A2D28] disabled:opacity-50"
        >
          {hintLevel === 0
            ? '卡住了？问问煤球'
            : hintLevel < 3
              ? '再提示一点'
              : '去试试吧'}
        </button>
        {hintLevel > 0 ? (
          <button
            type="button"
            onClick={handleCloseHint}
            className="cartoon-btn px-3.5 py-2 rounded-xl bg-[#FFFDF7] text-[11px] font-black text-[#3A2D28]"
          >
            收起
          </button>
        ) : null}
      </div>
    </div>
  );
};
