import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FolderPlus,
  FilePlus2,
  Grid2x2,
  List,
  Search,
  RotateCcw,
  Trash2,
  Lock,
  FolderOpen,
  Pencil,
} from 'lucide-react';
import {
  getBreadcrumb,
  getChildren,
  searchNodes,
} from '../../os/filesystem';
import { ROOT_IDS } from '../../os/seedData';
import { FSNode } from '../../os/types';
import { FileNodeIcon, TrashIcon } from '../CartoonIcons';

interface FileExplorerAppProps {
  nodes: FSNode[];
  initialFolderId?: string;
  onOpenNode: (node: FSNode) => void;
  onCreateFolder: (parentId: string, name: string) => void;
  onCreateFile: (parentId: string, name: string, content: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onMoveToTrash: (nodeId: string) => void;
  /** 还原回收站文件：会触发煤球小游戏，成功后才真正还原 */
  onRequestRestore: (nodeId: string) => void;
  onPermanentDelete: (nodeId: string) => void;
  onUnlockNode: (nodeId: string, passcode: string) => boolean;
}

const SIDEBAR_LOCATIONS = [
  { id: ROOT_IDS.COMPUTER, label: '我的电脑' },
  { id: ROOT_IDS.DESKTOP, label: '桌面' },
  { id: ROOT_IDS.DOCUMENTS, label: '文档' },
  { id: ROOT_IDS.PICTURES, label: '图片' },
  { id: ROOT_IDS.DOWNLOADS, label: '下载' },
  { id: ROOT_IDS.TRASH, label: '回收站' },
];

export const FileExplorerApp: React.FC<FileExplorerAppProps> = ({
  nodes,
  initialFolderId = ROOT_IDS.DOCUMENTS,
  onOpenNode,
  onCreateFolder,
  onCreateFile,
  onRenameNode,
  onMoveToTrash,
  onRequestRestore,
  onPermanentDelete,
  onUnlockNode,
}) => {
  const [history, setHistory] = useState<string[]>([initialFolderId]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Inline modal states
  const [createMode, setCreateMode] = useState<'folder' | 'file' | 'rename' | null>(null);
  const [inputName, setInputName] = useState('');
  const [lockTarget, setLockTarget] = useState<FSNode | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const currentFolderId = history[historyIndex];
  const isSearching = searchQuery.trim().length > 0;
  const isTrashView = !isSearching && currentFolderId === ROOT_IDS.TRASH;

  const displayedNodes = useMemo(() => {
    if (isSearching) return searchNodes(nodes, searchQuery);
    return getChildren(nodes, currentFolderId);
  }, [nodes, currentFolderId, isSearching, searchQuery]);

  const breadcrumb = useMemo(
    () => getBreadcrumb(nodes, currentFolderId),
    [nodes, currentFolderId]
  );

  const selectedNode = useMemo(
    () => displayedNodes.find((n) => n.id === selectedId) ?? null,
    [displayedNodes, selectedId]
  );

  const navigateTo = (folderId: string) => {
    setSearchQuery('');
    setSelectedId(null);
    if (folderId === currentFolderId) return;
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(folderId);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
    }
  };

  const handleUp = () => {
    const current = nodes.find((n) => n.id === currentFolderId);
    if (current?.parentId) navigateTo(current.parentId);
  };

  const handleActivateNode = (node: FSNode) => {
    if (node.type === 'folder') {
      navigateTo(node.id);
      return;
    }
    if (node.inTrash) {
      // 回收站里的文件需要先还原才能看
      onRequestRestore(node.id);
      return;
    }
    if (node.locked) {
      setLockTarget(node);
      setPasscodeInput('');
      setPasscodeError('');
      return;
    }
    onOpenNode(node);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;
    if (createMode === 'folder') {
      onCreateFolder(currentFolderId, trimmed);
    } else if (createMode === 'file') {
      onCreateFile(currentFolderId, trimmed, '侦探调查笔记：\n');
    } else if (createMode === 'rename' && selectedNode) {
      onRenameNode(selectedNode.id, trimmed);
    }
    setCreateMode(null);
    setInputName('');
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockTarget) return;
    const ok = onUnlockNode(lockTarget.id, passcodeInput);
    if (ok) {
      const unlockedCopy = { ...lockTarget, locked: false };
      setLockTarget(null);
      setPasscodeInput('');
      setPasscodeError('');
      onOpenNode(unlockedCopy);
    } else {
      setPasscodeError('密码错误！再检查照片或工作日志里的数字线索吧。');
    }
  };

