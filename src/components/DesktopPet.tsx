import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../os/sound';

interface DesktopPetProps {
  chapter: number;
  onOpenPet: () => void;
  /** 煤球抓文件任务：开始后煤球会去桌面上叼碎片 */
  fetchJob?: { fileId: string; fileName: string } | null;
  /** 全部叼完成功 */
  onFetchComplete?: (fileId: string, fileName: string) => void;
  /** 超时失败（或用户取消） */
  onFetchFailed?: () => void;
}

const PET_W = 78;
const PET_H = 96;
const TASKBAR_H = 56;
const MIN_Y = 150;

const FETCH_SHARDS = 10;
const FETCH_TIME_LIMIT = 18000; // 18 秒
const FETCH_SHARD_SIZE = 36;

const PET_LINES: Record<number, string[]> = {
  1: [
    '喵呜～ 今天太阳很好，要不要一起晒一会儿？',
    '小鱼干……你兜里有吗？我闻闻。',
    '呼噜噜，你敲键盘的声音像在按摩我的耳朵。',
  ],
  2: [
    '我刚刚打了个大哈欠，被你看到了，不许笑。',
    '电脑屏幕里有一只小虫子，我帮你盯着呢。',
    '喵。坐太久了，起来活动活动吧。',
  ],
  3: [
    '窗台那个位置我已经占了，阳光最好，别跟我抢。',
    '呼噜……你喝口水，我帮你守着电脑。',
    '今天还没喂小鱼干哦……我只是提醒一下。',
  ],
  4: [
    '喵呜。外面风大，出门记得加件外套。',
    '我把尾巴卷起来了，意思是……摸摸我？',
    '电脑屏幕亮度调低一点啦，晃眼。',
  ],
  5: [
    '呼噜噜……不管结果怎样，你已经做得很好了。',
    '喵。先吃点东西再说，我等你。',
    '尾巴摇三下，意思是——我在这儿。',
  ],
};

