import React, { useState } from 'react';
import { Heart, Fish, Sparkles } from 'lucide-react';
import { soundEngine } from '../../os/sound';

interface CatPetAppProps {
  chapter: number;
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
  discoveredClues,
  onDiscoverClue,
  onFlag,
  onFeed,
}) => {
  const [mood, setMood] = useState<'happy' | 'sleepy' | 'curious'>('happy');
  const [feedCount, setFeedCount] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [petted, setPetted] = useState(false);
  const [hintMode, setHintMode] = useState(false);

  const eligible = WHISPERS.filter(
    (w) => w.chapter <= chapter && (w.needFeed ?? 0) <= feedCount
  );
  const current = eligible.length > 0 ? eligible[lineIndex % eligible.length] : null;

  const hintText = (() => {
    const has = (id: string) => discoveredClues.includes(id);
    if (chapter === 2 && !has('clue_milu_slip'))
      return '喵。把证词卡摆到时间线白板上，看看哪两段时间打架；或者直接问米露烤箱定时的事。';
    if (chapter === 3 && (!has('clue_store_fund') || !has('clue_rejection_receipt') || !has('clue_fund_motive')))
      return '喵呜。八音盒的最后一首会给你四个数字，店庆基金就锁在里面；再看看波比账户里镇议会发来的回执。两份放在一起，选「因果动机」。';
    if (chapter === 4 && (!has('clue_fire_contradiction') || !has('clue_kill_motive') || !has('clue_same_hand') || !has('clue_relations_solved')))
      return '呼噜。档案室四个年份都调一遍；把 2006 年的验收单和火灾报告放在一起选「互相冲突」；手续链和关系板也别忘了。';
    if (chapter === 5)
      return '喵。第五章没有新谜题。看完真相，在下面选一个你要交上去的版本。';
    return '喵。这一章的门已经开了。去破案手账看看，还剩哪条线索是灰的。';
  })();

  const whisper = petted
    ? '呼噜噜……（煤球舒服得眯起了眼睛，尾巴一圈一圈地绕）'
    : hintMode
      ? hintText
      : current?.text ?? '喵？';

  const handleFeed = () => {
    soundEngine.playClick();
    onFeed();
    setPetted(false);
    setHintMode(false);
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
    setHintMode(false);
  };

  const handleHint = () => {
    soundEngine.playTone(660, 0.12, 'sine', 0.05);
    onFlag('used_hint');
    setPetted(false);
    setHintMode(true);
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

      {current?.clueId ? (
        <button
          type="button"
          onClick={handleRecord}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#A7F3D0] text-[11px] font-black text-[#3A2D28] mb-3"
        >
          把这段话记进手账
        </button>
      ) : null}

      <div className="flex items-center justify-center gap-2.5">
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
          className="cartoon-btn px-3.5 py-2 rounded-xl bg-[#DBEAFE] text-[11px] font-black text-[#3A2D28]"
        >
          卡住了？问问煤球
        </button>
      </div>
    </div>
  );
};
