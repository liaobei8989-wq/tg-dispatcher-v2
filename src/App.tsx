import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { FileImportHub } from './components/FileImportHub';
import { DualScrubber } from './components/DualScrubber';
import { AccountManager } from './components/AccountManager';
import { AntiBanConfig } from './components/AntiBanConfig';
import { TemplateLibrary } from './components/TemplateLibrary';
import { CampaignConsole } from './components/CampaignConsole';
import { LogViewer } from './components/LogViewer';
import { PythonCodeHub } from './components/PythonCodeHub';
import { CodexTgSimulator } from './components/CodexTgSimulator';
import { WhatsAppCloudConsole } from './components/WhatsAppCloudConsole';
import { BatchHealthModal } from './components/BatchHealthModal';
import { SimplifiedTgHub } from './components/SimplifiedTgHub';
import { LeadScraperHub } from './components/LeadScraperHub';
import { WebInboxHub } from './components/WebInboxHub';
import { ProxyManagerModal } from './components/ProxyManagerModal';

import { AccountSession, AntiBanSettings, CampaignLog, AccountStatus, ScrubbedContact } from './types';
import { INITIAL_MOCK_ACCOUNTS, calculateWarmupDays, getDedicatedProxyForPhone, BRAZIL_DEDICATED_PROXIES_MAP } from './data/mockAccounts';
import { PRESET_TEMPLATES } from './data/presetTemplates';
import { saveAccountsToStorage, loadAccountsFromStorage, safeSaveAccountsToLocalStorage } from './utils/accountStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('tg_simple');

  // Scrubbed contacts pool shared across modules
  const [scrubbedContacts, setScrubbedContacts] = useState<ScrubbedContact[]>([]);

  // Accounts state with fallback to INITIAL_MOCK_ACCOUNTS & dynamic sync
  const [accounts, setAccounts] = useState<AccountSession[]>(() => {
    try {
      const saved = localStorage.getItem('tg_wa_matrix_accounts_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const uniqueMap = new Map<string, AccountSession>();
          const obsoletePhones = new Set(['5538988630899', '5538991977854', '5538992304845', '5541987023810']);

          parsed.forEach((acc: AccountSession, idx: number) => {
            if (acc.platform === 'whatsapp' || acc.type?.startsWith('wa_')) return;
            const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : '';
            if (!cleanPhone || cleanPhone.length < 8 || obsoletePhones.has(cleanPhone)) return;

            if (!uniqueMap.has(cleanPhone)) {
              const dedicatedProxy = BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || acc.proxy || getDedicatedProxyForPhone(cleanPhone, idx);
              const createdAt = acc.createdAt || (cleanPhone.startsWith('55869948') || cleanPhone.startsWith('55869949') || cleanPhone.startsWith('55869951') ? '2026-08-29' : '2026-08-24');
              const validWarmupDay = calculateWarmupDays(createdAt, acc.warmupDay);
              const isBGroup = cleanPhone.startsWith('55869948') || cleanPhone.startsWith('55869949') || cleanPhone.startsWith('55869951') || validWarmupDay <= 3;
              const rawGroup = acc.groupTag;
              const normalizedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
                ? (isBGroup ? '新买养号B组' : '主力爆破A组')
                : rawGroup;

              uniqueMap.set(cleanPhone, {
                ...acc,
                proxy: dedicatedProxy,
                createdAt: createdAt,
                warmupDay: validWarmupDay,
                avatarUrl: acc.avatarUrl || '',
                groupTag: normalizedGroup
              });
            }
          });

          const sanitizedList = Array.from(uniqueMap.values());
          if (sanitizedList.length > 0) return sanitizedList;
        }
      }
    } catch (e) {
      console.warn('Initial localStorage account load warning:', e);
    }
    return INITIAL_MOCK_ACCOUNTS;
  });

  // Async hydration from server API and IndexedDB on initial load
  React.useEffect(() => {
    const obsoletePhones = new Set(['5538988630899', '5538991977854', '5538992304845', '5541987023810']);
    // 1. Fetch live accounts from server sessions directory
    fetch('/api/telegram/get-accounts')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.accounts) && data.accounts.length > 0) {
          setAccounts(prev => {
            const uniqueMap = new Map<string, AccountSession>();
            // Keep existing modified details if valid & not obsolete
            prev.forEach((a, idx) => {
              const cp = a.phone ? a.phone.replace(/\D/g, '') : '';
              if (cp && !obsoletePhones.has(cp)) {
                uniqueMap.set(cp, {
                  ...a,
                  proxy: BRAZIL_DEDICATED_PROXIES_MAP[cp] || a.proxy || getDedicatedProxyForPhone(cp, idx)
                });
              }
            });
            // Merge server accounts
            data.accounts.forEach((acc: AccountSession, idx: number) => {
              const cp = acc.phone ? acc.phone.replace(/\D/g, '') : '';
              if (cp && !obsoletePhones.has(cp)) {
                const existing = uniqueMap.get(cp);
                const dedicatedProxy = BRAZIL_DEDICATED_PROXIES_MAP[cp] || acc.proxy || getDedicatedProxyForPhone(cp, idx);
                const isBGroup = cp.startsWith('55869948') || cp.startsWith('55869949') || cp.startsWith('55869951');
                const rawGroup = existing?.groupTag || acc.groupTag;
                const normalizedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
                  ? (isBGroup ? '新买养号B组' : '主力爆破A组')
                  : rawGroup;

                uniqueMap.set(cp, {
                  ...acc,
                  ...(existing || {}),
                  proxy: dedicatedProxy,
                  createdAt: existing?.createdAt || acc.createdAt || (isBGroup ? '2026-08-29' : '2026-08-24'),
                  warmupDay: existing?.warmupDay || acc.warmupDay || (isBGroup ? 1 : 6),
                  groupTag: normalizedGroup
                });
              }
            });
            const list = Array.from(uniqueMap.values());
            safeSaveAccountsToLocalStorage(list);
            return list;
          });
        }
      })
      .catch(err => {
        console.warn('Server accounts sync skipped:', err);
      });

    // 2. Load from IndexedDB if available
    loadAccountsFromStorage().then(idbAccounts => {
      if (idbAccounts && idbAccounts.length > 0) {
        const uniqueMap = new Map<string, AccountSession>();
        idbAccounts.forEach((acc: AccountSession, idx: number) => {
          if (acc.platform === 'whatsapp' || acc.type?.startsWith('wa_')) return;
          const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : '';
          if (!cleanPhone || cleanPhone.length < 8) return;

          if (!uniqueMap.has(cleanPhone)) {
            const dedicatedProxy = BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || acc.proxy || getDedicatedProxyForPhone(cleanPhone, idx);
            const createdAt = acc.createdAt || (cleanPhone.startsWith('55869948') || cleanPhone.startsWith('55869949') || cleanPhone.startsWith('55869951') ? '2026-08-29' : '2026-08-24');
            const validWarmupDay = calculateWarmupDays(createdAt, acc.warmupDay);
            const isBGroup = cleanPhone.startsWith('55869948') || cleanPhone.startsWith('55869949') || cleanPhone.startsWith('55869951') || validWarmupDay <= 3;
            const rawGroup = acc.groupTag;
            const normalizedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
              ? (isBGroup ? '新买养号B组' : '主力爆破A组')
              : rawGroup;

            uniqueMap.set(cleanPhone, {
              ...acc,
              proxy: dedicatedProxy,
              createdAt: createdAt,
              warmupDay: validWarmupDay,
              avatarUrl: acc.avatarUrl || '',
              groupTag: normalizedGroup
            });
          }
        });
        const sanitized = Array.from(uniqueMap.values());
        if (sanitized.length > 0) {
          setAccounts(sanitized);
        }
      }
    }).catch(err => {
      console.warn('IndexedDB account hydration skipped:', err);
    });
  }, []);

  // Save accounts safely to IndexedDB and lightweight localStorage
  React.useEffect(() => {
    saveAccountsToStorage(accounts);
  }, [accounts]);

  // Anti-ban settings state with localStorage persistence
  const DEFAULT_ANTIBAN: AntiBanSettings = {
    minDelaySec: 15,
    maxDelaySec: 30,
    pauseIntervalCount: 20,
    pauseDurationMin: 3,
    minPauseDurationMin: 2,
    maxPauseDurationMin: 6,
    enableRandomRestDuration: true,
    enableWarmupSchedule: true,
    scheduledStartTime: '09:00',
    enableScheduledEndTime: true,
    scheduledEndTime: '22:00',
    scheduleTimezone: 'local',
    dailyWarmupLimits: [15, 35, 70, 150, 300, 500],
    autoRotateAccounts: true,
    rotationStrategy: 'round_robin',
    injectInvisibleUnicode: true,
    enableUrlRotator: true,
    enableGaussianJitter: true,
    tgDispatchRateLimit: 12,
    waDispatchRateLimit: 15,
    enableEarlyWarningFuse: true,
    warningThresholdPercent: 80,
    autoResumeNextDay: true,
    urls: [
      'https://m1.promobr1.xyz',
      'https://m2.promobr1.xyz',
      'https://m3.promobr1.xyz',
      'https://m4.promobr1.xyz',
      'https://m5.promobr1.xyz',
      'https://m6.promobr1.xyz',
      'https://m7.promobr1.xyz',
      'https://m8.promobr1.xyz',
      'https://m9.promobr1.xyz',
      'https://m10.promobr1.xyz'
    ]
  };

  const [antiBan, setAntiBan] = useState<AntiBanSettings>(() => {
    try {
      const saved = localStorage.getItem('antiban_settings');
      if (saved) {
        return { ...DEFAULT_ANTIBAN, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse antiban_settings from localStorage', e);
    }
    return DEFAULT_ANTIBAN;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('antiban_settings', JSON.stringify(antiBan));
    } catch (e) {
      console.error('Failed to save antiban_settings to localStorage', e);
    }
  }, [antiBan]);

  // Templates state
  const [templates, setTemplates] = useState(PRESET_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-fortune-tiger');

  // Campaign logs state
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);
  const [showBatchHealthModal, setShowBatchHealthModal] = useState<boolean>(false);
  const [showProxyModal, setShowProxyModal] = useState<boolean>(false);

  // Auto-imported leads from LeadScraperHub
  const [importedLeadsPool, setImportedLeadsPool] = useState<string[]>([]);

  // Health check handler for all accounts
  const handleCheckAllHealth = () => {
    setShowBatchHealthModal(true);
  };

  const handleImportScrapedLeads = (targets: string[]) => {
    setImportedLeadsPool(targets);
  };

  const handleUpdateAccountProxy = (phone: string, proxy: string) => {
    setAccounts(prev =>
      prev.map(a => (a.phone === phone ? { ...a, proxy } : a))
    );
  };

  const [totalFollowupToday, setTotalFollowupToday] = React.useState<number>(0);

  // Poll 24/7 auto-scanner follow-up stats from server
  React.useEffect(() => {
    const fetchFollowupStats = async () => {
      try {
        const res = await fetch('/api/tg-matrix/scanner-stats');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.todayCount === 'number') {
            setTotalFollowupToday(data.todayCount);
          }
        }
      } catch (e) {
        // silent
      }
    };
    fetchFollowupStats();
    const interval = setInterval(fetchFollowupStats, 4000);
    return () => clearInterval(interval);
  }, []);

  // Reset all platform data to complete 0 state
  const handleResetAllToZero = () => {
    setScrubbedContacts([]);
    setAccounts([]);
    setLogs([]);
    setIsCampaignRunning(false);
    setResetKey((prev) => prev + 1);
    setActiveTab('import');
  };

  const activeAccountCount = accounts.filter((a) => a.status === 'active' || a.status === 'warming').length;
  const totalSentToday = accounts.reduce((sum, a) => sum + a.sentToday, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAccountCount={activeAccountCount}
        totalSentToday={totalSentToday}
        totalFollowupToday={totalFollowupToday}
        isCampaignRunning={isCampaignRunning}
        onResetAllToZero={handleResetAllToZero}
      />

      <main className="w-full max-w-[1840px] mx-auto px-2 sm:px-4 lg:px-6 py-5">
        {activeTab === 'tg_simple' && (
          <SimplifiedTgHub
            accounts={accounts}
            setAccounts={setAccounts}
            logs={logs}
            setLogs={setLogs}
            isCampaignRunning={isCampaignRunning}
            setIsCampaignRunning={setIsCampaignRunning}
            onOpenLeadScraper={() => setActiveTab('lead_scraper')}
            onOpenWebInbox={() => setActiveTab('web_inbox')}
            onOpenProxyModal={() => setShowProxyModal(true)}
            initialTargets={importedLeadsPool}
          />
        )}

        {activeTab === 'lead_scraper' && (
          <LeadScraperHub
            accounts={accounts}
            onImportToDispatch={handleImportScrapedLeads}
            onNavigateToDispatch={() => setActiveTab('tg_simple')}
          />
        )}

        {activeTab === 'web_inbox' && (
          <WebInboxHub accounts={accounts} />
        )}

        {activeTab === 'proxy_manager' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  🌐 1 账号 1 独立 IP 代理池与指纹防护中心
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  南美高匿原生住宅代理与移动端设备硬件指纹（Samsung S24, iPhone 15 等），实现账号物理级隔离。
                </p>
              </div>
              <button
                onClick={() => setShowProxyModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20"
              >
                + 打开代理与指纹配置弹窗
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                      {acc.alias?.[0] || 'TG'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{acc.alias} ({acc.phone})</div>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                        {acc.proxy || '200.160.43.132:12323 (巴西住宅代理)'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    🟢 隔离生效中
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            accounts={accounts}
            setAccounts={setAccounts}
            antiBan={antiBan}
            logs={logs}
            setActiveTab={setActiveTab}
            onCheckAllHealth={handleCheckAllHealth}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountManager
            accounts={accounts}
            setAccounts={setAccounts}
            onCheckAllHealth={handleCheckAllHealth}
            onNavigateToPythonScript={() => setActiveTab('python')}
            onNavigateToCampaign={() => setActiveTab('campaign')}
          />
        )}

        {activeTab === 'antiban' && (
          <AntiBanConfig antiBan={antiBan} setAntiBan={setAntiBan} />
        )}

        {activeTab === 'templates' && (
          <TemplateLibrary
            templates={templates}
            setTemplates={setTemplates}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            onNavigateToCampaign={() => setActiveTab('campaign')}
          />
        )}

        {activeTab === 'campaign' && (
          <CampaignConsole
            accounts={accounts}
            setAccounts={setAccounts}
            antiBan={antiBan}
            setAntiBan={setAntiBan}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            logs={logs}
            setLogs={setLogs}
            isCampaignRunning={isCampaignRunning}
            setIsCampaignRunning={setIsCampaignRunning}
            scrubbedContacts={scrubbedContacts}
          />
        )}

        {activeTab === 'whatsapp_cloud' && (
          <WhatsAppCloudConsole
            scrubbedContacts={scrubbedContacts}
            onSentMessage={(count) => {
              const currentLogCount = logs.length;
              const newLog: CampaignLog = {
                id: (currentLogCount + 1).toString(),
                campaignId: 'cmp-cloud-api',
                accountId: 'acc-wa-cloud',
                accountPhone: '1288649794326030 (Meta Official)',
                targetPhone: '+55 71 99914-9956',
                platform: 'whatsapp',
                messageText: 'Meta WhatsApp Official Message Dispatched via Graph API v20.0',
                status: 'success',
                delaySec: 0,
                timestamp: new Date().toLocaleTimeString()
              };
              setLogs(prev => [newLog, ...prev]);
            }}
          />
        )}

        {activeTab === 'codex' && (
          <CodexTgSimulator
            accounts={accounts}
            scrubbedContacts={scrubbedContacts}
            onNavigateToCampaign={() => setActiveTab('campaign')}
          />
        )}

        {activeTab === 'logs' && (
          <LogViewer logs={logs} setLogs={setLogs} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'python' && <PythonCodeHub />}
      </main>

      <BatchHealthModal
        isOpen={showBatchHealthModal}
        onClose={() => setShowBatchHealthModal(false)}
        accounts={accounts}
        setAccounts={setAccounts}
      />

      <ProxyManagerModal
        isOpen={showProxyModal}
        onClose={() => setShowProxyModal(false)}
        accounts={accounts}
        onUpdateAccountProxy={handleUpdateAccountProxy}
      />
    </div>
  );
}

