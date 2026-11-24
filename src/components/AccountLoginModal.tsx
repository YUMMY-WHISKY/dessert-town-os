import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { BLAKE_ACCOUNT, POPPY_ACCOUNT } from '../os/seedData';
import { soundEngine } from '../os/sound';

export type LoginAccount = 'poppy' | 'black';

interface AccountLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (account: LoginAccount) => void;
}

/** 甜点镇账号登录框：登录谁的账号，就进入谁的账户 */
export const AccountLoginModal: React.FC<AccountLoginModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim().toLowerCase();
    if (
      cleanedEmail === POPPY_ACCOUNT.email &&
      cleanedPassword === POPPY_ACCOUNT.password
    ) {
      setError(false);
      setEmail('');
      setPassword('');
      soundEngine.playLoginResult(true);
      onSuccess('poppy');
      return;
    }
    if (
      cleanedEmail === BLAKE_ACCOUNT.email &&
      cleanedPassword === BLAKE_ACCOUNT.password
    ) {
      setError(false);
      setEmail('');
      setPassword('');
      soundEngine.playLoginResult(true);
      onSuccess('black');
      return;
    }
    soundEngine.playLoginResult(false);
    setError(true);
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#3A2D28]/35 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className={`w-full max-w-sm rounded-2xl bg-[#FFFDF7] border-[2.5px] border-[#3A2D28] shadow-[6px_6px_0_#3A2D28] p-4 ${
          error ? 'animate-[shake_0.3s]' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-[#3A2D28]">切换账户</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="w-6 h-6 rounded-lg border-2 border-[#3A2D28] bg-[#FFFDF7] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <label htmlFor="login-email" className="block text-[11px] font-bold text-[#6E5A52] mb-1">
          账号
        </label>
        <input
          id="login-email"
          type="text"
          value={email}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
          placeholder="name@nailong.com"
          className="w-full mb-2 px-3 py-1.5 text-sm rounded-xl bg-[#FFFDF7] border-2 border-[#3A2D28] focus:outline-none"
        />

        <label htmlFor="login-password" className="block text-[11px] font-bold text-[#6E5A52] mb-1">
          密码
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="名字拼音 + 生日 MMDD"
          className="w-full mb-2 px-3 py-1.5 text-sm rounded-xl bg-[#FFFDF7] border-2 border-[#3A2D28] focus:outline-none"
        />

        {error ? (
          <p className="text-[11px] font-bold text-[#DC2626] mb-2">账号或密码不对。</p>
        ) : null}

        <button
          type="submit"
          className="cartoon-btn w-full py-2 rounded-xl bg-[#FFB830] text-xs font-black text-[#3A2D28] flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>登录</span>
        </button>
      </form>
    </div>
  );
};
