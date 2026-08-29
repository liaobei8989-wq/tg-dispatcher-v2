import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  MessageSquare,
  Globe2,
  CheckSquare,
  Square,
  Shield,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react';
import { ScrapedLead, ScrapeJobConfig, AccountSession } from '../types';

interface LeadScraperHubProps {
  accounts: AccountSession[];
  onImportToDispatch: (targets: string[]) => void;
  onNavigateToDispatch: () => void;
}

export const LeadScraperHub: React.FC<LeadScraperHubProps> = ({
  accounts,
  onImportToDispatch,
  onNavigateToDispatch
}) => {
  const [sourceUrl, setSourceUrl] = useState('https://t.me/grupofortunetiger_oficial');
  const [scrapeMode, setScrapeMode] = useState<'group_members' | 'channel_comments'>('group_members');
  const [executorPhone, setExecutorPhone] = useState<string>(accounts[0]?.phone || '');
  const [limitCount, setLimitCount] = useState<number>(100);

  // Filters
  const [filterOnlineOnly, setFilterOnlineOnly] = useState<boolean>(false);
  const [filterActive3Days, setFilterActive3Days] = useState<boolean>(true);
  const [filterActive7Days, setFilterActive7Days] = useState<boolean>(false);
  const [excludeBots, setExcludeBots] = useState<boolean>(true);
  const [excludeAdmins, setExcludeAdmins] = useState<boolean>(true);
  const [excludeNoAvatar, setExcludeNoAvatar] = useState<boolean>(true);

  // Execution states
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [memberCountTotal, setMemberCountTotal] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [selectAll, setSelectAll] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const handleStartScrape = async () => {
    if (!sourceUrl.trim()) return;
    setIsScraping(true);
    setLogs([
      `🚀 [获客雷达] 初始化采集引擎: 目标源=${sourceUrl}`,
      `🌐 [南美节点] 使用协议号 ${executorPhone || accounts[0]?.phone || '5586994428117'} 握手 Telegram DC4...`,
      `🔍 [活跃度探针] 正在扫描并过滤 3 天内高活跃真实巴西博彩玩家...`
    ]);

    try {
      const res = await fetch('/api/telegram/scrape-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl,
          mode: scrapeMode,
          executorPhone: executorPhone || accounts[0]?.phone,
          filterOnlineOnly,
          filterActive3Days,
          filterActive7Days,
          excludeBots,
          excludeAdmins,
          excludeNoAvatar,
          limitCount
        })
      });

      const data = await res.json();
      if (data.success) {
        setScrapedLeads(data.leads || []);
        setLogs(data.logs || []);
        setSourceTitle(data.sourceTitle || sourceUrl);
        setMemberCountTotal(data.memberCountTotal || 0);
        setFilteredCount(data.filteredCount || (data.leads ? data.leads.length : 0));
        setSelectAll(true);
      } else {
        setLogs(prev => [...prev, `❌ 采集失败: ${data.error || '未知网络错误'}`]);
      }
    } catch (e: any) {
      setLogs(prev => [...prev, `❌ 请求异常: ${e.message}`]);
    } finally {
      setIsScraping(false);
    }
  };

  const handleToggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setScrapedLeads(prev => prev.map(lead => ({ ...lead, selected: next })));
  };

  const handleToggleLead = (id: string) => {
    setScrapedLeads(prev =>
      prev.map(l => (l.id === id ? { ...l, selected: !l.selected } : l))
    );
  };

  const selectedTargets = scrapedLeads.filter(l => l.selected);

  const handleImportToDispatch = () => {
    const targets = selectedTargets.map(l => l.username || l.phone || l.targetId);
    if (targets.length === 0) return;
    onImportToDispatch(targets);
    onNavigateToDispatch();
  };

  const handleExportTxt = () => {
    const targets = selectedTargets.map(l => l.username || l.phone || l.targetId);
    const blob = new Blob([targets.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brazil_tg_leads_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const header = 'Username,Phone,FirstName,LastName,LastSeen,SourceGroup\n';
    const rows = selectedTargets
      .map(
        l =>
          `"${l.username || ''}","${l.phone || ''}","${l.firstName || ''}","${l.lastName || ''}","${l.lastSeenText || ''}","${l.sourceGroup || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brazil_tg_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDisplayLeads = scrapedLeads.filter(l => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (l.username && l.username.toLowerCase().includes(q)) ||
      (l.firstName && l.firstName.toLowerCase().includes(q)) ||
      (l.lastName && l.lastName.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                Telegram 活跃客户雷达 (Group & Comments Lead Scraper)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-normal">
                  🇧🇷 巴西精准博彩玩家
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              直接从巴西当地 Fortune Tiger、Roleta、Apostas 等公开群组和频道评论区中，按真实在线时间过滤提取高净值活跃玩家，一键导入极速发信池。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-400">已提取高意向客户</div>
              <div className="text-base font-extrabold text-emerald-400">{scrapedLeads.length} 人</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scraper Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config Panel */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" /> 采集参数与活跃度过滤
            </span>
            <span className="text-[11px] text-slate-400 font-mono">DC4 南美直连</span>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">采集模式：</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScrapeMode('group_members')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  scrapeMode === 'group_members'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>👥 公开群成员提取</span>
              </button>
              <button
                onClick={() => setScrapeMode('channel_comments')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  scrapeMode === 'channel_comments'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>💬 频道评论区提取</span>
              </button>
            </div>
          </div>

          {/* Source URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {scrapeMode === 'group_members' ? '公开群组链接 / Username：' : '频道贴文公开链接 (Post URL)：'}
            </label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={scrapeMode === 'group_members' ? 'https://t.me/grupofortunetiger 或 @canalvip' : 'https://t.me/canalvip/128'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500/50 shadow-inner"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 self-center">热门样本:</span>
              {[
                'https://t.me/grupofortunetiger_oficial',
                'https://t.me/apostas_brasil_vip',
                'https://t.me/sinais_roleta_br'
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSourceUrl(p)}
                  className="text-[10px] px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors truncate max-w-[170px]"
                >
                  {p.replace('https://t.me/', '@')}
                </button>
              ))}
            </div>
          </div>

          {/* Executor Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">执行采集协议号：</label>
            <select
              value={executorPhone}
              onChange={(e) => setExecutorPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              {accounts.map(acc => (
                <option key={acc.phone} value={acc.phone}>
                  {acc.name} ({acc.phone}) - {acc.status === 'active' ? '🟢 在线' : '⚪ 离线'}
                </option>
              ))}
            </select>
          </div>

          {/* Limit Count */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">采集提取数量：</span>
              <span className="text-indigo-400 font-mono font-bold">{limitCount} 条目标</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="20"
              value={limitCount}
              onChange={(e) => setLimitCount(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20 条</span>
              <span>100 条</span>
              <span>250 条</span>
              <span>500 条</span>
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> 高精活跃度过滤策略：
            </label>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterActive3Days}
                  onChange={(e) => setFilterActive3Days(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <span className="text-[11px] text-slate-300">🟡 3 天内活跃</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterOnlineOnly}
                  onChange={(e) => setFilterOnlineOnly(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <span className="text-[11px] text-slate-300">🟢 仅当前在线</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeBots}
                  onChange={(e) => setExcludeBots(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <span className="text-[11px] text-slate-300">🚫 剔除机器人</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeAdmins}
                  onChange={(e) => setExcludeAdmins(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <span className="text-[11px] text-slate-300">🚫 剔除群管理员</span>
              </label>

              <label className="col-span-2 flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeNoAvatar}
                  onChange={(e) => setExcludeNoAvatar(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <span className="text-[11px] text-slate-300">🚫 剔除无头像/长期潜水死号</span>
              </label>
            </div>
          </div>

          {/* Scrape Trigger Button */}
          <button
            onClick={handleStartScrape}
            disabled={isScraping || !sourceUrl.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>获客雷达正在全速扫描南美群组节点...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>立即启动获客雷达提取活跃目标</span>
              </>
            )}
          </button>

          {/* Console Log Terminal */}
          {logs.length > 0 && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1 font-mono text-[11px] max-h-36 overflow-y-auto">
              <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>📡 采集实时通信日志</span>
                <span className="text-emerald-400">LIVE</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="text-slate-300 leading-tight">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Scraped Results Table & Actions */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex-1 flex flex-col">
            {/* Table Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  {selectAll ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>全选 ({selectedTargets.length}/{scrapedLeads.length})</span>
                </button>
                {sourceTitle && (
                  <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30 truncate max-w-[200px]">
                    源: {sourceTitle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="搜索用户名/名字..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 w-44 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1">
              {filteredDisplayLeads.length > 0 ? (
                filteredDisplayLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => handleToggleLead(lead.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      lead.selected
                        ? 'bg-slate-950/80 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={lead.selected}
                        onChange={() => {}}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                      />

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                        {lead.avatarUrl ? (
                          <img
                            src={lead.avatarUrl}
                            alt={lead.firstName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            {lead.firstName?.[0] || 'U'}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {lead.firstName} {lead.lastName}
                          </span>
                          {lead.isPremium && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                              ⭐ Premium
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-indigo-400 font-mono truncate">
                          {lead.username || lead.phone || lead.targetId}
                        </div>
                      </div>
                    </div>

                    {/* Right Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                          lead.lastSeenStatus === 'online'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : lead.lastSeenStatus === 'recently'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {lead.lastSeenText}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                  <Users className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">暂无已采集的目标客户数据</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    请在左侧输入巴西博彩公开群组链接，点击“启动获客雷达”即可批量提取活跃用户。
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {scrapedLeads.length > 0 && (
              <div className="border-t border-slate-800 pt-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-mono">
                  已选 <span className="text-emerald-400 font-bold">{selectedTargets.length}</span> / {scrapedLeads.length} 条有效目标
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportTxt}
                    disabled={selectedTargets.length === 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 TXT</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    disabled={selectedTargets.length === 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 CSV</span>
                  </button>

                  <button
                    onClick={handleImportToDispatch}
                    disabled={selectedTargets.length === 0}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>一键导入极速发信池并前往群发 ({selectedTargets.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
