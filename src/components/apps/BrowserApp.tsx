﻿import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Globe,
  History,
  Home,
  Landmark,
  Megaphone,
  MessageCircle,
  Plus,
  RotateCw,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { RichText } from '../RichText';
import { soundEngine } from '../../os/sound';

interface BrowserAppProps {
  chapter: number;
  onView?: (view: string) => void;
}

interface ForumReply {
  author: string;
  text: string;
}

interface ForumPost {
  id: string;
  title: string;
  author: string;
  paragraphs: string[];
  replies: ForumReply[];
}

const POSTS: ForumPost[] = [
  {
    id: 'p_demolish',
    title: '老街那家奶泡泡甜品铺，真的要拆了吗',
    author: '楼主 · 老街住户',
    paragraphs: [
      '听说下个月就要迁离了。好可惜啊，她家甜品特别好吃，听说是有独家秘方呢。',
      '我今天路过的时候，门口还挂着店庆的小旗子，玻璃上还贴着营业时间照旧呢。',
    ],
    replies: [
      { author: '回复一', text: '老板人挺好的，可惜了。' },
      { author: '回复二', text: '别听风就是雨，正式名单还没贴出来。' },
    ],
  },
  {
    id: 'p_black_weird',
    title: '有没有人觉得布莱克最近怪怪的',
    author: '楼主 · 黑猫常客',
    paragraphs: [
      '黑猫咖啡馆最近生意差得离谱，听说他到处找人借钱。',
      '今天倒是正常开门，只是特价牌换了又换。',
    ],
    replies: [
      { author: '回复一', text: '听说他找奶泡泡甜品铺谈了好几次，都被拒了。' },
      { author: '回复二', text: '供应商好像也停了，今天只卖司康。' },
      { author: '回复三', text: '别把人逼太紧，老街就剩这两家还像样。' },
    ],
  },
  {
    id: 'p_breakfast',
    title: '求推荐：老街哪家早餐最顶',
    author: '楼主 · 早起困难户',
    paragraphs: [
      '每天七点出门，想换换口味，别再啃面包了。',
      '最好是有热汤的，能坐下来吃十分钟的那种。',
      '老街附近，价格别太离谱就行。',
    ],
    replies: [
      { author: '回复一', text: '老街 5 号旁边的豆浆油条，六点半就开门。' },
      { author: '回复二', text: '钟表店隔壁那家馄饨，汤底是真的香。' },
      { author: '回复三', text: '楼上说得对，就是要排队。' },
    ],
  },
  {
    id: 'p_rebuild',
    title: '镇议会又要搞什么改造',
    author: '楼主 · 老街商户',
    paragraphs: [
      '老街这几年改来改去，越改越没人。',
      '这次说是要统一立面、统一供应链，还要清理沿街传统作坊。',
    ],
    replies: [
      { author: '回复一', text: '听说这次要统一供应链，小商户活不下去。' },
      { author: '回复二', text: '经办人还是镇长办公室那个秘书，手续挑不出错。' },
      { author: '回复三', text: '挑不出错，不代表没问题。' },
      { author: '匿名', text: '06年那次也闹过迁离，老街七家签了联名信，后来不了了之。听说签得最坚决的那家，当年出了意外。' },
    ],
  },
  {
    id: 'p_help',
    title: '求助：黑猫咖啡馆急寻合作方',
    author: '楼主 · 布莱克',
    paragraphs: [
      '本店经营正常，只是短期周转，价格好商量，有意私聊。',
      '不接受赊账，不接受配方抵押。',
      '如果有人认识愿意接手的，帮我问一句。',
    ],
    replies: [
      { author: '回复一', text: '听说要盘出去了，还嘴硬。' },
      { author: '回复二', text: '他家那个黑糖司康是真的好吃，可惜了。' },
      { author: '回复三', text: '今天去买了两个，他连找零都算错了。' },
    ],
  },
  {
    id: 'p_books',
    title: '镇图书馆的旧书角又开张了',
    author: '楼主 · 爱看闲书',
    paragraphs: [
      '管理员把地下室那批旧书搬上来了，一块钱一本。',
      '我翻到一本九十年代的园艺手册，书页里还夹着前一个借书人写的便签。',
      '周末去的人不少，想淘书的趁早。',
    ],
    replies: [
      { author: '回复一', text: '那本园艺手册我也看到了，全是手写批注。' },
      { author: '回复二', text: '有没有推理小说？我上周去没找着。' },
      { author: '回复三', text: '周六下午两点补一批，管理员说的。' },
    ],
  },
  {
    id: 'p_orangecat',
    title: '镇口那只橘猫是不是又胖了',
    author: '楼主 · 每天路过',
    paragraphs: [
      '早上经过邮局门口，它正趴在台阶上晒太阳。',
      '比上个月圆了一圈，估计整条街都在喂。',
      '谁家养的？想提醒一下，该给它减减肥了。',
    ],
    replies: [
      { author: '回复一', text: '不是谁家的，它自己挑的邮局。' },
      { author: '回复二', text: '我上周喂了半根火腿肠，它记住了。' },
    ],
  },
  {
    id: 'p_cold',
    title: '降温了，老街这边的风真顶不住',
    author: '楼主 · 骑车上班',
    paragraphs: [
      '今天早上出门只穿了一件外套，骑到桥头就后悔了。',
      '老街两边没有遮挡，风从巷子里灌出来。',
      '大家记得加件衣服，别硬扛。',
    ],
    replies: [
      { author: '回复一', text: '我已经把秋裤翻出来了。' },
      { author: '回复二', text: '桥头那家热饮摊今天排队排到路口。' },
    ],
  },
];

