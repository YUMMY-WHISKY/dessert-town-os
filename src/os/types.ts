export type GamePhase = 'title' | 'playing' | 'gameover';

export type AppId =
  | 'explorer'
  | 'notepad'
  | 'photos'
  | 'mail'
  | 'chat'
  | 'music'
  | 'clueboard'
  | 'achievements'
  | 'browser'
  | 'pet'
  | 'timeline'
  | 'radio'
  | 'relations'
  | 'archive'
  | 'filing'
  | 'donate';

export type FSNodeType = 'folder' | 'text' | 'image';

/** 线索层级：观察 → 证词 → 物证 → 矛盾 → 真相 */
export type ClueTier = 'observe' | 'testimony' | 'physical' | 'contradiction' | 'truth';

export interface PhotoHotspot {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  /** 可以只是说明，不产出线索 */
  clueId?: string;
  detail: string;
  /** 低于该缩放比例时热点不可见、不可点 */
  minZoom?: number;
  /** 最早在第几章出现，缺省为 1 */
  minChapter?: number;
  /** 递进解锁：需要先点开另一个热点才可见 */
  requiresHotspotId?: string;
  /** 点击热点后触发的特殊动作（由 PhotoViewerApp 处理） */
  action?: 'open-box-inside';
}

export interface FSNode {
  id: string;
  name: string;
  type: FSNodeType;
  parentId: string | null;
  originalParentId?: string | null;
  inTrash?: boolean;
  locked?: boolean;
  passcode?: string;
  passcodeHint?: string;
  content?: string;
  imageUrl?: string;
  hotspots?: PhotoHotspot[];
  sizeLabel: string;
  modifiedAt: string;
  clueId?: string;
  /** 该内容从第几章开始可见，缺省为 0（始终可见） */
  chapter?: number;
  /** 诱饵内容：看起来可信，实为伪造 */
  isDecoy?: boolean;
  /** 不显示在侧边栏（只能从另一个节点的 hotspot 进入） */
  hiddenFromSidebar?: boolean;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  fileId?: string;
  folderId?: string;
}

export interface EmailAttachment {
  /** 对应 INITIAL_FS_NODES 里 FSNode 的 id */
  fileId: string;
  /** 显示名（可以和 file.name 不同） */
  name: string;
  /** 大小标签，如 "1.1 KB" */
  sizeLabel: string;
}

export interface EmailItem {
  id: string;
  from: string;
  fromRole: string;
  to: string;
  subject: string;
  timestamp: string;
  folder: 'inbox' | 'sent' | 'trash';
  read: boolean;
  starred: boolean;
  body: string;
  attachments?: EmailAttachment[];
  clueId?: string;
  chapter?: number;
  /** 这封邮件属于哪个账户，缺省为探长账户 */
  account?: 'detective' | 'poppy' | 'black';
  /** 读到这封邮件时顺带记下的旗标（如银行核查邮件） */
  flagOnRead?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  chapter?: number;
  /** 这条回复里包含可收录的线索 */
  clueId?: string;
}

export interface ChatChoice {
  label: string;
  reply: string;
  /** 下一轮对话节点；不填表示这一支到此结束 */
  next?: string;
  clueId?: string;
  flag?: string;
  /** 这个选项最早在第几章出现，避免提前拿到后面的线索 */
  chapter?: number;
  /** casual=随便聊聊；case=案件相关。默认带 clueId 就是 case */
  kind?: 'casual' | 'case';
}

export interface ChatDialogueNode {
  id: string;
  prompt: string;
  choices: ChatChoice[];
}

export interface ChatDialogue {
  start: string;
  nodes: ChatDialogueNode[];
}

export interface ChatThread {
  id: string;
  contactName: string;
  role: string;
  avatarBg: string;
  avatarEmoji: string;
  unread: number;
  clueId?: string;
  chapter?: number;
  /** 这段聊天属于哪个账户，缺省为探长账户 */
  account?: 'detective' | 'poppy' | 'black';
  messages: ChatMessage[];
  /** 分支对话：玩家从选项里挑，NPC 多轮回话 */
  dialogue?: ChatDialogue;
  fallbackReply?: string;
}

