import { CaseState, ClueItem } from './types';

export interface HintPlan {
  targetClueId?: string;
  levels: [string, string, string];
}

/**
 * 每章希望玩家优先发现的线索顺序。
 * 调整这张表即可改变煤球先提示哪一条；未列出的线索会自动补在后面。
 */
const HINT_ORDER: Record<number, string[]> = {
  1: [
    'clue_milk_time',
    'clue_paw_print',
    'clue_drawer',
    'clue_box_code',
    'clue_box_interior',
    'clue_black_ultimatum',
    'clue_black_revenue',
    'clue_chat_alibi',
    'clue_blake_account',
    'clue_blake_birthday',
    'clue_deleted_transfer',
    'clue_wifi',
    'clue_delivery_slip',
    'clue_achai_clock',
    'clue_shift_milu_alone',
  ],
  2: [
    'clue_oven_timer',
    'clue_milu_slip',
    'clue_drawer_time',
    'clue_poppy_in_store',
    'clue_money_stayed',
    'clue_cold_chain_weight',
    'clue_cold_seal',
    'clue_box_to_oldstreet',
    'clue_poppy_inside_job',
  ],
  3: [
    'clue_music_code',
    'clue_store_fund',
    'clue_rejection_receipt',
    'clue_craft_list',
    'clue_auction_notice',
    'clue_fund_motive',
    'clue_poppy_filing',
    'clue_browser_history',
    'clue_poppy_daughter',
  ],
  4: [
    'clue_fire_archive',
    'clue_victim_list',
    'clue_wiring_archive',
    'clue_fire_contradiction',
    'clue_evict_list',
    'clue_burned_letter',
    'clue_kill_motive',
    'clue_same_hand',
    'clue_relations_solved',
  ],
  5: [],
};

const CHAPTER_DIRECTION: Record<number, string> = {
  1: '前厅留下的痕迹比看上去多。先看现场，再顺着人和时间往外查。',
  2: '案发前后有一段时间对不上。把证词、记录和时间线放在一起看。',
  3: '波比重查旧案，不会没有原因。看看她最近在找什么、在攒什么。',
  4: '旧案的纸都在档案室。把同一年、同一件事的文件放在一起。',
  5: '线索已经够了。剩下的不是找，是决定你要交上去哪一个版本。',
};

const TIER_ORDER: ClueItem['tier'][] = [
  'observe',
  'testimony',
  'physical',
  'contradiction',
  'truth',
];

const ARCHIVE_FLAGS = ['archive_1998', 'archive_2006', 'archive_2014', 'archive_2026'];

/** 找出当前章节里下一条该提示的线索 */
function pickTarget(
  chapter: number,
  clues: ClueItem[],
  discoveredClues: string[]
): ClueItem | null {
  const missing = clues.filter(
    (clue) => clue.chapter === chapter && !discoveredClues.includes(clue.id)
  );
  if (missing.length === 0) return null;

  const byId = new Map(missing.map((clue) => [clue.id, clue]));
  const ordered: ClueItem[] = [];
  for (const id of HINT_ORDER[chapter] ?? []) {
    const clue = byId.get(id);
    if (clue) ordered.push(clue);
  }

  const listed = new Set(ordered.map((clue) => clue.id));
  const rest = missing
    .filter((clue) => !listed.has(clue.id))
    .map((clue, index) => ({ clue, index }))
    .sort((a, b) => {
      const aDerived = a.clue.derivedFrom ? 1 : 0;
      const bDerived = b.clue.derivedFrom ? 1 : 0;
      if (aDerived !== bDerived) return aDerived - bDerived;
      const aTier = TIER_ORDER.indexOf(a.clue.tier);
      const bTier = TIER_ORDER.indexOf(b.clue.tier);
      if (aTier !== bTier) return aTier - bTier;
      return a.index - b.index;
    })
    .map((item) => item.clue);

  const candidates = [...ordered, ...rest];
  const direct = candidates.find(
    (clue) =>
      !clue.derivedFrom || clue.derivedFrom.every((id) => discoveredClues.includes(id))
  );
  if (direct) return direct;

  // 剩下的都是拼合线索，但前置线索没找齐：先提示缺的那条前置线索
  return (
    candidates
      .flatMap((clue) => clue.derivedFrom ?? [])
      .map((id) => clues.find((clue) => clue.id === id))
      .find((clue): clue is ClueItem => !!clue && !discoveredClues.includes(clue.id)) ??
    null
  );
}

