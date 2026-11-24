﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Combine,
  FolderOpen,
  Lock,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  DERIVE_RELATIONS,
  ENDING_TEXT,
  FINAL_ANSWER,
  TIER_LABEL,
} from '../../os/seedData';
import {
  CaseState,
  ChapterDef,
  ChapterQuestion,
  ClueItem,
  EndingId,
  FinalAccusation,
} from '../../os/types';
import { soundEngine } from '../../os/sound';

interface ClueBoardAppProps {
  caseState: CaseState;
  discoveredClues: string[];
  clues: ClueItem[];
  chapters: ChapterDef[];
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
  onCombine: (
    a: string,
    b: string,
    relation: string
  ) => { result: string | null; pairExists: boolean; relationOk: boolean };
  onChapterAnswer: (
    chapterId: number,
    answers: Record<string, string>
  ) => { ok: boolean; feedback: string; advanced: boolean };
  onSignClosure: () => void;
  onFinalSubmit: (
    acc: FinalAccusation
  ) => { solved: boolean; ending: EndingId | null; feedback: string };
}

const TIER_ORDER: ClueItem['tier'][] = ['observe', 'testimony', 'physical', 'contradiction', 'truth'];

const TIER_BG: Record<ClueItem['tier'], string> = {
  observe: 'bg-[#E0F2FE]',
  testimony: 'bg-[#FEF3C7]',
  physical: 'bg-[#EDE9FE]',
  contradiction: 'bg-[#FFE4E9]',
  truth: 'bg-[#D1FAE5]',
};

