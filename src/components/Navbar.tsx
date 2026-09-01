import React from 'react';
import {
  Smartphone,
  ShieldCheck,
  FileCode2,
  Send,
  History,
  LayoutDashboard,
  Flame,
  Globe2,
  UploadCloud,
  UserCheck2,
  Cpu,
  MessageCircle,
  MessageSquare,
  Search,
  Download,
  Sparkles,
  Server
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAccountCount: number;
  totalSentToday: number;
  totalFollowupToday?: number;
  isCampaignRunning: boolean;
  onResetAllToZero: () => void;
  onResetDailySent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeAccountCount,
  totalSentToday,
  totalFollowupToday = 0,
  isCampaignRunning,
  onResetAllToZero,
  onResetDailySent,
}) => {
  const navItems = [
    { id: 'tg_simple', label: '⚡ TG 极速一键中台', icon: Send, pulse: isCampaignRunning, badge: '极简主控' },
    { id: 'lead_scraper', label: '🎯 获客雷达采集', icon: Search, badge: '精准引流' },
    { id: 'web_inbox', label: '💬 聚合收件箱', icon: MessageSquare, badge: 'AI客服' },
    { id: 'proxy_manager', label: '🌐 1号1IP代理隔离', icon: Server, badge: '防关联' },
    { id: 'dashboard', label: '📊 控制台总览', icon: LayoutDashboard },
    { id: 'templates', label: '🔥 文案素材库', icon: Flame },
    { id: 'python', label: '📦 Python 脚本库', icon: FileCode2 },
    { id: 'antiban', label: '🛡️ 防封风控设置', icon: ShieldCheck },
    { id: 'logs', label: '📜 发送日志跟进', icon: History },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 sticky top-0 z-40 shadow-2xl">
      <div className="w-full max-w-[1840px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-16 gap-2">
          {/* Logo & Target Market Branding */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('tg_simple')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-emerald-400 font-black text-xs tracking-tight">TG</span>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-100 tracking-tight group-hover:text-emerald-400 transition-colors">
                  Telegram 矩阵极速全自动化营销中台
                </h1>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm shrink-0">
                  <Globe2 className="w-3 h-3 text-emerald-400" /> pt-BR 巴西市场专用
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                brazilgo888.com 全自动闭环导流矩阵
              </p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs bg-slate-950/80 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-slate-800/80 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tg_simple');
                  setTimeout(() => {
                    const el = document.getElementById('tg-account-table-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex items-center space-x-1.5 hover:bg-slate-900 px-2 py-0.5 rounded-lg border border-transparent hover:border-emerald-500/30 transition cursor-pointer group"
                title="点击直达 TG 账号列表与挂载中心"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-400 group-hover:text-slate-200">TG 协议号:</span>
                <span className="text-emerald-400 font-bold font-mono group-hover:underline flex items-center gap-0.5">
                  {activeAccountCount} 个 <span className="text-[10px] text-emerald-400">↑</span>
                </span>
              </button>
              <div className="h-3 w-px bg-slate-800"></div>
              <button
                type="button"
                title="每日 00:00 自动清零；亦可随时点击此按钮手动一键清零今日已发计数"
                onClick={onResetDailySent}
                className="flex items-center space-x-1.5 bg-amber-950/30 hover:bg-amber-900/50 px-2 py-0.5 rounded-lg border border-amber-500/20 hover:border-amber-400/40 transition cursor-pointer active:scale-95 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300 group-hover:text-white">已群发:</span>
                <span className="text-amber-400 font-bold font-mono">{totalSentToday} 条</span>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-200 opacity-60 group-hover:opacity-100 ml-0.5">🔄</span>
              </button>
              <div className="h-3 w-px bg-slate-800"></div>
              <button
                type="button"
                title="点击可一键清零补发统计"
                onClick={async () => {
                  if (window.confirm('确定要一键清零【自动补发】统计数据吗？')) {
                    try {
                      await fetch('/api/telegram/reset-reply-stats', { method: 'POST' });
                      window.location.reload();
                    } catch (e: any) {
                      alert('清零失败: ' + e.message);
                    }
                  }
                }}
                className="flex items-center space-x-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-500/20 hover:border-emerald-400/40 transition cursor-pointer active:scale-95 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-slate-300 group-hover:text-white">自动补发:</span>
                <span className="text-cyan-400 font-extrabold font-mono">{totalFollowupToday} 条</span>
                <span className="text-[10px] text-slate-400 group-hover:text-rose-300 opacity-60 group-hover:opacity-100 ml-0.5">🔄</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu - Supports responsive flex-wrap so no tabs are ever clipped */}
        <nav className="flex flex-wrap items-center gap-1.5 py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/50 bg-slate-950/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md border font-mono font-extrabold shrink-0 ${
                    isActive ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.pulse && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5 shrink-0"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