function clampPos(x: number, y: number) {
  const maxX = Math.max(8, window.innerWidth - PET_W - 8);
  const maxY = Math.max(8, window.innerHeight - TASKBAR_H - PET_H - 8);
  const minY = Math.min(MIN_Y, maxY);
  return {
    x: Math.max(8, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

/** 在桌面上随机生成 FETCH_SHARDS 个碎片坐标 */
interface FetchShard {
  id: number;
  x: number; // 屏幕绝对坐标
  y: number;
  collected: boolean;
}

function generateFetchShards(catX: number, catY: number): FetchShard[] {
  const shards: FetchShard[] = [];
  const minDist = 80; // 碎片间最小距离（px）
  const margin = 40;
  const topLimit = MIN_Y;
  const bottomLimit = window.innerHeight - TASKBAR_H - 40;
  let attempts = 0;
  while (shards.length < FETCH_SHARDS && attempts < 500) {
    attempts++;
    const x = margin + Math.random() * (window.innerWidth - margin * 2);
    const y = topLimit + Math.random() * (bottomLimit - topLimit);
    // 至少要离煤球初始位置 120px 以上，不然太近
    if (Math.hypot(x - (catX + PET_W / 2), y - (catY + PET_H / 2)) < 120) continue;
    const tooClose = shards.some(
      (s) => Math.hypot(s.x - x, s.y - y) < minDist
    );
    if (!tooClose) {
      shards.push({ id: shards.length, x, y, collected: false });
    }
  }
  // 兜底
  while (shards.length < FETCH_SHARDS) {
    shards.push({
      id: shards.length,
      x: 80 + (shards.length % 5) * Math.floor((window.innerWidth - 160) / 4),
      y: topLimit + 50 + Math.floor(shards.length / 5) * 120,
      collected: false,
    });
  }
  return shards;
}

const CatSprite: React.FC<{ walking: boolean; sleeping: boolean }> = ({
  walking,
  sleeping,
}) => (
  <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
    {/* 尾巴 */}
    <path
      d="M48 49 C59 48 61 37 55 30"
      fill="none"
      stroke="#3A2D28"
      strokeWidth="7"
      strokeLinecap="round"
      style={{
        transformOrigin: '48px 49px',
        animation: 'pet-tail 1.8s ease-in-out infinite',
      }}
    />
    <path
      d="M48 49 C58 48 60 37 55 31"
      fill="none"
      stroke="#F59E5B"
      strokeWidth="4"
      strokeLinecap="round"
      style={{
        transformOrigin: '48px 49px',
        animation: 'pet-tail 1.8s ease-in-out infinite',
      }}
    />

    {/* 身体 */}
    <ellipse cx="32" cy="44" rx="15.5" ry="12.5" fill="#F59E5B" stroke="#3A2D28" strokeWidth="2.4" />
    <ellipse cx="32" cy="47" rx="8.5" ry="7" fill="#FFE8C7" />
    <path d="M21 38 q3 4 0 7" stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M24 36 q3 4 0 7" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M43 38 q-3 4 0 7" stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* 前爪 */}
    <ellipse cx="24" cy="57.5" rx="4.6" ry="3.4" fill="#F59E5B" stroke="#3A2D28" strokeWidth="2" />
    <ellipse cx="40" cy="57.5" rx="4.6" ry="3.4" fill="#F59E5B" stroke="#3A2D28" strokeWidth="2" />

    {/* 耳朵 */}
    <path d="M20 17 L16.5 4.5 L29 11.5 Z" fill="#F59E5B" stroke="#3A2D28" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M44 17 L47.5 4.5 L35 11.5 Z" fill="#F59E5B" stroke="#3A2D28" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M21 14.5 L19 8.5 L25.5 12 Z" fill="#FFB3C1" />
    <path d="M43 14.5 L45 8.5 L38.5 12 Z" fill="#FFB3C1" />

    {/* 头 */}
    <circle cx="32" cy="27" r="15" fill="#F59E5B" stroke="#3A2D28" strokeWidth="2.4" />
    <path d="M27.5 13.5 l2 4" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 12.5 l0 4.5" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <path d="M36.5 13.5 l-2 4" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="32" cy="34" rx="8.5" ry="6.5" fill="#FFE8C7" opacity="0.85" />

    {/* 眼睛 */}
    {sleeping ? (
      <>
        <path d="M22.5 26 q3.5 2.5 7 0" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M34.5 26 q3.5 2.5 7 0" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <g
        style={{
          transformOrigin: '32px 26px',
          animation: 'pet-blink 4.6s infinite',
        }}
      >
        <ellipse cx="26.5" cy="26" rx="2.3" ry="3" fill="#3A2D28" />
        <ellipse cx="37.5" cy="26" rx="2.3" ry="3" fill="#3A2D28" />
        <circle cx="25.7" cy="25" r="0.8" fill="#FFFDF7" />
        <circle cx="36.7" cy="25" r="0.8" fill="#FFFDF7" />
      </g>
    )}

    {/* 鼻子与嘴 */}
    <path d="M32 30 l-2.2 1.6 h4.4 Z" fill="#FF758F" />
    <path d="M32 31.6 q-2.2 2.6 -4.5 0" stroke="#3A2D28" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M32 31.6 q2.2 2.6 4.5 0" stroke="#3A2D28" strokeWidth="1.5" strokeLinecap="round" fill="none" />

    {/* 胡须 */}
    <path d="M18 28 h-5.5 M18 31 h-5.5" stroke="#3A2D28" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M46 28 h5.5 M46 31 h5.5" stroke="#3A2D28" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

    {walking ? (
      <ellipse cx="32" cy="61" rx="14" ry="1.8" fill="#3A2D28" opacity="0.12" />
    ) : null}

    {sleeping ? (
      <text
        x="47"
        y="12"
        fill="#6E5A52"
        fontSize="8"
        fontWeight="900"
        style={{ animation: 'pet-float 2.2s ease-in-out infinite' }}
      >
        Zzz
      </text>
    ) : null}
  </svg>
);

export const DesktopPet: React.FC<DesktopPetProps> = ({
  chapter,
  onOpenPet,
  fetchJob,
  onFetchComplete,
  onFetchFailed,
}) => {
  const [pos, setPos] = useState(() =>
    clampPos(window.innerWidth - 160, window.innerHeight - 250)
  );
  const [facing, setFacing] = useState<1 | -1>(-1);
  const [walking, setWalking] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [hopping, setHopping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);

  // 煤球抓文件游戏
  const [fetchActive, setFetchActive] = useState(false);
  const [fetchShards, setFetchShards] = useState<FetchShard[]>([]);
  const [fetchTimeLeft, setFetchTimeLeft] = useState(FETCH_TIME_LIMIT);
  const [fetchOriginalPos, setFetchOriginalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fetchCarrying, setFetchCarrying] = useState(false);

  const posRef = useRef(pos);
  const lastActiveRef = useRef(Date.now());
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    pointerId: number;
  } | null>(null);
  const movedRef = useRef(0);
  const bubbleTimerRef = useRef<number | null>(null);
  const hopTimerRef = useRef<number | null>(null);
  const walkTimerRef = useRef<number | null>(null);
  const fetchTimerRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<number | null>(null);
  const fetchJobRef = useRef(fetchJob);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // 自己溜达
  useEffect(() => {
    if (dragging) return;
    const timer = window.setInterval(() => {
      if (sleeping || bubble) return;
      const prev = posRef.current;
      const next = clampPos(
        prev.x + (Math.random() * 2 - 1) * 260,
        prev.y + (Math.random() * 2 - 1) * 90
      );
      setFacing(next.x >= prev.x ? 1 : -1);
      setPos(next);
      setWalking(true);
      if (walkTimerRef.current !== null) window.clearTimeout(walkTimerRef.current);
      walkTimerRef.current = window.setTimeout(() => setWalking(false), 2300);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [dragging, sleeping, bubble]);

  // 长时间没人理就睡觉
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        !dragging &&
        !bubble &&
        Date.now() - lastActiveRef.current > 45000
      ) {
        setSleeping(true);
        setWalking(false);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [dragging, bubble]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clampPos(prev.x, prev.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(
    () => () => {
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
      if (hopTimerRef.current !== null) window.clearTimeout(hopTimerRef.current);
      if (walkTimerRef.current !== null) window.clearTimeout(walkTimerRef.current);
    },
    []
  );

  const speak = useCallback(() => {
    if (fetchActive) return; // fetch 期间不说话
    const lines = PET_LINES[Math.min(5, Math.max(1, chapter))] ?? PET_LINES[1];
    setBubble(lines[Math.floor(Math.random() * lines.length)]);
    setSleeping(false);
    setWalking(false);
    lastActiveRef.current = Date.now();

    setHopping(true);
    if (hopTimerRef.current !== null) window.clearTimeout(hopTimerRef.current);
    hopTimerRef.current = window.setTimeout(() => setHopping(false), 620);

    if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => setBubble(null), 4200);

    soundEngine.playTone(760, 0.09, 'sine', 0.04);
    window.setTimeout(() => soundEngine.playTone(980, 0.12, 'sine', 0.035), 110);
  }, [chapter, fetchActive]);

  // ===== 煤球抓文件游戏 =====
  const cleanupFetch = useCallback(() => {
    if (fetchTimerRef.current) {
      window.clearInterval(fetchTimerRef.current);
      fetchTimerRef.current = null;
    }
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    setFetchActive(false);
    setFetchShards([]);
    setFetchCarrying(false);
    setWalking(false);
  }, []);

  // 煤球走到目标位置（带动画）
  const moveCatTo = useCallback(
    (targetX: number, targetY: number, onArrive?: () => void) => {
      setFacing(targetX >= posRef.current.x ? 1 : -1);
      setWalking(true);
      setPos({ x: targetX, y: targetY });
      if (walkTimerRef.current) window.clearTimeout(walkTimerRef.current);
      walkTimerRef.current = window.setTimeout(() => {
        setWalking(false);
        onArrive?.();
      }, 380); // CSS transition duration
    },
    []
  );

  // 点碎片：煤球跑过去叼
  const catchFetchShard = useCallback(
    (shardId: number) => {
      if (!fetchActive) return;
      const shard = fetchShards.find((s) => s.id === shardId);
      if (!shard || shard.collected) return;

      // 煤球走到碎片位置（碎片在煤球底部居中，所以调整坐标让煤球爪子碰到碎片）
      const targetX = shard.x - PET_W / 2; // 煤球 center 对齐碎片
      const targetY = shard.y - PET_H / 2 + 8;
      moveCatTo(targetX, targetY, () => {
        soundEngine.playTone(660, 0.06, 'triangle', 0.05);
        setFetchCarrying(true);
        // 标记碎片已收集
        setFetchShards((prev) => {
          const next = prev.map((s) =>
            s.id === shardId ? { ...s, collected: true } : s
          );
          const allDone = next.every((s) => s.collected);
          if (allDone && fetchJobRef.current) {
            // 全部叼完 → 跑回原位 → 成功
            setFetchCarrying(false);
            const orig = fetchOriginalPos;
            window.setTimeout(() => {
              moveCatTo(orig.x, orig.y, () => {
                cleanupFetch();
                onFetchComplete?.(
                  fetchJobRef.current!.fileId,
                  fetchJobRef.current!.fileName
                );
              });
            }, 120);
          } else {
            // 叼着下一片 → 放回嘴里
            window.setTimeout(() => setFetchCarrying(false), 200);
          }
          return next;
        });
      });
    },
    [fetchActive, fetchShards, fetchOriginalPos, moveCatTo, cleanupFetch, onFetchComplete]
  );

  // fetchJob 变化 → 启动/清理游戏
  useEffect(() => {
    fetchJobRef.current = fetchJob;
    if (!fetchJob) {
      cleanupFetch();
      return;
    }
    // 启动
    setSleeping(false);
    setBubble(null);
    const orig = { ...posRef.current };
    setFetchOriginalPos(orig);
    const shards = generateFetchShards(orig.x + PET_W / 2, orig.y + PET_H / 2);
    setFetchShards(shards);
    setFetchTimeLeft(FETCH_TIME_LIMIT);
    setFetchActive(true);

    // 计时器
    const startAt = Date.now();
    if (fetchTimerRef.current) window.clearInterval(fetchTimerRef.current);
    fetchTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startAt;
      const remaining = FETCH_TIME_LIMIT - elapsed;
      if (remaining <= 0) {
        if (fetchTimerRef.current) {
          window.clearInterval(fetchTimerRef.current);
          fetchTimerRef.current = null;
        }
        setFetchTimeLeft(0);
        cleanupFetch();
        onFetchFailed?.();
      } else {
        setFetchTimeLeft(remaining);
      }
    }, 100);

    return () => {
      if (fetchTimerRef.current) {
        window.clearInterval(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchJob?.fileId]); // 只在任务 id 变化时重启

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (fetchActive) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: posRef.current.x,
      origY: posRef.current.y,
      pointerId: e.pointerId,
    };
    movedRef.current = 0;
    setDragging(true);
    setWalking(false);
    setSleeping(false);
    lastActiveRef.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    movedRef.current = Math.max(movedRef.current, Math.hypot(dx, dy));
    setPos(clampPos(drag.origX + dx, drag.origY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    lastActiveRef.current = Date.now();
    if (movedRef.current < 6) speak();
  };

  return (
    <>
      {/* 煤球本体 */}
      <div
        className="fixed z-[790] pointer-events-none"
        style={{
          left: pos.x,
          top: pos.y,
          width: PET_W,
          height: PET_H,
          transition: 'left 380ms cubic-bezier(0.22, 1, 0.36, 1), top 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        data-desktop-backdrop="false"
      >
      {bubble ? (
        <div
          role="status"
          className="absolute bottom-[86px] left-1/2 -translate-x-1/2 w-[196px] px-3 py-2 rounded-2xl bg-[#FEF3C7] border-[2.5px] border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] text-[11px] font-bold text-[#3A2D28] leading-snug"
          style={{ animation: 'pet-bubble 0.18s ease-out' }}
        >
          {bubble}
          <span className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45 bg-[#FEF3C7] border-r-[2.5px] border-b-[2.5px] border-[#3A2D28]" />
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        aria-label="桌宠煤球：单击说话，双击打开煤球小屋，按住可以拖动"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={onOpenPet}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            speak();
          }
        }}
        className="pointer-events-auto relative w-[78px] h-[86px] cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[#FFB830] rounded-2xl"
        style={{
          transform: `scaleX(${facing})`,
          transition: dragging ? 'none' : 'transform 220ms ease-out',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            animation: hopping
              ? 'pet-hop 0.62s cubic-bezier(0.22, 1, 0.36, 1)'
              : walking
                ? 'pet-bob 0.55s ease-in-out infinite'
                : undefined,
          }}
        >
          <CatSprite walking={walking} sleeping={sleeping} />
        </div>

        {/* 煤球嘴里叼着的碎片 */}
        {fetchCarrying ? (
          <div
            className="absolute -top-2 -right-1 w-5 h-4 rounded bg-[#FFFDF7] border-2 border-[#3A2D28] text-[8px] font-bold text-[#3A2D28] flex items-center justify-center shadow-[1px_1px_0_#3A2D28] animate-bounce"
            aria-hidden="true"
          >
            📄
          </div>
        ) : null}
      </div>

      <div className="w-[56px] h-[7px] mx-auto mt-1 rounded-full bg-[#3A2D28]/15 blur-[1px]" />
      </div>

      {/* 煤球抓文件 overlay */}
      {fetchActive ? (
        <>
          {/* 碎片 */}
          {fetchShards.map((shard) =>
            shard.collected ? null : (
              <button
                key={shard.id}
                type="button"
                aria-label="文件碎片"
                onClick={() => catchFetchShard(shard.id)}
                className="fixed z-[890] w-9 h-8 rounded bg-[#FFFDF7] border-2 border-[#3A2D28] text-base font-bold text-[#3A2D28] flex items-center justify-center hover:bg-[#FFE29A] hover:scale-125 transition-all shadow-[2px_2px_0_#3A2D28] animate-pulse"
                style={{
                  left: shard.x - FETCH_SHARD_SIZE / 2,
                  top: shard.y - FETCH_SHARD_SIZE / 2,
                }}
              >
                📄
              </button>
            )
          )}

          {/* 顶部状态栏 */}
          <div className="fixed z-[890] top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-[#FEF3C7] border-[2.5px] border-[#3A2D28] shadow-[3px_3px_0_#3A2D28] flex items-center gap-3">
            <span className="text-sm">🐈‍⬛</span>
            <p className="text-[11px] font-black text-[#3A2D28]">
              煤球在帮你叼文件碎片！快点它！
            </p>
            <span className="text-[11px] font-black text-[#3A2D28]">
              {fetchShards.filter((s) => s.collected).length}
              <span className="text-[#6E5A52]"> / {FETCH_SHARDS}</span>
            </span>
            <span
              className={`text-[11px] font-black tabular-nums ${
                fetchTimeLeft <= 3000 ? 'text-[#DC2626]' : 'text-[#3A2D28]'
              }`}
            >
              {(fetchTimeLeft / 1000).toFixed(1)}s
            </span>
          </div>
        </>
      ) : null}
    </>
  );
};
