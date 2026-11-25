import {
  CaseState,
  ChatThread,
  ClueItem,
  EmailItem,
  EndingId,
  FinalAccusation,
  FSNode,
} from './types';
import { CHAPTERS, FINAL_ANSWER, INITIAL_CLUES } from './seedData';

export function createInitialCaseState(): CaseState {
  return {
    chapter: 1,
    flags: {},
    derivedClues: [],
    chapterAnswers: {},
    ending: null,
  };
}

export function hasFlag(state: CaseState, flag: string): boolean {
  return !!state.flags[flag];
}

/** 章节可见性过滤：chapter 缺省视为 1 */
function nodeChapter(n: { chapter?: number }): number {
  return n.chapter ?? 1;
}

export function visibleNodes(nodes: FSNode[], chapter: number): FSNode[] {
  return nodes.filter((n) => nodeChapter(n) <= chapter);
}

export function visibleEmails(emails: EmailItem[], chapter: number): EmailItem[] {
  return emails.filter(
    (m) => (m.account ?? 'detective') !== 'detective' || nodeChapter(m) <= chapter
  );
}

export function visibleChats(chats: ChatThread[], chapter: number): ChatThread[] {
  return chats
    .filter(
      (t) => (t.account ?? 'detective') !== 'detective' || nodeChapter(t) <= chapter
    )
    .map((t) => {
      // 非 detective 账户的消息也全放出来（玩家偷看）
      if ((t.account ?? 'detective') !== 'detective') return t;
      return {
        ...t,
        messages: t.messages.filter((m) => (m.chapter ?? 1) <= chapter),
      };
    });
}

export function getClue(clueId: string): ClueItem | undefined {
  return INITIAL_CLUES.find((c) => c.id === clueId);
}

/**
 * 拼合两条线索，并校验玩家选择的推理方式。
 * 先看这两条是否存在可推理的交点，再看所选关系是否成立。
 */
export function evaluateCombine(
  a: string,
  b: string,
  relation: string
): { result: string | null; pairExists: boolean; relationOk: boolean } {
  const target = INITIAL_CLUES.find(
    (c) =>
      c.derivedFrom &&
      ((c.derivedFrom[0] === a && c.derivedFrom[1] === b) ||
        (c.derivedFrom[0] === b && c.derivedFrom[1] === a))
  );
  if (!target) return { result: null, pairExists: false, relationOk: false };
  const relationOk = target.relation === relation;
  return { result: relationOk ? target.id : null, pairExists: true, relationOk };
}

export function isChapterUnlocked(state: CaseState, chapterId: number): boolean {
  return state.chapter >= chapterId;
}

export function checkChapterAnswers(
  chapterId: number,
  answers: Record<string, string>
): { ok: boolean; wrongCount: number; total: number } {
  const def = CHAPTERS.find((c) => c.id === chapterId);
  const questions = def?.conclusion?.questions ?? [];
  let wrongCount = 0;
  for (const q of questions) {
    if (answers[q.id] !== q.correct) wrongCount += 1;
  }
  return {
    ok: questions.length > 0 && wrongCount === 0,
    wrongCount,
    total: questions.length,
  };
}

/** 判定终局指控；四个字段全对才算成立 */
export function isFinalAccusationCorrect(acc: FinalAccusation): boolean {
  return (
    acc.culprit === FINAL_ANSWER.culprit &&
    acc.method === FINAL_ANSWER.method &&
    acc.motive === FINAL_ANSWER.motive &&
    acc.evidence === FINAL_ANSWER.evidence
  );
}

/** 三个抉择：全部追责 / 只追旧案 / 签结案稿 */
export function resolveEnding(acc: FinalAccusation): EndingId | null {
  if (!isFinalAccusationCorrect(acc)) return null;
  if (acc.choice === 'full') return 'A';
  if (acc.choice === 'oldcase') return 'B';
  if (acc.choice === 'sign') return 'C';
  return null;
}

export function scoreCase(discovered: string[], total: number): number {
  const ratio = total > 0 ? discovered.length / total : 0;
  return Math.min(100, Math.round(55 + ratio * 45));
}
