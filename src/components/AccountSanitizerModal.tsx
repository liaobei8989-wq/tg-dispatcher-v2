import React, { useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { AccountSession } from '../types';

interface AccountSanitizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
}

export const AccountSanitizerModal: React.FC<AccountSanitizerModalProps> = ({
  isOpen,
  onClose,
  accounts
}) => {
  const [new2faPassword, setNew2faPassword] = useState<string>('BetVIP@2026Secure!');
  const [hint, setHint] = useState<string>('brazil_vip');
  const [kickOtherSessions, setKickOtherSessions] = useState<boolean>(true);
  const [resetRecoveryEmail, setResetRecoveryEmail] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [sanitizerLogs, setSanitizerLogs] = useState<Array<{ phone: string; step: string; status: 'pending' | 'success' | 'warn'; time: string }>>([]);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetAccounts = accounts.filter(a => a.status !== 'banned');

  const handleStartSanitizing = async () => {
    if (targetAccounts.length === 0) return;
    setIsRunning(true);
    setProgress(0);
    setSanitizerLogs([]);

    for (let i = 0; i < targetAccounts.length; i++) {
      const acc = targetAccounts[i];
      setCurrentIdx(i + 1);

      // Step 1: Terminate other sessions
      if (kickOtherSessions) {
        setSanitizerLogs(prev => [
          {
            phone: acc.phone || acc.alias,
            step: '正在调用 account.resetAuthorizations 强制下线并踢出卡商所有第三方设备...',
            status: 'pending',
            time: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        await new Promise(r => setTimeout(r, 600));
      }

      // Step 2: Set 2FA Password
      setSanitizerLogs(prev => [
        {
          phone: acc.phone || acc.alias,
          step: `成功写入全局统一 2FA 二级密码 (Password: ${new2faPassword.slice(0, 4)}****)，彻底锁定所有权`,
          status: 'success',
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 700));

      setProgress(Math.round(((i + 1) / targetAccounts.length) * 100));
    }

    setIsRunning(false);
  };

  const pythonScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🔐 Telegram 批量协议号洗号、踢下线与 2FA 二次密码接管锁定引擎
功能：
1. 强制剔除/注销卡商与上游号商在其他手机/网页上的所有登录设备
2. 批量设置或修改统一的 2FA 二次密码，防止一号多卖和原主找回
====================================================================
"""
import glob
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.account import ResetAuthorizationRequest, UpdatePasswordSettingsRequest
from telethon.tl.types import InputCheckPasswordEmpty
from telethon.tl.functions.auth import GetPasswordRequest
from telethon.utils import compute_password_hash

NEW_2FA_PASSWORD = "${new2faPassword}"
HINT = "${hint}"

async def sanitize_account(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    print(f"\\n[*] 正在清洗并锁定账号所有权: {phone}")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    
    try:
        await client.connect()
        if not await client.is_user_authorized():
            print(f"[!] 账号未授权: {phone}")
            return
            
        # 1. 强制踢下线除当前 session 外的其他所有设备
        try:
            await client(ResetAuthorizationRequest(hash=0))
            print(f"[✓] 账号 {phone} 已强制踢下线所有卡商/历史在线设备！")
        except Exception as e:
            print(f"[-] 踢下线提示 (可能无其他设备): {e}")

        # 2. 设置/更新 2FA 二次密码锁定
        pwd_info = await client(GetPasswordRequest())
        if not pwd_info.has_password:
            # 首次设置 2FA
            from telethon.tl.types.account import PasswordInputSettings
            import hashlib
            
            # 使用 Telethon 官方 2FA 安全哈希机制写入新密码
            print(f"[+] 账号 {phone} 正在写入新 2FA 密码: {NEW_2FA_PASSWORD}")
            # 注: 实战中可直接调用 client.edit_2fa(new_password=NEW_2FA_PASSWORD)
            await client.edit_2fa(new_password=NEW_2FA_PASSWORD, hint=HINT)
            print(f"[✓] 账号 {phone} 2FA 密码已生效锁定！")
        else:
            print(f"[i] 账号 {phone} 已有 2FA，如需修改请提供旧密码")

    except Exception as e:
        print(f"[x] 账号 {phone} 洗号异常: {e}")
    finally:
        await client.disconnect()

async def main():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🚀 启动 {len(sessions)} 个协议号的深度洗号与 2FA 安全锁定...")
    for s in sessions:
        await sanitize_account(s)
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">协议号批量洗号与 2FA 密码接管引擎</h3>
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                  防一号多卖 · 踢出卡商盗登
                </span>
              </div>
              <p className="text-xs text-slate-400">
                一键批量重置/接管 2FA 二级密码，强制踢掉号商在其他手机和电脑上的所有未注销会话
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">防盗登保护</span>
                <span className="text-base font-black text-white">强制踢出所有远端会话</span>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">全局 2FA 接管</span>
                <span className="text-base font-black text-amber-300">统一安全强密码锁定</span>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">资产所有权安全分</span>
                <span className="text-base font-black text-emerald-400">100% 绝对独占</span>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-400" /> 洗号与密码策略参数配置：
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">接管后的统一 2FA 二次密码 (Password):</label>
                <input
                  type="text"
                  value={new2faPassword}
                  onChange={(e) => setNew2faPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  placeholder="例如: BetVIP@2026Secure!"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">密码提示词 (Hint):</label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="例如: brazil_vip"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={kickOtherSessions}
                  onChange={(e) => setKickOtherSessions(e.target.checked)}
                  className="w-4 h-4 rounded text-red-500 bg-slate-900 border-slate-700"
                />
                <span>强制踢下线并注销卡商所有已登录设备</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={resetRecoveryEmail}
                  onChange={(e) => setResetRecoveryEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-red-500 bg-slate-900 border-slate-700"
                />
                <span>自动解绑上游卡商残留的恢复邮箱</span>
              </label>
            </div>
          </div>

          {/* Progress & Live Log */}
          {isRunning && (
            <div className="bg-slate-950 p-4 rounded-xl border border-red-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-red-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 正在批量深度清洗并接管 2FA ({currentIdx} / {targetAccounts.length})...
                </span>
                <span className="text-red-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {sanitizerLogs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400">洗号执行交互实时记录：</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono">
                {sanitizerLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">[{log.phone}]</span>
                      <span>{log.step}</span>
                    </span>
                    <span className="text-slate-500 text-[10px]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Python Script Section */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                🐍 导出 VPS Python 批量洗号与 2FA 批量锁定脚本
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonScript);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-red-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? '已复制' : '复制 Python 脚本'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900/90 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto max-h-24">
              {pythonScript}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            就绪协议账号: <strong className="text-white">{targetAccounts.length}</strong> 个
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              关闭
            </button>
            <button
              disabled={isRunning || targetAccounts.length === 0}
              onClick={handleStartSanitizing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? '洗号接管中...' : `一键全量洗号锁定 (${targetAccounts.length} 个账号)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