function blockerPlan(chapter: number, caseState: CaseState): HintPlan {
  const has = (flag: string) => !!caseState.flags[flag];

  if (chapter === 1 && !has('timeline_ch1_closed')) {
    return {
      levels: [
        '这一章的线索已经齐了，现在卡住的是时间。',
        '去「时间线白板」，把第一章的证词卡片按时间摆好。',
        '摆完后盖上结案章，再回破案手账提交第一章结论。',
      ],
    };
  }

  if (chapter === 2 && !has('timeline_ch2_solved')) {
    return {
      levels: [
        '线索齐了，但 14:12 到 14:33 之间还有断点。',
        '去「时间线白板」，把第二章的时间卡片补齐。',
        '解决时间线里的矛盾后，再回破案手账提交第二章结论。',
      ],
    };
  }

  if (chapter === 3 && !has('music_code')) {
    return {
      levels: [
        '这一章还有一段旋律没有解开。',
        '去「甜点八音盒」，按 1-3-1-2 的顺序播放。',
        '听完《店庆夜》，把末尾的数字和开业日期放在一起。',
      ],
    };
  }

  if (chapter === 4) {
    if (!ARCHIVE_FLAGS.every(has)) {
      return {
        levels: [
          '旧案的纸还没翻全。',
          '去「镇档案室」，把 1998、2006、2014、2026 四个年份都调阅一遍。',
          '四个年份都看完后，再回破案手账看手续链。',
        ],
      };
    }
    if (!has('procedure_chain_solved')) {
      return {
        levels: [
          '五份文件都在手里了，但签字还没有对上。',
          '去「破案手账」的「手续链」页。',
          '把五份文件的关键经办人标出来，看看是不是同一个人。',
        ],
      };
    }
    if (!has('relations_solved')) {
      return {
        levels: [
          '手续链已经闭合，还差人物之间的那几条线。',
          '去「人物关系板」，把六条关系全部连对。',
          '连完后板子中央会浮出最后一张结论纸条。',
        ],
      };
    }
  }

  if (chapter === 5) {
    if (!caseState.ending) {
      return {
        levels: [
          '线索已经够了，现在要决定的是你要交上去哪一个版本。',
          '去「破案手账」的「终局指控」。',
          '在全部追责、只追旧案、签结案稿之间选一个。',
        ],
      };
    }
    return {
      levels: [
        '这一案已经结了。',
        '你可以回破案手账翻翻各章结论。',
        '也可以回桌面看看还有没有没拿到的成就。',
      ],
    };
  }

  return {
    levels: [
      '这一章的线索已经齐了。',
      '去「破案手账」的章节结论页。',
      '把这一章的结论题提交上去。',
    ],
  };
}

/** 根据当前章节、已得线索和案件状态，生成煤球的三级提示 */
export function buildHintPlan(
  chapter: number,
  clues: ClueItem[],
  discoveredClues: string[],
  caseState: CaseState
): HintPlan {
  const target = pickTarget(chapter, clues, discoveredClues);
  const alreadyAnswered = !!caseState.chapterAnswers[chapter];

  if (!target) {
    if (alreadyAnswered) {
      return {
        levels: [
          '这一章已经结案了。',
          '可以去下一章，或者回破案手账看看还有没有灰着的线索。',
          '如果还想补成就，换个应用再翻翻。',
        ],
      };
    }
    return blockerPlan(chapter, caseState);
  }

  const direction =
    target.chapter < chapter
      ? `第${target.chapter}章还有一条线索没找齐，它和这一章有关。`
      : CHAPTER_DIRECTION[chapter] ?? '再翻翻还没看过的应用，答案通常藏在记录里。';

  const location = target.derivedFrom
    ? '去「破案手账」，把相关线索放在一起试试拼合。'
    : `去「${target.sourceApp}」找找看。`;

  return {
    targetClueId: target.id,
    levels: [direction, location, target.hint],
  };
}
