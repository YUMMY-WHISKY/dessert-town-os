import React, { useEffect, useState } from 'react';
import { X, LogIn, Cat, PawPrint, UserRound } from 'lucide-react';
import { BLAKE_ACCOUNT, POPPY_ACCOUNT } from '../os/seedData';
import { soundEngine } from '../os/sound';
import { LoginAccount, readLoggedInAccounts, writeLoggedInAccounts } from '../os/saveGame';

// ---- 模块级内存缓存（同一页面生命周期内有效） ----
let _cachedAccounts: LoginAccount[] | null = null;
let _initPromise: Promise<void> | null = null;

function ensureLoaded(): Promise<void> {
  if (_cachedAccounts !== null) return Promise.resolve();
  if (!_initPromise) {
    _initPromise = readLoggedInAccounts()
      .then((list) => {
        _cachedAccounts = list;
      })
      .catch(() => {
        _cachedAccounts = [];
      });
  }
  return _initPromise;
}

export function loadLoggedInAccounts(): LoginAccount[] {
  if (_cachedAccounts === null) {
    _cachedAccounts = [];
    ensureLoaded();
  }
  return [..._cachedAccounts];
}

async function _save(accounts: LoginAccount[]): Promise<void> {
  _cachedAccounts = [...accounts];
  try {
    await writeLoggedInAccounts(accounts);
  } catch {
    // ignore — 内存缓存已更新，下次打开仍然能用
  }
}

async function _markLoggedIn(account: LoginAccount): Promise<LoginAccount[]> {
  await ensureLoaded();
  const list = [...(_cachedAccounts ?? [])];
  if (!list.includes(account)) {
    list.push(account);
    await _save(list);
  }
  return list;
}

interface AccountLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (account: LoginAccount) => void;
  onSwitchDetective?: () => void;
}

const ACCOUNT_META: Record<LoginAccount, { label: string; email: string; icon: React.ReactNode; color: string }> = {
  poppy: {
    label: '波比',
    email: POPPY_ACCOUNT.email,
    icon: <Cat className="w-4 h-4" />,
    color: 'text-[#DC2626] bg-[#FEE2E2] border-[#DC2626]',
  },
  black: {
    label: '布莱克',
    email: BLAKE_ACCOUNT.email,
    icon: <PawPrint className="w-4 h-4" />,
    color: 'text-[#1F2937] bg-[#E5E7EB] border-[#1F2937]',
  },
};

/** 甜点镇账号登录框：自管已登录账户列表（云存档 + 内存缓存），支持快捷切换 */
export const AccountLoginModal: React.FC<AccountLoginModalProps> = ({
  open,
  onClose,
  onSuccess,
  onSwitchDetective,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  // 自己维护的已登录账户列表，从云异步加载 + 登录成功后即时更新
  const [accounts, setAccounts] = useState<LoginAccount[]>([]);

  // 打开时从云加载（等待完成再显示）
  useEffect(() => {
    if (!open) return;
    setEmail('');
    setPassword('');
    setError(false);
    // 重新加载确保拿到最新（可能其他 App 写入了新账户）
    _cachedAccounts = null;
    _initPromise = null;
    ensureLoaded().then(() => {
      setAccounts([...(_cachedAccounts ?? [])]);
    });
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim().toLowerCase();
    let matched: LoginAccount | null = null;
    if (
      cleanedEmail === POPPY_ACCOUNT.email &&
      cleanedPassword === POPPY_ACCOUNT.password
    ) {
      matched = 'poppy';
    } else if (
      cleanedEmail === BLAKE_ACCOUNT.email &&
      cleanedPassword === BLAKE_ACCOUNT.password
    ) {
      matched = 'black';
    }

    if (matched) {
      soundEngine.playLoginResult(true);
      const updated = await _markLoggedIn(matched);
      setAccounts(updated);
      onSuccess(matched);
      return;
    }
    soundEngine.playLoginResult(false);
    setError(true);
  };

  const quickSwitch = (a: LoginAccount) => {
    soundEngine.playLoginResult(true);
    onSuccess(a);
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#3A2D28]/35 flex items-center justify-center p-4">
      <div
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

        {/* 快捷切换区 */}
        {(accounts.length > 0 || onSwitchDetective) && (
          <div className="mb-4 pb-3 border-b-2 border-dashed border-[#D8CBB8]">
            <p className="text-[10px] font-bold text-[#6E5A52] mb-2">快捷切换</p>
            <div className="flex flex-wrap gap-1.5">
              {onSwitchDetective && (
                <button
                  type="button"
                  onClick={() => { soundEngine.playLoginResult(true); onSwitchDetective(); }}
                  className="px-2.5 py-1 rounded-lg border-2 border-[#3A2D28] bg-[#FFF8EB] text-[11px] font-black text-[#3A2D28] flex items-center gap-1"
                >
                  <UserRound className="w-3.5 h-3.5" />
                  侦探
                </button>
              )}
              {accounts.map((a) => {
                const meta = ACCOUNT_META[a];
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => quickSwitch(a)}
                    className={`px-2.5 py-1 rounded-lg border-2 text-[11px] font-black flex items-center gap-1 ${meta.color}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={submit}>
          <p className="text-[10px] font-bold text-[#6E5A52] mb-2">或输入密码登录新账户</p>

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
    </div>
  );
};
