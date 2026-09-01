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
          const top5Phones = new Set(['5586994428117', '5586994581839', '5586994709226', '5586994684213', '5586994687152']);

          parsed.forEach((acc: AccountSession, idx: number) => {
            // Telegram only verification
            const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : '';
            if (!cleanPhone || cleanPhone.length < 8 || obsoletePhones.has(cleanPhone)) return;

            if (!uniqueMap.has(cleanPhone)) {
              const isTop5 = top5Phones.has(cleanPhone) || (!cleanPhone.startsWith('55869948') && !cleanPhone.startsWith('55869949') && !cleanPhone.startsWith('55869951') && idx < 5);
              const dedicatedProxy = BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || acc.proxy || getDedicatedProxyForPhone(cleanPhone, idx);
              const defaultDay = isTop5 ? 7 : 3;
              const hasCorruptDay = acc.warmupDay === 16 || acc.warmupDay === 8 || !acc.warmupDay;
              const baseDay = hasCorruptDay ? defaultDay : (acc.baseWarmupDay || acc.warmupDay || defaultDay);
              const createdAt = hasCorruptDay ? '2026-08-31' : (acc.createdAt || '2026-08-31');
              const validWarmupDay = hasCorruptDay ? defaultDay : calculateWarmupDays(createdAt, baseDay);
              const isMature = validWarmupDay >= 4;
              const rawGroup = acc.groupTag;
              const normalizedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
                ? (isTop5 ? '主力爆破A组' : '新买养号B组')
                : rawGroup;

              uniqueMap.set(cleanPhone, {
                ...acc,
                proxy: dedicatedProxy,
                createdAt: createdAt,
                baseWarmupDay: baseDay,
                warmupDay: validWarmupDay,
                dailyLimit: validWarmupDay >= 4 ? 120 : 60,
                status: isMature ? 'active' : 'warming',
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
    const top5Phones = new Set(['5586994428117', '5586994581839', '5586994709226', '5586994684213', '5586994687152']);

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
                const isTop5 = top5Phones.has(cp) || (!cp.startsWith('55869948') && !cp.startsWith('55869949') && !cp.startsWith('55869951') && idx < 5);
                const dedicatedProxy = BRAZIL_DEDICATED_PROXIES_MAP[cp] || acc.proxy || getDedicatedProxyForPhone(cp, idx);
                const defaultDay = isTop5 ? 7 : 3;
                const hasCorruptDay = (existing?.warmupDay === 16 || existing?.warmupDay === 8 || acc.warmupDay === 16 || acc.warmupDay === 8);
                const baseDay = hasCorruptDay ? defaultDay : (existing?.baseWarmupDay || acc.baseWarmupDay || defaultDay);
                const createdAt = hasCorruptDay ? '2026-08-31' : (existing?.createdAt || acc.createdAt || '2026-08-31');
                const dynamicWarmupDay = hasCorruptDay ? defaultDay : calculateWarmupDays(createdAt, baseDay);
                const isMature = dynamicWarmupDay >= 4;
                const rawGroup = existing?.groupTag || acc.groupTag;
                const normalizedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
                  ? (isTop5 ? '主力爆破A组' : '新买养号B组')
                  : rawGroup;

                uniqueMap.set(cp, {
                  ...acc,
                  ...(existing || {}),
                  proxy: dedicatedProxy,
                  createdAt: createdAt,
                  baseWarmupDay: baseDay,
                  warmupDay: dynamicWarmupDay,
                  dailyLimit: isMature ? 120 : 60,
                  status: isMature ? 'active' : 'warming',
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
          // Telegram only verification
          const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : '';
          if (!cleanPhone || cleanPhone.length < 8) return;

          if (!uniqueMap.has(cleanPhone)) {
            const isTop5 = top5Phones.has(cleanPhone) || (!cleanPhone.startsWith('55869948') && !cleanPhone.startsWith('55869949') && !cleanPhone.startsWith('55869951') && idx < 5);
            const dedicatedProxy = BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || acc.proxy || getDedicatedProxyForPhone(cleanPhone, idx);
            const defaultDay = isTop5 ? 7 : 3;
            const hasCorruptDay = acc.warmupDay === 16 || acc.warmupDay === 8;
            const baseDay = hasCorruptDay ? defaultDay : (acc.baseWarmupDay || acc.warmupDay || defaultDay);
            const createdAt = hasCorruptDay ? '2026-08-31' : (acc.createdAt || '2026-08-31');
            const validWarmupDay = hasCorruptDay ? defaultDay : calculateWarmupDays(createdAt, baseDay);
            const isMature = validWarmupDay >= 4;
            const rawGroup = acc.groupTag;
            const normalizedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
              ? (isTop5 ? '主力爆破A组' : '新买养号B组')
              : rawGroup;

            uniqueMap.set(cleanPhone, {
              ...acc,
              proxy: dedicatedProxy,
              createdAt: createdAt,
              baseWarmupDay: baseDay,
              warmupDay: validWarmupDay,
              dailyLimit: isMature ? 120 : 60,
              status: isMature ? 'active' : 'warming',
              avatarUrl: acc.avatarUrl || '',
              groupTag: normalizedGroup
            });
          }
        });
        const list = Array.from(uniqueMap.values());
        setAccounts(list);
        safeSaveAccountsToLocalStorage(list);
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
    minDelaySec: 45,
    maxDelaySec: 60,
    pauseIntervalCount: 15,
    pauseDurationMin: 3,
    minPauseDurationMin: 2,
    maxPauseDurationMin: 5,
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
    enableEarlyWarningFuse: true,
    warningThresholdPercent: 80,
    autoResumeNextDay: true,
    urls: [
      'https://vip01.promobr1.xyz', 'https://br02.promobr1.xyz', 'https://pix03.promobr1.xyz', 'https://spin04.promobr1.xyz', 'https://bet05.promobr1.xyz',
      'https://slot06.promobr1.xyz', 'https://lucky07.promobr1.xyz', 'https://win08.promobr1.xyz', 'https://top09.promobr1.xyz', 'https://go10.promobr1.xyz',
      'https://play11.promobr1.xyz', 'https://forra12.promobr1.xyz', 'https://mega13.promobr1.xyz', 'https://sorte14.promobr1.xyz', 'https://ouro15.promobr1.xyz',
      'https://clube16.promobr1.xyz', 'https://brasil17.promobr1.xyz', 'https://premio18.promobr1.xyz', 'https://bonus19.promobr1.xyz', 'https://turbo20.promobr1.xyz',
      'https://vip01.promobr2.xyz', 'https://br02.promobr2.xyz', 'https://pix03.promobr2.xyz', 'https://spin04.promobr2.xyz', 'https://bet05.promobr2.xyz',
      'https://slot06.promobr2.xyz', 'https://lucky07.promobr2.xyz', 'https://win08.promobr2.xyz', 'https://top09.promobr2.xyz', 'https://go10.promobr2.xyz',
      'https://play11.promobr2.xyz', 'https://forra12.promobr2.xyz', 'https://mega13.promobr2.xyz', 'https://sorte14.promobr2.xyz', 'https://ouro15.promobr2.xyz',
      'https://clube16.promobr2.xyz', 'https://brasil17.promobr2.xyz', 'https://premio18.promobr2.xyz', 'https://bonus19.promobr2.xyz', 'https://turbo20.promobr2.xyz',
      'https://vip01.promobr3.xyz', 'https://br02.promobr3.xyz', 'https://pix03.promobr3.xyz', 'https://spin04.promobr3.xyz', 'https://bet05.promobr3.xyz',
      'https://slot06.promobr3.xyz', 'https://lucky07.promobr3.xyz', 'https://win08.promobr3.xyz', 'https://top09.promobr3.xyz', 'https://go10.promobr3.xyz',
      'https://play11.promobr3.xyz', 'https://forra12.promobr3.xyz', 'https://mega13.promobr3.xyz', 'https://sorte14.promobr3.xyz', 'https://ouro15.promobr3.xyz',
      'https://clube16.promobr3.xyz', 'https://brasil17.promobr3.xyz', 'https://premio18.promobr3.xyz', 'https://bonus19.promobr3.xyz', 'https://turbo20.promobr3.xyz',
      'https://vip01.promobr4.xyz', 'https://br02.promobr4.xyz', 'https://pix03.promobr4.xyz', 'https://spin04.promobr4.xyz', 'https://bet05.promobr4.xyz',
      'https://slot06.promobr4.xyz', 'https://lucky07.promobr4.xyz', 'https://win08.promobr4.xyz', 'https://top09.promobr4.xyz', 'https://go10.promobr4.xyz',
      'https://play11.promobr4.xyz', 'https://forra12.promobr4.xyz', 'https://mega13.promobr4.xyz', 'https://sorte14.promobr4.xyz', 'https://ouro15.promobr4.xyz',
      'https://clube16.promobr4.xyz', 'https://brasil17.promobr4.xyz', 'https://premio18.promobr4.xyz', 'https://bonus19.promobr4.xyz', 'https://turbo20.promobr4.xyz',
      'https://vip01.promobr5.xyz', 'https://br02.promobr5.xyz', 'https://pix03.promobr5.xyz', 'https://spin04.promobr5.xyz', 'https://bet05.promobr5.xyz',
      'https://slot06.promobr5.xyz', 'https://lucky07.promobr5.xyz', 'https://win08.promobr5.xyz', 'https://top09.promobr5.xyz', 'https://go10.promobr5.xyz',
      'https://play11.promobr5.xyz', 'https://forra12.promobr5.xyz', 'https://mega13.promobr5.xyz', 'https://sorte14.promobr5.xyz', 'https://ouro15.promobr5.xyz',
      'https://clube16.promobr5.xyz', 'https://brasil17.promobr5.xyz', 'https://premio18.promobr5.xyz', 'https://bonus19.promobr5.xyz', 'https://turbo20.promobr5.xyz'
    ]
  };

  const [antiBan, setAntiBan] = useState<AntiBanSettings>(() => {
    try {
      const saved = localStorage.getItem('antiban_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_ANTIBAN, ...parsed };
        if (!merged.minDelaySec || merged.minDelaySec < 40) merged.minDelaySec = 45;
        if (!merged.maxDelaySec || merged.maxDelaySec < 50) merged.maxDelaySec = 60;
        if (!merged.urls || merged.urls.length < 50) merged.urls = DEFAULT_ANTIBAN.urls;
        return merged;
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
    const interval = setInterval(fetchFollowupStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Reset daily sent counts for all accounts
  const handleResetDailySent = () => {
    if (window.confirm('确定要一键清零今日【已群发】计数吗？\n（不会删除账号与发件历史，仅将今日发信量重置为 0）')) {
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('tg_last_sent_date', todayStr);
      setAccounts(prev => {
        const updated = prev.map(a => ({ ...a, sentToday: 0 }));
        safeSaveAccountsToLocalStorage(updated);
        saveAccountsToStorage(updated);
        return updated;
      });
    }
  };

  // Check and automatically roll over / reset sentToday at 00:00 (daily rollover)
  React.useEffect(() => {
    const checkDailyMidnightReset = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastRecordedDate = localStorage.getItem('tg_last_sent_date');
      if (lastRecordedDate && lastRecordedDate !== todayStr) {
        // A new calendar day has started -> Auto-reset today counter
        localStorage.setItem('tg_last_sent_date', todayStr);
        setAccounts(prev => {
          const updated = prev.map(a => ({ ...a, sentToday: 0 }));
          safeSaveAccountsToLocalStorage(updated);
          saveAccountsToStorage(updated);
          return updated;
        });
      } else if (!lastRecordedDate) {
        localStorage.setItem('tg_last_sent_date', todayStr);
      }
    };
    checkDailyMidnightReset();
    const interval = setInterval(checkDailyMidnightReset, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  // Reset all platform data to complete 0 state
  const handleResetAllToZero = async () => {
    try {
      await fetch('/api/telegram/reset-reply-stats', { method: 'POST' });
    } catch (e) {}
    setTotalFollowupToday(0);
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
        onResetDailySent={handleResetDailySent}
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

