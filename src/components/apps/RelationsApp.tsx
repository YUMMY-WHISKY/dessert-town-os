import React, { useRef, useState } from 'react';
import { Link2, X } from 'lucide-react';
import { RelationEdgeDef, RelationNode, RelationType } from '../../os/types';
import { soundEngine } from '../../os/sound';

interface RelationsAppProps {
  nodes: RelationNode[];
  edgeDefs: RelationEdgeDef[];
  discoveredClues: string[];
  /** 已经在文件 / 邮件 / 聊天 / 档案里遇到过的人 */
  collectedIds: string[];
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
}

const TYPES: RelationType[] = [
  '亲属',
  '要挟',
  '复仇',
  '雇佣',
  '交易',
  '竞争',
  '旧识',
];

interface Edge {
  a: string;
  b: string;
  type: RelationType;
  /** null = 未判定, true = 对, false = 错 */
  ok: boolean | null;
}

export const RelationsApp: React.FC<RelationsAppProps> = ({
  nodes,
  edgeDefs,
  discoveredClues,
  collectedIds,
  onDiscoverClue,
  onFlag,
}) => {
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }]))
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<[string, string] | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string>('');

  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(
    null
  );

  const collectedNodes = nodes.filter((n) => collectedIds.includes(n.id));
  const solved = edges.filter((e) => e.ok === true);
  const allSolved = submitted && solved.length === edgeDefs.length;

  const handleCardPointerDown = (e: React.PointerEvent, node: RelationNode) => {
    if ((e.target as HTMLElement).closest('[data-pin]')) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      ox: pos[node.id].x,
      oy: pos[node.id].y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCardPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = ((e.clientX - d.startX) / rect.width) * 100;
    const dy = ((e.clientY - d.startY) / rect.height) * 100;
    setPos((prev) => ({
      ...prev,
      [d.id]: {
        x: Math.min(90, Math.max(10, d.ox + dx)),
        y: Math.min(90, Math.max(10, d.oy + dy)),
      },
    }));
  };

  const handleCardPointerUp = () => {
    dragRef.current = null;
  };

  const handleSelect = (node: RelationNode) => {
    soundEngine.playClick();
    if (!selected) {
      setSelected(node.id);
      return;
    }
    if (selected === node.id) {
      setSelected(null);
      return;
    }
    setPending([selected, node.id]);
    setSelected(null);
  };

  const applyType = (type: RelationType) => {
    if (!pending) return;
    const [a, b] = pending;
    const exists = edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));

    // 连线时不判定，ok=null 留待统一提交
    const next = exists
      ? edges.map((e) =>
          (e.a === a && e.b === b) || (e.a === b && e.b === a)
            ? { ...e, type, ok: null }
            : e
        )
      : [...edges, { a, b, type, ok: null }];
    setEdges(next);
    setSubmitted(false);
    setSubmitMsg('');
    setPending(null);
  };

  const handleSubmit = () => {
    // 全量判定：玩家连的每条线和 edgeDefs 比对
    const judged: Edge[] = edges.map((e) => {
      const def = edgeDefs.find(
        (d) =>
          ((d.a === e.a && d.b === e.b) || (d.a === e.b && d.b === e.a)) &&
          d.type === e.type
      );
      return { ...e, ok: !!def };
    });

    // 玩家连了但不在 edgeDefs 里的 pair（pair 存在但 type 不对 / pair 根本不是正确 pair）
    const allOkPairs = edgeDefs.map((d) =>
      edges.find(
        (e) => (e.a === d.a && e.b === d.b) || (e.a === d.b && e.b === d.a)
      )
    );
    const fullyCorrect = judged.filter((e) => e.ok).length === edgeDefs.length;

    setEdges(judged);
    setSubmitted(true);

    if (fullyCorrect) {
      soundEngine.playClueFound();
      setSubmitMsg('全部连对了。这张网的中心不是布莱克。');
      // 解锁每条边的线索
      edgeDefs.forEach((d) => {
        if (d.clueId) onDiscoverClue(d.clueId);
      });
      onFlag('relations_solved');
      onDiscoverClue('clue_relations_solved');
    } else {
      soundEngine.playError();
      const correctCount = judged.filter((e) => e.ok).length;
      setSubmitMsg(`连对了 ${correctCount} 条。再想想剩下的。`);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF7]">
      {/* 收集状态条 */}
      <div className="px-3 py-2 bg-[#F7FEE7] border-b-2 border-[#3A2D28] flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black text-[#3A2D28]">人物关系板</span>
        <span className="text-[10px] font-bold text-[#6E5A52]">
          在文件、邮件、聊天、档案里遇到的人，会自己出现在板上。
        </span>
        <span className="ml-auto text-[10px] font-bold text-[#6E5A52] tabular-nums">
          已收录 {collectedNodes.length}/{nodes.length}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* 软木板 */}
        <div
          ref={boardRef}
          className="relative flex-1 min-w-0 m-3 rounded-2xl border-[2.5px] border-[#3A2D28] shadow-[4px_4px_0_#3A2D28] overflow-hidden"
          style={{
            backgroundColor: '#E8D5B7',
            backgroundImage:
              'radial-gradient(rgba(120,90,60,0.18) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '11px 11px, 17px 17px',
            backgroundPosition: '0 0, 5px 7px',
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {edges.map((e, i) => {
              const pa = pos[e.a];
              const pb = pos[e.b];
              if (!pa || !pb) return null;
              const mx = (pa.x + pb.x) / 2;
              const my = (pa.y + pb.y) / 2 - 6;
              const stroke =
                e.ok === true ? '#F59E0B' : e.ok === false ? '#DC2626' : '#9CA3AF';
              return (
                <path
                  key={i}
                  d={`M ${pa.x} ${pa.y} Q ${mx} ${my} ${pb.x} ${pb.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={0.9}
                  strokeDasharray={e.ok === null ? '2 2' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {collectedNodes.length < 2 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm font-black text-[#3A2D28] mb-1">先把人钉上去</p>
              <p className="text-[11px] text-[#6E5A52] max-w-[240px] leading-relaxed">
                板上的人还不够。去文件、邮件和聊天记录里，把还活在这个案子里的人找出来。
              </p>
            </div>
          ) : null}

          {collectedNodes.map((node) => {
            const p = pos[node.id];
            const isSel = selected === node.id;
            return (
              <div
                key={node.id}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
              >
                <div
                  onPointerDown={(e) => handleCardPointerDown(e, node)}
                  onPointerMove={handleCardPointerMove}
                  onPointerUp={handleCardPointerUp}
                  className={`relative w-[84px] rounded-md border-2 bg-[#FFFDF7] px-1.5 pt-1.5 pb-1 cursor-grab active:cursor-grabbing transition-shadow ${
                    isSel
                      ? 'border-[#059669] shadow-[0_0_0_3px_#A7F3D0]'
                      : 'border-[#3A2D28] shadow-[2px_2px_0_rgba(58,45,40,0.6)]'
                  }`}
                >
                  <button
                    type="button"
                    data-pin="true"
                    onClick={() => handleSelect(node)}
                    aria-label={`选择 ${node.name}`}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#DC2626] border-2 border-[#3A2D28]"
                  />
                  <div className="text-center text-lg leading-none pt-1" aria-hidden="true">
                    {node.emoji}
                  </div>
                  <p className="text-center text-[11px] font-black text-[#3A2D28] leading-tight mt-0.5">
                    {node.name}
                  </p>
                  <p className="text-center text-[9px] text-[#6E5A52] leading-tight truncate">
                    {node.role}
                  </p>
                </div>
              </div>
            );
          })}

          {allSolved ? (
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 rotate-[-2deg] px-3 py-1.5 rounded bg-[#FEF08A] border-2 border-[#3A2D28] shadow-[2px_2px_0_#3A2D28]">
              <p className="text-[11px] font-black text-[#3A2D28]">
                这张网的中心不是布莱克。
              </p>
            </div>
          ) : null}
        </div>

        {/* 侧栏 */}
        <aside className="w-56 shrink-0 p-3 border-l-2 border-[#E5D8C5] overflow-y-auto cartoon-scroll">
          <h3 className="text-xs font-black text-[#3A2D28] mb-1 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-[#D97706]" />
            <span>人物关系板</span>
          </h3>
          <p className="text-[10px] text-[#6E5A52] mb-2 leading-relaxed">
            每张卡片都别着一枚红色图钉。先点一枚，再点另一枚，然后告诉板子这两个人之间是什么关系。
            <span className="text-[#8B7A6B]">全部连好之后点「提交判定」统一检查。</span>
          </p>
          <p className="text-[11px] font-bold text-[#6E5A52] mb-2 tabular-nums">
            已连线 {edges.length} / 需连 {edgeDefs.length}
            {submitted ? ` · 连对 ${solved.length}` : ''}
          </p>

          {submitMsg ? (
            <p
              className={`text-[11px] font-black mb-2 px-2 py-1.5 rounded-lg border-2 leading-snug ${
                allSolved
                  ? 'bg-[#FEF08A] border-[#3A2D28] text-[#3A2D28]'
                  : 'bg-[#FEE2E2] border-[#3A2D28] text-[#991B1B]'
              }`}
            >
              {submitMsg}
            </p>
          ) : null}

          {!allSolved ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={edges.length < edgeDefs.length}
              className={`cartoon-btn w-full py-2 rounded-xl text-xs font-black mb-3 ${
                edges.length < edgeDefs.length
                  ? 'bg-[#E5D8C5] text-[#8B7A6B] cursor-not-allowed'
                  : 'bg-[#FEF08A] text-[#3A2D28]'
              }`}
            >
              提交判定 {edges.length < edgeDefs.length ? `（还差 ${edgeDefs.length - edges.length} 条）` : ''}
            </button>
          ) : null}

          <div className="space-y-2">
            {edges.map((e) => {
              const def = edgeDefs.find(
                (d) =>
                  ((d.a === e.a && d.b === e.b) || (d.a === e.b && d.b === e.a)) &&
                  d.type === e.type
              );
              const nodeA = nodes.find((n) => n.id === e.a)?.name ?? e.a;
              const nodeB = nodes.find((n) => n.id === e.b)?.name ?? e.b;
              let bg = '#FEF3C7';
              let border = '#3A2D28';
              let tag = '✓';
              if (e.ok === null) {
                bg = '#F6EFE2';
                tag = '...';
              } else if (e.ok === false) {
                bg = '#FEE2E2';
                border = '#991B1B';
                tag = '✗';
              }
              return (
                <div
                  key={`${e.a}-${e.b}`}
                  className="p-2 rounded-lg border-2"
                  style={{ backgroundColor: bg, borderColor: border }}
                >
                  <p className="text-[10px] font-black mb-0.5">
                    <span
                      className={
                        e.ok === true
                          ? 'text-[#D97706]'
                          : e.ok === false
                          ? 'text-[#991B1B]'
                          : 'text-[#6E5A52]'
                      }
                    >
                      {e.type}
                    </span>
                    <span className="ml-1 tabular-nums">{tag}</span>
                  </p>
                  <p className="text-[10px] text-[#6E5A52] leading-tight">
                    {nodeA} ↔ {nodeB}
                  </p>
                  {def && discoveredClues.includes(def.clueId ?? '') && e.ok === true ? (
                    <p className="text-[10px] text-[#3A2D28] leading-snug mt-1">{def.testimony}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* 关系类型选择 */}
      {pending ? (
        <div className="absolute inset-0 z-30 bg-[#3A2D28]/35 flex items-center justify-center p-4">
          <div className="w-full max-w-xs rounded-2xl bg-[#FFFDF7] border-[2.5px] border-[#3A2D28] shadow-[6px_6px_0_#3A2D28] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-[#3A2D28]">这两个人是什么关系？</h3>
              <button
                type="button"
                onClick={() => setPending(null)}
                aria-label="取消"
                className="w-6 h-6 rounded-lg border-2 border-[#3A2D28] bg-[#FFFDF7] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => applyType(t)}
                  className="cartoon-btn py-2 rounded-xl bg-[#F6EFE2] text-xs font-black text-[#3A2D28]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
