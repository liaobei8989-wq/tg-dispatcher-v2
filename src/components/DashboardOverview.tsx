import React from 'react';
import { AccountSession, AntiBanSettings, CampaignLog } from '../types';
import { calculateWarmupDays, getDedicatedProxyForPhone } from '../data/mockAccounts';
import { safeSaveAccountsToLocalStorage } from '../utils/accountStorage';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Flame,
  Send,
  Zap,
  TrendingUp,
  Clock,
  ShieldCheck,
  ExternalLink,
  Users,
  Edit2
} from 'lucide-react';

interface DashboardOverviewProps {
  accounts: AccountSession[];
  setAccounts?: React.Dispatch<React.SetStateAction<AccountSession[]>>;
  antiBan: AntiBanSettings;
  logs: CampaignLog[];
  setActiveTab: (tab: string) => void;
  onCheckAllHealth: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  accounts,
  setAccounts,
  antiBan,
  logs,
  setActiveTab,
  onCheckAllHealth,
}) => {
  const totalAccounts = accounts.length;
  const onlineAccounts = accounts.filter(a => a.status === 'active' || a.status === 'warming').length;
  const matureAccounts = accounts.filter(a => a.status === 'active' && a.warmupDay >= 4).length;
  const warmingAccounts = accounts.filter(a => a.status === 'warming' || (a.status === 'active' && a.warmupDay < 4)).length;
  const riskAccounts = accounts.filter(a => a.status === 'risk').length;
  const bannedAccounts = accounts.filter(a => a.status === 'banned').length;

  const totalSentToday = accounts.reduce((sum, a) => sum + a.sentToday, 0);
  const totalDailyCap = accounts.reduce((sum, a) => sum + a.dailyLimit, 0);
  const successLogsCount = logs.filter(l => l.status === 'success').length;
  const successRate = logs.length > 0 ? ((successLogsCount / logs.length) * 100).toFixed(1) : '98.5';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-emerald-500/30 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-lg font-bold border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> 巴西博彩 (pt-BR) 专用引流控台
              </span>
              <span className="bg-slate-900/80 text-slate-300 text-xs px-3 py-1 rounded-lg font-mono border border-slate-700/80 shadow-sm">
                目标网址: <span className="text-emerald-400 font-semibold">brazilgo888.com</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Telegram 矩阵极速群发与动态 Session 协议池
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              结合 4 协议号高速轮流交替、2~4秒极速错峰、巴西葡语 Spintax 变体与后台异步回复雷达，全方位提升群发送达率。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('tg_simple')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" /> ⚡ TG 极速一键中台
            </button>
            <button
              onClick={onCheckAllHealth}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 批量健康检测
            </button>
          </div>
        </div>
      </div>

      {/* High Risk Warning Banner */}
      {riskAccounts > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                Session 账号池高危预警：⚠️ 当前有 {riskAccounts} 个账号触发风控警告！
              </span>
              <p className="text-slate-400 text-xs mt-0.5">
                主状态：在线可用 {onlineAccounts} / {totalAccounts} ({(onlineAccounts / (totalAccounts || 1) * 100).toFixed(0)}% 在线) | 状态明细：安全养号中 ({warmingAccounts}) | 需处理风控 ({riskAccounts} - 建议一键隔离) | 已封禁 ({bannedAccounts})
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('accounts')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shrink-0"
          >
            一键隔离风控账号 &rarr;
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Session Pool */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/90 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold tracking-tight">Session 账号池</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">{onlineAccounts} / {totalAccounts}</div>
            <span className="text-[11px] text-emerald-300 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {((onlineAccounts / (totalAccounts || 1)) * 100).toFixed(0)}% 在线
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-400 font-medium">成熟号: {matureAccounts}</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">养号限制中: {warmingAccounts}</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">封号: {bannedAccounts}</span>
          </p>
        </div>

        {/* Card 2: Messages Today */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/90 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold tracking-tight">今日发送量 / 上限</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">{totalSentToday}</div>
            <span className="text-xs text-slate-400 font-mono font-medium">/ {totalDailyCap} 容量</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-1.5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, (totalSentToday / (totalDailyCap || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Anti-Ban Protection State */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/90 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold tracking-tight">防封与频率保护</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500/20 transition-all">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-black text-slate-100 font-mono tracking-tight">
              {antiBan.minDelaySec}~{antiBan.maxDelaySec} 秒
            </div>
            <span className="text-[11px] text-teal-300 font-bold bg-teal-500/15 px-2.5 py-0.5 rounded-full border border-teal-500/30">
              随机动态延迟
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
            每发送 <strong className="text-slate-200">{antiBan.pauseIntervalCount}</strong> 条休眠 <strong className="text-slate-200">{antiBan.minPauseDurationMin || 2}~{antiBan.maxPauseDurationMin || 6}</strong> 分钟
          </p>
        </div>

        {/* Card 4: Delivery Success Rate */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700/90 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold tracking-tight">总体成功到达率</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">{successRate}%</div>
            <span className="text-[11px] text-indigo-300 font-bold bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Spintax 变体
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            失败数支持一键导出 CSV 进行二次重试
          </p>
        </div>
      </div>

      {/* Account Status Distribution & Core Features Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Session Pool Health Table Overview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-200 text-sm">Session 账号池监控 (实时状态)</h3>
            </div>
            <button
              onClick={() => setActiveTab('accounts')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              进入完整多号管理 &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">账号 / 标签</th>
                  <th className="py-2.5 px-3">巴西手机号</th>
                  <th className="py-2.5 px-3">状态</th>
                  <th className="py-2.5 px-3">健康度</th>
                  <th className="py-2.5 px-3">今日发送</th>
                  <th className="py-2.5 px-3">代理 Proxy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.slice(0, 10).map((acc, idx) => {
                  const cleanPhone = (acc.phone || '').replace(/\D/g, '');
                  const top5Phones = new Set(['5586994428117', '5586994581839', '5586994709226', '5586994684213', '5586994687152']);
                  const isTop5 = top5Phones.has(cleanPhone) || (!cleanPhone.startsWith('55869948') && !cleanPhone.startsWith('55869949') && !cleanPhone.startsWith('55869951') && idx < 5);
                  const defaultDay = isTop5 ? 7 : 3;
                  const hasCorruptDay = acc.warmupDay === 16 || acc.warmupDay === 8 || !acc.warmupDay;
                  const baseDay = hasCorruptDay ? defaultDay : (acc.baseWarmupDay || acc.warmupDay || defaultDay);
                  const effectiveCreatedAt = hasCorruptDay ? '2026-08-31' : (acc.createdAt || '2026-08-31');
                  const currentDay = hasCorruptDay ? defaultDay : calculateWarmupDays(effectiveCreatedAt, baseDay);
                  const effectiveProxy = getDedicatedProxyForPhone(acc.phone) || acc.proxy || '200.160.43.132:12323:14aade52b86e6:70dd653fc2';
                  return (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{acc.alias}</div>
                      {acc.tgChatId && (
                        <div className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1 mt-0.5">
                          <span>🆔 ID: {acc.tgChatId}</span>
                          {acc.tgUsername && <span className="text-cyan-300">({acc.tgUsername})</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{acc.phone}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {acc.sentToday >= Math.floor(acc.dailyLimit * 0.8) && acc.status !== 'banned' ? (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 w-max shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-amber-400" /> 80%预警熔断
                          </span>
                        ) : currentDay >= 4 ? (
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> 稳定成熟期 (第{currentDay}天)
                          </span>
                        ) : (
                          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3 text-amber-400" /> 养号保护期 (第{currentDay}天)
                          </span>
                        )}

                        {/* Manual Day Adjustment Buttons */}
                        {setAccounts && (
                          <div className="inline-flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded px-1 py-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const newDay = Math.max(1, currentDay - 1);
                                const today = new Date().toISOString().split('T')[0];
                                setAccounts(prev => {
                                  const updated = prev.map(a => 
                                    a.id === acc.id || (a.phone && acc.phone && a.phone.replace(/\D/g, '') === acc.phone.replace(/\D/g, ''))
                                      ? { ...a, warmupDay: newDay, baseWarmupDay: newDay, createdAt: today, status: (newDay >= 4 ? 'active' : 'warming') as any, dailyLimit: newDay >= 4 ? 120 : 60 }
                                      : a
                                  );
                                  safeSaveAccountsToLocalStorage(updated);
                                  return updated;
                                });
                              }}
                              className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                              title="减少 1 天"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const input = prompt(`请输入 [${acc.alias || acc.phone}] 的自定义养号天数 (1-30):`, String(currentDay));
                                if (input !== null) {
                                  const parsed = parseInt(input.trim(), 10);
                                  if (!isNaN(parsed) && parsed > 0) {
                                    const today = new Date().toISOString().split('T')[0];
                                    setAccounts(prev => {
                                      const updated = prev.map(a => 
                                        a.id === acc.id || (a.phone && acc.phone && a.phone.replace(/\D/g, '') === acc.phone.replace(/\D/g, ''))
                                          ? { ...a, warmupDay: parsed, baseWarmupDay: parsed, createdAt: today, status: (parsed >= 4 ? 'active' : 'warming') as any, dailyLimit: parsed >= 4 ? 120 : 60 }
                                          : a
                                      );
                                      safeSaveAccountsToLocalStorage(updated);
                                      return updated;
                                    });
                                  }
                                }
                              }}
                              className="px-1 text-cyan-400 hover:underline font-mono font-bold flex items-center gap-0.5"
                              title="点击直接输入任意天数"
                            >
                              <Edit2 className="w-2.5 h-2.5 opacity-70" />
                              改
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newDay = currentDay + 1;
                                const today = new Date().toISOString().split('T')[0];
                                setAccounts(prev => {
                                  const updated = prev.map(a => 
                                    a.id === acc.id || (a.phone && acc.phone && a.phone.replace(/\D/g, '') === acc.phone.replace(/\D/g, ''))
                                      ? { ...a, warmupDay: newDay, baseWarmupDay: newDay, createdAt: today, status: (newDay >= 4 ? 'active' : 'warming') as any, dailyLimit: newDay >= 4 ? 120 : 60 }
                                      : a
                                  );
                                  safeSaveAccountsToLocalStorage(updated);
                                  return updated;
                                });
                              }}
                              className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                              title="增加 1 天"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              acc.healthScore > 80
                                ? 'bg-emerald-400'
                                : acc.healthScore > 50
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${acc.healthScore}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-300">{acc.healthScore}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {acc.sentToday} / {acc.dailyLimit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      <div 
                        className="flex items-center gap-1.5 cursor-pointer group hover:text-emerald-300 transition-colors"
                        title="点击快速修改该账号的独立代理 IP"
                        onClick={() => {
                          const newP = prompt(`请输入账号 [${acc.phone || acc.alias}] 的代理 IP / SOCKS5:`, effectiveProxy);
                          if (newP !== null && newP.trim() && setAccounts) {
                            setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, proxy: newP.trim() } : a));
                          }
                        }}
                      >
                        <span className="truncate max-w-[180px]">{effectiveProxy}</span>
                        <span className="text-[9px] text-emerald-400 font-sans font-bold px-1 bg-emerald-950/80 border border-emerald-600/50 rounded opacity-80 group-hover:opacity-100">改</span>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Workflow Guidance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" /> 巴西市场（pt-BR）引流操作流程
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <p className="font-semibold text-slate-200">批量导入 Telegram 协议号</p>
                <p className="text-slate-400 text-[11px] mt-0.5">支持批量导入 +55 巴西号码 Token 与代理 IP，自动检测状态。</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <p className="font-semibold text-slate-200">设置防封随机延迟 (45~60秒 真人业务员节奏)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">模拟真人打字(3.5~6s) + 喝水小憩与隐形 Unicode 字符打乱 Hash 签名。</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <p className="font-semibold text-slate-200">选择 Fortune Tiger / PIX 葡语文案</p>
                <p className="text-slate-400 text-[11px] mt-0.5">内置 Spintax 语法变体（例如 Fortune Tiger, PIX 首存 200% Bônus）。</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <p className="font-semibold text-slate-200">下载 Python 后端脚本正式跑量</p>
                <p className="text-slate-400 text-[11px] mt-0.5">可直接部署至 VPS 或 Linux 服务器进行无人值守多线程群发。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
