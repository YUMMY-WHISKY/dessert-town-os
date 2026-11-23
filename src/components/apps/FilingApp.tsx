import React, { useState } from 'react';
import { FolderOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../os/sound';

interface FilingAppProps {
  chapter: number;
  discoveredClues: string[];
  onDiscoverClue: (clueId: string) => void;
}

type Tag = '母亲的店' | '官方的纸' | '她自己的记录';

const TAGS: Tag[] = ['母亲的店', '官方的纸', '她自己的记录'];

interface FilingItem {
  id: string;
  label: string;
  desc: string;
  answer: Tag;
}

const ITEMS: FilingItem[] = [
  { id: 'f_note', label: '调查笔记.txt', desc: '记了十二年的日期和门牌。', answer: '她自己的记录' },
  { id: 'f_clip', label: '旧报剪报_2006', desc: '剪下来的报纸，记着起火那晚的验收人。', answer: '官方的纸' },
  { id: 'f_reject', label: '2014 产权驳回回执', desc: '镇议会发来的驳回回执。', answer: '官方的纸' },
  { id: 'f_fund', label: '店庆基金_私人.dat', desc: '一笔一笔攒起来的二十五万。', answer: '她自己的记录' },
  { id: 'f_gugu', label: '咕咕的便条', desc: '夹在回执里的那张便条。', answer: '官方的纸' },
  { id: 'f_photo_open', label: '开业照片_1998', desc: '1998 年 7 月 15 日，阿栗和七岁的波比。', answer: '母亲的店' },
  { id: 'f_photo_now', label: '老街7号_现状照片', desc: '门牌没了，电箱换了，墙补过。', answer: '母亲的店' },
  { id: 'f_history', label: '浏览器搜索记录', desc: '她自己查过的问题。', answer: '她自己的记录' },
];

export const FilingApp: React.FC<FilingAppProps> = ({
  chapter,
  discoveredClues,
  onDiscoverClue,
}) => {
  const [assignments, setAssignments] = useState<Record<string, Tag>>({});
  const [checked, setChecked] = useState<{ ok: boolean; wrong: number } | null>(null);

  const solved = discoveredClues.includes('clue_poppy_filing');
  const complete = ITEMS.every((item) => assignments[item.id]);

  if (chapter < 3) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FFFDF7]">
        <FolderOpen className="w-8 h-8 text-[#C4B5A5] mb-2" />
        <p className="text-sm font-black text-[#3A2D28]">旧东西</p>
        <p className="text-xs text-[#6E5A52] mt-1 max-w-[260px] leading-relaxed">
          这个文件夹还锁着。等调查走到需要翻旧账的时候再回来。
        </p>
      </div>
    );
  }

  const check = () => {
    if (!complete) {
      soundEngine.playClick();
      setChecked({ ok: false, wrong: -1 });
      return;
    }
    const wrong = ITEMS.filter((item) => assignments[item.id] !== item.answer).length;
    if (wrong === 0) {
      soundEngine.playClueFound();
      setChecked({ ok: true, wrong: 0 });
      onDiscoverClue('clue_poppy_filing');
    } else {
      soundEngine.playError();
      setChecked({ ok: false, wrong });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      <div className="px-3 py-2 bg-[#F6EFE2] border-b-2 border-[#3A2D28] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-[#92400E]" />
          <span className="text-xs font-black text-[#3A2D28]">旧东西 · 文件归类</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setAssignments({});
            setChecked(null);
            soundEngine.playClick();
          }}
          className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-[11px] font-bold text-[#3A2D28] flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新归</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll p-3">
        <p className="text-[11px] font-bold text-[#6E5A52] leading-relaxed mb-3">
          波比把这些旧东西分成了三堆。她分堆的方式，不是按时间。
        </p>

        <div className="space-y-2">
          {ITEMS.map((item) => {
            const picked = assignments[item.id];
            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[2px_2px_0_#3A2D28]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-black text-[#3A2D28]">{item.label}</p>
                  <p className="text-[10px] text-[#8B7A6B] truncate">{item.desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setAssignments((prev) => ({ ...prev, [item.id]: tag }));
                        setChecked(null);
                        soundEngine.playClick();
                      }}
                      disabled={solved}
                      className={`px-2 py-0.5 rounded-lg border-2 border-[#3A2D28] text-[10px] font-bold ${
                        picked === tag ? 'bg-[#FFE29A]' : 'bg-[#FFFDF7] hover:bg-[#FFF8EB]'
                      } disabled:opacity-60`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {solved ? (
          <div className="mt-3 p-3 rounded-xl bg-[#D1FAE5] border-2 border-[#3A2D28] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-[#3A2D28]">归类正确。</p>
              <p className="text-[11px] font-bold text-[#4A3A32] mt-0.5 leading-relaxed">
                母亲的店、官方的纸、她自己的记录。她按人分，不按时间。
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={check}
              className="cartoon-btn w-full py-2 rounded-xl bg-[#FFB830] text-xs font-black text-[#3A2D28]"
            >
              提交归类
            </button>
            {checked ? (
              <p className="mt-1.5 text-[10px] font-bold text-[#DC2626] leading-relaxed">
                {checked.wrong === -1
                  ? '还有几份没有归类。'
                  : `有 ${checked.wrong} 份不像这一类。再想想这是谁的纸。`}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
