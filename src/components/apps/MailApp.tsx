import React, { useEffect, useMemo, useState } from 'react';
import { Download, Inbox, Send, Star, Search, UserRound } from 'lucide-react';
import { EmailItem } from '../../os/types';
import { RichText } from '../RichText';
import { soundEngine } from '../../os/sound';
import { BLAKE_ACCOUNT, POPPY_ACCOUNT } from '../../os/seedData';
import { AccountLoginModal } from '../AccountLoginModal';

interface MailAppProps {
  emails: EmailItem[];
  onMarkRead: (emailId: string) => void;
  onToggleStar: (emailId: string) => void;
  onFlag: (flag: string) => void;
  onDownloadAttachment?: (fileId: string) => void;
}

export const MailApp: React.FC<MailAppProps> = ({
  emails,
  onMarkRead,
  onToggleStar,
  onFlag,
  onDownloadAttachment,
}) => {
  const [folder, setFolder] = useState<'inbox' | 'starred' | 'sent'>('inbox');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [account, setAccount] = useState<'detective' | 'poppy' | 'black'>('detective');
  const [loginOpen, setLoginOpen] = useState(false);

  const scopedEmails = useMemo(
    () => emails.filter((mail) => (mail.account ?? 'detective') === account),
    [emails, account]
  );

  useEffect(() => {
    if (!scopedEmails.some((mail) => mail.id === selectedId)) {
      setSelectedId(scopedEmails[0]?.id ?? '');
    }
  }, [scopedEmails, selectedId]);

  const filteredEmails = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedEmails.filter((mail) => {
      if (folder === 'inbox' && mail.folder !== 'inbox') return false;
      if (folder === 'sent' && mail.folder !== 'sent') return false;
      if (folder === 'starred' && !mail.starred) return false;
      if (!q) return true;
      return (
        mail.subject.toLowerCase().includes(q) ||
        mail.from.toLowerCase().includes(q) ||
        mail.body.toLowerCase().includes(q)
      );
    });
  }, [scopedEmails, folder, query]);

  const currentEmail =
    filteredEmails.find((m) => m.id === selectedId) ?? filteredEmails[0] ?? null;

  const handleSelectEmail = (mail: EmailItem) => {
    soundEngine.playPaper();
    setSelectedId(mail.id);
    onMarkRead(mail.id);
    if (mail.flagOnRead) onFlag(mail.flagOnRead);
  };

  const accountLabel =
    account === 'poppy'
      ? `喵喵信箱 · 波比的账号`
      : account === 'black'
        ? `喵喵信箱 · 布莱克的账号`
        : '喵喵信箱 · 小橘探长';

  // 登录别人的账号需要账号和密码；已在别人账户里时点击则退回探长账户
  const switchAccount = () => {
    if (account === 'detective') {
      setLoginOpen(true);
    } else {
      setAccount('detective');
    }
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* Top Filter & Search Bar */}
      <div className="px-3 py-2 bg-[#F6EFE2] border-b-2 border-[#3A2D28] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFolder('inbox')}
            className={`px-3 py-1 rounded-lg border-2 border-[#3A2D28] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              folder === 'inbox' ? 'bg-[#FFE4E9]' : 'bg-[#FFFDF7] hover:bg-[#FFF8EB]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>收件箱</span>
          </button>
          <button
            type="button"
            onClick={() => setFolder('starred')}
            className={`px-3 py-1 rounded-lg border-2 border-[#3A2D28] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              folder === 'starred' ? 'bg-[#FFE4E9]' : 'bg-[#FFFDF7] hover:bg-[#FFF8EB]'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>星标邮件</span>
          </button>
          <button
            type="button"
            onClick={() => setFolder('sent')}
            className={`px-3 py-1 rounded-lg border-2 border-[#3A2D28] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              folder === 'sent' ? 'bg-[#FFE4E9]' : 'bg-[#FFFDF7] hover:bg-[#FFF8EB]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>已发送</span>
          </button>
        </div>

        <div className="relative w-44">
          <Search className="w-3.5 h-3.5 text-[#6E5A52] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索发件人或主题"
            aria-label="搜索邮件"
            className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#6E5A52] hidden sm:inline">{accountLabel}</span>
          <button
            type="button"
            onClick={switchAccount}
            className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-[11px] font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
          >
            <UserRound className="w-3.5 h-3.5" />
            <span>{account === 'detective' ? '切换账户' : '退出账户'}</span>
          </button>
        </div>
      </div>

      {account === 'poppy' ? (
        <div className="px-3 py-1.5 bg-[#FEF3C7] border-b-2 border-[#E5D8C5] text-[10px] font-bold text-[#6E5A52]">
          当前账号：{POPPY_ACCOUNT.email} · 波比留下的邮件都在这里
        </div>
      ) : account === 'black' ? (
        <div className="px-3 py-1.5 bg-[#E0F2FE] border-b-2 border-[#E5D8C5] text-[10px] font-bold text-[#6E5A52]">
          当前账号：{BLAKE_ACCOUNT.email} · 银行与业务往来邮件
        </div>
      ) : null}

      {/* Split Pane: Email List & Reading Pane */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
        <div className="w-full sm:w-64 shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-[#3A2D28] overflow-y-auto cartoon-scroll divide-y-2 divide-[#E5D8C5]">
          {filteredEmails.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#6E5A52]">此分类下暂无邮件</p>
          ) : (
            filteredEmails.map((mail) => {
              const selected = currentEmail?.id === mail.id;
              return (
                <button
                  key={mail.id}
                  type="button"
                  onClick={() => handleSelectEmail(mail)}
                  className={`w-full p-3 text-left transition-colors ${
                    selected ? 'bg-[#FFE4E9]' : 'bg-[#FFFDF7] hover:bg-[#FFF8EB]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-black text-[#3A2D28] truncate">
                      {!mail.read ? '【未读】' : ''}
                      {mail.from}
                    </span>
                    <span className="text-[11px] text-[#6E5A52] font-mono-tabular shrink-0">
                      {mail.timestamp}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#3A2D28] truncate mb-0.5">
                    {mail.subject}
                  </p>
                  <p className="text-[11px] text-[#6E5A52] truncate">{mail.fromRole}</p>
                </button>
              );
            })
          )}
        </div>

        <div className="flex-1 min-w-0 p-5 overflow-y-auto cartoon-scroll">
          {currentEmail ? (
            <div>
              <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b-2 border-[#E5D8C5]">
                <div>
                  <h3 className="text-base font-black text-[#3A2D28] mb-1">
                    {currentEmail.subject}
                  </h3>
                  <p className="text-xs text-[#6E5A52]">
                    {currentEmail.from} · {currentEmail.fromRole} · {currentEmail.timestamp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleStar(currentEmail.id)}
                  aria-label={currentEmail.starred ? '取消星标' : '添加星标'}
                  className="w-8 h-8 rounded-lg border-2 border-[#3A2D28] bg-[#FFFDF7] flex items-center justify-center hover:bg-[#FEF3C7] shrink-0"
                >
                  <Star
                    className={`w-4 h-4 ${
                      currentEmail.starred
                        ? 'fill-[#FFB830] text-[#3A2D28]'
                        : 'text-[#6E5A52]'
                    }`}
                  />
                </button>
              </div>
              <div className="text-sm text-[#3A2D28] leading-7 whitespace-pre-line max-w-[65ch]">
                <RichText text={currentEmail.body} />
              </div>
              {currentEmail.attachments && currentEmail.attachments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold text-[#6E5A52]">附件（{currentEmail.attachments.length}）</p>
                  {currentEmail.attachments.map((att) => (
                    <button
                      key={att.fileId}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onDownloadAttachment?.(att.fileId);
                      }}
                      className="w-full cartoon-btn px-3 py-2 rounded-lg bg-[#FFF8EB] border-2 border-[#3A2D28] text-left flex items-center gap-2 hover:bg-[#FFE4B5] transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#DC2626]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-[#3A2D28] truncate">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-[#6E5A52]">{att.sizeLabel}</div>
                      </div>
                      <span className="text-[10px] text-[#DC2626] font-bold shrink-0">下载</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-[#6E5A52]">选择一封邮件查看详情</p>
          )}
        </div>
      </div>

      <AccountLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(next) => {
          setAccount(next);
          setLoginOpen(false);
        }}
      />
    </div>
  );
};
