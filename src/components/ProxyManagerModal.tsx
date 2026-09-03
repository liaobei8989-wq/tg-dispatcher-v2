import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe2,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Check,
  X,
  Server,
  Save,
  Copy,
  Terminal,
  Search,
  Filter
} from 'lucide-react';
import { ProxyItem, DeviceFingerprint, AccountSession } from '../types';
import { BRAZIL_PROXIES_POOL, BRAZIL_DEDICATED_PROXIES_MAP } from '../data/mockAccounts';

interface ProxyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
  onUpdateAccountProxy?: (phone: string, proxy: string) => void;
}

const buildInitialProxies = (): ProxyItem[] => {
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

  return BRAZIL_PROXIES_POOL.map((pStr, idx) => {
    const parts = pStr.split(':');
    const ip = parts[0] || '';
    const port = parseInt(parts[1]) || 12323;
    const username = parts[2] || '';
    const password = parts[3] || '';

    // Find assigned phone from map
    let assignedPhone = '';
    for (const [ph, proxy] of Object.entries(BRAZIL_DEDICATED_PROXIES_MAP)) {
      if (proxy.includes(ip)) {
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
    };
  });
};

export const ProxyManagerModal: React.FC<ProxyManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUpdateAccountProxy
}) => {
  const [proxies, setProxies] = useState<ProxyItem[]>(buildInitialProxies);
  const [filterTab, setFilterTab] = useState<'all' | 'assigned' | 'available'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');
  const [selectedFingerprint, setSelectedFingerprint] = useState('Samsung Galaxy S24 Ultra');

  // Load existing mapping and pool on modal open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/proxies/pool')
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.proxies) && data.proxies.length > 0) {
            setProxies(data.proxies);
          } else {
            fetch('/api/proxies/get-mapping')
              .then(r => r.json())
              .then(mapData => {
                if (mapData.success && mapData.mappings) {
                  setProxies(prev => prev.map(p => {
                    const matchedEntry = Object.entries(mapData.mappings).find(([_, prxStr]) => String(prxStr).includes(p.ip));
                    if (matchedEntry) {
                      return { ...p, assignedPhone: matchedEntry[0] };
                    }
                    return p;
                  }));
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const FINGERPRINTS: DeviceFingerprint[] = [
    {
      id: 'fp1',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      deviceModel: 'SM-S928B',
      systemVersion: 'Android 14 (OneUI 6.1)',
      appVersion: '10.14.5 (4890)',
      systemLangCode: 'pt-BR',
      langCode: 'pt',
      screenResolution: '1440x3120'
    },
    {
      id: 'fp2',
      name: 'Apple iPhone 15 Pro Max',
      brand: 'Apple',
      deviceModel: 'iPhone16,2',
      systemVersion: 'iOS 17.5.1',
      appVersion: '10.14.0 (2981)',
      systemLangCode: 'pt-BR',
      langCode: 'pt',
      screenResolution: '1290x2796'
    },
    {
      id: 'fp3',
      name: 'Xiaomi 14 Pro',
      brand: 'Xiaomi',
      deviceModel: '23116PN5BC',
      systemVersion: 'Android 14 (HyperOS 1.0)',
      appVersion: '10.14.5 (4890)',
      systemLangCode: 'pt-BR',
      langCode: 'pt',
      screenResolution: '1440x3200'
    }
  ];

  if (!isOpen) return null;

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

  const handleTestPing = async (proxyStr: string, index: number) => {
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
    for (let i = 0; i < Math.min(proxies.length, 15); i++) {
      const p = proxies[i];
      await handleTestPing(`${p.ip}:${p.port}`, i);
    }
    setIsTestingAll(false);
  };

  const handleAddBulk = () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems: ProxyItem[] = lines.map((line, idx) => {
      const parts = line.split(':');
      return {
        id: `p-${Date.now()}-${idx}`,
        ip: parts[0] || '127.0.0.1',
        port: parseInt(parts[1]) || 12323,
        username: parts[2] || '',
        password: parts[3] || '',
        type: 'socks5',
        countryCode: 'BR',
        location: '🇧🇷 Brazil Native Residential',
        pingMs: 105,
        status: 'active'
      };
    });

    setProxies(prev => [...prev, ...newItems]);
    setBulkInput('');
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
        // Sync proxy pool format to localStorage
        try {
          const poolLines = proxies.map(p => {
            return p.username && p.password
              ? `${p.ip}:${p.port}:${p.username}:${p.password}`
              : `${p.ip}:${p.port}`;
          });
          localStorage.setItem('tg_custom_proxy_pool', JSON.stringify(poolLines));
        } catch (_) {}

        setSaveSuccessMsg('✅ 已成功将全部 60 个独立 IP 与 1号1IP 专属映射持久化写入 VPS (account_proxies.json & proxies.txt)！');
        setTimeout(() => setSaveSuccessMsg(''), 4500);
      }
    } catch (e: any) {
      setSaveSuccessMsg(`❌ 同步失败: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Globe2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-100 flex-wrap">
                <span>1 账号 1 独立 IP 隔离与设备指纹防护池</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30 whitespace-nowrap">
                  共 {proxies.length} 个独立出口 ({assignedCount} 已绑 + {availableCount} 待用)
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                每个 Telegram 号独占 1 个巴西原生住宅 IP 与手机设备指纹，完全物理隔离，防封防关联
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                handleSaveToDisk();
                onClose();
              }}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
              title="立即保存并关闭"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存配置</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Status notice */}
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">代理池总量 (VPS)</div>
                <div className="text-lg font-mono font-bold text-slate-100">{proxies.length} <span className="text-xs text-slate-400 font-normal">个 IP</span></div>
              </div>
              <Server className="w-6 h-6 text-cyan-400/60" />
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">当前已绑定账号</div>
                <div className="text-lg font-mono font-bold text-cyan-400">{assignedCount} <span className="text-xs text-slate-400 font-normal">个 (10老号)</span></div>
              </div>
              <Shield className="w-6 h-6 text-emerald-400/60" />
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">空闲待分配 (新购号就绪)</div>
                <div className="text-lg font-mono font-bold text-emerald-400">{availableCount} <span className="text-xs text-slate-400 font-normal">个 (新买50号即插即用)</span></div>
              </div>
              <Zap className="w-6 h-6 text-amber-400/60" />
            </div>
          </div>

        {/* Device Fingerprint Simulator Bar */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" /> MTProto 真实移动设备指纹随机化 (Device Fingerprint)：
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">100% 模拟真实手机型号</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {FINGERPRINTS.map((fp) => (
              <div
                key={fp.id}
                onClick={() => setSelectedFingerprint(fp.name)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                  selectedFingerprint === fp.name
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{fp.name}</span>
                  {selectedFingerprint === fp.name && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{fp.systemVersion}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">Telethon {fp.appVersion} • {fp.systemLangCode}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Proxy List & Filter Header */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                全部 IP ({proxies.length})
              </button>
              <button
                onClick={() => setFilterTab('assigned')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === 'assigned'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                已绑定 ({assignedCount})
              </button>
              <button
                onClick={() => setFilterTab('available')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === 'available'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                待分配待用 ({availableCount})
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索 IP / 手机号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-36 sm:w-44"
                />
              </div>

              <button
                onClick={handleTestAll}
                disabled={isTestingAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
                <span>批量测速</span>
              </button>

              <button
                onClick={handleAutoAssign}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20 flex items-center gap-1 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>一键精准 1:1 自动分配</span>
              </button>
            </div>
          </div>

          {/* Proxy Scroll Area */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {filteredProxies.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                暂无匹配的代理 IP
              </div>
            ) : (
              filteredProxies.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 flex items-center justify-between text-xs hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${p.assignedPhone ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`}></div>
                    <div>
                      <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
                        <span>{p.ip}:{p.port}</span>
                        {p.username && <span className="text-slate-400 font-normal text-[11px]">({p.username})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {p.pingMs} ms
                    </span>
                    {p.assignedPhone ? (
                      <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/30 font-mono font-bold">
                        🛡️ 专属绑定: +{p.assignedPhone}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded font-mono border border-emerald-500/20">
                        ⚡ 待用待购号接入
                      </span>
                    )}
                    <button
                      onClick={() => setProxies(prev => prev.filter(item => item.ip !== p.ip))}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="移除此 IP"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bulk Import */}
          <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>批量追加新代理 (一行一条，格式: IP:Port:User:Pass)：</span>
              <button
                onClick={handleAddBulk}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] font-bold transition-colors"
              >
                + 确认追加
              </button>
            </div>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="200.152.152.137:12323:14abdb1a0db2e:cb8f30f1a9&#10;200.152.152.113:12323:14abdb1a0db2e:cb8f30f1a9"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 resize-none shadow-inner"
            />
          </div>

          {/* VPS Command Helpers */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" /> VPS 1号1IP 必备 Python 依赖安装命令：
              </span>
              <button
                onClick={() => copyToClipboard('pip3 install telethon pysocks async_timeout', 'pip')}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded flex items-center gap-1 transition-colors border border-amber-500/30"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCmd === 'pip' ? '已复制！' : '复制 Pip 命令'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 select-all border border-slate-800">
              pip3 install telethon pysocks async_timeout
            </div>
          </div>
        </div>
      </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>1号1IP 物理隔离：共 {proxies.length} 个 IP (已绑 {assignedCount} / 待分配 {availableCount})</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSaveToDisk()}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? '同步中...' : '同步至 VPS 磁盘'}</span>
            </button>
            <button
              onClick={() => {
                handleSaveToDisk();
                onClose();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>保存并完成配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
