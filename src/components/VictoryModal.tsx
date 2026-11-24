import React from 'react';
import { Award, Heart, RotateCcw } from 'lucide-react';
import { AVATAR_SHIBA_URL, ENDING_TEXT } from '../os/seedData';
import { EndingId } from '../os/types';
import wechatQr from '../assets/images/qr_wechat.jpg';
import alipayQr from '../assets/images/qr_alipay.jpg';

interface VictoryModalProps {
  cluesFound: number;
  totalClues: number;
  elapsedSeconds: number;
  score: number;
  summary: string;
  ending: EndingId;
  onRestart: () => void;
  onContinueExploring: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  cluesFound,
  totalClues,
  elapsedSeconds,
  score,
  summary,
  ending,
  onRestart,
  onContinueExploring,
}) => {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const endingText = ENDING_TEXT[ending];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="案件结案"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#3A2D28]/55"
    >
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto cartoon-scroll rounded-3xl bg-[#FFFDF7] border-[3px] border-[#3A2D28] shadow-[8px_8px_0px_#3A2D28] p-6 md:p-7 text-center">
        <div className="mx-auto w-16 h-16 rounded-full border-[3px] border-[#3A2D28] shadow-[3px_3px_0px_#3A2D28] overflow-hidden bg-[#FEF3C7] mb-3">
          <img
            src={AVATAR_SHIBA_URL}
            alt="小橘探长"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>甜点镇 · 结案</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-[#3A2D28] mb-3">{endingText.title}</h2>

        <div className="text-left p-3 rounded-xl bg-[#FFF8EB] border-2 border-[#3A2D28] mb-4 space-y-1.5">
          {endingText.body.map((line, i) => (
            <p key={i} className="text-[11px] text-[#3A2D28] leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] p-2">
            <p className="text-[10px] font-medium text-[#6E5A52]">探案评分</p>
            <p className="text-lg font-black text-[#3A2D28] tabular-nums">{score}</p>
          </div>
          <div className="rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] p-2">
            <p className="text-[10px] font-medium text-[#6E5A52]">收集线索</p>
            <p className="text-lg font-black text-[#3A2D28] tabular-nums">
              {cluesFound}/{totalClues}
            </p>
          </div>
          <div className="rounded-xl bg-[#F6EFE2] border-2 border-[#3A2D28] p-2">
            <p className="text-[10px] font-medium text-[#6E5A52]">破案用时</p>
            <p className="text-lg font-black text-[#3A2D28] font-mono-tabular">{formattedTime}</p>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-[#3A2D28]/25 pt-4 mb-4">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#6E5A52] mb-3">
            <Heart className="w-3 h-3 text-pink-500" />
            如果玩得开心，给作者买杯奶茶吧～
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-[280px] mx-auto">
            <div className="rounded-xl bg-[#A7F3D0] border-2 border-[#3A2D28] p-2 flex flex-col items-center">
              <div className="w-full aspect-square rounded-lg bg-white border-2 border-[#3A2D28] p-1 overflow-hidden">
                <img src={wechatQr} alt="微信收款码" className="w-full h-full object-contain" draggable={false} />
              </div>
              <span className="mt-1.5 text-[11px] font-black text-[#07C160]">微信</span>
            </div>
            <div className="rounded-xl bg-[#BFDBFE] border-2 border-[#3A2D28] p-2 flex flex-col items-center">
              <div className="w-full aspect-square rounded-lg bg-white border-2 border-[#3A2D28] p-1 overflow-hidden">
                <img src={alipayQr} alt="支付宝收款码" className="w-full h-full object-contain" draggable={false} />
              </div>
              <span className="mt-1.5 text-[11px] font-black text-[#1677FF]">支付宝</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={onContinueExploring}
            className="cartoon-btn px-4 py-2 rounded-xl bg-[#FFFDF7] text-xs font-bold text-[#3A2D28] whitespace-nowrap"
          >
            继续留在桌面
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="cartoon-btn px-4 py-2 rounded-xl bg-[#FFB830] text-xs font-bold text-[#3A2D28] flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>从头再查一次</span>
          </button>
        </div>
      </div>
    </div>
  );
};
