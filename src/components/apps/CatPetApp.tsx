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
  onFlag: (flag: string) => void;
  onFeed: () => void;
}

/** 煤球的日常闲聊，只关心人，不碰案件 */
const WHISPERS: string[] = [
  '喵呜~ 今天也要记得好好吃饭，别光盯着屏幕。',
  '呼噜噜……你坐太久了，起来伸个懒腰吧。',
  '喵。窗外风有点凉，出门记得加件外套。',
  '我刚刚在窗台上晒了一会儿太阳，暖洋洋的。',
  '小鱼干很好吃，不过你别只顾着喂我，自己也吃点。',
  '喵呜，眼睛累了就看看远处，我陪你。',
  '今天也辛苦了。剩下的明天再想也没关系。',
  '呼噜……我睡一会儿，有事就叫我。',
  '你回来啦。我一直在等你。',
  '喵。先喝口水，再慢慢来。',
  '尾巴摇一摇，坏心情就走开啦。',
  '不管今天怎么样，晚上都要好好睡觉。',
];

export const CatPetApp: React.FC<CatPetAppProps> = ({
  chapter,
  clues,
  caseState,
  discoveredClues,
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

  const whisper = petted
    ? '呼噜噜……（煤球舒服得眯起了眼睛，尾巴一圈一圈地绕）'
    : hintLevel > 0
      ? hintPlan.levels[hintLevel - 1]
      : WHISPERS[lineIndex % WHISPERS.length];

  const handleFeed = () => {
    soundEngine.playClick();
    onFeed();
    setPetted(false);
    setHintLevel(0);
    setFeedCount((c) => c + 1);
    setMood('happy');
    setLineIndex((prev) => {
      if (WHISPERS.length <= 1) return 0;
      let next = Math.floor(Math.random() * WHISPERS.length);
      if (next === prev) next = (next + 1) % WHISPERS.length;
      return next;
    });
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
