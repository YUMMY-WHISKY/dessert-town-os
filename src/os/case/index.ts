import { ClueItem, EmailItem, FSNode } from '../types';
import { ROOT_IDS } from './roots';
import { CH1_CLUES, CH1_EMAILS, CH1_NODES } from './ch1';
import { CH2_CLUES, CH2_EMAILS, CH2_NODES } from './ch2';
import { CH3_CLUES, CH3_EMAILS, CH3_NODES } from './ch3';
import { CH4_CLUES, CH4_EMAILS, CH4_NODES } from './ch4';
import { CH5_EMAILS, CH5_NODES } from './ch5';
import { ALL_CHATS } from './chats';

export { ROOT_IDS } from './roots';
export {
  IMG,
  WALLPAPER_URL,
  AVATAR_SHIBA_URL,
  EVIDENCE_COUNTER_URL,
  EVIDENCE_BOX_URL,
} from './images';
export { CHAPTERS, RELATION_NODES, RELATION_EDGES } from './meta';
export { POPPY_ACCOUNT, BLAKE_ACCOUNT } from './accounts';
export { RADIO_CHANNELS, ARCHIVE_DRAWERS } from './media';
export {
  TIMELINE_CARDS,
  TIMELINE_CONTRADICTIONS,
  TIMELINE_EVIDENCE,
} from './ch2';
export { FINAL_ANSWER, ENDING_TEXT } from './ch5';

const ROOT_NODES: FSNode[] = [
  {
    id: ROOT_IDS.COMPUTER,
    name: '我的电脑 (C:)',
    type: 'folder',
    parentId: null,
    sizeLabel: '--',
    modifiedAt: '2026-11-21 09:00',
    chapter: 0,
  },
  {
    id: ROOT_IDS.DESKTOP,
    name: '桌面',
    type: 'folder',
    parentId: ROOT_IDS.COMPUTER,
    sizeLabel: '--',
    modifiedAt: '2026-11-21 09:00',
    chapter: 0,
  },
  {
    id: ROOT_IDS.DOCUMENTS,
    name: '文档',
    type: 'folder',
    parentId: ROOT_IDS.COMPUTER,
    sizeLabel: '--',
    modifiedAt: '2026-11-21 10:15',
    chapter: 0,
  },
  {
    id: ROOT_IDS.PICTURES,
    name: '图片',
    type: 'folder',
    parentId: ROOT_IDS.COMPUTER,
    sizeLabel: '--',
    modifiedAt: '2026-11-21 14:35',
    chapter: 0,
  },
  {
    id: ROOT_IDS.DOWNLOADS,
    name: '下载',
    type: 'folder',
    parentId: ROOT_IDS.COMPUTER,
    sizeLabel: '--',
    modifiedAt: '2026-11-21 13:50',
    chapter: 0,
  },
  {
    id: ROOT_IDS.TRASH,
    name: '回收站',
    type: 'folder',
    parentId: ROOT_IDS.COMPUTER,
    sizeLabel: '--',
    modifiedAt: '2026-11-21 14:40',
    chapter: 0,
  },
];

export const INITIAL_FS_NODES: FSNode[] = [
  ...ROOT_NODES,
  ...CH1_NODES,
  ...CH2_NODES,
  ...CH3_NODES,
  ...CH4_NODES,
  ...CH5_NODES,
];

export const INITIAL_EMAILS: EmailItem[] = [
  ...CH1_EMAILS,
  ...CH2_EMAILS,
  ...CH3_EMAILS,
  ...CH4_EMAILS,
  ...CH5_EMAILS,
];

export const INITIAL_CHATS = ALL_CHATS;

export const INITIAL_CLUES: ClueItem[] = [
  ...CH1_CLUES,
  ...CH2_CLUES,
  ...CH3_CLUES,
  ...CH4_CLUES,
];

/** 线索拼合表：由 derivedFrom 自动生成 */
export const CLUE_COMBOS = INITIAL_CLUES.filter(
  (c): c is ClueItem & { derivedFrom: [string, string] } => !!c.derivedFrom
).map((c) => ({ a: c.derivedFrom[0], b: c.derivedFrom[1], result: c.id }));

export const TIER_LABEL: Record<ClueItem['tier'], string> = {
  observe: '观察',
  testimony: '证词',
  physical: '物证',
  contradiction: '矛盾',
  truth: '真相',
};

/** 拼合时可选的推理方式 */
export const DERIVE_RELATIONS: { id: string; label: string; desc: string }[] = [
  { id: 'conflict', label: '互相冲突', desc: '两件事不能同时成立' },
  { id: 'trace', label: '证据对应', desc: '两条线索指向同一件事' },
  { id: 'motive', label: '因果动机', desc: '一件事是为了促成另一件' },
];