export const ClueBoardApp: React.FC<ClueBoardAppProps> = ({
  caseState,
  discoveredClues,
  clues,
  chapters,
  onDiscoverClue,
  onFlag,
  onCombine,
  onChapterAnswer,
  onFinalSubmit,
  onSignClosure,
}) => {
  const [tab, setTab] = useState<'clues' | 'chain' | 'conclusion'>('clues');
  const [viewChapter, setViewChapter] = useState(caseState.chapter);
  const [selected, setSelected] = useState<string[]>([]);
  const [comboMsg, setComboMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isReview = viewChapter < caseState.chapter;
  const viewDef = chapters.find((c) => c.id === viewChapter) ?? chapters[0];
  const isFinale = viewChapter === 5;
  const tabs: { id: 'clues' | 'chain' | 'conclusion'; label: string }[] = [
    { id: 'clues', label: '线索与拼合' },
    ...(viewChapter === 4 ? [{ id: 'chain' as const, label: '手续链' }] : []),
    ...(viewChapter === 3 ? [{ id: 'chain' as const, label: '旧物归档' }] : []),
    {
      id: 'conclusion',
      label: isFinale && !isReview ? '终局指控' : isReview ? '当时的结论' : '章节结论',
    },
  ];

  // 章节推进时，手账自动翻到新的一章
  useEffect(() => {
    setViewChapter((prev) => (caseState.chapter > prev ? caseState.chapter : prev));
  }, [caseState.chapter]);

  // 点击章节 tab 时，线索列表跳到对应章节开头
  useEffect(() => {
    if (tab !== 'clues') return;
    const el = document.getElementById(`chapter-${viewChapter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [viewChapter, tab]);

  /** 每章的线索总数与已取得数 */
  const chapterStats = useMemo(() => {
    return chapters.map((ch) => {
      const all = clues.filter((c) => c.chapter === ch.id);
      return {
        id: ch.id,
        title: ch.title,
        total: all.length,
        found: all.filter((c) => discoveredClues.includes(c.id)).length,
      };
    });
  }, [chapters, clues, discoveredClues]);

  /** 线索按章节分组，全部章节都展示 */
  const chapterGroups = useMemo(() => {
    return chapterStats
      .map((stat) => {
        const items = clues
          .filter((c) => c.chapter === stat.id)
          .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
        return { ...stat, items };
      })
      .filter((g) => g.items.length > 0);
  }, [chapterStats, clues]);

  const handleToggleClue = (clueId: string) => {
    setComboMsg(null);
    setSelected((prev) => {
      if (prev.includes(clueId)) return prev.filter((id) => id !== clueId);
      if (prev.length >= 2) return [prev[1], clueId];
      return [...prev, clueId];
    });
  };

  const handleCombine = (relation: string) => {
    if (selected.length !== 2) return;
    const res = onCombine(selected[0], selected[1], relation);
    if (res.result) {
      const target = clues.find((c) => c.id === res.result);
      onDiscoverClue(res.result);
      setComboMsg({ ok: true, text: `推理成立：${target?.title ?? '新的矛盾'}` });
    } else if (!res.pairExists) {
      setComboMsg({ ok: false, text: '这两条之间没有可推理的交点。' });
    } else {
      setComboMsg({ ok: false, text: '这两条确实有关，但不是这种关系。换一种推理方式。' });
    }
    setSelected([]);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* 章节条：已解锁的都可以点回去看 */}
      <div className="px-3 py-2 bg-[#FFF8EB] border-b-2 border-[#3A2D28] flex items-center gap-1.5 overflow-x-auto cartoon-scroll">
        {chapters.map((ch) => {
          const done = caseState.chapter > ch.id || !!caseState.chapterAnswers[ch.id];
          const active = ch.id === viewChapter;
          const stat = chapterStats.find((s) => s.id === ch.id);
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                setViewChapter(ch.id);
                setSelected([]);
                setComboMsg(null);
                setTab('clues');
              }}
              className={`shrink-0 px-2.5 py-1 rounded-lg border-2 text-[11px] font-black flex items-center gap-1 transition-colors ${
                active
                  ? 'bg-[#FFB830] border-[#3A2D28] text-[#3A2D28]'
                  : done
                    ? 'bg-[#A7F3D0] border-[#3A2D28] text-[#3A2D28] hover:brightness-[0.98]'
                    : 'bg-[#FFFDF7] border-[#3A2D28] text-[#3A2D28] hover:bg-[#FEF3C7]'
              }`}
            >
              <span>第{ch.id}章</span>
              {ch.id === 5 ? (
                <span className="text-[10px] font-black px-1 rounded bg-[#DC2626]/15 text-[#B91C1C]">
                  指控
                </span>
              ) : (
                <span className="tabular-nums text-[10px] px-1 rounded bg-[#FFFDF7]/70">
                  {stat?.found ?? 0}/{stat?.total ?? 0}
                </span>
              )}
              {active && isReview ? (
                <span className="text-[9px] font-bold opacity-70">回顾</span>
              ) : null}
            </button>
          );
        })}
        <span className="ml-auto shrink-0 text-[11px] font-bold text-[#6E5A52] tabular-nums">
          {discoveredClues.length}/{clues.length}
        </span>
      </div>

      {/* 页签 */}
      <div className="px-3 pt-2 bg-[#FFFDF7] border-b-2 border-[#E5D8C5] flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-black border-2 border-b-0 border-[#3A2D28] ${
              tab === t.id ? 'bg-[#FFE29A]' : 'bg-[#F6EFE2] text-[#6E5A52]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clues' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-3 py-2 bg-[#F6EFE2] border-b-2 border-[#E5D8C5] space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#6E5A52]">
                选中两条线索 → 选择推理方式
              </span>
              <div className="flex items-center gap-1">
                {selected.length === 0 ? (
                  <span className="text-[11px] text-[#A99A8C]">尚未选择</span>
                ) : (
                  selected.map((id) => {
                    const c = clues.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded-md bg-[#FFFDF7] border border-[#3A2D28] text-[10px] font-bold text-[#3A2D28]"
                      >
                        {c?.title}
                      </span>
                    );
                  })
                )}
              </div>
              <span className="ml-auto text-[10px] font-bold text-[#8B7A6B] tabular-nums">
                全案 {discoveredClues.length}/{clues.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {DERIVE_RELATIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={selected.length !== 2}
                  title={r.desc}
                  onClick={() => handleCombine(r.id)}
                  className="cartoon-btn px-2 py-1 rounded-lg bg-[#FFFDF7] text-[10px] font-black text-[#3A2D28] flex items-center gap-1 disabled:opacity-35"
                >
                  <Combine className="w-3 h-3" />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {comboMsg ? (
            <div
              className={`px-3 py-1.5 text-[11px] font-bold border-b-2 border-[#3A2D28] ${
                comboMsg.ok ? 'bg-[#D1FAE5] text-[#3A2D28]' : 'bg-[#FFFDF7] text-[#6E5A52]'
              }`}
            >
              {comboMsg.text}
            </div>
          ) : null}

          <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll p-3 space-y-4">
            {chapterGroups.map((group) => (
              <section key={group.id} id={`chapter-${group.id}`}>
                <h3 className="text-[11px] font-black text-[#3A2D28] mb-1.5 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#3A2D28]" />
                  <span>
                    第{group.id}章 · {group.title}
                  </span>
                  <span
                    className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded border ${
                      group.found === group.total
                        ? 'bg-[#A7F3D0] border-[#059669] text-[#065F46]'
                        : 'bg-[#FFFDF7] border-[#D8CBB8] text-[#6E5A52]'
                    }`}
                  >
                    {group.found}/{group.total}
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((clue) => {
                    const unlocked = discoveredClues.includes(clue.id);
                    const picked = selected.includes(clue.id);
                    return (
                      <button
                        key={clue.id}
                        type="button"
                        disabled={!unlocked}
                        title={unlocked ? undefined : '这条线索还没有找到'}
                        onClick={() => handleToggleClue(clue.id)}
                        className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                          picked
                            ? 'border-[#059669] bg-[#D1FAE5] shadow-[0_0_0_2px_#A7F3D0] cursor-pointer'
                            : unlocked
                              ? `${TIER_BG[clue.tier]} border-[#3A2D28] cursor-pointer`
                              : 'bg-[#F6EFE2] border-[#D8CBB8] cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-black text-[#3A2D28] flex items-center gap-1.5 min-w-0">
                            {unlocked ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                                <span className="truncate">{clue.title}</span>
                              </>
                            ) : (
                              <span className="truncate">线索未找到</span>
                            )}
                          </span>
                          {unlocked ? (
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] px-1 py-0.5 rounded border bg-[#FFFDF7]/80 border-[#3A2D28] text-[#3A2D28]">
                                {TIER_LABEL[clue.tier]}
                              </span>
                              <span className="text-[10px] text-[#6E5A52]">{clue.sourceApp}</span>
                            </span>
                          ) : null}
                        </div>
                        {unlocked ? (
                          <p className="text-[11px] text-[#4A3A32] leading-snug">
                            {clue.summary}
                          </p>
                        ) : null}
                        {unlocked && clue.derivedFrom ? (
                          <p className="text-[10px] text-[#B45309] mt-1 font-bold">
                            ※ 由两条线索拼合而来
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : tab === 'chain' ? (
        viewChapter === 3 ? (
          <FilingPuzzle
            discoveredClues={discoveredClues}
            onDiscoverClue={onDiscoverClue}
          />
        ) : (
          <ProcedureChain
            discoveredClues={discoveredClues}
            flags={caseState.flags}
            onDiscoverClue={onDiscoverClue}
            onFlag={onFlag}
          />
        )
      ) : (
        <ConclusionPanel
          caseState={caseState}
          viewChapter={viewChapter}
          viewDef={viewDef}
          isReview={isReview}
          onSignClosure={onSignClosure}
          discoveredClues={discoveredClues}
          onDiscoverClue={onDiscoverClue}
          onFlag={onFlag}
          onChapterAnswer={onChapterAnswer}
          onFinalSubmit={onFinalSubmit}
        />
      )}
    </div>
  );
};

/* ───────────── 结论 / 终局面板 ───────────── */

interface ConclusionPanelProps {
  caseState: CaseState;
  viewChapter: number;
  viewDef: ChapterDef;
  isReview: boolean;
  discoveredClues: string[];
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
  onChapterAnswer: ClueBoardAppProps['onChapterAnswer'];
  onFinalSubmit: ClueBoardAppProps['onFinalSubmit'];
  onSignClosure: () => void;
}

const ConclusionPanel: React.FC<ConclusionPanelProps> = ({
  caseState,
  viewChapter,
  viewDef,
  isReview,
  discoveredClues,
  onDiscoverClue,
  onFlag,
  onChapterAnswer,
  onFinalSubmit,
  onSignClosure,
}) => {
  // 章节锁：本章要求的线索与旗标齐了，才允许提交结论
  const missingClues = (viewDef.requiresClues ?? []).filter(
    (id) => !discoveredClues.includes(id)
  );
  const missingFlags = (viewDef.requiresFlags ?? []).filter(
    (flag) => !caseState.flags[flag]
  );
  const chapterLocked =
    !isReview && (missingClues.length > 0 || missingFlags.length > 0);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-4 rounded-2xl bg-[#FFF8EB] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28]">
          <h2 className="text-lg font-black text-[#3A2D28]">{viewDef.title}</h2>
        </div>

        {viewChapter === 5 && !isReview ? (
          <>
            <FinalForm
              locked={false}
              onFinalSubmit={onFinalSubmit}
            />
            {caseState.ending ? <EndingCard ending={caseState.ending} /> : null}
          </>
        ) : isReview ? (
          <ReviewPanel
            chapter={viewDef}
            answers={caseState.chapterAnswers[viewChapter] ?? {}}
          />
        ) : viewDef.conclusion ? (
          <>
            <ChapterForm
              key={viewDef.id}
              chapter={viewDef}
              discoveredClues={discoveredClues}
              flags={caseState.flags}
              locked={chapterLocked}
              onChapterAnswer={onChapterAnswer}
            />
            {viewChapter === 4 ? (
              <ClosureChoice locked={chapterLocked} onSignClosure={onSignClosure} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

const ClosureChoice: React.FC<{ locked: boolean; onSignClosure: () => void }> = ({
  locked,
  onSignClosure,
}) => {
  const [refused, setRefused] = useState(false);
  return (
    <div className="p-4 rounded-2xl bg-[#FFF8EB] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28]">
      <p className="text-[11px] font-black text-[#D97706] mb-1">结案发布会 · 你要签字吗</p>
      <p className="text-[11px] text-[#4A3A32] leading-relaxed">
        咕咕发来邮件：「稿子我拟好了，你只需要签字。有些旧事，让它过去，对活着的人更好。」
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          disabled={locked || refused}
          onClick={onSignClosure}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFE4E9] text-[11px] font-black text-[#3A2D28] disabled:opacity-40"
        >
          签字结案（结局 C · 签结案稿）
        </button>
        <button
          type="button"
          onClick={() => setRefused(true)}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#A7F3D0] text-[11px] font-black text-[#3A2D28]"
        >
          继续查
        </button>
      </div>
      {locked ? (
        <p className="text-[10px] font-bold text-[#8B7A6B] mt-1.5">
          先把五份档案、拼合、手续链和关系板都做完，才轮到你签字。
        </p>
      ) : null}
      {refused ? (
        <p className="text-[10px] font-bold text-[#059669] mt-1.5">
          你没有签字。提交本章结论，进入第五章。
        </p>
      ) : null}
    </div>
  );
};

/* ───────────── 归档谜题（第三章 chain tab） ───────────── */

type FilingTag = '母亲的店' | '官方的纸' | '她自己的记录';
const FILING_TAGS: FilingTag[] = ['母亲的店', '官方的纸', '她自己的记录'];
const FILING_ITEMS: { id: string; label: string; desc: string; answer: FilingTag }[] = [
  { id: 'f_note', label: '调查笔记.txt', desc: '记了十二年的日期和门牌。', answer: '她自己的记录' },
  { id: 'f_clip', label: '旧报剪报_2006', desc: '剪下来的报纸，记着起火那晚的验收人。', answer: '官方的纸' },
  { id: 'f_reject', label: '2014 产权驳回回执', desc: '镇议会发来的驳回回执。', answer: '官方的纸' },
  { id: 'f_fund', label: '店庆基金_私人.dat', desc: '一笔一笔攒起来的二十五万。', answer: '她自己的记录' },
  { id: 'f_gugu', label: '咕咕的便条', desc: '夹在回执里的那张便条。', answer: '官方的纸' },
  { id: 'f_photo_open', label: '开业照片_1998', desc: '1998 年 7 月 15 日，阿栗和七岁的波比。', answer: '母亲的店' },
  { id: 'f_photo_now', label: '老街7号_现状照片', desc: '门牌没了，电箱换了，墙补过。', answer: '母亲的店' },
  { id: 'f_history', label: '浏览器搜索记录', desc: '她自己查过的问题。', answer: '她自己的记录' },
];

const FilingPuzzle: React.FC<{
  discoveredClues: string[];
  onDiscoverClue: (clueId: string) => void;
}> = ({ discoveredClues, onDiscoverClue }) => {
  const [assignments, setAssignments] = useState<Record<string, FilingTag>>({});
  const [checked, setChecked] = useState<{ ok: boolean; wrong: number } | null>(null);
  const solved = discoveredClues.includes('clue_poppy_filing');
  const complete = FILING_ITEMS.every((item) => assignments[item.id]);

  const check = () => {
    if (!complete) {
      soundEngine.playClick();
      setChecked({ ok: false, wrong: -1 });
      return;
    }
    const wrong = FILING_ITEMS.filter((item) => assignments[item.id] !== item.answer).length;
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
          <span className="text-xs font-black text-[#3A2D28]">旧物归档 · 文件归类</span>
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
          {FILING_ITEMS.map((item) => {
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
                  {FILING_TAGS.map((tag) => (
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

interface ProcedureDoc {
  id: string;
  year: string;
  title: string;
  field: string;
  signature: string;
}

const PROCEDURE_DOCS: ProcedureDoc[] = [
  { id: 'p1', year: '2006', title: '电路验收单', field: '验收人', signature: '咕咕' },
  { id: 'p2', year: '2006', title: '火灾后产权待定', field: '经办人', signature: '咕咕' },
  { id: 'p3', year: '2014', title: '产权驳回回执', field: '经办人', signature: '咕咕' },
  { id: 'p4', year: '2014', title: '传统工艺保护名录认定书', field: '经办人', signature: '咕咕' },
  { id: 'p5', year: '2026', title: '迁离招标对接', field: '对接人', signature: '咕咕' },
];

const ProcedureChain: React.FC<{
  discoveredClues: string[];
  flags: Record<string, boolean>;
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
}> = ({ discoveredClues, flags, onDiscoverClue, onFlag }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wrongId, setWrongId] = useState<string | null>(null);
  const solved = discoveredClues.includes('clue_same_hand');

  const archiveReady =
    flags.archive_1998 &&
    flags.archive_2006 &&
    flags.archive_2014 &&
    flags.archive_2026;

  const choose = (doc: ProcedureDoc, name: string) => {
    if (name !== doc.signature) {
      soundEngine.playError();
      setWrongId(doc.id);
      window.setTimeout(() => setWrongId(null), 500);
      return;
    }
    soundEngine.playClick();
    const next = { ...answers, [doc.id]: name };
    setAnswers(next);
    if (PROCEDURE_DOCS.every((d) => next[d.id] === d.signature)) {
      soundEngine.playClueFound();
      onFlag('procedure_chain_solved');
      onDiscoverClue('clue_same_hand');
    }
  };

  if (!archiveReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-8 h-8 text-[#8B7A6B] mb-2" />
        <p className="text-sm font-black text-[#3A2D28]">手续链还没打开</p>
        <p className="text-xs text-[#6E5A52] mt-1 max-w-xs leading-relaxed">
          先把档案室的四个年份都调阅一遍（1998 / 2006 / 2014 / 2026），这里才会列出每份文件的关键签名栏。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll p-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="p-3 rounded-2xl bg-[#FFF8EB] border-2 border-[#3A2D28]">
          <p className="text-[11px] font-black text-[#D97706] mb-1">手续链 · 同一双手</p>
          <p className="text-[11px] text-[#4A3A32] leading-relaxed">
            每一份文件的关键签名/经办人栏都在下面。把同一个名字在五份文件里标出来。
          </p>
        </div>

        {PROCEDURE_DOCS.map((doc) => {
          const picked = answers[doc.id];
          return (
            <div
              key={doc.id}
              className={`p-3 rounded-xl border-2 border-[#3A2D28] bg-[#F6EFE2] ${
                wrongId === doc.id ? 'animate-[shake_0.28s_ease-in-out]' : ''
              }`}
            >
              <p className="text-[10px] font-bold text-[#6E5A52]">
                {doc.year} · {doc.title}
              </p>
              <p className="text-[11px] font-black text-[#3A2D28] mt-0.5 mb-1.5">
                {doc.field}：<span className="text-[#B45309]">{picked ?? '待辨认'}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['咕咕', '阿栗', '波比'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    disabled={solved}
                    onClick={() => choose(doc, name)}
                    className={`px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] text-[10px] font-bold ${
                      picked === name ? 'bg-[#FFE29A]' : 'bg-[#FFFDF7] hover:bg-[#FFF8EB]'
                    } disabled:opacity-60`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {solved ? (
          <div className="p-3 rounded-xl bg-[#D1FAE5] border-2 border-[#3A2D28]">
            <p className="text-xs font-black text-[#3A2D28] mb-1">五道手续，同一双手</p>
            <p className="text-[11px] text-[#4A3A32] leading-relaxed">
              没有一份文件违法。验收合格、驳回有据、名录合规、迁离按程序。但每一道手续上，都是同一个人的签名。
              他不需要放火，他只需要让每一张纸都「合规」。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ChapterForm: React.FC<{
  chapter: ChapterDef;
  discoveredClues: string[];
  flags: Record<string, boolean>;
  locked?: boolean;
  onChapterAnswer: ClueBoardAppProps['onChapterAnswer'];
}> = ({ chapter, discoveredClues, flags, locked = false, onChapterAnswer }) => {
  const questions = chapter.conclusion?.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ ok: boolean; feedback: string } | null>(null);
  // 连续猜错三次后锁住表单，必须再找到新线索才能继续
  const [fails, setFails] = useState(0);
  const [baseline, setBaseline] = useState(discoveredClues.length);

  useEffect(() => {
    if (fails >= 3 && discoveredClues.length > baseline) {
      setFails(0);
      setBaseline(discoveredClues.length);
    }
  }, [discoveredClues.length, fails, baseline]);

  const blocked = fails >= 3 && discoveredClues.length <= baseline;
  const complete = questions.every((q) => answers[q.id]);
  const missingFlags = (chapter.requiresFlags ?? []).filter((flag) => !flags[flag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || locked || blocked) return;
    const res = onChapterAnswer(chapter.id, answers);
    setResult({ ok: res.ok, feedback: res.feedback });
    setFails((f) => (res.ok ? 0 : f + 1));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] space-y-3"
    >
      <h3 className="text-sm font-black text-[#3A2D28]">本章结论</h3>

      {questions.map((q, qi) => (
        <div key={q.id}>
          <p className="text-[11px] font-bold text-[#3A2D28] mb-1">
            {qi + 1}. {q.question}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setAnswers((prev) => ({ ...prev, [q.id]: opt }));
                  setResult(null);
                }}
                className={`text-left px-2.5 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-colors ${
                  answers[q.id] === opt
                    ? 'bg-[#FFE29A] border-[#3A2D28]'
                    : 'bg-[#FFFDF7] border-[#D8CBB8] hover:border-[#3A2D28]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {result ? (
        <p
          className={`p-2.5 rounded-xl text-xs font-bold leading-relaxed border-2 border-[#3A2D28] ${
            result.ok ? 'bg-[#D1FAE5] text-[#3A2D28]' : 'bg-[#FFF8EB] text-[#6E5A52]'
          }`}
        >
          {result.feedback}
        </p>
      ) : null}

      {locked ? (
        <p className="p-2.5 rounded-xl bg-[#F6EFE2] border-2 border-dashed border-[#D8CBB8] text-[11px] font-bold text-[#8B7A6B] leading-relaxed">
          {missingFlags.length > 0
            ? chapter.id === 1
              ? '时间线还没有闭合。去「时间线白板」把第一章的证词摆完，盖上结案章。'
              : '时间线还有断点没有解决，或者你还没读到关键邮件。'
            : '这一章的结论还压不住。手账里缺一条能把话说死的线索——继续查。'}
        </p>
      ) : blocked ? (
        <p className="p-2.5 rounded-xl bg-[#FFE4E9] border-2 border-[#3A2D28] text-[11px] font-bold text-[#3A2D28] leading-relaxed">
          你连着猜了三次。手账被你翻乱了，先合上——去别的应用里再找到一条新线索，才能继续写。
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!complete || locked || blocked}
        className="cartoon-btn w-full py-2 rounded-xl bg-[#FFB830] text-xs font-black text-[#3A2D28] flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        <Send className="w-3.5 h-3.5" />
        <span>提交本章结论</span>
      </button>
    </form>
  );
};

const ReviewPanel: React.FC<{
  chapter: ChapterDef;
  answers: Record<string, string>;
}> = ({ chapter, answers }) => {
  const questions = chapter.conclusion?.questions ?? [];
  if (questions.length === 0) {
    return (
      <p className="text-[11px] text-[#8B7A6B]">这一章没有留下结论表单。</p>
    );
  }
  return (
    <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] space-y-3">
      <h3 className="text-sm font-black text-[#3A2D28]">当时的作答</h3>
      {questions.map((q, qi) => {
        const mine = answers[q.id];
        return (
          <div key={q.id} className="p-2.5 rounded-xl bg-[#F6EFE2] border border-[#D8CBB8]">
            <p className="text-[11px] font-bold text-[#3A2D28] mb-1">
              {qi + 1}. {q.question}
            </p>
            <p className="text-[11px] text-[#6E5A52]">
              你写的是：{mine ?? '（未作答）'}
            </p>
            <p className="text-[11px] text-[#059669] font-bold">
              正确：{q.correct}
            </p>
          </div>
        );
      })}
      {chapter.conclusion ? (
        <p className="text-[11px] text-[#4A3A32] leading-relaxed">
          {chapter.conclusion.successText}
        </p>
      ) : null}
    </div>
  );
};


const FinalForm: React.FC<{
  locked: boolean;
  onFinalSubmit: ClueBoardAppProps['onFinalSubmit'];
}> = ({ locked, onFinalSubmit }) => {
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleChoice = (choice: 'full' | 'oldcase' | 'sign') => {
    const acc = {
      culprit: FINAL_ANSWER.culprit,
      method: FINAL_ANSWER.method,
      motive: FINAL_ANSWER.motive,
      evidence: FINAL_ANSWER.evidence,
      choice,
    };
    const res = onFinalSubmit(acc);
    if (!res.solved) soundEngine.playError();
    setFeedback({ ok: res.solved, text: res.feedback });
  };

  const choices: { id: 'full' | 'oldcase' | 'sign'; label: string; hint: string; color: string }[] = [
    {
      id: 'full',
      label: '全部追责',
      hint: '波比的伪造失窃、咕咕的旧案和五道手续全交上去。两人都担责，2006 年火灾重新立案，布莱克获释。',
      color: 'bg-[#DC2626]',
    },
    {
      id: 'oldcase',
      label: '只追旧案',
      hint: '只交咕咕和 2006 年旧案的证据。波比的伪造失窃从轻处理，布莱克获释。',
      color: 'bg-[#92400E]',
    },
    {
      id: 'sign',
      label: '签结案稿',
      hint: '签咕咕拟好的结案稿。布莱克继续背锅，波比和咕咕都脱身，2006 年的火再没人提。',
      color: 'bg-[#6B7280]',
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#FFF8EB] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] space-y-3">
      <h3 className="text-sm font-black text-[#3A2D28]">致过去，现在，未来</h3>

      <div className="space-y-2">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleChoice(c.id)}
            className={`w-full text-left p-2.5 rounded-xl border-2 border-[#3A2D28] bg-[#FFFDF7] hover:bg-[#FFF8EB] transition-colors`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${c.color}`} aria-hidden="true" />
              <span className="text-xs font-black text-[#3A2D28]">{c.label}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6E5A52] leading-relaxed">{c.hint}</p>
          </button>
        ))}
      </div>

      {feedback ? (
        <p className={`text-[11px] font-bold leading-relaxed ${feedback.ok ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
};

/* ───────────── 结局 ───────────── */

const EndingCard: React.FC<{ ending: EndingId }> = ({ ending }) => {
  const text = ENDING_TEXT[ending];
  return (
    <div className="p-4 rounded-2xl bg-[#3A2D28] text-[#FFFDF7] shadow-[4px_4px_0_#3A2D28]">
      <h3 className="text-base font-black mb-2">{text.title}</h3>
      <div className="space-y-1.5">
        {text.body.map((line, i) => (
          <p key={i} className="text-xs leading-relaxed opacity-90">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};
