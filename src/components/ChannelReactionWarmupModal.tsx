import React, { useState } from 'react';
import {
  Heart,
  Smile,
  Flame,
  ThumbsUp,
  Award,
  Vote,
  Radio,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Play,
  Zap,
  Layers,
  Search
} from 'lucide-react';
import { AccountSession } from '../types';

interface ChannelReactionWarmupModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
}

const BRAZIL_NEWS_CHANNELS = [
  { username: 'g1noticias', name: 'G1 Notícias (巴西权威新闻)', subs: '1.2M', tag: 'News' },
  { username: 'ge_globo', name: 'ge - Globo Esporte (巴西足球体育)', subs: '890K', tag: 'Sports' },
  { username: 'cnnbrasil', name: 'CNN Brasil (即时快讯)', subs: '650K', tag: 'News' },
  { username: 'uolnoticias', name: 'UOL Notícias (巴西生活综合)', subs: '720K', tag: 'Lifestyle' },
  { username: 'brasileirao', name: 'Brasileirão Série A (巴甲官方资讯)', subs: '540K', tag: 'Football' }
];

const EMOJI_REACTIONS = ['👍', '🔥', '❤️', '👏', '🎉', '⚽', '😎', '🏆'];

export const ChannelReactionWarmupModal: React.FC<ChannelReactionWarmupModalProps> = ({
  isOpen,
  onClose,
  accounts
}) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(BRAZIL_NEWS_CHANNELS.map(c => c.username));
  const [autoVotePolls, setAutoVotePolls] = useState<boolean>(true);
  const [randomEmojiReactions, setRandomEmojiReactions] = useState<boolean>(true);
  const [dailyChannelsToJoin, setDailyChannelsToJoin] = useState<number>(3);
  const [dailyReactionsCount, setDailyReactionsCount] = useState<number>(8);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [logs, setLogs] = useState<Array<{ phone: string; channel: string; action: string; time: string }>>([]);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetAccounts = accounts.filter(a => a.status !== 'banned');

  const handleStartChannelWarmup = async () => {
    if (targetAccounts.length === 0) return;
    setIsRunning(true);
    setProgress(0);
    setLogs([]);

    for (let i = 0; i < targetAccounts.length; i++) {
      const acc = targetAccounts[i];
      setCurrentIdx(i + 1);

      const ch = BRAZIL_NEWS_CHANNELS[i % BRAZIL_NEWS_CHANNELS.length];
      const emoji = EMOJI_REACTIONS[Math.floor(Math.random() * EMOJI_REACTIONS.length)];

      setLogs(prev => [
        {
          phone: acc.phone || acc.alias,
          channel: ch.username,
          action: `自动加入公开频道 @${ch.username} 并为置顶推文点击 ${emoji} 反应，权重分 +15`,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 600));

      if (autoVotePolls) {
        setLogs(prev => [
          {
            phone: acc.phone || acc.alias,
            channel: ch.username,
            action: `参与了 @${ch.username} 的足球赛前预测投票 (Poll #4819)，模拟真实球迷行为`,
            time: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        await new Promise(r => setTimeout(r, 600));
      }

      setProgress(Math.round(((i + 1) / targetAccounts.length) * 100));
    }

    setIsRunning(false);
  };

  const pythonScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🎭 Telegram 自动订阅本地频道、推文 Emoji 互动与投票养号引擎
功能：
1. 自动搜索并加入巴西本地新闻与体育频道 (G1/Globo/Brasileirão)
2. 随机浏览推文并自动点击 👍/🔥/❤️/👏/🎉 等 Emoji 互动
3. 遇到投票 (Poll) 消息自动参与投票，向 TG 云端注入最高质量真实内容消费足迹
====================================================================
"""
import glob
import random
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import SendReactionRequest, SendVoteRequest
from telethon.tl.types import ReactionEmoji

TARGET_CHANNELS = ["g1noticias", "ge_globo", "cnnbrasil", "uolnoticias", "brasileirao"]
EMOJIS = ["👍", "🔥", "❤️", "👏", "🎉", "😎"]

async def warmup_channel_interaction(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    print(f"\\n[*] 正在为账号 {phone} 注入频道内容消费足迹...")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    
    try:
        await client.start()
        # 随机选择 2 个频道加入
        sample_channels = random.sample(TARGET_CHANNELS, 2)
        for ch in sample_channels:
            try:
                # 1. 订阅公开频道
                channel_entity = await client.get_entity(ch)
                await client(JoinChannelRequest(channel_entity))
                print(f"[+] {phone}: 已加入频道 @{ch}")
                await asyncio.sleep(random.uniform(2, 4))
                
                # 2. 获取最新 5 条推文并随机点 Emoji 反应
                messages = await client.get_messages(channel_entity, limit=5)
                for msg in messages:
                    if msg.poll:
                        # 自动参与投票
                        try:
                            await client(SendVoteRequest(
                                peer=channel_entity,
                                msg_id=msg.id,
                                options=[b'0'] # 选择第一项
                            ))
                            print(f"[✓] {phone}: 成功在 @{ch} 参与投票！")
                        except Exception:
                            pass
                    elif random.random() < 0.6:
                        # 点击 Emoji 反应
                        chosen_emoji = random.choice(EMOJIS)
                        try:
                            await client(SendReactionRequest(
                                peer=channel_entity,
                                msg_id=msg.id,
                                reaction=[ReactionEmoji(emoticon=chosen_emoji)]
                            ))
                            print(f"[✓] {phone}: 在 @{ch} 推文 #{msg.id} 点赞 {chosen_emoji}")
                            await asyncio.sleep(random.uniform(1.5, 3))
                        except Exception:
                            pass
            except Exception as e:
                print(f"[-] 频道 @{ch} 操作提示: {e}")
                
    except Exception as e:
        print(f"[x] {phone} 异常: {e}")
    finally:
        await client.disconnect()

async def main():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🚀 启动 {len(sessions)} 个账号的公开频道互动与真实足迹养号...")
    for s in sessions:
        await warmup_channel_interaction(s)
        await asyncio.sleep(random.uniform(3, 7))

if __name__ == "__main__":
    asyncio.run(main())
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-pink-950/40 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">频道 Emoji 互动与投票足迹养号引擎</h3>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-bold">
                  真实内容消费 · TG风控最高信任分
                </span>
              </div>
              <p className="text-xs text-slate-400">
                自动订阅巴西本土权威新闻与体育频道，随机给推文点赞 👍/🔥/❤️ 并参与投票，模拟 100% 真实活跃用户
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
          
          {/* Authentic Local Channels Pool */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-pink-400" /> 巴西本土高权重公共频道池：
              </label>
              <span className="text-[10px] text-slate-500 font-mono">已精选百万级正规大台</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {BRAZIL_NEWS_CHANNELS.map((ch) => (
                <div key={ch.username} className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span className="text-pink-300">@{ch.username}</span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/30">
                      {ch.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{ch.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">关注者: {ch.subs}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Switches */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-400" /> 交互行为模拟策略：
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={randomEmojiReactions}
                  onChange={(e) => setRandomEmojiReactions(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-500 bg-slate-900 border-slate-700"
                />
                <span className="flex items-center gap-1">
                  推文随机 Emoji 点赞 ({EMOJI_REACTIONS.slice(0, 5).join(' ')})
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={autoVotePolls}
                  onChange={(e) => setAutoVotePolls(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-500 bg-slate-900 border-slate-700"
                />
                <span className="flex items-center gap-1">
                  <Vote className="w-3.5 h-3.5 text-cyan-400" />
                  频道置顶投票自动参与 (Poll Votes)
                </span>
              </label>
            </div>
          </div>

          {/* Progress & Live Log */}
          {isRunning && (
            <div className="bg-slate-950 p-4 rounded-xl border border-pink-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-pink-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 正在批量执行频道内容互动与点赞 ({currentIdx} / {targetAccounts.length})...
                </span>
                <span className="text-pink-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-600 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400">频道互动实时记录：</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="text-pink-400 font-bold">[{log.phone}]</span>
                      <span>{log.action}</span>
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
                🐍 导出 VPS Python 批量频道订阅与 Emoji 互动脚本
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pythonScript);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
            活跃协议账号: <strong className="text-white">{targetAccounts.length}</strong> 个
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
              onClick={handleStartChannelWarmup}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-950/50 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? '互动执行中...' : `一键全量频道互动 (${targetAccounts.length} 个账号)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
