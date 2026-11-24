﻿import { EmailItem, FSNode } from '../types';

/** ───────── 第五章 · 文件（不再有老街 7 号实地调查） ───────── */
export const CH5_NODES: FSNode[] = [];

/** ───────── 第五章 · 邮件 ───────── */
export const CH5_EMAILS: EmailItem[] = [
  {
    id: 'mail_yuning_final',
    from: '尤宁',
    fromRole: '甜点镇警局 · 内勤',
    to: '小橘探长',
    subject: '这字你签不签',
    timestamp: '11 月 23 日 19:40',
    folder: 'inbox',
    read: false,
    starred: true,
    chapter: 5,
    account: 'detective',
    body: [
      '小橘探长：',
      '',
      '你没签字，咕咕那边很不高兴。他说今晚十点前不签，明天发布会照开。',
      '',
      '你手里现在有波比的笔记、五份档案、验收单和火灾报告的冲突、手续链上五处咕咕的签名、六条人物关系。',
      '',
      '够不够结案，你自己判断。',
      '',
      '—— 尤宁',
    ].join('\n'),
  },
  {
    id: 'mail_black_last',
    from: '黑猫店长 · 布莱克',
    fromRole: '隔壁黑猫咖啡馆',
    to: '小橘探长',
    subject: '谢谢你还我清白',
    timestamp: '11 月 23 日 18:05',
    folder: 'inbox',
    read: false,
    starred: false,
    chapter: 5,
    account: 'detective',
    body: [
      '探长：',
      '',
      '我听说你没签字。',
      '',
      '我这辈子没做过什么好事，但我也不会去做坏事。',
    ].join('\n'),
  },
  {
    id: 'mail_black_last_sent',
    from: '布莱克（已发送）',
    fromRole: '隔壁黑猫咖啡馆',
    to: '小橘探长',
    subject: '谢谢你还我清白',
    timestamp: '11 月 23 日 18:05',
    folder: 'sent',
    read: true,
    starred: false,
    chapter: 5,
    account: 'black',
    body: [
      '探长：',
      '',
      '我听说你没签字。',
      '',
      '我这辈子没做过什么好事，但我也不会去做坏事。',
    ].join('\n'),
  },
];

export const FINAL_ANSWER = {
  culprit: '奶泡泡甜品铺店长 波比',
  method: '用店内机制伪造失窃，配方装进冷链箱运走',
  motive: '逼警方调查 2006 年火灾，拿回被镇议会锁死的产权和母亲的名字',
  evidence: '时间线断点 + 冷链箱重量差 + 咕咕五道手续签名',
};

export const ENDING_TEXT: Record<'A' | 'B' | 'C', { title: string; body: string[] }> = {
  A: {
    title: '结局 A · 全部追责',
    body: [
      '你把波比的笔记、五份档案、验收单与火灾报告的冲突、手续链上五处签名全部交上去。',
      '波比因伪造失窃被调查，咕咕因 2006 年案子和合规操作被调查。',
      '2006 年火灾重新立案，布莱克获释。',
    ],
  },
  B: {
    title: '结局 B · 只追旧案',
    body: [
      '你把咕咕和 2006 年案子的证据交上去，波比的伪造失窃从轻处理。',
      '咕咕停职，2006 年火灾重新立案，波比自由。',
      '布莱克获释，但他没有回黑猫咖啡馆——他把店盘了出去，搬走了。',
    ],
  },
  C: {
    title: '结局 C · 签结案稿',
    body: [
      '你签了字。',
      '布莱克背锅，2006 年火灾无人问津。',
    ],
  },
};
