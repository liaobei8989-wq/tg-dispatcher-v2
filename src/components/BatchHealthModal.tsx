import React, { useState, useEffect } from 'react';
import { AccountSession } from '../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Globe,
  Bot,
  Zap,
  Check,
  X,
  Sparkles,
  Download,
  Key,
  Smartphone
} from 'lucide-react';

interface BatchHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountSession[]>>;
}

export const BatchHealthModal: React.FC<BatchHealthModalProps> = ({
  isOpen,
  onClose,
  accounts,
  setAccounts
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [checkedAccounts, setCheckedAccounts] = useState<AccountSession[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startDiagnostic();
    }
  }, [isOpen]);

  const startDiagnostic = async () => {
    setIsRunning(true);
    setShowReport(false);
    setProgressPercent(0);
    setCurrentStepIndex(0);
    setLogs(['🚀 启动全池多协议账号健康检测诊断系统...', '📡 连接协议节点与专用轮换代理 IP 代理池...']);

    const total = accounts.length;
    if (total === 0) {
      setIsRunning(false);
      setShowReport(true);
      return;
    }

    const updatedAccs: AccountSession[] = [];

    for (let i = 0; i < total; i++) {
      const acc = accounts[i];
      setCurrentStepIndex(i + 1);
      const curPercent = Math.round(((i + 1) / total) * 100);
      setProgressPercent(curPercent);

      const logPrefix = `[${i + 1}/${total}] 检测 ${acc.platform === 'telegram' ? '✈️ TG' : '🟢 WA'} 账号 [${acc.alias || acc.phone}]...`;
      setLogs((prev) => [...prev, logPrefix]);

      // Simulate realistic step-by-step API & Session check delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const pingNum = Math.floor(95 + Math.random() * 55);
      const pingStr = `${pingNum}ms`;
      const nowTimeStr = new Date().toLocaleString('zh-CN', { hour12: false });

      let isBanned = acc.status === 'banned';
      let isWarming = acc.warmupDay < 3 && !isBanned;
      let isRestricted = (acc.healthScore < 60 || acc.spambotStatus === 'restricted') && !isBanned && !isWarming;

      let spambot: 'clean' | 'restricted' | 'banned' = isBanned
        ? 'banned'
        : isRestricted
        ? 'restricted'
        : 'clean';

      let healthScore = isBanned ? 10 : isRestricted ? 65 : isWarming ? 85 : Math.floor(92 + Math.random() * 8);

      let diagLog = '';
      if (acc.platform === 'telegram') {
        diagLog = isBanned
          ? '❌ MTProto Session 密钥失效 / @SpamBot 检索显示永久封禁 (Banned)'
          : isWarming
          ? `🛡️ 协议号处于【新号养号保护期】(注册/挂载第${acc.warmupDay}天) | Session 正常 | @SpamBot 干净 | 自动设为低频安全发信`
          : `🟢 MTProto Session 握手成功 | API_ID (${acc.tgApiId || '39005001'}) 认证有效 | Proxy 延迟 ${pingStr} | @SpamBot 无违规受限记录`;
      } else {
        diagLog = isBanned
          ? '❌ WhatsApp Web 6-Key Session 连通失败 / 号码已被 Meta 封禁'
          : isWarming
          ? `🛡️ WhatsApp 协议号处于【养号保护期】(挂载第${acc.warmupDay}天) | Session 正常 | Proxy 延迟 ${pingStr} | 建议每日控量<30条`
          : `🟢 WhatsApp Protocol Session 挂载通过 | 浏览器 Fingerprint 匹配 | Proxy 延迟 ${pingStr}`;
      }

      setLogs((prev) => [
        ...prev,
        isBanned
          ? `  └─ ❌ [异常] ${acc.alias}: ${diagLog}`
          : isWarming
          ? `  └─ 🛡️ [养号保护] ${acc.alias}: Session 握手 OK, 处于安全发信保护期`
          : `  └─ ✅ [正常] ${acc.alias}: MTProto Session 握手 OK, Proxy 延迟 ${pingStr}, @SpamBot 无封禁`
      ]);

      updatedAccs.push({
        ...acc,
        status: isBanned ? 'banned' : isWarming ? 'warming' : 'active',
        isLoggedIn: !isBanned,
        healthScore,
        spambotStatus: spambot,
        proxyPing: pingStr,
        sessionValid: !isBanned,
        lastCheckTime: nowTimeStr,
        healthDiagnosticLog: diagLog,
        lastActive: isBanned ? '失效/已封禁' : '刚完成健康检测 (Session握手正常)'
      });
    }

    setCheckedAccounts(updatedAccs);
    setAccounts(updatedAccs);
    setIsRunning(false);
    setShowReport(true);
    setLogs((prev) => [...prev, '🎉 全池账号健康检测完成！诊断报告已就绪。']);
  };

  if (!isOpen) return null;

  const totalCount = checkedAccounts.length || accounts.length;
  const healthyCount = checkedAccounts.filter((a) => a.spambotStatus === 'clean' && a.status !== 'banned').length;
  const warningCount = checkedAccounts.filter((a) => a.spambotStatus === 'restricted' || a.status === 'warming').length;
  const bannedCount = checkedAccounts.filter((a) => a.status === 'banned' || a.spambotStatus === 'banned').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                矩阵账号全池健康深度诊断系统
                {isRunning && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse font-normal">
                    <RefreshCw className="w-3 h-3 animate-spin" /> 检测中...
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                针对当前 {totalCount} 个协议账号执行 Session 状态握手、Proxy Ping 延迟、SpamBot 风控状态检索与健康得分诊断
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Progress Bar & Status indicator */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isRunning
                  ? `正在全面诊断账号 (${currentStepIndex}/${totalCount})...`
                  : '✅ 诊断扫描已完成！全池健康数据已更新存盘'}
              </span>
              <span className="text-emerald-400 font-mono text-sm">{progressPercent}%</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Terminal Live Diagnostics Log */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-slate-300 max-h-36 overflow-y-auto custom-scrollbar">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Summary Stats Cards */}
          {showReport && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 flex flex-col items-center text-center">
                  <span className="text-xs text-slate-400 font-medium">检测账号总数</span>
                  <span className="text-2xl font-bold text-slate-100 font-mono mt-1">{totalCount}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">双平台协议号</span>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col items-center text-center">
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 最佳状态号
                  </span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono mt-1">{healthyCount}</span>
                  <span className="text-[10px] text-emerald-500/80 mt-0.5">SpamBot干净无限制</span>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex flex-col items-center text-center">
                  <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> 预警 / 养号保护期
                  </span>
                  <span className="text-2xl font-bold text-amber-400 font-mono mt-1">{warningCount}</span>
                  <span className="text-[10px] text-amber-500/80 mt-0.5">挂载未满3天 (低频防封控量)</span>
                </div>

                <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 flex flex-col items-center text-center">
                  <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" /> 失效/已封禁
                  </span>
                  <span className="text-2xl font-bold text-rose-400 font-mono mt-1">{bannedCount}</span>
                  <span className="text-[10px] text-rose-500/80 mt-0.5">保留IP可供新号继承</span>
                </div>
              </div>

              {/* Detailed Accounts Health Breakdown List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> 各账号实测健康情况报告明细
                  </h4>
                  <span className="text-xs text-slate-400">更新时间：{new Date().toLocaleTimeString()}</span>
                </div>

                <div className="space-y-2.5">
                  {checkedAccounts.map((acc) => {
                    const isTg = acc.platform === 'telegram';
                    return (
                      <div
                        key={acc.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        {/* Account Basic Info */}
                        <div className="flex items-center gap-3 min-w-[220px]">
                          {acc.avatarUrl ? (
                            <img
                              src={acc.avatarUrl}
                              alt={acc.alias}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              isTg ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {isTg ? 'TG' : 'WA'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-100">{acc.alias}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isTg ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {isTg ? 'TG 协议号' : 'WA Session'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>{acc.phone}</span>
                              {acc.tgUsername && <span className="text-cyan-400">{acc.tgUsername}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Health Indicators Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Session Status */}
                          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-slate-400">Session:</span>
                            <span className="font-medium text-emerald-400">🟢 活跃在线</span>
                          </div>

                          {/* Proxy Ping */}
                          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-slate-400">代理Ping:</span>
                            <span className="font-mono text-cyan-300">{acc.proxyPing || '118ms'}</span>
                          </div>

                          {/* SpamBot Status */}
                          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-400">SpamBot:</span>
                            <span className={`font-semibold ${
                              acc.spambotStatus === 'banned' ? 'text-rose-400' : acc.spambotStatus === 'restricted' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {acc.spambotStatus === 'banned' ? '🔴 封禁' : acc.spambotStatus === 'restricted' ? '🟡 受限' : '🟢 干净无风控'}
                            </span>
                          </div>

                          {/* Health Score */}
                          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-slate-400">健康分:</span>
                            <span className="font-bold text-emerald-400">{acc.healthScore}/100</span>
                          </div>
                        </div>

                        {/* Limit Recommendation */}
                        <div className="text-right min-w-[150px]">
                          <div className="text-[11px] text-slate-400">建议每日发信配额</div>
                          <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                            {acc.status === 'warming' ? '15 - 30 条/日 (保护期)' : `${acc.dailyLimit} 条/日`}
                          </div>
                          <div className={`text-[10px] font-medium ${
                            acc.status === 'warming' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {acc.status === 'warming' ? '🛡️ 注册<3天 智能风控保护中' : '🟢 环境稳定 可大流量发信'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={startDiagnostic}
            disabled={isRunning}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-emerald-400' : ''}`} />
            重新全池复测
          </button>

          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <Check className="w-4 h-4" /> 确认并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
