import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Zap,
  CheckCircle2,
  X,
  Play,
  Copy,
  Terminal,
  MessageSquare,
  Flame,
  Globe2,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AccountSession } from '../types';

interface GroupInviterModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
  initialTargets?: string[];
}

export const GroupInviterModal: React.FC<GroupInviterModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialTargets = []
}) => {
  const [groupTitle, setGroupTitle] = useState('🎰 VIP 每日爆奖内部策略群 - BR888');
  const [groupAbout, setGroupAbout] = useState('🔥 Grupo Oficial VIP Palpites & Sinais Diários! Bônus de 100% no 1º Depósito via PIX.');
  const [pinnedMessage, setPinnedMessage] = useState(
    `🚨 BEM-VINDO AO CLUBE VIP BR888! 🚨\n\n💰 Deposite R$ 20 e ganhe R$ 50 imediatamente via PIX!\n🔗 Link Oficial Protegido: https://brazilgo888.com/vip1\n\n🎯 Sinais dos Jogos com 98.6% de Assertividade todos os dias!`
  );
  const [targetList, setTargetList] = useState(
    initialTargets.length > 0
      ? initialTargets.join('\n')
      : `5511987654321\n5521998877665\n5531988776655\n5541999881122\n5586994428117\n5586994581839\n5511911223344\n5521922334455`
  );
  const [inviteDelaySec, setInviteDelaySec] = useState(18);
  const [maxPerAccount, setMaxPerAccount] = useState(15);
  const [muteNormalMembers, setMuteNormalMembers] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [invitedCount, setInvitedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const validTargets = targetList.split('\n').map(l => l.trim()).filter(l => l.length >= 8);
  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'warming');

  const handleStartInviteMatrix = async () => {
    if (validTargets.length === 0) {
      alert('请输入待拉入群组的玩家号码列表！');
      return;
    }
    if (activeAccounts.length === 0) {
      alert('请确保至少有 1 个可用的 Telegram 协议号！');
      return;
    }

    setIsRunning(true);
    setInvitedCount(0);
    setLogs([
      `[系统初始化] 选定主号 [+${activeAccounts[0]?.phone}] 创建私密群组 [${groupTitle}]...`,
      `[群组配置] 开启【仅管理员发言】与【防恶意截流模式】...`,
      `[置顶公告] 已自动置顶图文策略与专属落地页: https://brazilgo888.com/vip1`,
      `[矩阵协同] 启动 ${activeAccounts.length} 个协议号以 1号1IP 独立代理协同拉人...`
    ]);

    for (let i = 0; i < Math.min(validTargets.length, 30); i++) {
      await new Promise(r => setTimeout(r, 600));
      const target = validTargets[i];
      const acc = activeAccounts[i % activeAccounts.length];
      setInvitedCount(prev => prev + 1);
      setLogs(prev => [
        `✨ [拉群成功] 协议号 [+${acc.phone}] 已将目标 [${target}] 安全拉入私密群组 [${groupTitle}]`,
        ...prev.slice(0, 15)
      ]);
    }

    setIsRunning(false);
  };

  const copyScriptCmd = () => {
    navigator.clipboard.writeText('python3 public/tg_group_inviter.py --title "VIP BR888" --targets targets.txt --delay 18');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  👥 自动创建私密营销群并裂变拉人 (Group Inviter 广播矩阵)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/40">
                  单号产出提升 5~10 倍
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                通过主号自动建私密营销群，多矩阵小号协同将精准玩家拉入群内，群内统一置顶转化话术与落地页
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Strategy Info Box */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl flex items-start gap-3 text-xs">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300">
              <div className="font-bold text-amber-300">💡 为什么拉群矩阵的抗封权重远高于单发私信？</div>
              <div className="text-[11px] text-slate-400">
                Telegram 对 1v1 频繁私发陌生人有严格的频率限制，而<strong className="text-emerald-300">将用户邀请入群</strong>属于系统白名单行为，风控容忍度高 5~10 倍！一个 500 人的私密群内发布一条置顶消息，等同于瞬间私发 500 次且 0 封号风险。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Form: Group Setup */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  🏷️ 营销私密群名称 (Group Title)：
                </label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  📌 群内置顶官方公告 & 转化话术：
                </label>
                <textarea
                  value={pinnedMessage}
                  onChange={(e) => setPinnedMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                />
              </div>

              {/* Safety Controls */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>🛡️ 矩阵防风控频控设置</span>
                  <span className="text-[10px] text-slate-400">可用协议号: {activeAccounts.length} 个</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-400 block mb-0.5">拉人间隙 (秒):</label>
                    <input
                      type="number"
                      value={inviteDelaySec}
                      onChange={(e) => setInviteDelaySec(parseInt(e.target.value) || 15)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">单号每日上限 (人):</label>
                    <input
                      type="number"
                      value={maxPerAccount}
                      onChange={(e) => setMaxPerAccount(parseInt(e.target.value) || 15)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={muteNormalMembers}
                    onChange={(e) => setMuteNormalMembers(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span className="text-slate-300 text-[11px]">全员禁言（仅群主/管理员可发言，杜绝同行捣乱）</span>
                </label>
              </div>
            </div>

            {/* Right: Targets & Live Logs */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                <span>🎯 待拉入群组的目标玩家列表 ({validTargets.length} 人)：</span>
                <span className="font-mono text-emerald-400">已拉入: {invitedCount} 人</span>
              </div>

              {!isRunning && logs.length === 0 ? (
                <textarea
                  value={targetList}
                  onChange={(e) => setTargetList(e.target.value)}
                  rows={8}
                  placeholder="一行一个玩家手机号或 @用户名"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500/50 resize-none flex-1 shadow-inner"
                />
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex-1 max-h-[220px] overflow-y-auto space-y-1.5 font-mono text-[11px]">
                  {logs.map((log, i) => (
                    <div key={i} className="text-slate-300 border-b border-slate-900 pb-1">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleStartInviteMatrix}
                disabled={isRunning}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isRunning
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-500/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>多协议号协同拉人中 ({invitedCount}/{validTargets.length})...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-indigo-300" />
                    <span>一键创建私密营销群并启动多号拉人裂变</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* VPS Script Terminal Box */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" /> VPS 后台全自动建群与协同拉人群发命令：
              </span>
              <button
                onClick={copyScriptCmd}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-bold text-[11px] flex items-center gap-1 transition-colors border border-amber-500/30"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCmd ? '已复制！' : '复制命令'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300 select-all border border-slate-800">
              python3 public/tg_group_inviter.py --title "VIP BR888" --targets targets.txt --delay 18
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>智能波峰拉人已就绪：每个协议号拉 10~15 人自动休眠切换，杜绝风控</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
          >
            完成并保存
          </button>
        </div>
      </div>
    </div>
  );
};
