import React, { useState } from 'react';
import { Lock, RotateCcw, Search } from 'lucide-react';
import { AVATAR_SHIBA_URL, ROOT_IDS } from '../os/seedData';
import { SaveSlots } from '../os/saveGame';
import { AppId } from '../os/types';
import { AppIcon, TrashIcon } from './CartoonIcons';

interface StartMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenApp: (appId: AppId, options?: { folderId?: string }) => void;
  onLockScreen: () => void;
  onResetCase: () => void;
  saveSlots: SaveSlots;
  onSaveSlot: (index: number) => void;
  onLoadSlot: (index: number) => void;
  onDeleteSlot: (index: number) => void;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const APP_LIST: { appId: AppId; name: string; desc: string }[] = [
  { appId: 'explorer', name: '文件管理器', desc: '浏览文档、图片与下载' },
  { appId: 'mail', name: '喵喵信箱', desc: '查看往来邮件与通知' },
  { appId: 'chat', name: '汪汪聊天', desc: '问询店员与证人' },
  { appId: 'photos', name: '图画看图', desc: '放大检查照片与对比现场' },
  { appId: 'browser', name: 'PawNet 浏览器', desc: '小喇叭论坛与搜索' },
  { appId: 'timeline', name: '时间线白板', desc: '把证词摆到时间轴上' },
  { appId: 'filing', name: '旧东西', desc: '波比的旧文件与归类' },
  { appId: 'radio', name: '甜点镇广播', desc: '收听从前的录音与公告' },
  { appId: 'relations', name: '人物关系板', desc: '拉线理清谁在替谁办事' },
  { appId: 'archive', name: '镇档案室', desc: '凭调阅编号翻旧报纸' },
  { appId: 'pet', name: '店猫煤球小屋', desc: '投喂小鱼干，听它说两句' },
  { appId: 'notepad', name: '记事本', desc: '阅读与记录探案笔记' },
  { appId: 'music', name: '甜点八音盒', desc: '按顺序播放解锁隐藏曲目' },
  { appId: 'clueboard', name: '破案手账', desc: '线索拼合、章节结论与终局' },
  { appId: 'achievements', name: '成就徽章', desc: '查看已解锁的成就' },
];

export const StartMenu: React.FC<StartMenuProps> = ({
  open,
  onClose,
  onOpenApp,
  onLockScreen,
  onResetCase,
  saveSlots,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
}) => {
  const [filter, setFilter] = useState('');

  if (!open) return null;

  const filteredApps = APP_LIST.filter(
    (app) =>
      app.name.includes(filter.trim()) ||
      app.desc.includes(filter.trim()) ||
      filter.trim() === ''
  );

  return (
    <nav
      aria-label="开始菜单"
      className="fixed bottom-16 left-3 z-[850] w-[340px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] rounded-2xl bg-[#FFFDF7] border-[2.5px] border-[#3A2D28] shadow-[6px_6px_0px_#3A2D28] overflow-y-auto cartoon-scroll"
    >
      {/* Top User Strip */}
      <div className="p-3.5 bg-[#FFE29A] border-b-[2.5px] border-[#3A2D28] flex items-center gap-3">
        <div className="w-11 h-11 rounded-full border-2 border-[#3A2D28] overflow-hidden bg-[#FFFDF7] shrink-0">
          <img
            src={AVATAR_SHIBA_URL}
            alt="小橘探长"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-[#3A2D28] truncate">小橘探长</p>
          <p className="text-xs text-[#6E5A52] truncate">甜点镇特别调查账户</p>
        </div>
      </div>

      {/* App Search */}
      <div className="p-3 border-b-2 border-[#E5D8C5] bg-[#F6EFE2]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#6E5A52] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索软件或工具..."
            aria-label="搜索软件"
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl bg-[#FFFDF7] border-2 border-[#3A2D28] text-[#3A2D28] focus:outline-none"
          />
        </div>
      </div>

      {/* App Launcher List */}
      <div className="p-2.5 max-h-72 overflow-y-auto cartoon-scroll space-y-1">
        {filteredApps.map((app) => (
          <button
            key={app.appId}
            type="button"
            onClick={() => {
              onOpenApp(app.appId);
              onClose();
            }}
            className="w-full px-3 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-[#FEF3C7] border-2 border-transparent hover:border-[#3A2D28] transition-colors"
          >
            <AppIcon appId={app.appId} className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#3A2D28] truncate">{app.name}</p>
              <p className="text-xs text-[#6E5A52] truncate">{app.desc}</p>
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            onOpenApp('explorer', { folderId: ROOT_IDS.TRASH });
            onClose();
          }}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-[#FEF3C7] border-2 border-transparent hover:border-[#3A2D28] transition-colors"
        >
          <TrashIcon className="w-9 h-9 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#3A2D28] truncate">回收站</p>
            <p className="text-xs text-[#6E5A52] truncate">检查或还原被删掉的文件</p>
          </div>
        </button>

        {filteredApps.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#6E5A52]">没有找到匹配的软件</p>
        ) : null}
      </div>

      {/* 存档 */}
      <div className="p-2.5 bg-[#F6EFE2] border-t-2 border-[#3A2D28]">
        <p className="text-[10px] font-black text-[#6E5A52] mb-1.5">存档</p>
        <div className="space-y-1.5">
          {saveSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28]/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-[#3A2D28]">存档 {index + 1}</p>
                <p className="text-[9px] font-bold text-[#8B7A6B] truncate">
                  {slot
                    ? `第 ${slot.caseState.chapter} 章 · ${slot.discoveredClues.length} 条线索 · ${formatSavedAt(slot.savedAt)}`
                    : '空存档'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSaveSlot(index)}
                className="cartoon-btn shrink-0 px-1.5 py-0.5 rounded-md bg-[#FFE29A] text-[9px] font-black text-[#3A2D28]"
              >
                保存
              </button>
              {slot ? (
                <button
                  type="button"
                  onClick={() => onLoadSlot(index)}
                  className="cartoon-btn shrink-0 px-1.5 py-0.5 rounded-md bg-[#A7F3D0] text-[9px] font-black text-[#3A2D28]"
                >
                  读取
                </button>
              ) : null}
              {slot ? (
                <button
                  type="button"
                  onClick={() => onDeleteSlot(index)}
                  className="cartoon-btn shrink-0 px-1.5 py-0.5 rounded-md bg-[#FFE4E9] text-[9px] font-black text-[#3A2D28]"
                >
                  删除
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Power & Reset Actions */}
      <div className="p-2.5 bg-[#F6EFE2] border-t-2 border-[#3A2D28] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            onLockScreen();
          }}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1.5 whitespace-nowrap"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>锁定屏幕</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onResetCase();
          }}
          className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFE4E9] text-xs font-bold text-[#3A2D28] flex items-center gap-1.5 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置案件</span>
        </button>
      </div>
    </nav>
  );
};