interface HistoryItem {
  query: string;
  resultTitle: string;
  resultBody: string;
  extra?: string;
}

interface PersonSite {
  id: string;
  title: string;
  url: string;
  summary: string;
  paragraphs: string[];
}

interface TownPerson {
  id: string;
  name: string;
  role: string;
  emoji: string;
  sites: PersonSite[];
}

const TOWN_PEOPLE: TownPerson[] = [
  {
    id: 'person_poppy',
    name: '波比',
    role: '奶泡泡甜品铺店长',
    emoji: '🧁',
    sites: [
      {
        id: 'site_poppy_blog',
        title: '波比的烘焙日记',
        url: 'paw://bobi.bake/blog',
        summary: '店庆、蛋挞。',
        paragraphs: [
          '11.20　店庆。这家店重新开张的日子，照旧凌晨四点起来揉面。',
          '11.21　隔壁又来找我谈配方。',
          '有些东西不是价钱的问题。',
        ],
      },
      {
        id: 'site_poppy_menu',
        title: '奶泡泡甜品铺 · 店庆菜单',
        url: 'paw://sweet.house/menu',
        summary: '店庆供应、店庆歌单与营业时间。',
        paragraphs: [
          '店庆供应：黄金流心蛋挞（限量）、草莓牛奶、黑糖司康、蛋挞。',
          '店庆歌单：1-3-1-2。顺序错了就不成调子了。',
          '营业时间：08:00–18:00。',
          '外卖只接镇内，冷链箱另加 5 甜心币。',
        ],
      },
      {
        id: 'site_poppy_album',
        title: '波比的旧相册',
        url: 'paw://bobi.bake/album',
        summary: '1998 年开业那天的照片。',
        paragraphs: [
          '妈站在柜台后面，围裙上全是面粉。',
          '我坐在柜台上，手里举着一块木牌，上面写着「波比的店」。',
          '相册最后一页夹着一张旧报纸剪角，日期是 2006 年 6 月。',
        ],
      },
      {
        id: 'site_poppy_order',
        title: '奶泡泡甜品铺 · 本周预约',
        url: 'paw://sweet.house/order',
        summary: '店庆预订、取货时间与限量说明。',
        paragraphs: [
          '店庆周只接受当天预订，每人限购两份黄金流心蛋挞。',
          '取货时间：10:00–13:30、15:00–17:30。14:00–15:00 暂停取货。',
        ],
      },
    ],
  },
  {
    id: 'person_black',
    name: '布莱克',
    role: '黑猫咖啡馆店长',
    emoji: '🐈‍⬛',
    sites: [
      {
        id: 'site_black_blog',
        title: '黑猫的深夜博客',
        url: 'paw://blackcat.blog',
        summary: '布莱克的自言自语。',
        paragraphs: [
          '2026.11.03　生日这天，店里只来了两桌。给自己烤了一个黑糖司康，插了一根蜡烛。每年 [[11 月 3 日|clue_blake_birthday]]，我都给自己烤一个。今年没什么可许愿的。',
          '2026.10.28　又跌了。银行今天打电话来，说两笔贷款都到期了。再拿不到配方，估计撑不过今年冬天了。我都出这么高的价了，她还不卖，她说那不是钱的事。',
          '2026.09.15　隔壁的黄金流心。整条老街，只有她家排队。我又又去找她谈授权。她还是那句话：不卖。我只是想把店继续开下去。',
        ],
      },
      {
        id: 'site_black_shop',
        title: '黑猫咖啡馆 · 营业信息',
        url: 'paw://blackcat.cafe/info',
        summary: '营业时间、本周特价与招聘启事。',
        paragraphs: [
          '营业时间：周一至周日 08:00–20:00。本月起取消夜间时段。',
          '本周特价：黑糖司康买二送一。',
          '招聘：兼职店员一名，时薪面议。',
        ],
      },
      {
        id: 'site_black_daily',
        title: '黑猫的采购清单',
        url: 'paw://blackcat.cafe/list',
        summary: '一张被反复改过的进货单。',
        paragraphs: [
          '黑糖 2 袋、黄油 1 箱、面粉 3 袋。',
          '划掉了「糖霜」，旁边写着「先欠着」。',
          '最下面一行：授权保证金 100,000（待定）。',
          '另一页写着：如果这周还不上货款，下周只进黑糖。',
        ],
      },
      {
        id: 'site_black_menu',
        title: '黑猫咖啡馆 · 本周菜单',
        url: 'paw://blackcat.cafe/menu',
        summary: '本周供应、价格与缺货说明。',
        paragraphs: [
          '黑糖司康 6 甜心币，买二送一。',
          '黄油曲奇暂时缺货，供应商未恢复。',
          '手冲咖啡照常供应，夜间时段取消。',
          '老板留言：本店经营正常，只是短期周转。',
        ],
      },
    ],
  },
  {
    id: 'person_milu',
    name: '米露',
    role: '奶泡泡甜品铺学徒',
    emoji: '🐰',
    sites: [
      {
        id: 'site_milu_blog',
        title: '米露的实习周记',
        url: 'paw://milu.memo/blog',
        summary: '烤箱、蛋挞和一点点害怕。',
        paragraphs: [
          '11.21　今天又被烤箱烫到了。波比姐让我去后门搬箱子，说烤箱还早。结果刚搬一半就响了。',
          '11.20　店庆当天，前厅挤得转不过身，蛋挞差点没出炉。',
          '11.19　波比姐最近总在看一张老照片。',
        ],
      },
      {
        id: 'site_milu_recipe',
        title: '米露的蛋挞笔记',
        url: 'paw://milu.memo/tart',
        summary: '一份写满修改痕迹的配方笔记。',
        paragraphs: [
          '蛋挞液比例 1:1:0.5，烤箱 200 度 18 分钟。',
          '下次一定要盯着定时器。',
        ],
      },
    ],
  },
  {
    id: 'person_achai',
    name: '阿柴',
    role: '甜点镇速递员',
    emoji: '🐶',
    sites: [
      {
        id: 'site_achai_price',
        title: '甜点镇速递 · 价格表',
        url: 'paw://achai.delivery/price',
        summary: '镇内配送、冷链与加急费用。',
        paragraphs: [
          '镇内配送：8 甜心币。',
          '冷链箱：+5 甜心币。',
          '加急/不写系统：+10 甜心币。',
          '备注：活体与易碎品另议。',
        ],
      },
      {
        id: 'site_achai_route',
        title: '阿柴的今日路线',
        url: 'paw://achai.delivery/route',
        summary: '一张手写的送货顺序表。',
        paragraphs: [
          '08:30 镇南果园 → 09:10 奶泡泡甜品铺 → 10:00 黑猫咖啡馆。',
          '13:52 奶泡泡甜品铺冷链箱签收。',
          '14:05 镇南驿站打卡。',
          '17:30 老街 7 号，临时加单。',
        ],
      },
    ],
  },
  {
    id: 'person_gugu',
    name: '咕咕',
    role: '镇长办公室秘书',
    emoji: '🕊️',
    sites: [
      {
        id: 'site_gugu_blog',
        title: '咕咕的工作笔记',
        url: 'paw://office.town/gugu',
        summary: '一份过于整洁的公开工作记录。',
        paragraphs: [
          '11.21　今天处理了三份产权申请，都按流程办。',
          '老街片区的材料要统一归档，旧事不要影响街区申报。',
          '下午让办公室给奶泡泡甜品铺打了电话，提醒结案前保持安静。',
        ],
      },
      {
        id: 'site_gugu_notice',
        title: '镇长办公室 · 本周日程',
        url: 'paw://office.town/week',
        summary: '产权复核、改造对接与结案发布会。',
        paragraphs: [
          '周一：产权复核。',
          '周三：街区改造对接。',
          '周五：奶泡泡甜品铺失窃案结案发布会。',
          '备注：发布会稿已拟好，待探长签字。',
        ],
      },
      {
        id: 'site_gugu_reception',
        title: '镇长办公室 · 公开接待日',
        url: 'paw://office.town/reception',
        summary: '本周接待安排与材料要求。',
        paragraphs: [
          '接待时间：周二、周四 14:00–16:00。',
          '产权类材料请提前三个工作日提交，逾期顺延。',
          '涉及历史档案的，请走正式调阅流程。',
          '备注：口头咨询不作为办理依据。',
        ],
      },
    ],
  },
  {
    id: 'person_arley',
    name: '阿栗',
    role: '老奶泡泡甜品铺掌柜',
    emoji: '🕯️',
    sites: [
      {
        id: 'site_arley_blog',
        title: '阿栗的旧博客',
        url: 'paw://old.sweet/blog',
        summary: '1998 到 2006 年，一个掌柜的日常。',
        paragraphs: [
          '1998.7.15　开业。可爱的波比说，这店以后是她的，我说小傻瓜，现在就是你的。',
          '2006.7.14　电路又跳闸了，得赶紧叫人来看看了。',
          '2006.7.15　终于修好了，今天晚上早点关门。',
        ],
      },
      {
        id: 'site_arley_menu',
        title: '老奶泡泡甜品铺 · 旧菜单',
        url: 'paw://old.sweet/menu',
        summary: '一张已经停用的手写菜单。',
        paragraphs: [
          '黄金流心蛋挞：2 甜心币。',
          '黑糖司康：1 甜心币。',
          '草莓牛奶：1 甜心币。',
          '（落款：阿栗，1998 年）',
        ],
      },
    ],
  },
];

