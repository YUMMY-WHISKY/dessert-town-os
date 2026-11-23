import React, { useEffect, useState } from 'react';
import { Save, FilePlus2, Check, Pencil } from 'lucide-react';
import { FSNode } from '../../os/types';
import { RichText } from '../RichText';

interface NotepadAppProps {
  nodes: FSNode[];
  activeFileId?: string;
  onSelectFile: (fileId: string) => void;
  onSaveFile: (fileId: string, content: string) => void;
  onCreateNewNote: (name: string, content: string) => FSNode;
  onFlag: (flag: string) => void;
}

export const NotepadApp: React.FC<NotepadAppProps> = ({
  nodes,
  activeFileId,
  onSelectFile,
  onSaveFile,
  onCreateNewNote,
  onFlag,
}) => {
  const readableFiles = nodes.filter((n) => n.type === 'text' && !n.locked);
  const currentFile =
    readableFiles.find((f) => f.id === activeFileId) ?? readableFiles[0] ?? null;

  const [draft, setDraft] = useState(currentFile?.content ?? '');
  const [editing, setEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(currentFile?.content ?? '');
    setEditing(false);
    setSavedNotice(false);
    if (currentFile?.id === 'file_investigation_note') {
      onFlag('read_investigation_note');
    }
  }, [currentFile?.id, currentFile?.content, onFlag]);

  const handleSave = () => {
    if (!currentFile) return;
    onSaveFile(currentFile.id, draft);
    setEditing(false);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleNew = () => {
    const created = onCreateNewNote(`探案备忘_${readableFiles.length + 1}.txt`, '');
    onSelectFile(created.id);
    setEditing(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* Toolbar */}
      <div className="px-3 py-2 bg-[#F6EFE2] border-b-2 border-[#3A2D28] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <label htmlFor="notepad-file-select" className="text-xs font-bold text-[#6E5A52] shrink-0">
            打开文档：
          </label>
          <select
            id="notepad-file-select"
            value={currentFile?.id ?? ''}
            onChange={(e) => onSelectFile(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] text-[#3A2D28] max-w-[210px]"
          >
            {readableFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleNew}
            className="cartoon-btn px-3 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>新建</span>
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={!currentFile}
            className="cartoon-btn px-3 py-1 rounded-lg bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{editing ? '阅读' : '编辑'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!currentFile || !editing}
            className="cartoon-btn px-3 py-1 rounded-lg bg-[#A7F3D0] text-xs font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedNotice ? '已保存' : '保存'}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 p-3 flex flex-col">
        {editing ? (
          <>
            <label htmlFor="notepad-editor" className="sr-only">
              文本编辑区
            </label>
            <textarea
              id="notepad-editor"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="在这里记录你的探案推理笔记..."
              className="flex-1 w-full resize-none rounded-xl bg-[#FFFDF7] border-2 border-[#E5D8C5] focus:border-[#3A2D28] p-4 text-sm leading-7 text-[#3A2D28] focus:outline-none cartoon-scroll"
            />
          </>
        ) : (
          <div className="flex-1 w-full overflow-y-auto cartoon-scroll rounded-xl bg-[#FFFDF7] border-2 border-[#E5D8C5] p-4 text-sm leading-7 text-[#3A2D28] whitespace-pre-line">
            {currentFile ? (
              <RichText text={draft} />
            ) : (
              <span className="text-[#6E5A52]">无文档</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-[#F6EFE2] border-t-2 border-[#3A2D28] flex items-center justify-between text-xs text-[#6E5A52]">
        <span className="truncate">{currentFile ? currentFile.name : '无文档'}</span>
        <span className="shrink-0">{draft.length} 字</span>
      </div>
    </div>
  );
};
