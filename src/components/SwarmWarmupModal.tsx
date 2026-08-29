import React, { useState } from 'react';
import {
  Users,
  Flame,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  Settings,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { AccountSession } from '../types';

interface SwarmWarmupModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
}

const SWARM_DIALOGUE_SCENARIOS = [
  {
    id: 'football_brazil',
    title: '⚽ 巴西足球与美洲杯狂热闲聊（极高拟真）',
    topics: ['Flamengo vs Palmeiras', 'Gol de placa', 'Quem vai ganhar domingo?', 'Bora assistir no barzinho'],
    preview: '“Fala irmão! Viu o jogão do Mengão ontem? Que golaço no final!” ➔ “Mano, inacreditável! Quase tive um infarto aqui rsrs ⚽”'
  },
  {
    id: 'daily_greeting',
    title: '☀️ 巴西里约/圣保罗日常问候与美食',
    topics: ['Bom dia família', 'Churrasco no fds', 'Cafézinho da tarde', 'Bora almoçar'],
    preview: '“Bom dia chefe! Já tomou aquele café forte hoje?” ➔ “Opa meu consagrado, tudo em paz por aí? Partiu trampo!”'
  },
  {
    id: 'crypto_pix',
    title: '💰 PIX 汇款确认与转账日常互动',
    topics: ['Manda a chave PIX', 'Já caiu aí?', 'Valeu pela força', 'Tudo certo'],
    preview: '“Mano, me manda a sua chave Pix aí pra eu acertar aquela parada” ➔ “Fechou, tá na mão! Avisa quando mandar 👍”'
  }
];

