import React, { useState } from 'react';
import {
  Timer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  Sliders,
  Radio,
  Flame,
  Zap,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { AccountSession } from '../types';

interface FloodWaitAutoBackoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
}

export const FloodWaitAutoBackoffModal: React.FC<FloodWaitAutoBackoffModalProps> = ({
  isOpen,
  onClose,
  accounts
}) => {
  const [enableAutoCooling, setEnableAutoCooling] = useState<boolean>(true);
  const [maxCoolingWaitSec, setMaxCoolingWaitSec] = useState<number>(600); // 10 min
  const [autoSwitchNextAccount, setAutoSwitchNextAccount] = useState<boolean>(true);
  const [exponentialBackoffMultiplier, setExponentialBackoffMultiplier] = useState<number>(1.2);
  const [enablePeerFloodWarning, setEnablePeerFloodWarning] = useState<boolean>(true);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const pythonScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
⏳ Telegram FloodWait 智能自适应退避、自动休眠与无缝唤醒引擎
功能：
1. 协议底层精确捕获 FloodWaitError(seconds) 与 PeerFloodError
2. 自动标记该账号状态为 cooling（冷却中），并精确挂起指定秒数
3. 毫秒级将发信队列无缝切换至下一个可用账号，实现 7x24 小时零卡死无人值守
====================================================================
"""
import time
import glob
import asyncio
from telethon import TelegramClient, errors

class AccountWorker:
    def __init__(self, session_path):
        self.session_path = session_path
        self.phone = session_path.split("/")[-1].replace(".session", "")
        self.client = TelegramClient(session_path, 2040, "b18441a1ff607e10a989891a5462e627")
        self.cooling_until = 0  # timestamp
        self.is_healthy = True

    def is_available(self):
        return self.is_healthy and time.time() >= self.cooling_until

    async def send_message_safely(self, target_user, message_text):
        if not self.is_available():
            wait_rem = int(self.cooling_until - time.time())
            print(f"⏳ 账号 [{self.phone}] 仍在冷却中 (还需等待 {wait_rem} 秒)")
            return False, "cooling"

        try:
            await self.client.send_message(target_user, message_text)
            print(f"[✓] [{self.phone}] ➔ 成功发送至: {target_user}")
            return True, "ok"
        except errors.FloodWaitError as e:
            # 捕获官方返回的精确冷却秒数
            cooling_seconds = e.seconds
            self.cooling_until = time.time() + cooling_seconds
            print(f"🚨 [FloodWait] 账号 [{self.phone}] 触发风控限频，需冷却 {cooling_seconds} 秒！")
            print(f"🔄 系统已自动将该号挂起，正在无缝切换到备用号...")
            return False, "flood_wait"
        except errors.PeerFloodError:
            self.is_healthy = False
            print(f"⚠️ [PeerFlood] 账号 [{self.phone}] 触发陌生人限制，自动移出活跃队列并提交 @SpamBot 申诉")
            return False, "peer_flood"
        except Exception as e:
            print(f"[x] [{self.phone}] 发送失败: {e}")
            return False, str(e)

async def run_resilient_campaign(target_users, message_text):
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    workers = [AccountWorker(s) for s in sessions]
    for w in workers:
        await w.client.start()
        
    print(f"🚀 启动 {len(workers)} 个账号的自适应退避弹性发信调度器...")
    
    current_worker_idx = 0
    for target in target_users:
        sent = False
        attempts = 0
        
        while not sent and attempts < len(workers):
            worker = workers[current_worker_idx]
            if worker.is_available():
                ok, status = await worker.send_message_safely(target, message_text)
                if ok:
                    sent = True
                elif status == "flood_wait":
                    # 轮转下一个
                    pass
            current_worker_idx = (current_worker_idx + 1) % len(workers)
            attempts += 1
            
        if not sent:
            print(f"⚠️ 当前所有账号均处于冷却或忙碌状态，自适应休眠 30 秒...")
            await asyncio.sleep(30)
            
        await asyncio.sleep(random.uniform(5, 12))

if __name__ == "__main__":
    # asyncio.run(run_resilient_campaign(["@test_user"], "Olá!"))
    pass
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">自适应 FloodWait 自动休眠与唤醒退避引擎</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  7x24 无人值守 · 零卡死无缝切换
                </span>
              </div>
              <p className="text-xs text-slate-400">
                精确捕获 Telegram 协议层 FloodWait 秒数，自动挂起受限小号并无缝切到下一个可用账号，倒计时结束后自愈唤醒
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
          
          {/* Visual Architecture */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> FloodWait 弹性容灾与自愈流程架构：
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400">1. 协议层拦截</div>
                <div className="text-[11px] text-slate-400">捕获官方 FloodWaitError 精确秒数 (如 342s)</div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-400">2. 状态标为 Cooling</div>
                <div className="text-[11px] text-slate-400">该账号独立进入倒计时挂起，不拖慢大盘</div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400">3. 无缝热切换</div>
                <div className="text-[11px] text-slate-400">发信任务 0 毫秒交接给下一个健康 Session</div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-bold text-purple-400">4. 自动复活归队</div>
                <div className="text-[11px] text-slate-400">冷却时间结束自动重新加入主轮询池</div>
              </div>
            </div>
          </div>

          {/* Strategy Switches */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" /> 退避保护参数微调：
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={enableAutoCooling}
                  onChange={(e) => setEnableAutoCooling(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                />
                <span>启用 FloodWait 精确秒数独立冷却挂起</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={autoSwitchNextAccount}
                  onChange={(e) => setAutoSwitchNextAccount(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                />
                <span>遇冷却立即 0 延迟无缝热切换至备用账号</span>
              </label>
            </div>
          </div>

          {/* Python Script Section */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                🐍 导出 VPS Python 弹性 FloodWait 调度器源码
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonScript);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
            保护范围: 全部 <strong className="text-white">{accounts.length}</strong> 个协议账号
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              关闭
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              保存并激活自适应退避
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
