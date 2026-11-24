import React from 'react';
import { CheckCircle2, Lock, Trophy } from 'lucide-react';
import {
  ACHIEVEMENT_CATEGORY_LABEL,
  ACHIEVEMENTS,
  AchievementCategory,
  AchievementDef,
  AchievementProgress,
} from '../../os/achievements';

interface AchievementsAppProps {
  progress: AchievementProgress;
}

const CATEGORY_ORDER: AchievementCategory[] = [
  'story',
  'deduction',
  'discovery',
  'choice',
];

const CATEGORY_COLOR: Record<AchievementCategory, string> = {
  story: '#FED7AA',
  deduction: '#DBEAFE',
  discovery: '#FEF3C7',
  choice: '#D1FAE5',
};

const AchievementCard: React.FC<{
  def: AchievementDef;
  unlocked: boolean;
}> = ({ def, unlocked }) => (
  <div
    className={`p-2.5 rounded-xl border-2 border-[#3A2D28] flex items-start gap-2 ${
      unlocked ? 'bg-[#FFFDF7] shadow-[2px_2px_0_#3A2D28]' : 'bg-[#F6EFE2] opacity-70'
    }`}
  >
    <span
      className="w-8 h-8 rounded-lg border-2 border-[#3A2D28] flex items-center justify-center shrink-0"
      style={{ backgroundColor: unlocked ? CATEGORY_COLOR[def.category] : '#E9E1D6' }}
    >
      {unlocked ? (
        <Trophy className="w-4 h-4 text-[#3A2D28]" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-[#8B7A6B]" />
      )}
    </span>
    <div className="min-w-0">
      <p
        className={`text-[11px] font-black leading-snug ${
          unlocked ? 'text-[#3A2D28]' : 'text-[#6E5A52]'
        }`}
      >
        {def.name}
      </p>
      <p className="text-[10px] font-bold text-[#8B7A6B] leading-snug mt-0.5">
        {def.description}
      </p>
    </div>
    {unlocked ? (
      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 ml-auto" />
    ) : null}
  </div>
);

export const AchievementsApp: React.FC<AchievementsAppProps> = ({ progress }) => {
  const unlocked = new Set(progress.unlocked);
  const allUnlocked = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;
  const ratio = Math.round((allUnlocked / ACHIEVEMENTS.length) * 100);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* 顶部进度 */}
      <div className="px-4 py-3 bg-[#FFF8EB] border-b-2 border-[#3A2D28]">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#D97706]" />
          <h2 className="text-sm font-black text-[#3A2D28]">成就徽章</h2>
          <span className="ml-auto text-[11px] font-black text-[#6E5A52] tabular-nums">
            已解锁 {allUnlocked} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-[#E9E1D6] border-2 border-[#3A2D28] overflow-hidden">
          <div
            className="h-full bg-[#FFB830] transition-[width] duration-300"
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll p-3 space-y-4">
        {CATEGORY_ORDER.map((category) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === category);
          if (items.length === 0) return null;
          const done = items.filter((a) => unlocked.has(a.id)).length;
          return (
            <section key={category}>
              <h3 className="text-[11px] font-black text-[#3A2D28] mb-1.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#3A2D28]" />
                <span>{ACHIEVEMENT_CATEGORY_LABEL[category]}</span>
                <span className="tabular-nums text-[10px] px-1.5 py-0.5 rounded border border-[#D8CBB8] bg-[#FFFDF7] text-[#6E5A52]">
                  {done}/{items.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {items.map((def) => (
                  <AchievementCard key={def.id} def={def} unlocked={unlocked.has(def.id)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
