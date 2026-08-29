import React, { useState } from 'react';
import {
  Bell,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  MessageSquare,
  Radio,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { AccountSession } from '../types';

interface LeadAlertWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
}

const DEFAULT_INTENT_KEYWORDS = [
  'pix', 'bonus', 'bônus', 'deposito', 'depósito', 'depositar', 
  'saque', 'sacar', 'link', 'cadastro', 'cadastrar', 'plataforma', 
  'como jogar', 'quanto paga', 'paga mesmo', 'quero', 'entrar', 'vip'
];

export const LeadAlertWebhookModal: React.FC<LeadAlertWebhookModalProps> = ({
  isOpen,
  onClose,
  accounts
}) => {
  const [tgBotToken, setTgBotToken] = useState<string>('7182938491:AAH8a9s8d9f0g1h2j3k4l5m6n7o8p9q0');
  const [tgAdminChatId, setTgAdminChatId] = useState<string>('-1002345678901');
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>('https://oapi.dingtalk.com/robot/send?access_token=...');
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_INTENT_KEYWORDS);
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  const [enableTgBotPush, setEnableTgBotPush] = useState<boolean>(true);
  const [enableSoundAlert, setEnableSoundAlert] = useState<boolean>(true);
  const [testSent, setTestSent] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    if (newKeywordInput.trim() && !keywords.includes(newKeywordInput.trim().toLowerCase())) {
      setKeywords([...keywords, newKeywordInput.trim().toLowerCase()]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSendTestAlert = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const pythonListenerScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
⚡ Telegram 100+ 账号高意向私信秒级实时监听与 TG 管理群告警守护进程
功能：常驻后台监听所有 session 的新私信，命中博彩/充值意向词立即推送到管理员 TG 报警群
====================================================================
"""
import glob
import asyncio
import aiohttp
from telethon import TelegramClient, events

# ⚙️ 告警配置
TG_ALERT_BOT_TOKEN = "${tgBotToken}"
TG_ADMIN_CHAT_ID = "${tgAdminChatId}"
INTENT_KEYWORDS = ${JSON.stringify(keywords)}

async def send_tg_admin_alert(from_user, account_phone, text):
    msg_card = (
        f"🚨 <b>【发现高意向巴西客户！】</b>\\n"
        f"━━━━━━━━━━━━━━━━━━━━\\n"
        f"👤 <b>客户TG:</b> @{from_user.username or '未知'} (ID: <code>{from_user.id}</code>)\\n"
        f"📱 <b>接待小号:</b> <code>{account_phone}</code>\\n"
        f"💬 <b>客户原话:</b> <i>\\"{text}\\"</i>\\n"
        f"🎯 <b>命中意向词:</b> 充值 / 玩法咨询\\n"
        f"━━━━━━━━━━━━━━━━━━━━\\n"
        f"👉 <b>客服请立即打开对应小号跟进并发送注册链接！</b>"
    )
    url = f"https://api.telegram.org/bot{TG_ALERT_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TG_ADMIN_CHAT_ID,
        "text": msg_card,
        "parse_mode": "HTML"
    }
    async with aiohttp.ClientSession() as session:
        await session.post(url, json=payload)
        print(f"[⚡] 已向 TG 管理群推送高意向客资: {from_user.id}")

async def listen_account(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    
    @client.on(events.NewMessage(incoming=True))
    async def handler(event):
        if event.is_private:
            sender = await event.get_sender()
            text = (event.raw_text or "").lower()
            
            # 关键词意向命中过滤
            if any(kw in text for kw in INTENT_KEYWORDS):
                print(f"🔥 捕获高意向咨询 [{phone}] <- {sender.id}: {event.raw_text}")
                await send_tg_admin_alert(sender, phone, event.raw_text)

    await client.start()
    print(f"[*] 账号 {phone} 监听就绪...")
    await client.run_until_disconnected()

async def main():
    sessions = glob.glob("sessions/*.session")
    print(f"🚀 启动 {len(sessions)} 个账号的全天候高意向私信监听引擎...")
    tasks = [listen_account(s) for s in sessions]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">高意向私信秒级 Webhook 告警与 TG 管理群推送</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  30秒客服快速转化 · 意向关键词拦截
                </span>
              </div>
              <p className="text-xs text-slate-400">
                实时聚合 100+ 协议号接收到的新消息，当客户提到 PIX、充值、玩法等关键词时，秒级在 TG 管理群告警
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
          
          {/* Channel Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TG Bot Push Config */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-cyan-400" /> Telegram 告警机器人配置 (推荐)
                </span>
                <label className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTgBotPush}
                    onChange={(e) => setEnableTgBotPush(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>已启用</span>
                </label>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Telegram Bot Token (来自 @BotFather):</label>
                <input
                  type="text"
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                  placeholder="例如: 123456789:AA..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">管理员/客服群 Chat ID:</label>
                <input
                  type="text"
                  value={tgAdminChatId}
                  onChange={(e) => setTgAdminChatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                  placeholder="例如: -100192837482"
                />
              </div>
            </div>

            {/* Simulated Telegram Alert Card */}
            <div className="bg-slate-950/90 border border-emerald-500/40 p-3.5 rounded-xl space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> TG 管理群收到报警卡片样式示例：
                </span>
                <span className="text-[10px] text-slate-500 font-mono">秒级推送</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300 leading-relaxed">
                <div className="text-emerald-400 font-bold">🚨 【发现高意向巴西客户！】</div>
                <div>👤 客户: <span className="text-cyan-300">@gabriel_br99</span> (ID: 61829482)</div>
                <div>📱 接待小号: <span className="text-amber-300">+55 11 98765-4321</span></div>
                <div>💬 客户原话: <span className="text-white italic">"Mano, como que faz pra depositar via PIX? Tem bônus de 100%?"</span></div>
                <div className="text-amber-400 text-[10px]">🎯 命中意向词: [pix, bonus, depositar]</div>
              </div>
              <button
                onClick={handleSendTestAlert}
                className="w-full py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {testSent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5" />}
                {testSent ? '测试报警已发送成功！' : '发送一条模拟测试告警'}
              </button>
            </div>

          </div>

          {/* Intent Keywords Filter Dictionary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> 意向词拦截字典 (命中任意词触发报警)：
              </label>
              <span className="text-[10px] text-slate-500 font-mono">共 {keywords.length} 个意向词</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                placeholder="输入新关键词 (如: fortune tiger)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleAddKeyword}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
              >
                + 添加
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="bg-slate-950 text-amber-300 border border-slate-800 text-xs px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-mono"
                >
                  {kw}
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-slate-500 hover:text-rose-400 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* VPS Python Script Section */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                🐍 导出 VPS Python 100+ 账号常驻私信监听与推送脚本
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonListenerScript);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? '已复制' : '复制 Python 监听脚本'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900/90 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto max-h-24">
              {pythonListenerScript}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            监听范围: 全部 <strong className="text-white">{accounts.length}</strong> 个 Telegram 协议账号
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              保存并启用实时告警
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
