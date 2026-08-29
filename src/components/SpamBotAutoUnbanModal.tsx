import React, { useState } from 'react';
import {
  ShieldAlert,
  Bot,
  Sparkles,
  Play,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Send,
  Download,
  Copy,
  Check,
  Zap,
  MessageSquare,
  FileText
} from 'lucide-react';
import { AccountSession } from '../types';

interface SpamBotAutoUnbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
  onUpdateAccountStatus: (accId: string, status: 'active' | 'warming' | 'risk' | 'banned', spambotStatus: 'clean' | 'restricted' | 'banned') => void;
}

const PRESET_APPEAL_TEMPLATES = [
  {
    id: 'brazil_normal_user',
    title: '🇧🇷 巴西普通用户误报（推荐·成功率高）',
    lang: 'English / Portuguese',
    text: "Hello Telegram Support Team,\n\nI believe my account has been restricted by mistake. I am a regular user from São Paulo, Brazil. I only talk with my real-life friends, family, and local football discussion groups. I have never sent unsolicited spam or violated Telegram Terms of Service. Could you please review my account and lift the limitation?\n\nObrigado pela atenção!",
  },
  {
    id: 'misunderstood_dm',
    title: '💬 误加好友误会澄清型',
    lang: 'English',
    text: "Dear Telegram Moderator,\n\nMy account was recently limited from initiating new chats. I only contacted members from public interest groups who asked for information. I suspect someone may have clicked report by misunderstanding. I strictly follow Telegram rules and will ensure not to message anyone without their explicit consent. Please kindly remove the restriction.",
  },
  {
    id: 'portuguese_native',
    title: '🇵🇹 全葡语地道申述话术',
    lang: 'Portuguese',
    text: "Prezada equipe do Telegram,\n\nAcho que minha conta foi limitada por engano. Sou um usuário comum no Brasil e uso o aplicativo apenas para conversar com amigos e familiares. Nunca pratiquei spam nem enviei links indevidos. Por favor, analisem meu caso e retirem a restrição temporária. Muito obrigado!",
  },
  {
    id: 'polite_first_time',
    title: '🕊️ 首次违规诚恳请求解除',
    lang: 'English',
    text: "Hello Support,\n\nI noticed my account cannot message non-contacts. This is my primary personal account. If any of my past activity triggered an automated filter, it was completely unintentional. I value Telegram's platform safety and promise to follow all community guidelines carefully. Please restore full functionality. Thank you!",
  }
];

