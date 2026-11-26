import React, { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { ChatChoice, ChatThread } from '../../os/types';
import { RichText } from '../RichText';
import { soundEngine } from '../../os/sound';
import { AccountLoginModal } from '../AccountLoginModal';

interface ChatAppProps {
  threads: ChatThread[];
  chapter: number;
  onReadThread: (thread: ChatThread) => void;
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
}

interface DialogueLogItem {
  role: 'me' | 'them';
  text: string;
  clueId?: string;
}

interface DialogueState {
  nodeId: string | null;
  log: DialogueLogItem[];
  /** 已经展示过 prompt 的节点集合，避免重复追加固定搭配 */
  visitedNodes: Set<string>;
  /** 已用过的选项 key：${nodeId}:${choiceIndex} */
  usedChoices: Set<string>;
}

interface TypingState {
  threadId: string;
  sentences: string[];
  index: number;
  nextNodeId: string | null;
  clueId?: string;
}

function splitSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[。！？\n])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function stripClueMarkup(text: string): string {
  return text.replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1');
}

function bubbleClass(role: 'me' | 'them'): string {
  return role === 'me'
    ? 'items-end'
    : 'items-start';
}

export const ChatApp: React.FC<ChatAppProps> = ({
  threads,
  chapter,
  onReadThread,
  onDiscoverClue,
  onFlag,
}) => {
  const [selectedId, setSelectedId] = useState(threads[0]?.id ?? '');
  const [dialogues, setDialogues] = useState<Record<string, DialogueState>>({});
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [account, setAccount] = useState<'detective' | 'poppy' | 'black'>('detective');
  const [loginOpen, setLoginOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 对方回完话 / 切换会话后自动滚到底
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [typing, selectedId, account]);

  const accountThreads = threads.filter(
    (t) => (t.account ?? 'detective') === account
  );

  // 登录别人的账号需要账号和密码；已在别人账户里时点击则退回探长账户
  const switchAccount = () => {
    if (account === 'detective') {
      setLoginOpen(true);
    } else {
      setAccount('detective');
    }
  };

  const activeThread = accountThreads.find((t) => t.id === selectedId) ?? accountThreads[0];
  const isDetective = account === 'detective';
  const dialogue = isDetective ? activeThread?.dialogue : undefined;
  const state = isDetective && activeThread ? dialogues[activeThread.id] : undefined;
  const isTyping = typing?.threadId === activeThread?.id;

  useEffect(() => {
    if (!accountThreads.some((t) => t.id === selectedId)) {
      setSelectedId(accountThreads[0]?.id ?? '');
    }
  }, [account, accountThreads, selectedId]);

  const currentNode =
    dialogue && state?.nodeId
      ? dialogue.nodes.find((n) => n.id === state.nodeId) ?? null
      : null;

  const availableChoices = currentNode
    ? currentNode.choices
        .map((choice, origIdx) => ({ choice, origIdx }))
        .filter(({ choice, origIdx }) => {
          if (choice.chapter && choice.chapter > chapter) return false;
          const key = `${currentNode.id}:${origIdx}`;
          // casual（日常闲聊）选一次就隐藏；case（案件相关）永远显示，让玩家把所有分支跑完
          if (state?.usedChoices.has(key) && choice.kind === 'casual') return false;
          return true;
        })
    : [];

  useEffect(() => {
    if (!isDetective || !activeThread?.dialogue) return;
    const thread = activeThread;
    setDialogues((prev) => {
      if (prev[thread.id]) return prev;
      const start = thread.dialogue!.nodes.find((n) => n.id === thread.dialogue!.start);
      if (!start) return prev;
      // 由玩家先开口：不预置对方的开场白，直接把提问选项交给玩家
      return {
        ...prev,
        [thread.id]: {
          nodeId: start.id,
          log: [],
          visitedNodes: new Set([start.id]),
          usedChoices: new Set(),
        },
      };
    });
  }, [isDetective, activeThread?.id, activeThread?.dialogue]);

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedId(thread.id);
    onReadThread(thread);
  };

  const handleChoice = (choice: ChatChoice, choiceIdx: number) => {
    if (!activeThread || !dialogue || !state) return;
    const nextNode = choice.next ? dialogue.nodes.find((n) => n.id === choice.next) : null;

    setDialogues((prev) => {
      const cur = prev[activeThread.id];
      if (!cur) return prev;
      const key = `${cur.nodeId}:${choiceIdx}`;
      return {
        ...prev,
        [activeThread.id]: {
          ...cur,
          nodeId: null,
          log: [...cur.log, { role: 'me', text: choice.label }],
          usedChoices: new Set(cur.usedChoices).add(key),
        },
      };
    });
    setTyping({
      threadId: activeThread.id,
      sentences: splitSentences(choice.reply),
      index: 0,
      nextNodeId: nextNode?.id ?? null,
      clueId: choice.clueId,
    });

    if (choice.flag) onFlag(choice.flag);
    soundEngine.playClick();
  };

  // 对方一句一句回复
  useEffect(() => {
    if (!typing) return;
    const delay = typing.index === 0 ? 500 : 650;
    const timer = window.setTimeout(() => {
      if (typing.index < typing.sentences.length) {
        const sentence = typing.sentences[typing.index];
        setDialogues((prev) => {
          const cur = prev[typing.threadId];
          if (!cur) return prev;
          return {
            ...prev,
            [typing.threadId]: {
              ...cur,
              log: [
                ...cur.log,
                { role: 'them', text: sentence, clueId: typing.clueId },
              ],
            },
          };
        });
        setTyping({ ...typing, index: typing.index + 1 });
        return;
      }
      const nextNode = typing.nextNodeId
        ? threads
            .find((t) => t.id === typing.threadId)
            ?.dialogue?.nodes.find((n) => n.id === typing.nextNodeId) ?? null
        : null;
      setDialogues((prev) => {
        const cur = prev[typing.threadId];
        if (!cur) return prev;
        const firstVisit = typing.nextNodeId && !cur.visitedNodes.has(typing.nextNodeId);
        const newVisited = new Set(cur.visitedNodes);
        if (typing.nextNodeId) newVisited.add(typing.nextNodeId);
        return {
          ...prev,
          [typing.threadId]: {
            ...cur,
            nodeId: typing.nextNodeId,
            log: firstVisit && nextNode?.prompt
              ? [...cur.log, { role: 'them' as const, text: nextNode.prompt }]
              : cur.log,
            visitedNodes: newVisited,
          },
        };
      });
      setTyping(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [typing]);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col sm:flex-row bg-[#FFFDF7]">
      {/* Left Contacts List */}
      <aside
        aria-label="聊天联系人"
        className="w-full sm:w-56 shrink-0 bg-[#F6EFE2] border-b-2 sm:border-b-0 sm:border-r-2 border-[#3A2D28] p-2 space-y-1.5 overflow-y-auto cartoon-scroll"
      >
        {accountThreads.length === 0 ? (
          <p className="p-3 text-[11px] font-bold text-[#8B7A6B] leading-relaxed">
            这个账户里没有聊天记录。
          </p>
        ) : null}
        {accountThreads.map((thread) => {
          const isCurrent = thread.id === activeThread?.id;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => handleSelectThread(thread)}
              className={`w-full p-2.5 rounded-xl border-2 flex items-center gap-2.5 text-left transition-colors ${
                isCurrent
                  ? 'bg-[#A7F3D0] border-[#3A2D28]'
                  : 'bg-[#FFFDF7] border-transparent hover:border-[#3A2D28]'
              }`}
            >
              <div
                style={{ backgroundColor: thread.avatarBg }}
                className="w-10 h-10 rounded-full border-2 border-[#3A2D28] flex items-center justify-center text-lg shrink-0"
                aria-hidden="true"
              >
                {thread.avatarEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-[#3A2D28] truncate">
                    {thread.contactName}
                  </span>
                  {thread.unread > 0 ? (
                    <span className="text-[11px] font-bold text-[#DC2626] tabular-nums shrink-0">
                      {thread.unread}条未读
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#6E5A52] truncate">{thread.role}</p>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Right Message Conversation */}
      <div className="flex-1 min-w-0 flex flex-col">
        {activeThread ? (
          <>
            <div className="px-4 py-2.5 bg-[#FFF8EB] border-b-2 border-[#E5D8C5] flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#3A2D28]">{activeThread.contactName}</h3>
                <p className="text-xs text-[#6E5A52]">
                  {activeThread.role}
                  {account === 'poppy' ? ' · 波比账户' : account === 'black' ? ' · 布莱克账户' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={switchAccount}
                className="cartoon-btn px-2.5 py-1 rounded-lg bg-[#FFFDF7] text-[11px] font-bold text-[#3A2D28] flex items-center gap-1 whitespace-nowrap"
              >
                <UserRound className="w-3.5 h-3.5" />
                <span>{account === 'detective' ? '切换账户' : '退出账户'}</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 p-4 overflow-y-auto cartoon-scroll space-y-3 bg-[#FFFDF7]">
              {activeThread.messages
                // 侦探模式按章节渐进解锁；用密码登录他人账户时显示全部（玩家主动偷看）
                .filter((msg) => account !== 'detective' || !msg.chapter || msg.chapter <= chapter)
                .map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id} className={`flex flex-col ${bubbleClass(msg.sender)}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl border-2 border-[#3A2D28] px-3.5 py-2.5 text-sm leading-relaxed ${
                          isMe ? 'bg-[#FFE29A] text-[#3A2D28]' : 'bg-[#F6EFE2] text-[#3A2D28]'
                        }`}
                      >
                        {msg.clueId ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => onDiscoverClue(msg.clueId!)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onDiscoverClue(msg.clueId!);
                              }
                            }}
                            className="text-[#DC2626] font-bold underline decoration-dotted cursor-pointer hover:text-[#B91C1C]"
                          >
                            {stripClueMarkup(msg.text)}
                          </span>
                        ) : (
                          <RichText text={msg.text} />
                        )}
                      </div>
                      <span className="text-[11px] text-[#6E5A52] font-mono-tabular mt-1 px-1">
                        {msg.time}
                      </span>
                    </div>
                  );
                })}

              {state?.log.map((item, idx) => (
                <div key={`dlg-${idx}`} className={`flex flex-col ${bubbleClass(item.role)}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl border-2 border-[#3A2D28] px-3.5 py-2.5 text-sm leading-relaxed ${
                      item.role === 'me'
                        ? 'bg-[#FFE29A] text-[#3A2D28]'
                        : 'bg-[#F6EFE2] text-[#3A2D28]'
                    }`}
                  >
                    {item.clueId ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => onDiscoverClue(item.clueId!)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onDiscoverClue(item.clueId!);
                          }
                        }}
                        className="text-[#DC2626] font-bold underline decoration-dotted cursor-pointer hover:text-[#B91C1C]"
                      >
                        {stripClueMarkup(item.text)}
                      </span>
                    ) : (
                      <RichText text={item.text} />
                    )}
                  </div>
                </div>
              ))}

              {isTyping ? (
                <div className="flex flex-col items-start">
                  <div className="max-w-[82%] rounded-2xl border-2 border-[#3A2D28] px-3.5 py-2.5 text-sm text-[#8B7A6B] bg-[#F6EFE2]">
                    对方正在输入…
                  </div>
                </div>
              ) : null}

              {isDetective && dialogue && state && !isTyping && currentNode && availableChoices.length === 0 ? (
                <p className="text-center text-[11px] text-[#A99A8C] pt-1">
                  这个节点的选项都问完了。
                </p>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {isTyping ? null : !isDetective ? (
              <p className="p-3 bg-[#F6EFE2] border-t-2 border-[#3A2D28] text-center text-[11px] font-bold text-[#8B7A6B]">
                这是之前的聊天记录，无法继续回复。
              </p>
            ) : currentNode && availableChoices.length > 0 ? (
              <div className="p-1.5 bg-[#F6EFE2] border-t-2 border-[#3A2D28]">
                <div className="flex flex-col gap-1">
                  {availableChoices.map(({ choice, origIdx }) => (
                    <button
                      key={origIdx}
                      type="button"
                      onClick={() => handleChoice(choice, origIdx)}
                      className="cartoon-btn w-full text-left px-2 py-1 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] text-[11px] font-bold text-[#3A2D28] hover:bg-[#FEF3C7] leading-snug"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <span className="text-3xl" aria-hidden="true">
              {account === 'poppy' ? '🧁' : account === 'black' ? '🐈‍⬛' : '💬'}
            </span>
            <p className="text-sm font-black text-[#3A2D28] mt-2">
              {account === 'poppy'
                ? '这个账户还没有聊天'
                : account === 'black'
                  ? '布莱克账户里没有更多聊天'
                  : '选一个联系人'}
            </p>
            <p className="text-xs text-[#6E5A52] mt-1 leading-relaxed max-w-[240px]">
              {account === 'poppy'
                ? '波比账户里的聊天暂时只有这些。'
                : account === 'black'
                  ? '他和镇上的往来都在这里。'
                  : '左边是镇上能问话的人。'}
            </p>
            <button
              type="button"
              onClick={switchAccount}
              className="mt-3 cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFFDF7] text-[11px] font-bold text-[#3A2D28]"
            >
              {account === 'detective' ? '切换账户' : '退出账户'}
            </button>
          </div>
        )}
      </div>

      <AccountLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(next) => {
          setAccount(next);
          setLoginOpen(false);
        }}
        onSwitchDetective={() => {
          setAccount('detective');
          setLoginOpen(false);
        }}
      />
    </div>
  );
};