/** 拼合线索时可选的推理方式 */
export type DeriveRelation = 'conflict' | 'trace' | 'motive';

export interface ClueItem {
  id: string;
  title: string;
  sourceApp: string;
  summary: string;
  hint: string;
  chapter: number;
  tier: ClueTier;
  /** 由另外两条线索拼合而来 */
  derivedFrom?: [string, string];
  /** 这两条线索之间成立的是哪种推理关系 */
  relation?: DeriveRelation;
  /** 未取得时给出的推理条件（不直接点破答案） */
  combineHint?: { a: string; b: string };
  isDecoy?: boolean;
}

export interface DeductionAnswer {
  suspect: string;
  timeWindow: string;
  evidence: string;
}

export interface DeductionResult {
  solved: boolean;
  score: number;
  feedback: string;
}

export interface ChapterQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
}

export interface ChapterConclusion {
  questions: ChapterQuestion[];
  successText: string;
  failText: string;
}

export interface ChapterDef {
  id: number;
  title: string;
  /** 提交本章结论前必须在手账里凑齐的全部线索 */
  requiresClues?: string[];
  /** 提交本章结论前必须完成的旗标（时间线闭合、读到某封邮件等） */
  requiresFlags?: string[];
  /** 终章不用这套结论表单 */
  conclusion?: ChapterConclusion;
}

export interface TimelineCard {
  id: string;
  who: string;
  /** 14:00 起算的分钟数 */
  start: number;
  end: number;
  text: string;
  chapter: number;
  /** 到达该章后这张卡退场（如第一章的“米露全程在后厨”） */
  untilChapter?: number;
  /** 点卡：只有 start 有意义；区间卡按 start–end 显示 */
  kind?: 'point' | 'span';
  /** 这张卡在指定章节里允许吸附的区间（第一章的“抽屉被开”） */
  acceptRange?: { chapter: number; from: number; to: number };
}

export interface TimelineContradiction {
  a: string;
  b: string;
  clueId: string;
  text: string;
}

/** 冷链卡：不计入时间轴，但能作为断点三的证据 */
export interface TimelineEvidence {
  id: string;
  label: string;
  clueId: string;
  chapter: number;
  detail: string;
}

export interface RadioLine {
  text: string;
  clueId?: string;
  flag?: string;
}

export interface RadioChannel {
  id: string;
  frequency: string;
  name: string;
  chapter: number;
  lines: RadioLine[];
}

export type RelationType =
  | '亲属'
  | '要挟'
  | '复仇'
  | '雇佣'
  | '交易'
  | '竞争'
  | '旧识';

export interface RelationNode {
  id: string;
  name: string;
  emoji: string;
  role: string;
  x: number;
  y: number;
}

export interface RelationEdgeDef {
  a: string;
  b: string;
  type: RelationType;
  testimony: string;
  clueId?: string;
}

export interface ArchiveDrawer {
  id: string;
  year: string;
  code: string;
  headline: string;
  dateline: string;
  paragraphs: string[];
  stamp: string;
  clueId?: string;
  flag?: string;
  /** 打开后还能再翻一次，拿到第二条线索 */
  extraClueId?: string;
  extraLabel?: string;
}

export type EndingId = 'A' | 'B' | 'C';

export interface CaseState {
  chapter: number;
  flags: Record<string, boolean>;
  derivedClues: string[];
  /** 章节 → 题号 → 当时的作答 */
  chapterAnswers: Record<number, Record<string, string>>;
  ending: EndingId | null;
}

export interface FinalAccusation {
  culprit: string;
  method: string;
  motive: string;
  evidence: string;
  choice: 'full' | 'oldcase' | 'sign' | null;
}
