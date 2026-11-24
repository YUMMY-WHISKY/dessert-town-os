import { EndingId } from './types';

export type AchievementCategory =
  | 'story'
  | 'deduction'
  | 'discovery'
  | 'choice';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
}

export const ACHIEVEMENT_CATEGORY_LABEL: Record<AchievementCategory, string> = {
  story: '章节奖励',
  deduction: '推理玩法',
  discovery: '细心发现',
  choice: '选择',
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // 一、章节奖励
  {
    id: 'story_ch1',
    category: 'story',
    name: '秘方失窃，先立个案',
    description: '完成第 1 章「失窃的秘方」的结论，把这一章结案',
  },
  {
    id: 'story_ch2',
    category: 'story',
    name: '替罪羊？不存在的',
    description: '完成第 2 章「替罪羊」的结论，把这一章结案',
  },
  {
    id: 'story_ch3',
    category: 'story',
    name: '十二年，一页翻过去',
    description: '完成第 3 章「她的十二年」的结论，把这一章结案',
  },
  {
    id: 'story_ch4',
    category: 'story',
    name: '火炎焱燚也烧不掉证据',
    description: '完成第 4 章「火炎焱燚」的结论，把这一章结案',
  },
  {
    id: 'story_ch5',
    category: 'story',
    name: '小橘探长赛高！！',
    description: '在第五章做出指控，达成结局 A 或 B',
  },

  // 二、推理玩法
  {
    id: 'deduction_combine',
    category: 'deduction',
    name: '给你一点成功的滋味尝尝',
    description: '两条线索，一种关系，推理成立',
  },
  {
    id: 'deduction_relations_types',
    category: 'deduction',
    name: '哇塞！？莫非你是推理大师',
    description: '互相冲突、证据对应、因果动机，你都用过了',
  },
  {
    id: 'deduction_ch1_cards',
    category: 'deduction',
    name: '老实交代！穷举了多少次？',
    description: '把完整时间线拼对了',
  },
  {
    id: 'deduction_relations_six',
    category: 'deduction',
    name: '能搞定这个怕是《雷雨》的关系图也不在话下了吧',
    description: '阿栗、波比、咕咕、米露、阿柴、布莱克，六条关系全部连对',
  },
  {
    id: 'deduction_archives',
    category: 'deduction',
    name: '那几个数字到底藏在哪！',
    description: '1998、2006、2014、2026，四个年份你都调过',
  },
  {
    id: 'deduction_music',
    category: 'deduction',
    name: '歌不错吧？。',
    description: '解锁了隐藏曲目',
  },

  // 三、细心发现
  {
    id: 'discovery_milk',
    category: 'discovery',
    name: '张张张张张',
    description: '第一章现场照片里的五条线索，全都找齐了',
  },
  {
    id: 'discovery_poppy_phone',
    category: 'discovery',
    name: '宁可错杀一千不可放过一个',
    description: '米露、阿柴、布莱克、咕咕，四个人的问话你都打开过了',
  },
  {
    id: 'discovery_margin_fund',
    category: 'discovery',
    name: '你咋这么八卦',
    description: '论坛、搜索历史、议会公告，你都翻过了',
  },

  // 四、电台
  {
    id: 'radio_all',
    category: 'discovery',
    name: '调频高手',
    description: '四个频道，你都听过了',
  },

  // 五、选择
  {
    id: 'choice_any',
    category: 'choice',
    name: '左边右边中间你选哪边？',
    description: '全部追责、只追旧案、签结案稿——你选了一条',
  },
  {
    id: 'choice_both',
    category: 'choice',
    name: '站中间串两边',
    description: '你先签了结案稿，又回头重查了这个案子',
  },
  {
    id: 'choice_ending_c',
    category: 'choice',
    name: '这你也签？',
    description: '签下结案稿，用 C 结局收场',
  },

  // 六、推理玩法（一次性完成章节结论）
  {
    id: 'hidden_ch1_first_try',
    category: 'deduction',
    name: '一一得一',
    description: '第一章所有结论题目一次答对',
  },
  {
    id: 'hidden_ch2_first_try',
    category: 'deduction',
    name: '二二得四',
    description: '第二章所有结论题目一次答对',
  },
  {
    id: 'hidden_ch3_first_try',
    category: 'deduction',
    name: '三三得九',
    description: '第三章所有结论题目一次答对',
  },
  {
    id: 'hidden_ch4_first_try',
    category: 'deduction',
    name: '四四十六',
    description: '第四章所有结论题目一次答对',
  },
  {
    id: 'hidden_perfect',
    category: 'choice',
    name: '金牌探长！！',
    description: '没有使用提示，找齐所有线索，用 A 或 B 结局结案',
  },

  // 七、细心发现
  {
    id: 'hidden_feed3',
    category: 'discovery',
    name: '爱猫人士',
    description: '你投喂了煤球三次',
  },
];

export interface AchievementProgress {
  unlocked: string[];
  combines: number;
  relations: string[];
  feeds: number;
  radioChannels: string[];
  /** 章节 → 是否在第一次提交时就全对 */
  firstTry: Record<string, boolean>;
  /** 按触发顺序记录见过的结局 */
  endingsSeen: EndingId[];
  /** 打开过的聊天会话 */
  openedChats: string[];
  /** 浏览过的网页视图 */
  browserViews: string[];
  /** 时间线失败提交次数 */
  timelineAttempts: number;
  /** 时间线是否一次提交就全对 */
  timelineFirstTry: boolean;
}

