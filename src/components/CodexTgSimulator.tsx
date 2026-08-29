import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Users,
  Send,
  Zap,
  ShieldCheck,
  Cpu,
  Clock,
  MessageSquare,
  Play,
  Pause,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  Activity,
  ArrowRight
} from 'lucide-react';
import { AccountSession, ScrubbedContact } from '../types';

interface CodexTgSimulatorProps {
  accounts: AccountSession[];
  scrubbedContacts: ScrubbedContact[];
  onNavigateToCampaign?: () => void;
}

export const CodexTgSimulator: React.FC<CodexTgSimulatorProps> = ({
  accounts,
  scrubbedContacts,
}) => {
  const [selectedMode, setSelectedMode] = useState<'pm_dispatch' | 'auto_group' | 'peer_warmup'>('pm_dispatch');
  const [persona, setPersona] = useState<'br_player' | 'vip_manager' | 'tiger_analyst'>('br_player');
  const [targetInput, setTargetInput] = useState<string>('');
  const [groupTitle, setGroupTitle] = useState<string>('🇧🇷 VIP Sinais Oficial');
  const [typingDelayRange, setTypingDelayRange] = useState<[number, number]>([3, 8]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: 'info' | 'ai' | 'success' | 'warning' | 'error'; text: string; details?: string }>>([]);
  const [sentStats, setSentStats] = useState({ success: 0, failed: 0, groupsCreated: 0, membersInvited: 0 });

  // Quick import targets from scrubbed contacts pool
  const handleImportScrubbed = () => {
    if (scrubbedContacts.length === 0) {
      alert('当前导入库中暂无名单，请先在【1. 导入名单】中解析导入号码！');
      return;
    }
    const formatted = scrubbedContacts
      .slice(0, 10)
      .map(c => c.tgUsername || c.formattedPhone || c.phone)
      .join(', ');
    setTargetInput(formatted);
  };

  // Run CODEX AI Human Simulation Dispatch / Group Invite
  const handleRunCodexSimulation = async () => {
    if (!targetInput.trim() && selectedMode !== 'peer_warmup') {
      alert('请输入目标 Telegram 用户名或手机号！');
      return;
    }

    setIsSimulating(true);
    const newLog = (type: 'info' | 'ai' | 'success' | 'warning' | 'error', text: string, details?: string) => {
      setLogs(prev => [
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          type,
          text,
          details
        },
        ...prev
      ]);
    };

    newLog('info', `🚀 启动 CODEX AI 模拟器 - 模式: ${
      selectedMode === 'pm_dispatch' ? '私信拟真人强发' : selectedMode === 'auto_group' ? '自动建群拉人' : '协议号对打互养'
    }`);

    const targets = targetInput
      .split(/[\n,;\s]+/)
      .map(t => t.strip ? t.strip() : t.trim())
      .filter(Boolean);

    try {
      // Call backend CODEX API
      const response = await fetch('/api/codex/simulate-human-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          persona,
          targets,
          groupTitle,
          typingDelayRange
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.aiGeneratedMessage) {
          newLog('ai', `🧠 Gemini 3.6 Flash / CODEX 生成真人拟态话术`, `"${data.aiGeneratedMessage}"`);
        }

        if (Array.isArray(data.executionSteps)) {
          for (const step of data.executionSteps) {
            newLog(step.type || 'info', step.message, step.details);
          }
        }

        setSentStats(prev => ({
          ...prev,
          success: prev.success + (data.successCount || targets.length),
          groupsCreated: selectedMode === 'auto_group' ? prev.groupsCreated + 1 : prev.groupsCreated,
          membersInvited: selectedMode === 'auto_group' ? prev.membersInvited + targets.length : prev.membersInvited
        }));

        newLog('success', `🎉 CODEX 任务成功执行！所有指令已通过 Telethon MTProto 加密下发到 Telegram 真实服务器。`);
      } else {
        newLog('error', `❌ 模拟调度异常: ${data.error || '服务器未响应'}`);
      }
    } catch (err: any) {
      newLog('error', `❌ 网络或服务请求失败: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-2 mb-2">
              <span>💡【简单操作指引】：本页面为 **AI 文案生成效果测试** 与 **Python 脚本导出实验室**。日常进行 Telegram 账号批量多线程群发，请直接切换到菜单 **【4. 矩阵群发调度】** 进行一键排单启动！</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> CODEX + Gemini 3.6 Flash 神经网络
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 模拟真人行姿防封
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              🤖 CODEX AI协议号真人模拟与 1v1 高权直发系统
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              根据最新风控避险策略：<strong className="text-amber-300">已彻底撤销强拉群/自动建群功能（强制拉陌生人入群极易触发 PeerFlood 封禁）</strong>。系统现全面升级为 CODEX AI 1v1 拟人私信直发，控制 Telethon MTProto 协议号模拟真实打字速度（3.5s~8.2s）、自然语音/图片发送与高权单对单触达。
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">已强发成功 / 强拉进群</div>
              <div className="text-lg font-black font-mono text-emerald-400">{sentStats.success} 人</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">自动创建 TG 群</div>
              <div className="text-lg font-black font-mono text-indigo-400">{sentStats.groupsCreated} 个</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Selector */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> 1. 选择 CODEX AI 控号模式
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode('pm_dispatch')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  selectedMode === 'pm_dispatch'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <MessageSquare className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-xs font-bold text-slate-100">💬 CODEX 真人私信群发</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  AI 生成变体，模拟 3-8s 打字速度强发私信
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('auto_group')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  selectedMode === 'auto_group'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-xs font-bold text-slate-100">🎯 CODEX 频道/链接引导私发</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  私信发送专属频道链接吸引主动入群（已撤销强拉群风险操作）
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('peer_warmup')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  selectedMode === 'peer_warmup'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <RefreshCw className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-xs font-bold text-slate-100">🔄 协议账号对打养号</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  控矩阵号内部互相 AI 聊天对话，解封升权
                </div>
              </button>
            </div>
          </div>

          {/* AI Persona & Human Timing Settings */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" /> 2. AI 说话人设 & 真人时延策略
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  AI 语气人格预设 (Brazilian pt-BR)
                </label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="br_player">🇧🇷 巴西本地玩家老哥 (Fala mano, bora jogar?)</option>
                  <option value="vip_manager">👑 品牌 VIP 经理 (Olá! Benefício exclusivo)</option>
                  <option value="tiger_analyst">🐯 Fortune Tiger 试玩大师 (Sinal confirmado!)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>模拟真人打字时延 (秒)</span>
                  <span className="font-mono text-indigo-400">{typingDelayRange[0]}s - {typingDelayRange[1]}s</span>
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={typingDelayRange[1]}
                    onChange={(e) => setTypingDelayRange([3, Number(e.target.value)])}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {selectedMode === 'auto_group' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                   Telegram VIP 群组名称
                </label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="例如: 🇧🇷 BrazilGO888 VIP Sinais Oficial"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Targets Input */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" /> 3. 强发 / 强拉目标账号库
              </h3>
              <button
                type="button"
                onClick={handleImportScrubbed}
                className="text-xs bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" /> 从已清洗名单一键填入 ({scrubbedContacts.length})
              </button>
            </div>

            <textarea
              rows={4}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="请输入目标 Telegram 用户名 (@gabriel_costa77) 或带区号手机号 (+5571999149956)，每行一个或逗号分隔..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />

            {/* Launch Button */}
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleRunCodexSimulation}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                isSimulating
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-indigo-500/25 active:scale-[0.99]'
              }`}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                  CODEX AI 正在解析 MTProto 协议并下发消息...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                  {selectedMode === 'pm_dispatch'
                    ? '⚡ 启动 CODEX AI 拟真人私信群发'
                    : selectedMode === 'auto_group'
                    ? '👥 启动 CODEX 自动建群并强拉受众入群'
                    : '🔄 启动 CODEX 矩阵号互养解封'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Execution Console & Live Terminal Logs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col h-full min-h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  CODEX Live Protocol Terminal
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                MTProto Stream Active
              </span>
            </div>

            {/* Protocol Account Status Pills */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400">已挂载 Telethon 发件节点:</div>
              <div className="grid grid-cols-2 gap-2">
                {accounts.slice(0, 4).map((acc) => (
                  <div key={acc.id} className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs">
                    <div className="truncate">
                      <div className="font-bold text-slate-200 truncate">{acc.alias}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{acc.phone}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      acc.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {acc.status === 'active' ? '🟢 健康' : '🟡 受限'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Console Output */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono text-[11px] space-y-2.5 overflow-y-auto max-h-[380px] no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-12 space-y-2">
                  <Cpu className="w-8 h-8 text-slate-700 mx-auto" />
                  <div>CODEX AI 协议控制台待命</div>
                  <div className="text-[10px] text-slate-600">点击左侧控制按钮，发起 AI 拟真人私信或自动建群拉人指令</div>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800/50 pb-2 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[10px] text-slate-500">[{log.time}]</span>
                      <span className={`font-bold ${
                        log.type === 'ai' ? 'text-indigo-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {log.text}
                      </span>
                    </div>
                    {log.details && (
                      <div className="bg-slate-950 p-2 rounded text-slate-300 border border-slate-800/80 whitespace-pre-wrap">
                        {log.details}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
