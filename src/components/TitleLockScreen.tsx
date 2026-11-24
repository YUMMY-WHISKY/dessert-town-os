import React, { useEffect, useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { AVATAR_SHIBA_URL, WALLPAPER_URL } from '../os/seedData';
import { soundEngine } from '../os/sound';

interface TitleLockScreenProps {
  onStart: () => void;
}

const BOOT_LINES = [
  'SWEET-OS 1.0  ·  开机自检',
  '[ OK ] 内存 640K',
  '[ OK ] 载入甜点镇档案库',
  '[ OK ] 挂载喵喵信箱 / 汪汪聊天',
  '[ OK ] 作者签名校验',
  '[ OK ] 小橘探长身份校验',
  '启动完成 · 等待开机口令',
];

/** 开机口令：作者的名字 Yooning */
const BOOT_PASSWORD = 'yooning';

/** 开机动画 → 开机口令 → 进入桌面 */
export const TitleLockScreen: React.FC<TitleLockScreenProps> = ({ onStart }) => {
  const [bootStep, setBootStep] = useState(0);
  const [stage, setStage] = useState<'boot' | 'locked'>('boot');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (stage !== 'boot') return;
    if (bootStep < BOOT_LINES.length - 1) {
      const timer = window.setTimeout(() => {
        soundEngine.playType();
        setBootStep((s) => s + 1);
      }, 380);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      soundEngine.playNotify();
      setStage('locked');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [bootStep, stage]);

  const progress = Math.round(((bootStep + 1) / BOOT_LINES.length) * 100);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === BOOT_PASSWORD) {
      setError(false);
      soundEngine.playBoot();
      onStart();
      return;
    }
    soundEngine.playLoginResult(false);
    setError(true);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden flex items-center justify-center p-6 bg-[#CFE9FF]">
      <img
        src={WALLPAPER_URL}
        alt="甜点镇桌面背景"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-85"
      />
      <div className="absolute inset-0 bg-[#FFFDF7]/55" />

      {stage === 'boot' ? (
        <div className="relative z-10 w-full max-w-lg rounded-3xl bg-[#FFFDF7] border-[3px] border-[#3A2D28] shadow-[8px_8px_0px_#3A2D28] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl border-[3px] border-[#3A2D28] shadow-[3px_3px_0px_#3A2D28] overflow-hidden bg-[#FEF3C7] shrink-0"
              style={{ animation: 'boot-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <img
                src={AVATAR_SHIBA_URL}
                alt="小橘探长头像"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.3em] text-[#D97706]">SWEET-OS</p>
              <p className="text-base md:text-lg font-black text-[#3A2D28] truncate">
                甜点镇警局 · 证物计算机
              </p>
              <p className="text-[10px] font-bold text-[#8B7A6B]">小橘探长桌面 OS · 开机自检</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FFF8EB] border-2 border-[#3A2D28] p-4 font-mono-tabular text-[11px] leading-6 text-[#4A3A32] min-h-[168px]">
            {BOOT_LINES.slice(0, bootStep + 1).map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">
                <span className="text-[#059669] font-black">›</span> {line}
              </p>
            ))}
            <span
              className="inline-block w-2 h-3.5 bg-[#D97706] align-middle"
              style={{ animation: 'boot-cursor 1s step-end infinite' }}
            />
          </div>

          <div className="mt-4 h-3 rounded-full bg-[#F6EFE2] border-2 border-[#3A2D28] overflow-hidden">
            <div
              className="h-full bg-[#FFB830] transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-black text-[#8B7A6B]">
            <span>正在启动… {progress}%</span>
            <span>🐾 甜点镇</span>
          </div>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className={`relative z-10 w-full max-w-sm rounded-3xl bg-[#FFFDF7] border-[3px] border-[#3A2D28] shadow-[8px_8px_0px_#3A2D28] p-6 ${
            error ? 'animate-[shake_0.3s]' : ''
          }`}
        >
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full border-[3px] border-[#3A2D28] shadow-[3px_3px_0px_#3A2D28] overflow-hidden bg-[#FEF3C7] mb-2">
              <img
                src={AVATAR_SHIBA_URL}
                alt="小橘探长头像"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] font-black tracking-[0.3em] text-[#D97706]">SWEET-OS</p>
            <p className="text-base font-black text-[#3A2D28]">甜点镇警局 · 证物计算机</p>
            <p className="text-[11px] font-bold text-[#8B7A6B] flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3" />
              <span>系统已锁定</span>
            </p>
          </div>

          <label htmlFor="boot-password" className="block text-[11px] font-bold text-[#6E5A52] mb-1">
            开机口令
          </label>
          <input
            id="boot-password"
            type="password"
            value={password}
            autoFocus
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className="w-full mb-2 px-3 py-2 text-center text-base rounded-xl bg-[#FFFDF7] border-2 border-[#3A2D28] focus:outline-none"
          />

          {error ? (
            <p className="text-[11px] font-bold text-[#DC2626] mb-2">口令不对，再想想。</p>
          ) : (
            <p className="text-[10px] text-[#A99A8C] mb-2 leading-relaxed">
                 口令是作者的名字。
            </p>
          )}

          <button
            type="submit"
            className="cartoon-btn w-full py-2 rounded-xl bg-[#FFB830] text-xs font-black text-[#3A2D28] flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>解锁</span>
          </button>
        </form>
      )}
    </main>
  );
};
