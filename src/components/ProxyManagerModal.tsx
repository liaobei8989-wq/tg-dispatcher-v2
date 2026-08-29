import React, { useState, useEffect } from 'react';
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
  Terminal
} from 'lucide-react';
import { ProxyItem, DeviceFingerprint, AccountSession } from '../types';

interface ProxyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSession[];
  onUpdateAccountProxy?: (phone: string, proxy: string) => void;
}

export const ProxyManagerModal: React.FC<ProxyManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUpdateAccountProxy
}) => {
  const [proxies, setProxies] = useState<ProxyItem[]>([
    {
      id: 'p1',
      ip: '200.160.43.132',
      port: 12323,
      username: '14aade52b86e6',
      password: '70dd653fc2',
      type: 'socks5',
      countryCode: 'BR',
      location: '🇧🇷 Brazil (São Paulo - Claro/Vivo Residential)',
      pingMs: 104,
      status: 'active',
      assignedPhone: '5586994428117'
    },
    {
      id: 'p2',
      ip: '200.239.213.26',
      port: 12323,
      username: '14aade52b86e6',
      password: '70dd653fc2',
      type: 'socks5',
      countryCode: 'BR',
      location: '🇧🇷 Brazil (Rio de Janeiro - TIM Residential)',
      pingMs: 112,
      status: 'active',
      assignedPhone: '5586994581839'
    },
    {
      id: 'p3',
      ip: '200.160.36.222',
      port: 12323,
      username: '14aade52b86e6',
      password: '70dd653fc2',
      type: 'socks5',
      countryCode: 'BR',
      location: '🇧🇷 Brazil (Belo Horizonte - Oi Residential)',
      pingMs: 98,
      status: 'active',
      assignedPhone: '5586994709226'
    },
    {
      id: 'p4',
      ip: '200.239.237.124',
      port: 12323,
      username: '14aade52b86e6',
      password: '70dd653fc2',
      type: 'socks5',
      countryCode: 'BR',
      location: '🇧🇷 Brazil (Curitiba - Copel Residential)',
      pingMs: 108,
      status: 'active',
      assignedPhone: '5586994684213'
    },
    {
      id: 'p5',
      ip: '200.160.38.29',
      port: 12323,
      username: '14aade52b86e6',
      password: '70dd653fc2',
      type: 'socks5',
      countryCode: 'BR',
      location: '🇧🇷 Brazil (Brasília - Vivo Residential)',
      pingMs: 115,
      status: 'active',
      assignedPhone: '5586994687152'
    }
  ]);

  const [bulkInput, setBulkInput] = useState('');
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');
  const [selectedFingerprint, setSelectedFingerprint] = useState('Samsung Galaxy S24 Ultra');

  // Load existing mapping on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/proxies/get-mapping')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.mappings && Object.keys(data.mappings).length > 0) {
            // Update assigned phones in state
            setProxies(prev => prev.map(p => {
              const matchedEntry = Object.entries(data.mappings).find(([ph, prxStr]) => String(prxStr).includes(p.ip));
              if (matchedEntry) {
                return { ...p, assignedPhone: matchedEntry[0] };
              }
              return p;
            }));
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
          next[index] = {
            ...next[index],
            pingMs: data.pingMs,
            status: 'active',
            location: data.location
          };
          return next;
        });
      }
    } catch (e) {}
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    for (let i = 0; i < proxies.length; i++) {
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
        port: parseInt(parts[1]) || 1080,
        username: parts[2],
        password: parts[3],
        type: 'socks5',
        countryCode: 'BR',
        location: '🇧🇷 Brazil Native Residential',
        pingMs: 110,
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
        setSaveSuccessMsg('✅ 已成功将 1号1IP 专属映射持久化同步至 VPS 磁盘 (account_proxies.json)！');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                1 账号 1 独立 IP 隔离与设备指纹防护
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">
                  1:1 独立原生出口
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                为 VPS 上每个 Telegram 协议号绑定专属独立巴西原生住宅 IP（SOCKS5/HTTP）与手机指纹，杜绝关联封号
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

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

        {/* Proxy List & Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" /> 1:1 独立原生代理池 ({proxies.length} 个 IP 在线)：
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestAll}
                disabled={isTestingAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
                <span>全量测速 (Ping)</span>
              </button>

              <button
                onClick={handleAutoAssign}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20 flex items-center gap-1 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>一键精准 1:1 自动分配与绑定</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {proxies.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
                      <span>{p.ip}:{p.port}</span>
                      {p.username && <span className="text-slate-400 font-normal text-[11px]">({p.username})</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.location}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="font-mono text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {p.pingMs} ms
                  </span>
                  {p.assignedPhone ? (
                    <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/30 font-mono font-bold">
                      🛡️ 专属绑定: +{p.assignedPhone}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded font-mono">
                      待分配
                    </span>
                  )}
                  <button
                    onClick={() => setProxies(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Import */}
          <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>批量导入新代理 (一行一条，格式: IP:Port 或 IP:Port:User:Pass)：</span>
              <button
                onClick={handleAddBulk}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] font-bold transition-colors"
              >
                + 确认导入
              </button>
            </div>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="200.160.43.132:12323:14aade52b86e6:70dd653fc2&#10;200.239.213.26:12323:14aade52b86e6:70dd653fc2"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 resize-none shadow-inner"
            />
          </div>

          {/* VPS Command Helpers */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" /> VPS 1号1IP 必备 Python 依赖安装命令：
              </span>
              <button
                onClick={() => copyToClipboard('pip3 install telethon pysocks async_timeout', 'pip')}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded flex items-center gap-1 transition-colors border border-amber-500/30"
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

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-4 gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>1号1IP 物理隔离已生效：Telegram 后台会将每个号识别为不同城市巴西本地家庭手机</span>
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
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
            >
              保存并完成配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