const ALL_SITES = TOWN_PEOPLE.flatMap((p) => p.sites);

const HISTORY: HistoryItem[] = [
  {
    query: '镇档案室 调阅 需要什么材料',
    resultTitle: '甜点镇档案室 · 调阅须知',
    resultBody: '调阅人须为当事人本人，或持继承证明的直系亲属。卷宗只可在室内查阅，不提供复印。',
  },
  {
    query: '继承证明 母亲去世二十年 怎么开',
    resultTitle: '镇议会公告 · 产权确认材料清单',
    resultBody: '需提供死亡证明、亲属关系证明、原产权凭证。任一材料缺失，申请将被退回。',
  },
  {
    query: '产权申请 被驳回 还能再提交吗',
    resultTitle: '镇议会 · 产权驳回后续说明',
    resultBody: '同一地块的产权申请，驳回后一年内不得重复提交；逾期未确认的产权，视为自动放弃。',
  },
  {
    query: '2006 年 电路验收 记录 存档',
    resultTitle: '无直接结果',
    resultBody: '只有一条论坛旧帖：《2006 年那场火，有人记得吗》。底下零回复。',
    extra: '搜不到，不是因为没有，是因为能搜到的东西已经被处理过了。',
  },
];

type BrowserView = 'home' | 'forum' | 'site' | 'history' | 'council' | 'weather';