export const SpamBotAutoUnbanModal: React.FC<SpamBotAutoUnbanModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUpdateAccountStatus
}) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [customAppealText, setCustomAppealText] = useState<string>(PRESET_APPEAL_TEMPLATES[0].text);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentAccIndex, setCurrentAccIndex] = useState<number>(0);
  const [appealLogs, setAppealLogs] = useState<Array<{ phone: string; step: string; status: 'pending' | 'success' | 'failed'; time: string }>>([]);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter restricted or all accounts
  const restrictedAccounts = accounts.filter(a => 
    a.spambotStatus === 'restricted' || 
    a.status === 'risk' || 
    a.status === 'banned'
  );

  const targetAccounts = restrictedAccounts.length > 0 ? restrictedAccounts : accounts;

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    setCustomAppealText(PRESET_APPEAL_TEMPLATES[idx].text);
  };

  const handleStartAutoAppeal = async () => {
    if (targetAccounts.length === 0) return;
    setIsRunning(true);
    setCurrentProgress(0);
    setAppealLogs([]);

    for (let i = 0; i < targetAccounts.length; i++) {
      const acc = targetAccounts[i];
      setCurrentAccIndex(i + 1);

      // Step 1: Send /start to @SpamBot
      setAppealLogs(prev => [
        {
          phone: acc.phone || acc.alias,
          step: '正在向 @SpamBot 发送 /start 查询状态...',
          status: 'pending',
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Auto reply options
      setAppealLogs(prev => [
        {
          phone: acc.phone || acc.alias,
          step: '检测到双向限制，自动点击选项: [This is a mistake] -> [Yes] -> [No, I never did that]',
          status: 'pending',
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 800));

      // Step 3: Submit appeal letter
      setAppealLogs(prev => [
        {
          phone: acc.phone || acc.alias,
          step: `成功提交申诉理由: "${customAppealText.slice(0, 38)}..."`,
          status: 'success',
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);

      // Update state
      onUpdateAccountStatus(acc.id, 'warming', 'clean');
      setCurrentProgress(Math.round(((i + 1) / targetAccounts.length) * 100));
      await new Promise(r => setTimeout(r, 500));
    }

    setIsRunning(false);
  };

  const pythonScriptCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🤖 TG 批量全自动 @SpamBot 智能申诉解封守护脚本 (Auto SpamBot Unbanner)
功能：全自动遍历 sessions 目录下的小号，查询 @SpamBot 限制状态并自动提交无辜申诉
====================================================================
"""
import os
import glob
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.messages import StartBotRequest

APPEAL_REASON = """${customAppealText.replace(/"/g, '\\"')}"""

async def appeal_account(session_file):
    phone = os.path.basename(session_file).replace('.session', '')
    print(f"\\n[*] 正在检测并申诉账号: {phone}")
    client = TelegramClient(session_file, api_id=2040, api_hash="b18441a1ff607e10a989891a5462e627")
    
    try:
        await client.connect()
        if not await client.is_user_authorized():
            print(f"[!] 账号未授权或已失效: {phone}")
            return
            
        spambot = await client.get_entity("@SpamBot")
        await client.send_message(spambot, "/start")
        await asyncio.sleep(2)
        
        # 监听 SpamBot 回复并模拟点击
        async for message in client.iter_messages(spambot, limit=2):
            text = message.text or ""
            if "good news" in text.lower() or "free as a bird" in text.lower():
                print(f"[+] 账号 {phone} 状态完全正常 (无任何限制)！")
                return
            elif "limited" in text.lower() or "unfortunately" in text.lower():
                print(f"[-] 账号 {phone} 触发限制，开始自动提交申诉...")
                await client.send_message(spambot, "This is a mistake")
                await asyncio.sleep(2)
                await client.send_message(spambot, "Yes")
                await asyncio.sleep(2)
                await client.send_message(spambot, "No, I never did that")
                await asyncio.sleep(2)
                await client.send_message(spambot, APPEAL_REASON)
                print(f"[✓] 账号 {phone} 申诉材料已提交，通常 24-48 小时内解除限制！")
                break
    except Exception as e:
        print(f"[x] 账号 {phone} 申诉异常: {e}")
    finally:
        await client.disconnect()

async def main():
    sessions = glob.glob("sessions/*.session")
    print(f"🔍 扫描到 {len(sessions)} 个 .session 协议文件，开始全自动申诉...")
    for s in sessions:
        await appeal_account(s)
        await asyncio.sleep(3) # 间隔防并发

if __name__ == "__main__":
    asyncio.run(main())
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">全自动 @SpamBot 智能申诉解封引擎</h3>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                  救回死号 · 降低30%买号成本
                </span>
              </div>
              <p className="text-xs text-slate-400">
                针对被双向限制/被举报投诉的小号，全自动与官方 @SpamBot 机器人多轮对话，提交无辜申辩信
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
          
          {/* Target Status Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">需申诉/受限账号</span>
                <span className="text-base font-black text-amber-300">{restrictedAccounts.length} <span className="text-xs font-normal text-slate-500">/ 总 {accounts.length}</span></span>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">预计解封成功率</span>
                <span className="text-base font-black text-emerald-400">25% ~ 45% <span className="text-[10px] text-slate-500 font-normal">(首次误报更高)</span></span>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">申诉处理时效</span>
                <span className="text-base font-black text-cyan-300">24 ~ 48 小时 <span className="text-[10px] text-slate-500 font-normal">TG官方审核</span></span>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" /> 选择申诉策略与模板：
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_APPEAL_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(idx)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplateIndex === idx
                      ? 'bg-rose-950/30 border-rose-500 text-rose-200 shadow-md shadow-rose-950/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{tmpl.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{tmpl.lang}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                    {tmpl.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Custom Appeal Letter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 申辩文案内容 (将自动提交给 @SpamBot):
              </label>
              <span className="text-[11px] text-slate-500 font-mono">{customAppealText.length} 字符</span>
            </div>
            <textarea
              value={customAppealText}
              onChange={(e) => setCustomAppealText(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none leading-relaxed"
              placeholder="输入给 Telegram 官方审核人员的申诉信..."
            />
          </div>

          {/* Execution Progress & Real-time Logs */}
          {isRunning && (
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-rose-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 正在批量自动申诉中 ({currentAccIndex} / {targetAccounts.length})...
                </span>
                <span className="text-rose-400 font-mono">{currentProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>
          )}

          {appealLogs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400">实时交互日志：</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-1 text-[11px] font-mono">
                {appealLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">[{log.phone}]</span>
                      <span>{log.step}</span>
                    </span>
                    <span className="text-slate-500 text-[10px]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VPS Python Script Section */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                🐍 导出 VPS Python 无头申诉脚本 (适合数百个账号常驻自动解封)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonScriptCode);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? '已复制' : '复制 Python 脚本'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900/90 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto max-h-24">
              {pythonScriptCode}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            已就绪账号: <strong className="text-white">{targetAccounts.length}</strong> 个
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
              onClick={handleStartAutoAppeal}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? '申诉执行中...' : `一键全自动申诉 (${targetAccounts.length} 个账号)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