export const EMPTY_ACHIEVEMENT_PROGRESS: AchievementProgress = {
  unlocked: [],
  combines: 0,
  relations: [],
  feeds: 0,
  radioChannels: [],
  firstTry: {},
  endingsSeen: [],
  openedChats: [],
  browserViews: [],
  timelineAttempts: 0,
  timelineFirstTry: false,
};

const STORAGE_KEY = 'dessert-town-achievements-v1';

export function loadAchievementProgress(): AchievementProgress {
  if (typeof window === 'undefined') return { ...EMPTY_ACHIEVEMENT_PROGRESS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_ACHIEVEMENT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<AchievementProgress>;
    return {
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      combines: typeof parsed.combines === 'number' ? parsed.combines : 0,
      relations: Array.isArray(parsed.relations) ? parsed.relations : [],
      feeds: typeof parsed.feeds === 'number' ? parsed.feeds : 0,
      radioChannels: Array.isArray(parsed.radioChannels) ? parsed.radioChannels : [],
      firstTry:
        parsed.firstTry && typeof parsed.firstTry === 'object' ? parsed.firstTry : {},
      endingsSeen: Array.isArray(parsed.endingsSeen) ? parsed.endingsSeen : [],
      openedChats: Array.isArray(parsed.openedChats) ? parsed.openedChats : [],
      browserViews: Array.isArray(parsed.browserViews) ? parsed.browserViews : [],
      timelineAttempts:
        typeof parsed.timelineAttempts === 'number' ? parsed.timelineAttempts : 0,
      timelineFirstTry: parsed.timelineFirstTry === true,
    };
  } catch {
    return { ...EMPTY_ACHIEVEMENT_PROGRESS };
  }
}

export function saveAchievementProgress(progress: AchievementProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 忽略隐私模式下的写入失败
  }
}

export interface AchievementContext {
  flags: Record<string, boolean>;
  discoveredClues: string[];
  chapterAnswers: Record<number, Record<string, string>>;
  ending: EndingId | null;
  totalClues: number;
  progress: AchievementProgress;
}

const ARCHIVE_FLAGS = [
  'archive_1998',
  'archive_2006',
  'archive_2014',
  'archive_2026',
];

const RADIO_CHANNEL_IDS = ['radio_hit', 'radio_announce', 'radio_night', 'radio_history'];

/** 第一章现场照片里的五条线索 */
const CH1_PHOTO_CLUES = [
  'clue_milk_time',
  'clue_paw_print',
  'clue_drawer',
  'clue_box_code',
  'clue_box_interior',
];

/** 需要打开过的四个问话 */
const CHAT_IDS = ['chat_milu', 'chat_achai', 'chat_black', 'chat_owl'];

/** 论坛、搜索历史、议会公告 */
const BROWSER_VIEWS = ['forum', 'history', 'council'];

function isMet(id: string, ctx: AchievementContext): boolean {
  const { flags, discoveredClues, chapterAnswers, ending, totalClues, progress } = ctx;
  switch (id) {
    case 'story_ch1':
      return !!chapterAnswers[1];
    case 'story_ch2':
      return !!chapterAnswers[2];
    case 'story_ch3':
      return !!chapterAnswers[3];
    case 'story_ch4':
      return !!chapterAnswers[4];
    case 'story_ch5':
      return ending === 'A' || ending === 'B';

    case 'deduction_combine':
      return progress.combines >= 1;
    case 'deduction_relations_types':
      return ['conflict', 'trace', 'motive'].every((r) => progress.relations.includes(r));
    case 'deduction_ch1_cards':
      return !!flags.timeline_ch2_solved;
    case 'deduction_relations_six':
      return discoveredClues.includes('clue_relations_solved');
    case 'deduction_archives':
      return ARCHIVE_FLAGS.every((f) => !!flags[f]);
    case 'deduction_music':
      return !!flags.music_unlocked && discoveredClues.includes('clue_music_code');

    case 'discovery_milk':
      return CH1_PHOTO_CLUES.every((id2) => discoveredClues.includes(id2));
    case 'discovery_poppy_phone':
      return CHAT_IDS.every((id2) => progress.openedChats.includes(id2));
    case 'discovery_margin_fund':
      return BROWSER_VIEWS.every((id2) => progress.browserViews.includes(id2));

    case 'radio_all':
      return RADIO_CHANNEL_IDS.every((id2) => progress.radioChannels.includes(id2));

    case 'choice_any':
      return ending !== null;
    case 'choice_both': {
      const cIndex = progress.endingsSeen.indexOf('C');
      return (
        cIndex >= 0 &&
        progress.endingsSeen
          .slice(cIndex + 1)
          .some((e) => e === 'A' || e === 'B')
      );
    }

    case 'choice_ending_c':
      return progress.endingsSeen.includes('C');

    case 'hidden_perfect':
      return (
        !flags.used_hint &&
        discoveredClues.length >= totalClues &&
        (progress.endingsSeen.includes('A') || progress.endingsSeen.includes('B'))
      );
    case 'hidden_ch1_first_try':
      return !!progress.firstTry[1];
    case 'hidden_ch2_first_try':
      return !!progress.firstTry[2];
    case 'hidden_ch3_first_try':
      return !!progress.firstTry[3];
    case 'hidden_ch4_first_try':
      return !!progress.firstTry[4];
    case 'hidden_feed3':
      return progress.feeds >= 3;

    default:
      return false;
  }
}

/** 返回本次新解锁的成就 id（不修改传入的 progress） */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter(
    (a) => !ctx.progress.unlocked.includes(a.id) && isMet(a.id, ctx)
  ).map((a) => a.id);
}
