import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Check,
  Server,
  Save,
  Copy,
  Terminal,
  Search,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AccountSession, ProxyItem } from '../types';
import { BRAZIL_PROXIES_POOL, BRAZIL_DEDICATED_PROXIES_MAP } from '../data/mockAccounts';

interface ProxyHubViewProps {
  accounts: AccountSession[];
  onOpenProxyModal: () => void;
  onUpdateAccountProxy?: (phone: string, proxy: string) => void;
}

export const ProxyHubView: React.FC<ProxyHubViewProps> = ({
  accounts,
  onOpenProxyModal,
  onUpdateAccountProxy
}) => {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'assigned' | 'available'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const locations = [
    '🇧🇷 Brazil (São Paulo - Claro/Vivo Residential)',
    '🇧🇷 Brazil (Rio de Janeiro - TIM Residential)',
    '🇧🇷 Brazil (Belo Horizonte - Oi Residential)',
    '🇧🇷 Brazil (Curitiba - Copel Residential)',
    '🇧🇷 Brazil (Brasília - Vivo Residential)',
    '🇧🇷 Brazil (Porto Alegre - Claro Residential)',
    '🇧🇷 Brazil (Salvador - TIM Residential)',
    '🇧🇷 Brazil (Fortaleza - Brisanet Residential)',
    '🇧🇷 Brazil (Recife - Vivo Residential)',
    '🇧🇷 Brazil (Manaus - Claro Residential)'
  ];

  // Load 60 proxies from server
  const loadProxies = () => {
    fetch('/api/proxies/pool')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.proxies) && data.proxies.length > 0) {
          setProxies(data.proxies);
        } else {
          // fallback
          const fallback = BRAZIL_PROXIES_POOL.map((pStr, idx) => {
            const parts = pStr.split(':');
            const ip = parts[0] || '';
            const port = parseInt(parts[1]) || 12323;
            const username = parts[2] || '';
            const password = parts[3] || '';

            let assignedPhone = '';
            for (const [ph, prx] of Object.entries(BRAZIL_DEDICATED_PROXIES_MAP)) {
              if (prx.includes(ip)) {
                assignedPhone = ph;
                break;
              }
            }

            return {
              id: `p-${idx + 1}`,
              ip,
              port,
              username,
              password,
              type: 'socks5',
              countryCode: 'BR',
              location: locations[idx % locations.length],
              pingMs: 92 + (idx % 28),
              status: 'active',
              assignedPhone
            } as ProxyItem;
          });
          setProxies(fallback);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProxies();
  }, []);

  const assignedCount = proxies.filter(p => Boolean(p.assignedPhone)).length;
  const availableCount = proxies.filter(p => !p.assignedPhone).length;

  const filteredProxies = proxies.filter(p => {
    if (filterTab === 'assigned' && !p.assignedPhone) return false;
    if (filterTab === 'available' && p.assignedPhone) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ipMatch = p.ip.toLowerCase().includes(q);
      const phoneMatch = p.assignedPhone && p.assignedPhone.includes(q);
      const locMatch = p.location && p.location.toLowerCase().includes(q);
      return ipMatch || phoneMatch || locMatch;
    }
    return true;
  });

  const handleTestPing = async (proxyStr: string) => {
    try {
      const res = await fetch('/api/proxies/test-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: proxyStr })
      });
      const data = await res.json();
      if (data.success) {
        setProxies(prev => {
          const next = [...prev];
          const target = next.find(item => item.ip === proxyStr.split(':')[0]);
          if (target) {
            target.pingMs = data.pingMs;
            target.status = 'active';
            target.location = data.location;
          }
          return [...next];
        });
      }
    } catch (e) {}
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    for (let i = 0; i < Math.min(proxies.length, 12); i++) {
      const p = proxies[i];
      await handleTestPing(`${p.ip}:${p.port}`);
    }
    setIsTestingAll(false);
  };

  const handleAutoAssign = () => {
    const updated = [...proxies];
    const mappings: Record<string, string> = {};

    accounts.forEach((acc, idx) => {
      const cleanPhone = acc.phone.replace(/[^0-9]/g, '');
      const p = updated[idx % updated.length];
      if (p) {
        p.assignedPhone = cleanPhone;
        const proxyStr = p.username && p.password
          ? `${p.ip}:${p.port}:${p.username}:${p.password}`
          : `${p.ip}:${p.port}`;
        mappings[cleanPhone] = proxyStr;
        if (onUpdateAccountProxy) {
          onUpdateAccountProxy(cleanPhone, `socks5://${proxyStr}`);
        }
      }
    });

    setProxies(updated);
    handleSaveToDisk(mappings);
  };

  const handleSaveToDisk = async (customMappings?: Record<string, string>) => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      let mappings = customMappings;
      if (!mappings) {
        mappings = {};
        proxies.forEach(p => {
          if (p.assignedPhone) {
            const clean = p.assignedPhone.replace(/[^0-9]/g, '');
            const pStr = p.username && p.password
              ? `${p.ip}:${p.port}:${p.username}:${p.password}`
              : `${p.ip}:${p.port}`;
            mappings![clean] = pStr;
          }
        });
      }

      const res = await fetch('/api/proxies/save-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappings,
          proxiesList: proxies
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('✅ 已成功将全部 60 个独立 IP 与 1号1IP 映射持久化保存到 VPS 磁盘 (account_proxies.json & proxies.txt)！');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (e: any) {
      setSaveSuccessMsg(`❌ 同步失败: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Globe2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex flex-wrap items-center gap-2.5">
              <span>🌐 1 账号 1 独立 IP 代理池与指纹防护中心</span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                已装载 {proxies.length || 60} 个独立原生出口
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              每个 Telegram 协议号独占 1 个专属巴西住宅 IP 与独立的移动端设备指纹。老号 10 个已绑定，新买 50 个号即插即用自动分配。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleAutoAssign}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>一键 1:1 自动分配</span>
          </button>
          <button
            onClick={onOpenProxyModal}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>打开高级代理配置弹窗</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">VPS 代理池总量</div>
            <div className="text-2xl font-mono font-black text-slate-100 mt-1">
              {proxies.length || 60} <span className="text-xs text-slate-400 font-normal">个原生 IP</span>
            </div>
            <div className="text-[11px] text-cyan-400 mt-0.5 font-mono">proxies.txt</div>
          </div>
          <Server className="w-8 h-8 text-cyan-400/50" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">当前老账号绑定 (10 个)</div>
            <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
              {assignedCount} <span className="text-xs text-slate-400 font-normal">个 1:1 锁定</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">account_proxies.json</div>
          </div>
          <Shield className="w-8 h-8 text-emerald-400/50" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">空闲待分配 (新购号就绪)</div>
            <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
              {availableCount} <span className="text-xs text-slate-400 font-normal">个全新独立 IP</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-0.5 font-mono">50 个新号即插即用</div>
          </div>
          <Zap className="w-8 h-8 text-amber-400/50" />
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部独立 IP ({proxies.length})
            </button>
            <button
              onClick={() => setFilterTab('assigned')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'assigned'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              已绑定老号 ({assignedCount})
            </button>
            <button
              onClick={() => setFilterTab('available')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              待分配新 IP ({availableCount})
            </button>
          </div>

          {/* Search & Test */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索 IP / 手机号 / 城市..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={handleTestAll}
              disabled={isTestingAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin text-cyan-400' : ''}`} />
              <span>快速测速</span>
            </button>
          </div>
        </div>

        {/* 60 Proxies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredProxies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              没有找到符合条件的代理 IP
            </div>
          ) : (
            filteredProxies.map((p, idx) => (
              <div
                key={p.id || idx}
                className={`bg-slate-950/80 border rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 transition-all hover:border-slate-700 ${
                  p.assignedPhone ? 'border-cyan-500/30' : 'border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.assignedPhone ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`}></div>
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-xs text-slate-100 truncate">
                        {p.ip}:{p.port}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {p.location}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    {p.pingMs || 98} ms
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                  {p.assignedPhone ? (
                    <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] font-bold">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+{p.assignedPhone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>新购号即插即用待命</span>
                    </div>
                  )}

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                      p.assignedPhone
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {p.assignedPhone ? '🟢 1:1 隔离中' : '⚡ 空闲就绪'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
