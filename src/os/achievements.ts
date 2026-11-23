import { EndingId } from './types';

export type AchievementCategory =
  | 'story'
  | 'deduction'
  | 'discovery'
  | 'choice'
  | 'hidden';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  hidden?: boolean;
}

export const ACHIEVEMENT_CATEGORY_LABEL: Record<AchievementCategory, string> = {
  story: '剧情推进',
  deduction: '推理玩法',
  discovery: '细心发现',
  choice: '选择',
  hidden: '隐藏成就',
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // 一、剧情推进
  {
    id: 'story_closure',
    category: 'story',
    name: '恭喜结案',
    description: '你按规矩做对了每一件事，结论却是错的',
  },
  {
    id: 'story_timeline',
    category: 'story',
    name: '时间管理大师来的吧',
    description: '布莱克 14:21 就走了，抽屉 14:25 才开，中间这四分钟，时间线上只剩一个人',
  },
  {
    id: 'story_notes',
    category: 'story',
    name: '一目十行',
    description: '从 2006 到 2026，十六页笔记，你读完了',
  },
  {
    id: 'story_procedure',
    category: 'story',
    name: 'how old are you？',
    description: '没有一份文件违法，每一道手续上都是同一个人',
  },
  {
    id: 'story_finale',
    category: 'story',
    name: '小橘探长赛高！！',
    description: '达成一个结局',
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
    name: '哇塞！？莫非你是拼图大师',
    description: '互相冲突、证据对应、因果动机，你都用过了',
  },
  {
    id: 'deduction_ch1_cards',
    category: 'deduction',
    name: '老实交代！穷举了多少次？',
    description: '完整时间线第一次提交就全对',
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
    description: '不错不错',
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
    id: 'discovery_view_only',
    category: 'discovery',
    name: '叮咚！邮件被你看完啦',
    description: '侦探账户里的关键邮件都读完了',
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

  // 隐藏成就
  {
    id: 'hidden_perfect',
    category: 'hidden',
    name: '一点细节都不放过啊你',
    description: '没用提示，找齐所有线索，用 A、B 两个结局结案，而且从没触发过 C 结局',
    hidden: true,
  },
  {
    id: 'hidden_ch1_first_try',
    category: 'hidden',
    name: '一一得一',
    description: '第一章所有结论题目一次答对',
    hidden: true,
  },
  {
    id: 'hidden_ch2_first_try',
    category: 'hidden',
    name: '二二得四',
    description: '第二章所有结论题目一次答对',
    hidden: true,
  },
  {
    id: 'hidden_ch3_first_try',
    category: 'hidden',
    name: '三三得九',
    description: '第三章所有结论题目一次答对',
    hidden: true,
  },
  {
    id: 'hidden_ch4_first_try',
    category: 'hidden',
    name: '四四十六',
    description: '第四章所有结论题目一次答对',
    hidden: true,
  },
  {
    id: 'hidden_feed3',
    category: 'hidden',
    name: '煤球投喂官',
    description: '你投喂了煤球三次，它开始跟你说更多的话',
    hidden: true,
  },
];

export const VISIBLE_ACHIEVEMENTS = ACHIEVEMENTS.filter((a) => !a.hidden);
export const HIDDEN_ACHIEVEMENTS = ACHIEVEMENTS.filter((a) => a.hidden);

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
  /** 读过的邮件 id */
  readEmails: string[];
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
  readEmails: [],
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
      readEmails: Array.isArray(parsed.readEmails) ? parsed.readEmails : [],
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

/** 侦探账户里的关键邮件 */
const KEY_DETECTIVE_EMAILS = [
  'mail_welcome',
  'mail_achai_weight',
  'mail_black_2',
  'mail_police_cctv',
  'mail_owl_warning',
  'mail_yuning_archive',
  'mail_gugu_pressure',
  'mail_poppy_scheduled',
  'mail_yuning_final',
  'mail_black_last',
];

/** 论坛、搜索历史、议会公告 */
const BROWSER_VIEWS = ['forum', 'history', 'council'];

function isMet(id: string, ctx: AchievementContext): boolean {
  const { flags, discoveredClues, chapterAnswers, ending, totalClues, progress } = ctx;
  switch (id) {
    case 'story_closure':
      return !!chapterAnswers[1];
    case 'story_timeline':
      return !!flags.timeline_ch2_solved;
    case 'story_notes':
      return !!flags.read_investigation_note;
    case 'story_procedure':
      return !!flags.procedure_chain_solved;
    case 'story_finale':
      return ending !== null;

    case 'deduction_combine':
      return progress.combines >= 1;
    case 'deduction_relations_types':
      return ['conflict', 'trace', 'motive'].every((r) => progress.relations.includes(r));
    case 'deduction_ch1_cards':
      return progress.timelineFirstTry;
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
    case 'discovery_view_only':
      return KEY_DETECTIVE_EMAILS.every((id2) => progress.readEmails.includes(id2));
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

    case 'hidden_perfect':
      return (
        !flags.used_hint &&
        discoveredClues.length >= totalClues &&
        progress.endingsSeen.includes('A') &&
        progress.endingsSeen.includes('B') &&
        !progress.endingsSeen.includes('C')
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