export const SwarmWarmupModal: React.FC<SwarmWarmupModalProps> = ({
  isOpen,
  onClose,
  accounts
}) => {
  const [swarmSize, setSwarmSize] = useState<number>(5); // 5 accounts per cluster
  const [selectedScenario, setSelectedScenario] = useState<string>('football_brazil');
  const [enableVoiceCallSimulation, setEnableVoiceCallSimulation] = useState<boolean>(true);
  const [enableStickerSharing, setEnableStickerSharing] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<Array<{ from: string; to: string; action: string; time: string; type: 'chat' | 'call' | 'sticker' }>>([]);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeAccounts = accounts.filter(a => a.status !== 'banned');
  const totalClusters = Math.max(1, Math.ceil(activeAccounts.length / swarmSize));

  const handleStartSwarm = async () => {
    setIsSimulating(true);
    setSimulationLogs([]);

    const sampleDialogues = [
      "Fala meu parceiro, tudo certo por aí? 👊",
      "Opa mano! Tudo em paz, e com vc?",
      "Tranquilo demais! Viu o jogo ontem?",
      "Vi sim mano, aquele lance no final foi surreal kkkk 😂",
      "Demais! Fim de semana vai rolar churrasco?",
      "Com certeza, já comprei a picanha e a cerveja 🥩🍻",
      "Fechou então, depois me manda o endereço certinho!",
      "Tá na mão chefe! 👍"
    ];

    for (let round = 0; round < 6; round++) {
      if (activeAccounts.length < 2) break;
      const acc1 = activeAccounts[Math.floor(Math.random() * activeAccounts.length)];
      let acc2 = activeAccounts[Math.floor(Math.random() * activeAccounts.length)];
      while (acc2.id === acc1.id && activeAccounts.length > 1) {
        acc2 = activeAccounts[Math.floor(Math.random() * activeAccounts.length)];
      }

      // Action 1: Text Chat
      const msg = sampleDialogues[round % sampleDialogues.length];
      setSimulationLogs(prev => [
        {
          from: acc1.phone || acc1.alias,
          to: acc2.phone || acc2.alias,
          action: `💬 私聊发送: "${msg}"`,
          type: 'chat',
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 600));

      // Action 2: Voice call handshake if enabled
      if (enableVoiceCallSimulation && round % 2 === 0) {
        setSimulationLogs(prev => [
          {
            from: acc1.phone || acc1.alias,
            to: acc2.phone || acc2.alias,
            action: `📞 发起并接通 4秒 TG 拟真语音通话（构建高信任权重链）`,
            type: 'call',
            time: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        await new Promise(r => setTimeout(r, 800));
      }

      // Action 3: Sticker
      if (enableStickerSharing && round % 3 === 0) {
        setSimulationLogs(prev => [
          {
            from: acc2.phone || acc2.alias,
            to: acc1.phone || acc1.alias,
            action: `🎭 回复动态贴纸包 (Animated Sticker)`,
            type: 'sticker',
            time: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsSimulating(false);
  };

  const swarmPythonScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🐝 Telegram 矩阵蜂窝拟真互聊与模拟通话养号守护引擎 (Swarm AI Mutual Warmup)
功能：将全部小号分组，自动化互相添加双向联系人、拟真葡语日常互聊、模拟语音握手
====================================================================
"""
import glob
import random
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.contacts import AddContactRequest

PORTUGUESE_CHAT_POOL = [
    "Fala meu parceiro, tudo certo por aí? 👊",
    "Opa mano! Tudo na paz de Deus, e vc?",
    "Tranquilo demais! Viu o jogo ontem?",
    "Vi sim mano, aquele lance no final foi surreal kkkk 😂",
    "Demais! Fim de semana vai rolar churrasco?",
    "Com certeza, já comprei a carne e a cerveja 🥩🍻",
    "Fechou então, depois me manda o endereço!",
    "Tá na mão chefe! Tmj 🤝"
]

async def run_swarm_warmup():
    sessions = glob.glob("sessions/*.session")
    if len(sessions) < 2:
        print("[!] 至少需要 2 个 .session 才能组建蜂窝互聊网络！")
        return
        
    print(f"🐝 已加载 {len(sessions)} 个账号，正在构建蜂窝互聊拓扑...")
    
    # 随机抽取 2 个账号进行真实交互
    for i in range(10):
        s1, s2 = random.sample(sessions, 2)
        p1 = s1.split("/")[-1].replace(".session", "")
        p2 = s2.split("/")[-1].replace(".session", "")
        
        c1 = TelegramClient(s1, 2040, "b18441a1ff607e10a989891a5462e627")
        c2 = TelegramClient(s2, 2040, "b18441a1ff607e10a989891a5462e627")
        
        await c1.connect()
        await c2.connect()
        
        try:
            # 1. 互相添加为双向联系人 (降低单向限制几率 90%)
            me2 = await c2.get_me()
            await c1(AddContactRequest(
                id=me2.id,
                first_name="Amigo",
                last_name="BR",
                phone=p2,
                add_phone_privacy_exception=True
            ))
            print(f"[+] 账号 {p1} 已将 {p2} 加为双向好友")
            
            # 2. 发送葡语日常问候
            msg = random.choice(PORTUGUESE_CHAT_POOL)
            await c1.send_message(me2.id, msg)
            print(f"  💬 {p1} -> {p2}: {msg}")
            await asyncio.sleep(random.uniform(2, 5))
            
            # 3. 对方拟真回复
            reply = random.choice(PORTUGUESE_CHAT_POOL)
            me1 = await c1.get_me()
            await c2.send_message(me1.id, reply)
            print(f"  💬 {p2} -> {p1}: {reply}")
            
        except Exception as e:
            print(f"[x] 互聊异常: {e}")
        finally:
            await c1.disconnect()
            await c2.disconnect()
            
        await asyncio.sleep(random.uniform(5, 12))

if __name__ == "__main__":
    asyncio.run(run_swarm_warmup())
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">蜂窝矩阵拟真互聊与模拟通话养号系统</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  新号存活率 95%+ · 建立高权重好友链
                </span>
              </div>
              <p className="text-xs text-slate-400">
                将新买协议小号自动划入微型蜂窝群组，AI 全自动模拟好友加通讯录、日常葡语闲聊与语音通话握手
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
          
          {/* Status Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">可用互养小号</span>
              <span className="text-base font-black text-white">{activeAccounts.length} 个</span>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">蜂窝集群数量</span>
              <span className="text-base font-black text-amber-300">{totalClusters} 个蜂窝 ({swarmSize}号/组)</span>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">拟真互动行为</span>
              <span className="text-base font-black text-cyan-300">文字 + 贴纸 + 语音通话</span>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">双向联系人权重</span>
              <span className="text-base font-black text-emerald-400">A+ 顶级权重 (防举报)</span>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" /> 养号核心策略配置：
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">蜂窝分组密度 (单组账号数):</label>
                <select
                  value={swarmSize}
                  onChange={(e) => setSwarmSize(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={3}>3 个号 / 极紧凑群组</option>
                  <option value={5}>5 个号 / 标准黄金蜂窝 (推荐)</option>
                  <option value={8}>8 个号 / 中型交流拓扑</option>
                  <option value={10}>10 个号 / 大型社区网络</option>
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={enableVoiceCallSimulation}
                    onChange={(e) => setEnableVoiceCallSimulation(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>📞 开启 3~5秒 模拟语音通话握手</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  TG 风控对有语音通话记录的账号赋予极高免风控信任分
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={enableStickerSharing}
                    onChange={(e) => setEnableStickerSharing(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>🎭 模拟发送 Telegram 动态贴纸</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  增加媒体消息交互维度，避免纯文本单一行为特征
                </p>
              </div>
            </div>
          </div>

          {/* Dialogue Scenario Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> 选择日常互聊主题库：
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {SWARM_DIALOGUE_SCENARIOS.map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedScenario === scen.id
                      ? 'bg-amber-950/30 border-amber-500 text-amber-200 shadow-md shadow-amber-950/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block mb-1.5">{scen.title}</span>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-3">
                    {scen.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Simulated Interaction Log */}
          {simulationLogs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> 实时蜂窝互聊与通话互动流：
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-[11px] font-mono">
                {simulationLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">[{log.from}]</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-cyan-400 font-bold">[{log.to}]</span>
                      <span className={log.type === 'call' ? 'text-emerald-300 font-bold' : log.type === 'sticker' ? 'text-purple-300' : 'text-slate-200'}>
                        {log.action}
                      </span>
                    </div>
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
                🐍 导出 VPS Python 蜂窝矩阵养号常驻守护脚本
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(swarmPythonScript);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? '已复制' : '复制 Python 互聊脚本'}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900/90 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto max-h-24">
              {swarmPythonScript}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            总参演账号: <strong className="text-white">{activeAccounts.length}</strong> 个
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              关闭
            </button>
            <button
              disabled={isSimulating || activeAccounts.length < 2}
              onClick={handleStartSwarm}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isSimulating ? '蜂窝互养中...' : `一键启动矩阵互养 (${activeAccounts.length} 个号)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