  const isSystemFolder = (id: string) =>
    (Object.values(ROOT_IDS) as string[]).includes(id);

  const selectedNodeOriginalFolder = nodes.find(
    (n) => n.id === selectedNode?.originalParentId
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* Navigation & Search Toolbar */}
      <div className="p-2.5 bg-[#F6EFE2] border-b-2 border-[#3A2D28] flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIndex === 0}
            aria-label="后退"
            className="w-8 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center disabled:opacity-40 hover:bg-[#FEF3C7]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            aria-label="前进"
            className="w-8 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center disabled:opacity-40 hover:bg-[#FEF3C7]"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleUp}
            disabled={currentFolderId === ROOT_IDS.COMPUTER}
            aria-label="返回上一级"
            className="w-8 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center disabled:opacity-40 hover:bg-[#FEF3C7]"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Breadcrumb Bar */}
        <div
          aria-label="当前路径"
          className="flex-1 min-w-[180px] h-8 px-3 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center gap-1.5 text-xs font-bold text-[#3A2D28] overflow-x-auto cartoon-scroll"
        >
          {isSearching ? (
            <span className="whitespace-nowrap">搜索结果：{searchQuery}</span>
          ) : (
            breadcrumb.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 ? <span className="text-[#6E5A52]">/</span> : null}
                <button
                  type="button"
                  onClick={() => navigateTo(crumb.id)}
                  className="hover:underline whitespace-nowrap shrink-0"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))
          )}
        </div>

        {/* Search Box */}
        <div className="relative w-44 sm:w-52 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#6E5A52] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文件名或内容"
            aria-label="搜索文件"
            className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] text-[#3A2D28] focus:outline-none"
          />
        </div>
      </div>

      {/* Action Ribbon */}
      <div className="px-3 py-2 bg-[#FFF8EB] border-b-2 border-[#E5D8C5] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {!isTrashView && !isSearching && currentFolderId !== ROOT_IDS.COMPUTER ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setCreateMode('folder');
                  setInputName('线索整理夹');
                }}
                className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>新建文件夹</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateMode('file');
                  setInputName('新调查笔记');
                }}
                className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>新建笔记</span>
              </button>
            </>
          ) : null}

          {selectedNode ? (
            <>
              <button
                type="button"
                onClick={() => handleActivateNode(selectedNode)}
                className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFE29A] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>打开</span>
              </button>

              {selectedNode.inTrash ? (
                <button
                  type="button"
                  onClick={() => onRequestRestore(selectedNode.id)}
                  className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#A7F3D0] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>还原</span>
                </button>
              ) : null}

              {!isSystemFolder(selectedNode.id) ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMode('rename');
                      setInputName(selectedNode.name);
                    }}
                    className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>重命名</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedNode.inTrash) {
                        onPermanentDelete(selectedNode.id);
                      } else {
                        onMoveToTrash(selectedNode.id);
                      }
                      setSelectedId(null);
                    }}
                    className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFE4E9] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{selectedNode.inTrash ? '彻底删除' : '移入回收站'}</span>
                  </button>
                </>
              ) : null}
            </>
          ) : null}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#F6EFE2] p-0.5 rounded-lg border-2 border-[#3A2D28]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="图标视图"
            className={`p-1 rounded ${
              viewMode === 'grid' ? 'bg-[#FFE29A]' : 'hover:bg-[#FFFDF7]'
            }`}
          >
            <Grid2x2 className="w-4 h-4 text-[#3A2D28]" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="列表视图"
            className={`p-1 rounded ${
              viewMode === 'list' ? 'bg-[#FFE29A]' : 'hover:bg-[#FFFDF7]'
            }`}
          >
            <List className="w-4 h-4 text-[#3A2D28]" />
          </button>
        </div>
      </div>

      {/* Inline Create / Rename Form */}
      {createMode ? (
        <form
          onSubmit={handleCreateSubmit}
          className="px-3 py-2 bg-[#FEF3C7] border-b-2 border-[#3A2D28] flex items-center gap-2"
        >
          <label
            htmlFor="fs-inline-input"
            className="text-xs font-bold text-[#3A2D28] whitespace-nowrap"
          >
            {createMode === 'folder'
              ? '文件夹名称：'
              : createMode === 'file'
                ? '笔记文件名：'
                : '新名称：'}
          </label>
          <input
            id="fs-inline-input"
            type="text"
            autoFocus
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="flex-1 max-w-xs px-2.5 py-1 text-xs rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] focus:outline-none"
          />
          <button
            type="submit"
            className="cartoon-btn px-3 py-1 rounded-lg bg-[#A7F3D0] text-xs font-bold text-[#3A2D28] whitespace-nowrap"
          >
            确定
          </button>
          <button
            type="button"
            onClick={() => setCreateMode(null)}
            className="cartoon-btn px-3 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] whitespace-nowrap"
          >
            取消
          </button>
        </form>
      ) : null}

      {/* Main Split: Sidebar + File Canvas */}
      <div className="flex-1 min-h-0 flex">
        {/* Sidebar */}
        <aside
          aria-label="快速访问"
          className="w-36 sm:w-44 shrink-0 bg-[#F6EFE2] border-r-2 border-[#3A2D28] p-2 space-y-1 overflow-y-auto cartoon-scroll"
        >
          <p className="px-2 py-1 text-[11px] font-bold text-[#6E5A52]">快速访问</p>
          {SIDEBAR_LOCATIONS.map((loc) => {
            const active = !isSearching && currentFolderId === loc.id;
            const locNode = nodes.find((n) => n.id === loc.id);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => navigateTo(loc.id)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-left transition-colors border-2 ${
                  active
                    ? 'bg-[#FFE29A] border-[#3A2D28] text-[#3A2D28]'
                    : 'border-transparent text-[#3A2D28] hover:bg-[#FFFDF7]'
                }`}
              >
                {loc.id === ROOT_IDS.TRASH ? (
                  <TrashIcon className="w-5 h-5 shrink-0" />
                ) : locNode ? (
                  <FileNodeIcon node={locNode} className="w-5 h-5 shrink-0" />
                ) : null}
                <span className="truncate">{loc.label}</span>
              </button>
            );
          })}
        </aside>

        {/* File Items Area */}
        <div className="flex-1 min-h-0 p-3 overflow-y-auto cartoon-scroll relative">
          {isTrashView ? (
            <div className="mb-3 px-3 py-2 rounded-xl bg-[#FFE4E9] border-2 border-[#3A2D28] flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#3A2D28]">
                回收站中共有 {displayedNodes.length} 个被删除的文件。
                <span className="text-[#DC2626]">选中文件后需还原才能查看。</span>
              </p>
            </div>
          ) : null}

          {displayedNodes.length === 0 ? (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-[#6E5A52]">
              <p className="text-sm font-bold text-[#3A2D28] mb-1">
                {isSearching ? '没有找到符合条件的文件' : '这个文件夹目前是空的'}
              </p>
              <p className="text-xs">
                {isSearching
                  ? '换个关键词试试看吧'
                  : '点击上方按钮新建文件夹或探案笔记'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedNodes.map((node) => {
                const isSelected = node.id === selectedId;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    onDoubleClick={() => handleActivateNode(node)}
                    aria-label={`${node.name}${node.locked ? ' (已加密)' : ''}`}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#FFE29A] border-[#3A2D28] shadow-[3px_3px_0px_#3A2D28]'
                        : 'bg-[#FFFDF7] border-[#E5D8C5] hover:border-[#3A2D28] hover:bg-[#FFF8EB]'
                    }`}
                  >
                    <div className="relative">
                      <FileNodeIcon node={node} className="w-12 h-12" />
                      {node.locked ? (
                        <Lock className="w-4 h-4 text-[#DC2626] absolute -top-1 -right-1 bg-[#FFFDF7] rounded-full p-0.5 border border-[#3A2D28]" />
                      ) : null}
                    </div>
                    <span className="text-xs font-bold text-[#3A2D28] break-all line-clamp-2">
                      {node.name}
                    </span>
                    <span className="text-[11px] text-[#6E5A52] font-mono-tabular">
                      {node.type === 'folder' ? '文件夹' : node.sizeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-[#3A2D28] text-[#6E5A52]">
                  <th className="py-2 px-2 font-bold">名称</th>
                  <th className="py-2 px-2 font-bold">修改时间</th>
                  <th className="py-2 px-2 font-bold text-right">大小</th>
                </tr>
              </thead>
              <tbody>
                {displayedNodes.map((node) => {
                  const isSelected = node.id === selectedId;
                  return (
                    <tr
                      key={node.id}
                      onClick={() => setSelectedId(node.id)}
                      onDoubleClick={() => handleActivateNode(node)}
                      className={`cursor-pointer border-b border-[#E5D8C5] ${
                        isSelected ? 'bg-[#FFE29A]' : 'hover:bg-[#FFF8EB]'
                      }`}
                    >
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(node.id)}
                          onDoubleClick={() => handleActivateNode(node)}
                          className="flex items-center gap-2 font-bold text-[#3A2D28] text-left"
                        >
                          <FileNodeIcon node={node} className="w-5 h-5 shrink-0" />
                          <span>{node.name}</span>
                          {node.locked ? (
                            <Lock className="w-3.5 h-3.5 text-[#DC2626]" />
                          ) : null}
                        </button>
                      </td>
                      <td className="py-2 px-2 text-[#6E5A52] font-mono-tabular">
                        {node.modifiedAt}
                      </td>
                      <td className="py-2 px-2 text-right text-[#6E5A52] font-mono-tabular">
                        {node.sizeLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Status Strip */}
      <div className="px-3 py-1.5 bg-[#F6EFE2] border-t-2 border-[#3A2D28] flex items-center justify-between text-xs text-[#6E5A52]">
        <span className="tabular-nums">{displayedNodes.length} 个项目</span>
        <span>提示：双击项目可打开 · 选中后可使用上方工具按钮</span>
      </div>

      {/* Passcode Unlock Modal */}
      {lockTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`解锁 ${lockTarget.name}`}
          className="absolute inset-0 z-30 bg-[#3A2D28]/40 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleUnlockSubmit}
            className="w-full max-w-sm rounded-2xl bg-[#FFFDF7] border-[2.5px] border-[#3A2D28] shadow-[6px_6px_0px_#3A2D28] p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-[#D97706]" />
              <h3 className="text-base font-black text-[#3A2D28]">需要访问密码</h3>
            </div>
            <p className="text-xs text-[#6E5A52] mb-3 leading-relaxed">
              文件「{lockTarget.name}」已加密。{lockTarget.passcodeHint}
            </p>
            <label htmlFor="unlock-passcode" className="sr-only">
              输入4位数字密码
            </label>
            <input
              id="unlock-passcode"
              type="text"
              autoFocus
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value);
                setPasscodeError('');
              }}
              placeholder="输入 4 位数字密码"
              className="w-full px-3 py-2 text-sm rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] font-mono-tabular text-[#3A2D28] focus:outline-none focus:bg-white mb-2"
            />
            {passcodeError ? (
              <p className="text-xs font-bold text-[#DC2626] mb-2">{passcodeError}</p>
            ) : null}
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setLockTarget(null)}
                className="cartoon-btn px-3.5 py-1.5 rounded-xl bg-[#FFFDF7] text-xs font-bold text-[#3A2D28]"
              >
                取消
              </button>
              <button
                type="submit"
                className="cartoon-btn px-3.5 py-1.5 rounded-xl bg-[#FFB830] text-xs font-bold text-[#3A2D28]"
              >
                验证解锁
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
