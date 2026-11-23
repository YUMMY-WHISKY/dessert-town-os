import React, { useState } from 'react';
import { Play, Pause, SkipForward, Music, Lock, Sparkles } from 'lucide-react';
import { soundEngine } from '../../os/sound';

interface MusicBoxAppProps {
  isPlaying: boolean;
  trackIndex: number;
  muted: boolean;
  chapter: number;
  unlocked: boolean;
  discoveredClues: string[];
  onTogglePlay: () => void;
  onSelectTrack: (idx: number) => void;
  onUnlockMusic: () => void;
  onDiscoverClue: (clueId: string) => void;
  onFlag: (flag: string) => void;
}

const TRACKS = [
  { title: '午后甜点店', mood: '轻快八音盒 · 120 BPM' },
  { title: '雨天侦探社', mood: '柔和慢板 · 96 BPM' },
  { title: '草莓圆舞曲', mood: '明亮三拍子 · 132 BPM' },
];

const SECRET_ORDER = [0, 2, 0, 1];

export const MusicBoxApp: React.FC<MusicBoxAppProps> = ({
  isPlaying,
  trackIndex,
  muted,
  chapter,
  unlocked,
  discoveredClues,
  onTogglePlay,
  onSelectTrack,
  onUnlockMusic,
  onDiscoverClue,
  onFlag,
}) => {
  const [seq, setSeq] = useState<number[]>([]);
  const [showSheet, setShowSheet] = useState(false);

  const activeTrack = TRACKS[trackIndex % TRACKS.length];
  const canPuzzle = chapter >= 3 && !unlocked;

  const handleSelect = (idx: number) => {
    onSelectTrack(idx);
    if (!canPuzzle) return;
    const next = [...seq, idx].slice(-SECRET_ORDER.length);
    setSeq(next);
    if (next.length === SECRET_ORDER.length && next.every((v, i) => v === SECRET_ORDER[i])) {
      soundEngine.playClueFound();
      onUnlockMusic();
      setSeq([]);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 bg-[#FFFDF7]">
      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`w-16 h-16 rounded-full border-[2.5px] border-[#3A2D28] bg-[#DDD6FE] flex items-center justify-center shrink-0 ${
            isPlaying && !muted ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '6s' }}
        >
          <div className="w-7 h-7 rounded-full border-2 border-[#3A2D28] bg-[#FFFDF7] flex items-center justify-center">
            <Music className="w-3.5 h-3.5 text-[#3A2D28]" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#6E5A52]">正在播放旋律</p>
          <h3 className="text-base font-black text-[#3A2D28] truncate">{activeTrack.title}</h3>
          <p className="text-[11px] text-[#6E5A52]">{activeTrack.mood}</p>
          {muted ? (
            <p className="text-[11px] font-bold text-[#DC2626] mt-0.5">
              当前已静音，请先取消右下角静音
            </p>
          ) : null}
        </div>
      </div>

      {/* 曲目列表 */}
      <div className="flex-1 min-h-0 my-2 overflow-y-auto cartoon-scroll">
        <div className="space-y-1.5">
        {TRACKS.map((track, idx) => {
          const active = idx === trackIndex % TRACKS.length;
          return (
            <button
              key={track.title}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`w-full px-2.5 py-1.5 rounded-xl border-2 text-left flex items-center justify-between text-[11px] font-bold transition-colors ${
                active
                  ? 'bg-[#DDD6FE] border-[#3A2D28] text-[#3A2D28]'
                  : 'bg-[#F6EFE2] border-transparent hover:border-[#3A2D28] text-[#6E5A52]'
              }`}
            >
              <span>
                0{idx + 1}. {track.title}
              </span>
              <span>{track.mood}</span>
            </button>
          );
        })}

        {/* 第四首 */}
        <button
          type="button"
          disabled={!unlocked}
          onClick={() => {
            if (!unlocked) return;
            soundEngine.playClick();
            setShowSheet(true);
          }}
          className={`w-full px-2.5 py-1.5 rounded-xl border-2 text-left flex items-center justify-between text-[11px] font-bold transition-colors ${
            unlocked
              ? 'bg-[#FDE68A] border-[#3A2D28] text-[#3A2D28] hover:bg-[#FCD34D]'
              : 'bg-[#F6EFE2] border-dashed border-[#D8CBB8] text-[#A99A8C]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {unlocked ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>04. 店庆夜</span>
          </span>
          <span>{unlocked ? '未公开曲目' : '顺序不对，播不出来'}</span>
        </button>
        </div>

      {/* 乐谱残页 */}
      {showSheet ? (
        <div className="rounded-xl border-2 border-[#3A2D28] bg-[#FFFBEB] p-3 mt-2">
          <p className="text-[11px] font-black text-[#3A2D28] mb-1">《店庆夜》· 最后两小节</p>
          <div className="flex items-center gap-1.5 mb-2">
            {['5', '3', '2', '1'].map((n, i) => (
              <span
                key={i}
                className="w-7 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#3A2D28] flex items-center justify-center text-sm font-black text-[#3A2D28] font-mono-tabular"
              >
                {n}
              </span>
            ))}
            <span className="text-[10px] text-[#6E5A52] ml-1">
              末尾两个音，是年份
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClueFound();
              onDiscoverClue('clue_music_code');
              onFlag('music_code');
            }}
            className="cartoon-btn w-full py-1.5 rounded-lg bg-[#A7F3D0] text-[11px] font-black text-[#3A2D28]"
          >
            {discoveredClues.includes('clue_music_code') ? '已收录这段旋律' : '收录这段旋律'}
          </button>
        </div>
      ) : null}

      {canPuzzle ? (
        <p className="text-[10px] text-[#6E5A52] text-center mb-1">
          按波比留下的顺序播放 · 当前 {seq.length}/4
        </p>
      ) : null}
      </div>

      {/* 控制 */}
      <div className="flex items-center justify-center gap-2.5 pt-2 border-t-2 border-[#E5D8C5] shrink-0">
        <button
          type="button"
          onClick={onTogglePlay}
          className="cartoon-btn px-4 py-2 rounded-xl bg-[#FFB830] text-xs font-bold text-[#3A2D28] flex items-center gap-1.5"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? '暂停播放' : '播放八音盒'}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTrack((trackIndex + 1) % TRACKS.length)}
          aria-label="下一首"
          className="cartoon-btn px-3 py-2 rounded-xl bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] flex items-center gap-1"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>下一首</span>
        </button>
      </div>
    </div>
  );
};