const PAGE_TITLES: Record<BrowserView, string> = {
  home: '新标签页',
  forum: '甜点镇小喇叭 · 镇民论坛',
  site: '居民主页',
  history: '甜点镇小喇叭 · 搜索历史',
  council: '甜点镇议会 · 公告栏',
  weather: '甜点镇天气',
};

interface BrowserSnapshot {
  view: BrowserView;
  postId: string | null;
  siteId: string | null;
  query: string;
  searched: boolean;
}

interface BrowserTab extends BrowserSnapshot {
  id: string;
  history: BrowserSnapshot[];
}

export const BrowserApp: React.FC<BrowserAppProps> = ({ chapter, onView }) => {
  const nextTabId = useRef(2);
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      view: 'home',
      postId: null,
      siteId: null,
      query: '',
      searched: false,
      history: [],
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const { view, postId, siteId, query, searched } = activeTab;

  const patchActive = (patch: Partial<BrowserTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, ...patch } : t))
    );
  };

  const navigate = (patch: Partial<BrowserSnapshot>) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTab.id) return t;
        const snapshot: BrowserSnapshot = {
          view: t.view,
          postId: t.postId,
          siteId: t.siteId,
          query: t.query,
          searched: t.searched,
        };
        return {
          ...t,
          ...patch,
          history: [...t.history, snapshot].slice(-30),
        };
      })
    );
  };

  const setQuery = (q: string) => patchActive({ query: q });
  const setSearched = (value: boolean) => patchActive({ searched: value });

  const newTab = () => {
    soundEngine.playOpenWindow();
    const id = `tab-${nextTabId.current++}`;
    setTabs((prev) => [
      ...prev,
      {
        id,
        view: 'home',
        postId: null,
        siteId: null,
        query: '',
        searched: false,
        history: [],
      },
    ]);
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    soundEngine.playClick();
    if (tabs.length === 1) {
      const fresh: BrowserTab = {
        id: `tab-${nextTabId.current++}`,
        view: 'home',
        postId: null,
        siteId: null,
        query: '',
        searched: false,
        history: [],
      };
      setTabs([fresh]);
      setActiveTabId(fresh.id);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (activeTabId === id) {
      const fallback = next[Math.max(0, idx - 1)] ?? next[0];
      setActiveTabId(fallback.id);
    }
  };

  const currentPost = POSTS.find((p) => p.id === postId) ?? null;
  const currentSite = ALL_SITES.find((s) => s.id === siteId) ?? null;

  const address = useMemo(() => {
    if (view === 'site') return currentSite?.url ?? 'paw://newtab';
    if (view === 'forum') return 'paw://xiaolaba.town/bbs';
    if (view === 'history') return 'paw://xiaolaba.town/history';
    if (view === 'council') return 'paw://council.town/notice';
    if (view === 'weather') return 'paw://weather.town';
    return 'paw://newtab';
  }, [view, currentSite]);

  const openSite = (next: BrowserView) => {
    soundEngine.playOpenWindow();
    onView?.(next);
    navigate({
      view: next,
      postId: null,
      siteId: null,
    });
  };

  const openPersonSite = (nextSiteId: string) => {
    soundEngine.playOpenWindow();
    navigate({ view: 'site', siteId: nextSiteId, postId: null });
  };

  const goBack = () => {
    soundEngine.playClick();
    const history = activeTab.history;
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    patchActive({ ...prev, history: history.slice(0, -1) });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ searched: true });
    if (query.trim()) soundEngine.playClick();
  };

  const personMatches = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    if (q.includes('博客')) return TOWN_PEOPLE;
    return TOWN_PEOPLE.filter(
      (p) => q.includes(p.name) || p.name.includes(q) || q.includes(p.role)
    );
  }, [query]);

  const searchHit =
    searched &&
    query.trim().length > 0 &&
    ['小喇叭', '论坛', '老街', '奶泡泡甜品铺', '镇民'].some((k) => query.includes(k));

  const bookmarkClass =
    'flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#FFF8EB] text-[10px] font-bold text-[#3A2D28] whitespace-nowrap';

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* 标签页栏 */}
      <div className="px-2 pt-1.5 bg-[#FDE7F0] border-b-2 border-[#3A2D28] flex items-end gap-1 shrink-0 overflow-x-auto cartoon-scroll">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          const title = tab.postId
            ? POSTS.find((p) => p.id === tab.postId)?.title ?? PAGE_TITLES[tab.view]
            : tab.siteId
              ? ALL_SITES.find((s) => s.id === tab.siteId)?.title ?? PAGE_TITLES[tab.view]
              : PAGE_TITLES[tab.view];
          return (
            <div
              key={tab.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActiveTabId(tab.id);
              }}
              className={`w-[150px] shrink-0 h-7 px-2 rounded-t-lg border-2 border-b-0 border-[#3A2D28] flex items-center gap-1.5 min-w-0 cursor-pointer ${
                isActive ? 'bg-[#FFFDF7]' : 'bg-[#FFFDF7]/55 hover:bg-[#FFFDF7]/80'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB830] border border-[#3A2D28] shrink-0" />
              <span className="text-[10px] font-bold text-[#3A2D28] truncate">{title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label={`关闭 ${title}`}
                className="ml-auto w-4 h-4 rounded hover:bg-[#FFE4E9] flex items-center justify-center shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={newTab}
          aria-label="新建标签页"
          className="w-6 h-6 mb-0.5 rounded-md bg-[#FFFDF7]/70 border-2 border-[#3A2D28] flex items-center justify-center shrink-0"
        >
          <Plus className="w-3 h-3" />
        </button>
        <div className="flex-1" />
      </div>

      {/* 工具栏 */}
      <div className="px-2.5 py-1.5 bg-[#E5E7EB] border-b-2 border-[#3A2D28] flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={goBack}
          disabled={activeTab.history.length === 0}
          aria-label="返回"
          className={`w-6 h-6 rounded-md bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center ${
            activeTab.history.length === 0 ? 'opacity-40' : ''
          }`}
        >
          <ArrowLeft className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => soundEngine.playClick()}
          aria-label="前进"
          className="w-6 h-6 rounded-md bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center opacity-40"
        >
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => soundEngine.playClick()}
          aria-label="刷新"
          className="w-6 h-6 rounded-md bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center"
        >
          <RotateCw className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => openSite('home')}
          aria-label="主页"
          className="w-6 h-6 rounded-md bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center"
        >
          <Home className="w-3 h-3" />
        </button>
        <div className="flex-1 h-6 px-2 rounded-full bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center gap-1.5 min-w-0">
          <Globe className="w-3 h-3 text-[#6E5A52] shrink-0" />
          <span className="text-[10px] font-mono-tabular text-[#6E5A52] truncate">{address}</span>
        </div>
      </div>

      {/* 书签栏 */}
      <div className="px-2 py-1 bg-[#F6EFE2] border-b-2 border-[#3A2D28] flex items-center gap-0.5 overflow-x-auto cartoon-scroll shrink-0">
        <BookmarkMark icon={<Megaphone className="w-3 h-3 text-[#B45309]" />} label="甜点镇小喇叭" onClick={() => openSite('forum')} className={bookmarkClass} />
        {chapter >= 3 ? (
          <BookmarkMark icon={<History className="w-3 h-3 text-[#4338CA]" />} label="搜索历史" onClick={() => openSite('history')} className={bookmarkClass} />
        ) : null}
        <BookmarkMark icon={<Landmark className="w-3 h-3 text-[#0E7490]" />} label="镇议会公告" onClick={() => openSite('council')} className={bookmarkClass} />
        <BookmarkMark icon={<Sun className="w-3 h-3 text-[#D97706]" />} label="甜点镇天气" onClick={() => openSite('weather')} className={bookmarkClass} />
      </div>

      {view === 'home' ? (
        <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll">
          <div className="max-w-xl mx-auto px-5 py-10">
            <div className="text-center mb-6">
              <p className="text-[11px] font-bold text-[#6E5A52] tracking-widest">PawNet</p>
              <h1 className="text-2xl font-black text-[#3A2D28] mt-1">PawNet 浏览器</h1>
              <p className="text-[11px] text-[#8B7A6B] mt-1">搜索甜点镇的公开信息</p>
            </div>

            <form onSubmit={handleSearch} className="relative mb-5">
              <Search className="w-4 h-4 text-[#6E5A52] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearched(false);
                }}
                placeholder="搜索居民的名字或店铺"
                aria-label="浏览器搜索"
                className="w-full h-11 pl-11 pr-20 text-sm rounded-full bg-[#FFFDF7] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] text-[#3A2D28] focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-8 px-3 rounded-full bg-[#FFB830] border-2 border-[#3A2D28] text-[11px] font-black text-[#3A2D28]"
              >
                搜索
              </button>
            </form>

            {searched ? (
              <div className="mb-5 space-y-3">
                {personMatches.map((person) => (
                  <div
                    key={person.id}
                    className="p-3 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[2px_2px_0_#3A2D28]"
                  >
                    <p className="text-[12px] font-black text-[#3A2D28] flex items-center gap-1.5">
                      <span>{person.emoji}</span>
                      <span>{person.name}</span>
                      <span className="text-[10px] font-bold text-[#6E5A52]">
                        · {person.role}
                      </span>
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {person.sites.map((site) => (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => openPersonSite(site.id)}
                          className="w-full text-left p-2 rounded-lg bg-[#FFFDF7] border-2 border-[#E5D8C5] hover:border-[#3A2D28] hover:bg-[#FFF8EB] transition-colors"
                        >
                          <p className="text-[11px] font-black text-[#3A2D28]">{site.title}</p>
                          <p className="text-[10px] text-[#6E5A52] mt-0.5 truncate">
                            {site.url} · {site.summary}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {searchHit ? (
                  <div className="p-3 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[2px_2px_0_#3A2D28]">
                    <p className="text-[10px] font-bold text-[#6E5A52] mb-1">论坛与公告</p>
                    <button type="button" onClick={() => openSite('forum')} className="w-full text-left">
                      <p className="text-[12px] font-black text-[#3A2D28]">甜点镇小喇叭 · 镇民论坛</p>
                      <p className="text-[10px] text-[#6E5A52] mt-0.5">
                        paw://xiaolaba.town/bbs · 老街街坊的帖子
                      </p>
                    </button>
                  </div>
                ) : null}

                {personMatches.length === 0 && !searchHit ? (
                  <p className="text-[11px] font-bold text-[#8B7A6B]">
                    没有找到与「{query}」相关的网站。
                  </p>
                ) : null}
              </div>
            ) : null}

          </div>
        </div>
      ) : view === 'site' ? (
        currentSite ? (
          <PersonSiteView site={currentSite} />
        ) : (
          <p className="p-6 text-xs text-[#6E5A52]">这个页面不存在。</p>
        )
      ) : view === 'council' ? (
        <SimpleSite
          title="甜点镇议会 · 公告栏"
          lines={[
            '关于老街片区产权确认的统一安排',
            '经办人：咕咕（镇长办公室）　日期：2014.8.20',
            '逾期未确认的产权，视为自动放弃。',
            '老街片区改造期间，相关产权变更需待规划确定后统一处理。',
            '',
            '【2026 · 甜品特色街区改造项目已立项】',
            '完整招标文件与迁离名单已归档于镇档案室 2026 号抽屉。',
            '沿街商户请于本月底前联系镇长办公室咕咕对接改造事宜。',
            '',
            '【2026 · 沿街商户统一供应链登记】',
            '请沿街商户于本月底前完成登记复核。逾期未登记的，视为自动放弃改造后铺位。',
            '登记材料：营业执照、产权或租赁证明、现有供货渠道说明。',
            '',
            '【会议通知】',
            '本周五上午十点，镇议会将举行奶泡泡甜品铺失窃案结案发布会。',
            '请相关人员准时出席。发布会稿由镇长办公室统一拟定。',
            '',
            '【历史档案调阅说明】',
            '涉及 2006 年及以前的老街档案，须经镇长办公室审批后调阅。',
            '未经审批的复印件不作为正式材料。',
          ]}
        />
      ) : view === 'weather' ? (
        <SimpleSite
          title="甜点镇天气"
          lines={[
            '今天：晴，14°C，西北风 2 级。',
            '湿度 68%，适合烤蛋挞。',
            '傍晚有薄雾，老街路灯可能不太亮。',
            '明日：多云，15°C。',
          ]}
        />
      ) : view === 'history' ? (
        <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll">
          <div className="px-3 py-2 bg-[#FDE68A] border-b-2 border-[#3A2D28] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-[#92400E]" />
              <span className="text-xs font-black text-[#3A2D28]">甜点镇小喇叭 · 搜索历史</span>
            </div>
            <button
              type="button"
              onClick={() => openSite('forum')}
              className="px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] bg-[#FFFDF7] text-[10px] font-bold text-[#3A2D28]"
            >
              去论坛
            </button>
          </div>
          <div className="max-w-2xl mx-auto p-4 space-y-3">
            <p className="text-[11px] font-bold text-[#6E5A52] leading-relaxed">
              这是这个浏览器里留下的搜索历史。没有删。
            </p>
            {HISTORY.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[2px_2px_0_#3A2D28]"
              >
                <p className="text-[11px] font-black text-[#3A2D28] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#6E5A52]" />
                  <span>搜索记录 {idx + 1}：{item.query}</span>
                </p>
                <p className="text-[11px] font-bold text-[#4A3A32] mt-1.5">{item.resultTitle}</p>
                <p className="text-[11px] text-[#6E5A52] leading-relaxed mt-0.5">
                  {idx === 3 ? (
                    <RichText text={'只有一条论坛旧帖：[[《2006 年那场火，有人记得吗》|clue_browser_history]]。底下零回复。'} />
                  ) : (
                    item.resultBody
                  )}
                </p>
                {item.extra ? (
                  <p className="text-[10px] font-bold text-[#DC2626] mt-1">{item.extra}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="px-3 py-2 bg-[#FDE68A] border-b-2 border-[#3A2D28] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Megaphone className="w-4 h-4 text-[#92400E] shrink-0" />
              <span className="text-xs font-black text-[#3A2D28] truncate">
                甜点镇小喇叭 · 镇民论坛
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openSite('forum')}
                className="px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] text-[10px] font-bold bg-[#FFFDF7]"
              >
                论坛
              </button>
              <button
                type="button"
                onClick={() => {
                  if (chapter >= 3) openSite('history');
                }}
                className={`px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] text-[10px] font-bold ${
                  chapter >= 3 ? 'bg-[#FEF3C7]' : 'bg-[#FEF3C7] opacity-40'
                }`}
              >
                搜索历史
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-4 overflow-y-auto cartoon-scroll">
            {currentPost ? (
              <div className="max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    navigate({ postId: null });
                    soundEngine.playClick();
                  }}
                  className="mb-3 flex items-center gap-1 text-[11px] font-bold text-[#6E5A52] hover:text-[#3A2D28]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回论坛首页</span>
                </button>

                <article className="p-4 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28]">
                  <h2 className="text-base font-black text-[#3A2D28] mb-1 leading-snug">
                    {currentPost.title}
                  </h2>
                  <p className="text-[10px] font-bold text-[#6E5A52] mb-3">{currentPost.author}</p>
                  <div className="space-y-2">
                    {currentPost.paragraphs.map((p, i) => (
                      <p key={i} className="text-[11px] text-[#4A3A32] leading-6 text-justify">
                        <RichText text={p} />
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t-2 border-dashed border-[#D8CBB8] space-y-2">
                    {currentPost.replies.map((r, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#FFFDF7] border border-[#E5D8C5]">
                        <p className="text-[10px] font-black text-[#6E5A52] mb-0.5">{r.author}</p>
                        <p className="text-[11px] text-[#4A3A32] leading-5">
                          <RichText text={r.text} />
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <p className="text-[11px] font-bold text-[#6E5A52] mb-3">论坛首页 · 点标题看帖子</p>
                <div className="divide-y-2 divide-[#E5D8C5] rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] overflow-hidden">
                  {POSTS.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playOpenWindow();
                        navigate({ postId: post.id });
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#FFF8EB] flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-[#3A2D28] truncate">
                          《{post.title}》
                        </p>
                        <p className="text-[10px] text-[#6E5A52] mt-0.5">{post.author}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#6E5A52] flex items-center gap-0.5 shrink-0 mt-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.replies.length}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#8B7A6B] mt-3 leading-relaxed">
                  这只是镇民自己发帖的地方。帖子里的说法不一定可靠，但有时比档案更接近当天的情况。
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const BookmarkMark: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
}> = ({ icon, label, onClick, className }) => (
  <button type="button" onClick={onClick} className={className}>
    {icon}
    <span>{label}</span>
  </button>
);

const PersonSiteView: React.FC<{ site: PersonSite }> = ({ site }) => (
  <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll">
    <div className="px-3 py-2 bg-[#FDE68A] border-b-2 border-[#3A2D28] flex items-center gap-1.5">
      <BookOpen className="w-4 h-4 text-[#6B21A8]" />
      <span className="text-xs font-black text-[#3A2D28] truncate">{site.title}</span>
      <span className="ml-auto text-[10px] font-mono-tabular font-bold text-[#8B7A6B] truncate">
        {site.url}
      </span>
    </div>
    <div className="max-w-2xl mx-auto p-4">
      <p className="text-[11px] font-bold text-[#6E5A52] leading-relaxed mb-3">{site.summary}</p>
      <article className="p-4 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] space-y-2.5">
        {site.paragraphs.map((p, i) => (
          <p key={i} className="text-[11px] text-[#4A3A32] leading-6 text-justify">
            <RichText text={p} />
          </p>
        ))}
      </article>
      <p className="mt-3 text-[10px] text-[#8B7A6B] leading-relaxed">
        这只是居民自己的页面。说法不一定可靠，但日常记录有时比档案更接近当天。
      </p>
    </div>
  </div>
);

const SimpleSite: React.FC<{ title: string; lines: string[] }> = ({ title, lines }) => (
  <div className="flex-1 min-h-0 overflow-y-auto cartoon-scroll">
    <div className="px-3 py-2 bg-[#E0F2FE] border-b-2 border-[#3A2D28] flex items-center gap-1.5">
      <Landmark className="w-4 h-4 text-[#0E7490]" />
      <span className="text-xs font-black text-[#3A2D28]">{title}</span>
    </div>
    <div className="max-w-2xl mx-auto p-4">
      <div className="p-4 rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] space-y-2">
        {lines.map((line, idx) => (
          <p key={idx} className={idx === 0 ? 'text-sm font-black text-[#3A2D28]' : 'text-[11px] text-[#4A3A32] leading-6'}>
            {line}
          </p>
        ))}
      </div>
    </div>
  </div>
);
