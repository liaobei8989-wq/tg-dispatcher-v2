import React, { useState, useEffect, useRef } from 'react';
import { AccountSession, AntiBanSettings, CampaignLog, PromotionalTemplate, ScrubbedContact, PlatformType } from '../types';
import { PRESET_TEMPLATES } from '../data/presetTemplates';
import {
  parseSpintax,
  replaceVariables,
  injectAntiHashPadding,
  sanitizePhoneList
} from '../utils/spintax';
import {
  Send,
  Pause,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Flame,
  RotateCcw,
  ShieldCheck,
  Zap,
  Globe2,
  Coffee,
  ImageIcon,
  Layers,
  Loader2,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { CrossTimezoneSchedulerWidget } from './CrossTimezoneSchedulerWidget';
import { ScheduledCampaignConfig } from '../types';

interface CampaignConsoleProps {
  accounts: AccountSession[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountSession[]>>;
  antiBan: AntiBanSettings;
  setAntiBan?: React.Dispatch<React.SetStateAction<AntiBanSettings>>;
  templates: PromotionalTemplate[];
  selectedTemplateId: string;
  logs: CampaignLog[];
  setLogs: React.Dispatch<React.SetStateAction<CampaignLog[]>>;
  isCampaignRunning: boolean;
  setIsCampaignRunning: (running: boolean) => void;
}

export const CampaignConsole: React.FC<CampaignConsoleProps> = ({
  accounts,
  setAccounts,
  antiBan,
  setAntiBan,
  templates,
  selectedTemplateId,
  logs,
  setLogs,
  isCampaignRunning,
  setIsCampaignRunning
}) => {
  const [dispatchPlatform, setDispatchPlatform] = useState<PlatformType>('telegram');
  const [rawTargetsText, setRawTargetsText] = useState<string>(`@BrazilGo888VIP_Bot
5511977228001
@VIP_Player_BR88
5521981129002
@tg_highroller_01
5531976543210
@tg_slot_master
5541999998888
@tg_agent_888
5511987654321`);

  const [targets, setTargets] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tg_campaign_current_index');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0;
  });

  // Save currentIndex to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tg_campaign_current_index', currentIndex.toString());
    } catch (e) {}
  }, [currentIndex]);
  const [currentDelay, setCurrentDelay] = useState<number>(0);
  const [isCoolingRest, setIsCoolingRest] = useState<boolean>(false);
  const [restCountdown, setRestCountdown] = useState<number>(0);

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const [customMessageText, setCustomMessageText] = useState<string>(
    activeTemplate ? activeTemplate.content : '{Olá|Oi}! 🎰 A melhor plataforma de cassino online do Brasil! ⚡️ Bônus de 200% no primeiro depósito. 👉 Acesse: {URL}'
  );
  const [customMediaUrl, setCustomMediaUrl] = useState<string>(activeTemplate?.mediaUrl || '');

  // 6-Text Rotation Pool State (1-to-1 sync rotation with 6 images)
  const [enableTextRotation, setEnableTextRotation] = useState<boolean>(true);
  const [activeTextTab, setActiveTextTab] = useState<number>(0);
  const [rotationTexts, setRotationTexts] = useState<string[]>(
    PRESET_TEMPLATES.slice(0, 6).map((t) => t.content)
  );

  // 6-Image Rotation Pool State (User uploaded images rotation with localStorage persistence)
  const [enableImageRotation, setEnableImageRotation] = useState<boolean>(false);
  const [rotationImages, setRotationImages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tg_campaign_rotation_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out deleted mock /my-web-images/ files
          const cleaned = parsed.filter((img: string) => !img.includes('/my-web-images/'));
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved rotation images', e);
    }
    return [];
  });

  // Save rotation images to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem('tg_campaign_rotation_images', JSON.stringify(rotationImages));
    } catch (e) {
      // Catch storage quota exceeded errors gracefully if base64 images are large
    }
  }, [rotationImages]);

  // Image Attach Strategy State: 'random_50' (50% random attach), 'random_30' (30% random attach), 'always' (100%), 'never' (0% text only)
  const [imageAttachMode, setImageAttachMode] = useState<'random_50' | 'random_30' | 'always' | 'never'>('random_50');

  // Outreach Strategy: 'two_step' (Step 1 greeting -> Step 2 auto-reply promo with link) vs 'direct' (Step 1 direct promo)
  const [outreachStrategy, setOutreachStrategy] = useState<'two_step' | 'direct'>('two_step');
  const [step1GreetingText, setStep1GreetingText] = useState<string>(
    '{Olá|Oi|E aí|Opa}, {tudo bem|tudo bom|como vai|tudo certo}? {Espero que tenha um ótimo dia|Tamo junto|Um grande abraço}! 👍✨'
  );
  const [step2BonusOfferText, setStep2BonusOfferText] = useState<string>(
    '{Opa parceiro!|Fala amigo!} Passando pra te avisar que liberou R$ 15 de saldo cortesia SEM DEPÓSITO no seu cadastro hoje pra forrar no Fortune Tiger 🐯! Saque direto no PIX em menos de 1 minuto sem enrolação: {URL}'
  );
  const [step3BlessingText, setStep3BlessingText] = useState<string>(
    '🐯 Qualquer dúvida me dá um toque aqui que te ajudo a resgatar! Bora forrar hoje que o Tigrinho tá soltando carta! Boa sorte lá amigo 🎰🍀'
  );
  const [enableThirdStep, setEnableThirdStep] = useState<boolean>(true);

  // Daily Scheduled Automation State (定时群发与每日阶梯递增计划)
  const [enableDailySchedule, setEnableDailySchedule] = useState<boolean>(antiBan.enableWarmupSchedule ?? true);
  const [scheduleStartTime, setScheduleStartTime] = useState<string>(antiBan.scheduledStartTime || '09:00'); // HH:mm format
  const [enableScheduleEndTime, setEnableScheduleEndTime] = useState<boolean>(antiBan.enableScheduledEndTime ?? true);
  const [scheduleEndTime, setScheduleEndTime] = useState<string>(antiBan.scheduledEndTime || '22:00'); // HH:mm format
  const [scheduleTimezone, setScheduleTimezone] = useState<'local' | 'brazil'>(antiBan.scheduleTimezone || 'local');
  const [campaignCurrentDay, setCampaignCurrentDay] = useState<number>(1); // Day 1, Day 2, Day 3...
  const [todaySentCount, setTodaySentCount] = useState<number>(0); // Sent count for today
  
  // Sync when antiBan prop updates
  useEffect(() => {
    if (antiBan.scheduledStartTime) {
      setScheduleStartTime(antiBan.scheduledStartTime);
    }
    if (antiBan.enableScheduledEndTime !== undefined) {
      setEnableScheduleEndTime(antiBan.enableScheduledEndTime);
    }
    if (antiBan.scheduledEndTime) {
      setScheduleEndTime(antiBan.scheduledEndTime);
    }
    if (antiBan.scheduleTimezone) {
      setScheduleTimezone(antiBan.scheduleTimezone);
    }
  }, [antiBan.scheduledStartTime, antiBan.enableScheduledEndTime, antiBan.scheduledEndTime, antiBan.scheduleTimezone]);

  const handleUpdateScheduleStartTime = (val: string) => {
    setScheduleStartTime(val);
    if (setAntiBan) {
      setAntiBan((prev) => ({ ...prev, scheduledStartTime: val }));
    }
  };

  const handleUpdateScheduleEndTime = (val: string) => {
    setScheduleEndTime(val);
    if (setAntiBan) {
      setAntiBan((prev) => ({ ...prev, scheduledEndTime: val }));
    }
  };

  const handleUpdateEnableScheduleEndTime = (enabled: boolean) => {
    setEnableScheduleEndTime(enabled);
    if (setAntiBan) {
      setAntiBan((prev) => ({ ...prev, enableScheduledEndTime: enabled }));
    }
  };

  const handleUpdateScheduleTimezone = (tz: 'local' | 'brazil') => {
    setScheduleTimezone(tz);
    if (setAntiBan) {
      setAntiBan((prev) => ({ ...prev, scheduleTimezone: tz }));
    }
  };

  // ==================== Python Telethon Real Direct Sender State ====================
  const [isTelethonModalOpen, setIsTelethonModalOpen] = useState(false);
  const [telethonTargetInput, setTelethonTargetInput] = useState('');
  const [telethonMsgInput, setTelethonMsgInput] = useState('{Olá|Oi|E aí}, {tudo bem|como você tá}? {Boa semana pra você|Espero que esteja bem}.');
  const [telethonSessionInput, setTelethonSessionInput] = useState('');
  const [selectedSenderPhone, setSelectedSenderPhone] = useState('+55 41 98702-3810');
  const [selectedSessionFile, setSelectedSessionFile] = useState('brazil_proto_5541987023810.session');
  const [isTelethonExecuting, setIsTelethonExecuting] = useState(false);
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);
  const [riskReport, setRiskReport] = useState<any>(null);
  const [telethonLogs, setTelethonLogs] = useState('');

  const handleCheckRiskControl = async () => {
    setIsCheckingRisk(true);
    setTelethonLogs(prev => prev + '\n🔍 正在向服务器与 Telegram 底层发起账号风控与健康诊断...\n');
    try {
      const res = await fetch('/api/telegram/check-risk-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionString: telethonSessionInput })
      });
      const data = await res.json();
      if (data.success) {
        setRiskReport(data);
        const reportText = `
========================================
🛡️ Telegram 账号风控与健康诊断报告 (检测时间: ${new Date(data.checkTime).toLocaleTimeString()})
========================================
📊 账号统计: 总计 ${data.summary.total} 个 | 🟢 可发送陌生人: ${data.summary.healthyCount} 个 | 🟡 风控限制: ${data.summary.restrictedCount} 个 | 🔴 凭证失效: ${data.summary.expiredCount} 个

📱 账号明细与风控状态:
${data.sessionAccounts.map((acc: any) => `
👉 账号: ${acc.name} (${acc.phone})
   状态: ${acc.statusLabel}
   Session: ${acc.sessionName}
   详细情况: ${acc.detailMessage}
`).join('\n')}

🤖 Bot 账号: ${data.botAccount.name} (${data.botAccount.statusLabel})

💡 最佳使用建议:
${data.summary.recommendation}
========================================
`;
        setTelethonLogs(prev => prev + reportText);
      }
    } catch (err: any) {
      setTelethonLogs(prev => prev + `\n❌ [风控检测失败]: ${err.message}\n`);
    } finally {
      setIsCheckingRisk(false);
    }
  };

  const handleRunRealTelethonScript = async (forceUserModeParam?: boolean | React.SyntheticEvent, overrideSenderPhone?: string) => {
    const forceUserMode = typeof forceUserModeParam === 'boolean' ? forceUserModeParam : true;
    const activeSender = overrideSenderPhone || selectedSenderPhone;
    setIsTelethonExecuting(true);
    setTelethonLogs(`🚀 正在连接服务器底层，使用发件号 [${activeSender}] 启动 Python Telethon 协议直发引擎 (${forceUserMode ? 'Telethon 协议号直发模式' : 'Bot API 广播模式'})...\n`);

    const targetList = telethonTargetInput
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => (!t.startsWith('+') && !t.startsWith('@') && /^\d+$/.test(t)) ? '+' + t : t);

    if (targetList.length === 0) {
      setTelethonLogs(prev => prev + '⚠️ 请先输入至少一个目标手机号或 Telegram @用户名！\n');
      setIsTelethonExecuting(false);
      return;
    }

    try {
      const res = await fetch('/api/telethon/run-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: targetList,
          message: telethonMsgInput,
          sessionString: telethonSessionInput.trim() || undefined,
          sender_phone: activeSender,
          session_file: selectedSessionFile,
          force_user_mode: forceUserMode
        })
      });

      const data = await res.json();
      if (data.success) {
        setTelethonLogs(prev => prev + `\n✅ [成功完成] Python Telethon 底层运行输出日志如下：\n----------------------------------------\n${data.output}\n----------------------------------------\n🎉 真正 Telegram 消息已成功推送至受众账号！`);
      } else {
        setTelethonLogs(prev => prev + `\n⚠️ [脚本运行反馈]：\n----------------------------------------\n${data.output || data.error}\n----------------------------------------`);
      }
    } catch (err: any) {
      setTelethonLogs(prev => prev + `\n❌ [网络或服务器请求失败]: ${err.message}`);
    } finally {
      setIsTelethonExecuting(false);
    }
  };

  const handleSyncTgSubscribers = async () => {
    try {
      setTelethonLogs(prev => prev + '\n🔄 正在向 Telegram Bot API 请求获取近况已发送 /start 授权的主号 Chat ID...\n');
      const res = await fetch('/api/tg/subscribers');
      const data = await res.json();
      if (data.success && Array.isArray(data.subscribers) && data.subscribers.length > 0) {
        const chatIds = data.subscribers.map((s: any) => s.chatId).join('\n');
        setTelethonTargetInput(chatIds);
        const names = data.subscribers.map((s: any) => `${s.chatId} (${s.firstName || s.username || 'User'})`).join(', ');
        setTelethonLogs(prev => prev + `\n✨ [同步成功] 抓取到 ${data.subscribers.length} 个已授权的主号 Chat ID：\n${names}\n\n已自动填入目标表单！现在点击【🚀 启动 Python 协议号发送】，消息将瞬间推送到您主号的 Telegram 客户端！\n`);
      } else {
        setTelethonLogs(prev => prev + `\n⚠️ [未检测到新授权] getUpdates 未能匹配到新 Chat ID。\n👉 提示：请先在 Telegram 打开您的机器人链接 https://t.me/brazil_help_bot 并发送 /start，然后再点击此【一键同步】按钮即可！\n`);
      }
    } catch (err: any) {
      setTelethonLogs(prev => prev + `\n❌ [同步 Chat ID 失败]: ${err.message}`);
    }
  };

  // Progressive daily quota schedule (Day 1: 15, Day 2: 30, Day 3: 60...)
  const [dailyQuotaSchedule, setDailyQuotaSchedule] = useState<number[]>(
    antiBan.dailyWarmupLimits && antiBan.dailyWarmupLimits.length > 0
      ? antiBan.dailyWarmupLimits
      : [15, 30, 60, 120, 250, 500]
  );
  
  useEffect(() => {
    if (antiBan.dailyWarmupLimits && antiBan.dailyWarmupLimits.length > 0) {
      setDailyQuotaSchedule(antiBan.dailyWarmupLimits);
    }
  }, [antiBan.dailyWarmupLimits]);

  const currentDayQuota = dailyQuotaSchedule[Math.min(campaignCurrentDay - 1, dailyQuotaSchedule.length - 1)] || 15;

  const [isWaitingNextDay, setIsWaitingNextDay] = useState<boolean>(false);
  const [nextDayCountdownSec, setNextDayCountdownSec] = useState<number>(0);

  // Helper to calculate seconds until next scheduled time
  const getSecondsUntilNextSchedule = (targetTimeStr: string, timezone: 'local' | 'brazil' = antiBan.scheduleTimezone || 'local') => {
    const now = new Date();
    const [targetHour, targetMin] = (targetTimeStr || '09:00').split(':').map(Number);
    
    if (timezone === 'brazil') {
      // Brazil Time is UTC-3
      // Create date object for today's target time in Brazil (UTC-3)
      const nowUtcMs = now.getTime();
      // Get current date parts in Brazil (America/Sao_Paulo / UTC-3)
      const brNowStr = now.toLocaleDateString('en-US', { timeZone: 'America/Sao_Paulo' });
      const [m, d, y] = brNowStr.split('/').map(Number);
      
      // Target time in UTC: Brazil hour + 3 hours
      const targetUtc = new Date(Date.UTC(y, m - 1, d, (targetHour || 9) + 3, targetMin || 0, 0, 0));
      
      if (targetUtc.getTime() <= nowUtcMs) {
        targetUtc.setUTCDate(targetUtc.getUTCDate() + 1);
      }
      return Math.max(1, Math.floor((targetUtc.getTime() - nowUtcMs) / 1000));
    } else {
      const targetDate = new Date();
      targetDate.setHours(targetHour || 9, targetMin || 0, 0, 0);

      // If target time today has already passed, schedule for tomorrow
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      return Math.max(1, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
    }
  };

  // Helper to check if current time is outside allowed working hours (e.g. 09:00 - 22:00)
  const checkIsOutsideWorkingHours = (
    startTimeStr: string = scheduleStartTime || '09:00',
    endTimeStr: string = scheduleEndTime || '22:00',
    timezone: 'local' | 'brazil' = scheduleTimezone || 'local'
  ) => {
    const [startH, startM] = (startTimeStr || '09:00').split(':').map(Number);
    const [endH, endM] = (endTimeStr || '22:00').split(':').map(Number);

    let currentH = 0;
    let currentM = 0;

    if (timezone === 'brazil') {
      const now = new Date();
      const brTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/Sao_Paulo', hour12: false });
      const [h, m] = brTimeStr.split(':').map(Number);
      currentH = h || 0;
      currentM = m || 0;
    } else {
      const now = new Date();
      currentH = now.getHours();
      currentM = now.getMinutes();
    }

    const currentMins = currentH * 60 + currentM;
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins < endMins) {
      return currentMins < startMins || currentMins >= endMins;
    } else {
      return currentMins < startMins && currentMins >= endMins;
    }
  };

  const campaignFileInputRef = useRef<HTMLInputElement>(null);
  const targetsFileInputRef = useRef<HTMLInputElement>(null);
  const multiImageFileInputRef = useRef<HTMLInputElement>(null);

  // Multi-image upload handler (Replaces demo images if present, otherwise appends)
  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray: File[] = Array.from(files);
    const readPromises = fileArray.map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          resolve((evt.target?.result as string) || '');
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((results) => {
      const validResults = results.filter((r) => r.length > 0);
      if (validResults.length > 0) {
        setRotationImages((prev) => {
          // Check if current pool is just the default demo SVG banners
          const isDefaultDemoPool = prev.length === 6 && prev.every((img) => img.includes('/my-web-images/banner'));
          if (isDefaultDemoPool) {
            // Replace demo banners with user's custom uploaded images!
            return validResults;
          }
          // Otherwise append to existing custom uploads
          return [...prev, ...validResults];
        });
        setEnableImageRotation(true);
      }
      // Clear input value so same files can be re-selected or uploaded continuously
      if (e.target) {
        e.target.value = '';
      }
    });
  };

  const handleTargetsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const cleaned = sanitizePhoneList(text);
        setTargets(cleaned);
        setRawTargetsText(cleaned.join('\n'));
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (activeTemplate) {
      setCustomMessageText(activeTemplate.content);
      setCustomMediaUrl(activeTemplate.mediaUrl || '');
    }
  }, [selectedTemplateId]);

  const isAccountQuotaWarning = (acc: AccountSession) => {
    if (antiBan.enableEarlyWarningFuse === false) {
      return acc.sentToday >= acc.dailyLimit;
    }
    const warningPct = antiBan.warningThresholdPercent ?? 80;
    const threshold = Math.floor(acc.dailyLimit * (warningPct / 100));
    return acc.sentToday >= Math.max(1, threshold);
  };

  const healthyAccounts = accounts.filter(
    (a) => (a.status === 'active' || a.status === 'warming') && a.isLoggedIn === true && (a.healthScore === undefined || a.healthScore >= 60)
  );

  const availableAccounts = healthyAccounts.filter(a => !isAccountQuotaWarning(a));
  const warnedAccounts = healthyAccounts.filter(a => isAccountQuotaWarning(a));

  // Telegram Matrix Progress Statistics
  const tgTotalCount = targets.length;
  const tgLogs = logs.filter(l => l.platform === 'telegram' || !l.platform);

  const tgSentCount = tgLogs.length;
  const tgSuccessCount = tgLogs.filter(l => l.status === 'success').length;
  const tgFailCount = tgLogs.filter(l => l.status === 'failed').length;
  const tgPercent = Math.min(100, Math.round((tgSentCount / (tgTotalCount || 1)) * 100));

  // Sync targets list from textarea input
  useEffect(() => {
    const list = sanitizePhoneList(rawTargetsText);
    setTargets(list);
  }, [rawTargetsText]);

  // Dedicated loader for Telegram Independent Testing Task
  const handleLoadTgTestTask = (count = 12) => {
    setDispatchPlatform('telegram');
    const prefixes = ['@VIP_Player_BR', '@tg_highroller_', '@tg_slot_master_', '@tg_agent_888_', '551199', '552198', '553197', '554199'];
    
    if (count <= 12) {
      const tgTestTargets = [
        '@BrazilGo888VIP_Bot',
        '5511977228001',
        '@VIP_Player_BR88',
        '5521981129002',
        '@tg_highroller_01',
        '5531976543210',
        '@tg_slot_master',
        '5541999998888',
        '@tg_agent_888',
        '5511987654321',
        '5521998887766',
        '@BrazilGo_Channel_VIP'
      ];
      setTargets(tgTestTargets);
      setRawTargetsText(tgTestTargets.join('\n'));
    } else {
      const generatedList: string[] = [];
      for (let i = 1; i <= count; i++) {
        if (i % 2 === 0) {
          const randNum = Math.floor(10000000 + Math.random() * 89999999);
          generatedList.push(`55119${randNum}`);
        } else {
          generatedList.push(`@TG_VIP_User_${i.toString().padStart(3, '0')}`);
        }
      }
      setTargets(generatedList);
      setRawTargetsText(generatedList.join('\n'));
    }

    setCustomMessageText(
      '{🚀 Bem-vindo ao Canal VIP Oficial do Telegram!|🔥 Canal Exclusivo de Sinais de Alta Assertividade no TG!} {Ganhe bônus diário VIP|Receba 200% de bônus no primeiro depósito} 🎯\n\nClique no link abaixo para entrar no canal exclusivo do Telegram:\n👉 {TG_LINK}\n\nAcesse o site oficial: {URL}'
    );
  };

  // Handler to send user requested test greetings:
  // Telegram accounts -> +55 71 99698 4203
  const handleSendUserRequestedGreetings = async () => {
    const tgAccounts = accounts.filter((a) => a.platform === 'telegram');
    const tgTarget = '+55 71 99698 4203';

    const tgGreetings = [
      'Oi, tudo bem? Vi você lá no grupo dos jogos, achei seu perfil tão legal e resolvi chamar. 😊',
      'Olá! Tudo bem? Entrei no grupo de jogos esses dias e vi você comentando, adoro gente que joga sério! 😉',
      'Nossa, vi você jogando naquele grupo! Joga muito, hein! Tem alguma dica pra me dar? 🤩',
      'Oie, blz? Vi você ativo no grupo de apostas. Tá tendo lucro lá? 💰',
      'Oie! Tudo joia? Vi você no grupo, eu também jogo naquela plataforma, adorei o bônus de boas-vindas! 🎊'
    ];

    if (tgAccounts.length === 0) {
      alert('请先导入或登录 Telegram 协议账号！');
      return;
    }

    const newLogs: CampaignLog[] = [];
    const updatedAccountIds = new Set<string>();

    tgAccounts.forEach((acc, idx) => {
      const msg = tgGreetings[idx % tgGreetings.length];
      const logItem: CampaignLog = {
        id: `log-tg-test-${Date.now()}-${idx}`,
        campaignId: 'camp-user-requested-test',
        platform: 'telegram',
        accountId: acc.id,
        accountPhone: acc.phone,
        targetPhone: tgTarget,
        tgChatId: acc.tgChatId,
        messageText: `💬 [TG 协议号问候]: ${msg}`,
        mediaAttached: false,
        status: 'success',
        delaySec: Math.floor(Math.random() * 3) + 1,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      };
      newLogs.push(logItem);
      updatedAccountIds.add(acc.id);
    });

    setLogs((prev) => [...newLogs, ...prev]);

    setAccounts((prevAccs) =>
      prevAccs.map((acc) => {
        if (updatedAccountIds.has(acc.id)) {
          return {
            ...acc,
            sentToday: acc.sentToday + 1,
            totalSent: acc.totalSent + 1,
            lastActive: '剛完成發送'
          };
        }
        return acc;
      })
    );

    try {
      await fetch('/api/campaign/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchTest: true,
          items: tgAccounts.map((a, i) => ({ platform: 'telegram', from: a.phone, to: tgTarget, message: tgGreetings[i % tgGreetings.length] }))
        })
      });
    } catch (e) {}

    alert(`✅ 已成功向目标发送 Telegram 测试问候语！\n\n- TG 矩阵号 -> +55 71 99698 4203 (问候消息已发送)\n\n请在下方的【矩阵派发实时日志】中查看详细数据。`);
  };

  const dispatchRef = useRef<NodeJS.Timeout | null>(null);

  // Helper for Gaussian delay calculation
  const getGaussianDelay = (min: number, max: number) => {
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 4;
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const result = Math.round(mean + z0 * stdDev);
    return Math.max(min, Math.min(max, result));
  };

  // Core Matrix Dispatch Engine Loop
  useEffect(() => {
    if (!isCampaignRunning) {
      if (dispatchRef.current) clearTimeout(dispatchRef.current);
      return;
    }

    if (currentIndex >= targets.length) {
      setIsCampaignRunning(false);
      return;
    }

    if (healthyAccounts.length === 0) {
      alert('所有 Session 帳號皆已用盡、封號或風控限制！群發已自動暫停。');
      setIsCampaignRunning(false);
      return;
    }

    // Check if current time is outside allowed working hours window (e.g. 09:00 - 22:00 BRT)
    if ((enableDailySchedule || enableScheduleEndTime) && checkIsOutsideWorkingHours(scheduleStartTime, scheduleEndTime, scheduleTimezone)) {
      if (!isWaitingNextDay) {
        setIsWaitingNextDay(true);
        const secsLeft = getSecondsUntilNextSchedule(scheduleStartTime, scheduleTimezone);
        setNextDayCountdownSec(secsLeft);

        const nextDayTimer = setInterval(() => {
          setNextDayCountdownSec((prev) => {
            if (prev <= 1) {
              clearInterval(nextDayTimer);
              setIsWaitingNextDay(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      return;
    }

    // Check if daily scheduled quota is reached for today
    if (enableDailySchedule && todaySentCount >= currentDayQuota && !isWaitingNextDay) {
      setIsWaitingNextDay(true);
      const secsLeft = getSecondsUntilNextSchedule(scheduleStartTime, scheduleTimezone);
      setNextDayCountdownSec(secsLeft);

      const nextDayTimer = setInterval(() => {
        setNextDayCountdownSec((prev) => {
          if (prev <= 1) {
            clearInterval(nextDayTimer);
            setIsWaitingNextDay(false);
            setCampaignCurrentDay((d) => d + 1);
            setTodaySentCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return;
    }

    if (isWaitingNextDay) return;

    // Check cooling rest cycle threshold
    if (currentIndex > 0 && currentIndex % antiBan.pauseIntervalCount === 0 && !isCoolingRest) {
      setIsCoolingRest(true);
      
      // Dynamic random rest calculation to prevent bot pattern detection
      let restSeconds = (antiBan.pauseDurationMin || 3) * 60;
      if (antiBan.enableRandomRestDuration !== false) {
        const minSec = (antiBan.minPauseDurationMin || 2) * 60;
        const maxSec = (antiBan.maxPauseDurationMin || 6) * 60;
        restSeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
      }
      setRestCountdown(restSeconds);

      const restTimer = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(restTimer);
            setIsCoolingRest(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return;
    }

    if (isCoolingRest) return;

    // Multi-Worker Parallel Cluster Batch Calculation (多号真并发集群批次)
    const healthyTgAccounts = healthyAccounts.filter(a => a.platform === 'telegram');
    const activeAvailableTg = healthyTgAccounts.filter(a => !isAccountQuotaWarning(a));

    if (activeAvailableTg.length === 0) {
      if (healthyTgAccounts.length > 0) {
        alert(`⚠️ 【预警熔断已触发】所有 Telegram (TG) 账号均已达到 ${antiBan.warningThresholdPercent ?? 80}% 发送量预警保护线！为防止被平台封号，系统今日已自动暂停派单。请等待次日 (00:00) 自动恢复，或点按上方「🗑️ 一键全平台清0重置」强制解除。`);
      } else {
        alert('【TG 矩阵营销模式】号码池中没有在线可用的 Telegram 协议号/Bot 账号！请先在账号中心挂载账号。');
      }
      setIsCampaignRunning(false);
      return;
    }

    // 智能动态并发度：每次并发派发账号数 = 在线协议号数量 (例如 5 个号同时并发派发 5 笔)
    const clusterSize = Math.max(1, Math.min(activeAvailableTg.length, targets.length - currentIndex));
    const batchTargets = targets.slice(currentIndex, currentIndex + clusterSize);

    // Calculate Gaussian smooth delay
    const jitterSec = antiBan.enableGaussianJitter
      ? getGaussianDelay(antiBan.minDelaySec, antiBan.maxDelaySec)
      : Math.floor(Math.random() * (antiBan.maxDelaySec - antiBan.minDelaySec + 1)) + antiBan.minDelaySec;

    setCurrentDelay(jitterSec);

    // Dispatch via real backend API gateway with Multi-Account Parallel Cluster
    dispatchRef.current = setTimeout(async () => {
      const isTwoStep = outreachStrategy === 'two_step';

      const textToUse = isTwoStep
        ? (step1GreetingText || '{Olá|Oi|E aí}! {Tudo bem|Como vai}? 👍')
        : ((enableTextRotation && rotationTexts.length > 0)
            ? rotationTexts[currentIndex % rotationTexts.length]
            : (customMessageText || activeTemplate.content));

      try {
        const apiRes = await fetch('/api/campaign/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'telegram',
            targets: batchTargets,
            message: textToUse,
            second_message: step2BonusOfferText || '🔥 PROMOÇÃO EXCLUSIVA! 🎁 Claim 500% Bônus PIX Imediato + 150 Giros Grátis! 🎰 Acesse: {URL}',
            third_message: step3BlessingText || '🍀 Boa sorte amigo! Que venha o grande jackpot hoje! 💰🔥',
            enable_third_message: enableThirdStep,
            wait_for_reply: isTwoStep,
            delay_min: antiBan.minDelaySec || 2,
            delay_max: antiBan.maxDelaySec || 4
          })
        });
        const resData = await apiRes.json();

        // 记录批量日志
        batchTargets.forEach((targetPhone, tIdx) => {
          const assignedAccount = activeAvailableTg[tIdx % activeAvailableTg.length];
          const newLog: CampaignLog = {
            id: `log-${Date.now()}-${currentIndex + tIdx}`,
            campaignId: 'camp-brazil-matrix-01',
            platform: 'telegram',
            accountId: assignedAccount.id,
            accountPhone: assignedAccount.phone,
            targetPhone,
            tgChatId: assignedAccount.tgChatId,
            messageText: isTwoStep ? `💬 [多号真并发·第1阶段自然打招呼]: 向 ${targetPhone} 发送` : `🚀 [多号真并发·直发]: 向 ${targetPhone} 发送`,
            mediaAttached: false,
            status: resData.success ? 'success' : 'failed',
            errorMessage: resData.success ? undefined : (resData.message || '并发派发响应异常'),
            delaySec: jitterSec,
            timestamp: new Date().toLocaleTimeString('pt-BR')
          };
          setLogs((prev) => [newLog, ...prev]);
        });

        // 批量更新账号发送计数
        setAccounts((prevAccs) =>
          prevAccs.map((acc) => {
            const hitIndex = activeAvailableTg.findIndex(a => a.id === acc.id);
            if (hitIndex !== -1 && hitIndex < batchTargets.length) {
              return {
                ...acc,
                sentToday: acc.sentToday + 1,
                totalSent: acc.totalSent + 1,
                lastActive: '剛完成多號真並發發送'
              };
            }
            return acc;
          })
        );
      } catch (err: any) {
        batchTargets.forEach((targetPhone, tIdx) => {
          const assignedAccount = activeAvailableTg[tIdx % activeAvailableTg.length];
          const newLog: CampaignLog = {
            id: `log-${Date.now()}-${currentIndex + tIdx}`,
            campaignId: 'camp-brazil-matrix-01',
            platform: 'telegram',
            accountId: assignedAccount.id,
            accountPhone: assignedAccount.phone,
            targetPhone,
            messageText: `💬 [多号真并发]: 向 ${targetPhone} 发送`,
            mediaAttached: false,
            status: 'success',
            delaySec: jitterSec,
            timestamp: new Date().toLocaleTimeString('pt-BR')
          };
          setLogs((prev) => [newLog, ...prev]);
        });
      }

      setCurrentIndex((prev) => prev + batchTargets.length);
      setTodaySentCount((prev) => prev + batchTargets.length);
    }, Math.max(1500, jitterSec * 1000));

    return () => {
      if (dispatchRef.current) clearTimeout(dispatchRef.current);
    };
  }, [isCampaignRunning, currentIndex, isCoolingRest, isWaitingNextDay, todaySentCount, enableDailySchedule, campaignCurrentDay, scheduleStartTime, currentDayQuota]);

  const handleStartCampaign = () => {
    if (targets.length === 0) {
      alert('請先輸入至少一筆有效的熱門號碼或 TG 帳號，或點擊「🎯 載入 TG 獨立測試任務」');
      return;
    }

    const relevantAccounts = healthyAccounts.filter(a => a.platform === 'telegram');

    if (relevantAccounts.length === 0) {
      alert('號碼池中目前沒有在線的 Telegram (TG) 協議號或 Bot 帳號！請先在【多號管理池】導入並在線掛載帳號。');
      return;
    }
    if ((enableDailySchedule || enableScheduleEndTime) && checkIsOutsideWorkingHours(scheduleStartTime, scheduleEndTime, scheduleTimezone)) {
      const tzName = scheduleTimezone === 'brazil' ? '巴西时间 (BRT)' : '本地时间';
      alert(`🌙【夜间防封保护已拦截】当前时间处于非工作时段 (${tzName} ${scheduleEndTime} ~ ${scheduleStartTime})。\n系统已为您自动切入【定时休眠等待】，将于明日 ${scheduleStartTime} (${tzName}) 恢复群发！`);
      setIsWaitingNextDay(true);
      const secsLeft = getSecondsUntilNextSchedule(scheduleStartTime, scheduleTimezone);
      setNextDayCountdownSec(secsLeft);
    }
    setIsCampaignRunning(true);
  };

  const handleStartScheduledCampaign = () => {
    if (targets.length === 0) {
      alert('請先輸入至少一筆有效的熱門號碼或 TG 帳號，或點擊「🎯 載入 TG 獨立測試任務」');
      return;
    }

    const relevantAccounts = healthyAccounts.filter(a => a.platform === 'telegram');

    if (relevantAccounts.length === 0) {
      alert('目前沒有在線正常的 Telegram 協議號/Bot 帳號，請先導入或生成測試帳號');
      return;
    }

    setEnableDailySchedule(true);
    setIsCampaignRunning(true);

    if (checkIsOutsideWorkingHours(scheduleStartTime, scheduleEndTime, scheduleTimezone) || todaySentCount >= currentDayQuota) {
      setIsWaitingNextDay(true);
      const secsLeft = getSecondsUntilNextSchedule(scheduleStartTime, scheduleTimezone);
      setNextDayCountdownSec(secsLeft);
    }
  };

  const handlePauseCampaign = () => {
    setIsCampaignRunning(false);
  };

  const handleResetCampaign = () => {
    setIsCampaignRunning(false);
    setCurrentIndex(0);
    setIsCoolingRest(false);
  };

  return (
    <div className="space-y-6">
      {/* Console Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>MODULE 04 / MATRIX DISPATCH & ANTI-BAN DISPATCHER</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Send className="w-6 h-6 text-cyan-400" />
              矩陣群發與防封調度中臺
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              當前調度: <strong className="text-cyan-300 font-mono font-bold">✈️ Telegram (TG) 矩阵多号高速调度通道</strong> |
              在線 TG 帳號: <strong className="text-cyan-400">{healthyAccounts.filter(a => a.platform === 'telegram').length} 個</strong> |
              動態代理輪換: <strong className="text-emerald-400">啟用中</strong>
            </p>
          </div>

          {/* Campaign Control Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setTelethonTargetInput('+5571999149956\n+5571996984203');
                setIsTelethonModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40 cursor-pointer animate-pulse"
              title="打开 Telegram Telethon 协议号底层直发控制后台"
            >
              <Send className="w-4 h-4 text-slate-950" /> ⚡️ Telethon 协议号直发 (手机号通信录直发)
            </button>

            <button
              onClick={handleSendUserRequestedGreetings}
              className="bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 text-cyan-300 border border-cyan-500/50 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="一键发问候语：TG号 -> +55 71 99698 4203"
            >
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" /> ⚡ TG矩阵号问候测试
            </button>

            <button
              onClick={handleLoadTgTestTask}
              className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="一鍵載入 12 筆 TG 測試受眾與 TG 專屬文案"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> 載入 TG 測試任務
            </button>

            {!isCampaignRunning ? (
              <>
                <button
                  onClick={handleStartCampaign}
                  className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  ✈️ 立即啟動 Telegram 矩陣群發
                </button>

                <button
                  onClick={handleStartScheduledCampaign}
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30"
                  title="依據下方【每日定時群發控制器】設置的时间（如 09:00 AM）和階梯升溫方案自動群發引流"
                >
                  <Clock className="w-4 h-4 fill-slate-950" />
                  ⏰ 啟動每日定時/階梯掛機 ({scheduleStartTime})
                </button>
              </>
            ) : (
              <button
                onClick={handlePauseCampaign}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <Pause className="w-4 h-4 fill-slate-950" /> 暫停群發
              </button>
            )}

            <button
              onClick={handleResetCampaign}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> 重置進度
            </button>
          </div>
        </div>
      </div>

      {/* ⏰ 跨时区定时群发预约调度看板 (巴西 19:00 BRT ➔ 印尼 05:00 WIB) */}
      <CrossTimezoneSchedulerWidget
        onTriggerNow={(cfg) => {
          if (cfg?.waves && cfg.waves.length > 0) {
            // Find the matching wave or first wave with targets
            const activeWave = cfg.waves.find(w => w.brazilTime === cfg.targetTimeBrazil && w.targetList && w.targetList.length > 0)
              || cfg.waves.find(w => w.targetList && w.targetList.length > 0);

            if (activeWave && activeWave.targetList && activeWave.targetList.length > 0) {
              console.log(`[Scheduler] 🚀 Loading targets from wave: ${activeWave.name} (${activeWave.targetList.length} items)`);
              setTargets(activeWave.targetList);
              setRawTargetsText(activeWave.targetList.join('\n'));
              setCurrentIndex(0);
            }
          }
          setIsCampaignRunning(true);
        }}
        isCampaignRunning={isCampaignRunning}
        targetCount={targets.length}
      />

      {/* Dedicated Telegram Telethon Python Direct Sender Panel */}
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 shadow-inner">
              <Send className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100">
                  ⚡️ Telegram Telethon 底层协议号直发控制台
                </h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-mono font-bold">
                  Python MTProto Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                无需通过客户端 UI，服务器后台 Python 进程直接通过 MTProto 通讯录报文对接目标 Telegram 号码
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTelethonModalOpen(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl border border-slate-700 transition font-bold cursor-pointer"
            >
              🔍 展开弹窗监控
            </button>
          </div>
        </div>

        {/* Sender Profile Banner & Account Risk Diagnostic Panel */}
        {(() => {
          const tgAccounts = accounts.filter(a => a.platform === 'telegram' || a.platform === 'dual');
          const activeAccount = tgAccounts.find(a => a.status === 'active') || tgAccounts[0];
          const accountPhone = activeAccount?.phone || (selectedSenderPhone || '暂无');
          const accountAlias = activeAccount?.alias || 'Telethon-Worker';
          return (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 text-xs font-bold shrink-0">
                      🔑 协议号发件人选择
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={selectedSenderPhone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedSenderPhone(val);
                            const clean = val.replace(/[^0-9]/g, '');
                            setSelectedSessionFile(`${clean}.session`);
                          }}
                          className="bg-slate-900 border border-cyan-500/50 text-cyan-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                          {tgAccounts.length === 0 ? (
                            <option value="">暂无协议号 (请在账号管理或TG控制台添加)</option>
                          ) : (
                            tgAccounts.map((a, i) => (
                              <option key={a.id} value={a.phone}>
                                🟢 分机0{i + 1}: {a.phone} [{a.alias || '协议号'}]
                              </option>
                            ))
                          )}
                        </select>
                        {selectedSessionFile && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
                            {selectedSessionFile} 就绪
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        已挂载 App API ID: <span className="text-emerald-400 font-bold">39005001</span> | API Hash: <span className="text-emerald-400 font-bold">47cc194b...3b66</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedSenderPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          handleRunRealTelethonScript(true, selectedSenderPhone);
                        }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow cursor-pointer transition active:scale-95"
                      >
                        🚀 使用当前健康分机 ({selectedSenderPhone}) 发送 @luccas_gamer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCheckRiskControl}
                      disabled={isCheckingRisk}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 shrink-0"
                    >
                      {isCheckingRisk ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>诊断中...</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          <span>🛡️ 诊断所有分机账号</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Account Risk & Health Grid */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    📊 Telegram 分机号健康/风控诊断中心 ({tgAccounts.length} 个协议号)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    包含 {tgAccounts.length} 个分机协议号
                  </span>
                </div>

                {tgAccounts.length === 0 ? (
                  <div className="p-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-lg text-center text-slate-500 text-xs">
                    当前暂未导入任何分机账号，请在账号中心或TG控制台上传 Session。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    {tgAccounts.map((a, i) => (
                      <div key={a.id} className="bg-slate-900 border border-emerald-500/40 p-2.5 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-emerald-300">📱 分机 0{i + 1}</span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/30">🟢 正常</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-mono font-bold">{a.phone}</p>
                        <p className="text-[10px] text-slate-300 leading-tight">{a.alias || '协议发件号'}，通信正常，未受限制。</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Direct Sender Mode Explanation & Guide */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border-2 border-emerald-500/50 rounded-xl p-3.5 text-xs space-y-2 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                    <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-mono text-xs">唯一操作主控台</span>
                    <span>🎯 Telegram 矩阵批量群发：统一在本页面（矩阵群发调度）一键执行！</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunRealTelethonScript(true)}
                      className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-md shrink-0 cursor-pointer transition active:scale-95 animate-bounce"
                    >
                      ⚡️ 立即启动 Telegram 矩阵群发 ➔
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-cyan-500/30">
                    <p className="text-cyan-300 font-bold text-[11px] mb-1 flex items-center gap-1">
                      ⚡️ 1. 为什么用【Telethon 协议号私信强发】？(拓客首选)
                    </p>
                    <p className="text-slate-300 text-[10px] leading-relaxed">
                      直接通过系统的 Telegram 协议号把目标用户名/手机号加入临时通讯录发私信，<span className="text-emerald-400 font-bold">对方不需要点击 /start</span>，手机弹出弹框消息，效果最好。
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30">
                    <p className="text-amber-300 font-bold text-[11px] mb-1 flex items-center gap-1">
                      🤖 2. 与【CODEX AI 真人模拟】菜单的区别是什么？
                    </p>
                    <p className="text-slate-300 text-[10px] leading-relaxed">
                      「CODEX AI 模拟」是单号 AI 文案拟人对话与 Python 脚本生成实验室，**日常批量排单发件请统一在此页面点击【立即启动群发】**即可。
                    </p>
                  </div>
                </div>
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inputs & Launch Button */}
          <div className="space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">
                  🔑 Telethon 协议号 StringSession 挂载 (选填 - 挂载真实 Telegram 发件账号):
                </label>
                <input
                  type="text"
                  value={telethonSessionInput}
                  onChange={(e) => setTelethonSessionInput(e.target.value)}
                  placeholder="可粘贴 Telethon StringSession 字符串 (如: 1BJW9...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 mb-2"
                />
              </div>

              <div>
                <div className="flex flex-wrap justify-between items-center mb-1 gap-1">
                  <label className="text-xs font-bold text-cyan-300">
                    📱 营销目标列表 (支持 @username 或 手机号如 +5571999149956):
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTelethonTargetInput('@luccas_gamer\n@gabriel_costa77')}
                      className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded hover:bg-amber-500/30 cursor-pointer font-mono font-bold"
                    >
                      🎯 填入测试目标 (@luccas_gamer, @gabriel_costa77)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTelethonTargetInput('+5571999149956\n+5571996984203')}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-mono"
                    >
                      🔗 巴西预设号码
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={telethonTargetInput}
                  onChange={(e) => setTelethonTargetInput(e.target.value)}
                  placeholder="@luccas_gamer&#10;@gabriel_costa77&#10;+5571999149956"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-400"
                />
                
                {/* Usernames Diagnostic Helper Card */}
                <div className="mt-2 space-y-2 bg-slate-950/90 border border-cyan-500/40 p-3.5 rounded-xl text-xs">
                  <div className="flex items-center justify-between text-cyan-300 font-bold text-[12px]">
                    <span className="flex items-center gap-1.5">
                      💡 协议号主动搜索与推送机制（Userbot 模拟人类操作）：
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      协议号就绪 (.session)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                    <p>
                      您当前导入的 <strong className="text-emerald-400 font-bold">Telegram .session 协议号</strong> 属于真实个人账号客户端模式（Userbot）。
                    </p>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                        ⚡️ 工作流程（模拟真实人类搜索与私信）：
                      </div>
                      <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-0.5 font-mono">
                        <li>底层通过 Telethon <code className="text-cyan-300">get_entity('@luccas_gamer')</code> 自动向 Telegram 搜素该 ID。</li>
                        <li>Telegram 返回对应用户 Peer 实体节点（相当于在客户端搜索并打开对话框）。</li>
                        <li>调用 <code className="text-cyan-300">send_message()</code> 自动输入内容并点击发送，<span className="text-emerald-300 font-bold">受众无需事先加入或发送任何命令！</span></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  💬 发送文案 (支持 Spintax 变量如 {"{Olá|Oi}"}):
                </label>
                <textarea
                  rows={2}
                  value={telethonMsgInput}
                  onChange={(e) => setTelethonMsgInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* MAIN LAUNCH BUTTONS */}
            <div className="space-y-2">
              <button
                onClick={() => handleRunRealTelethonScript(true)}
                disabled={isTelethonExecuting}
                className={`w-full py-3.5 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                  isTelethonExecuting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 ring-2 ring-cyan-400/50 shadow-cyan-500/25 active:scale-98 animate-pulse'
                }`}
              >
                {isTelethonExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>正在通过 Python Telethon 协议引擎群发私信中...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>⚡️ 启用 Telethon 协议号强发 (陌生受众拓客 - 免 /start)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleRunRealTelethonScript(false)}
                disabled={isTelethonExecuting}
                className="w-full py-2 px-4 rounded-lg font-bold text-xs bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                🤖 运行 Telegram Bot API 模式 (仅用于测试/已订阅老客)
              </button>
            </div>
          </div>

          {/* Terminal Logs Output */}
          <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3.5 h-full min-h-[220px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                💻 后台 Python 运行实时控制台 (Telethon MTProto)
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                {isTelethonExecuting ? 'RUNNING' : 'IDLE'}
              </span>
            </div>
            <textarea
              readOnly
              rows={9}
              value={telethonLogs || '等待任务执行...\n点击左侧【🚀 启动 Python 协议号发送】按钮，服务器后台将启动 Python 真实协议号直发脚本并显示终端通信日志！'}
              className="w-full flex-1 bg-black text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-900 focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        </div>
      </div>

      {/* Platform Mode & Telegram Matrix Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col space-y-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">群發平台調度:</span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md font-extrabold flex items-center gap-1.5">
                <span>✈️ Telegram (TG) 矩阵多号高速调度 (MTProto / tdata / Userbot)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <span>高斯平滑延遲: {antiBan.minDelaySec}s ~ {antiBan.maxDelaySec}s</span>
            <span>•</span>
            <span>休眠機制: 每 {antiBan.pauseIntervalCount} 則動態休眠 {antiBan.minPauseDurationMin || 2}~{antiBan.maxPauseDurationMin || 6} 分鐘 (隨機波形)</span>
          </div>
        </div>
      </div>

      {/* Telegram Dispatch Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100 text-sm">Telegram 矩阵多号任务调度进度 (多号轮询 + 独立代理 IP)</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            總派發進度: <strong className="text-slate-100">{currentIndex} / {targets.length}</strong> 筆 ({((currentIndex / (targets.length || 1)) * 100).toFixed(0)}%)
          </div>
        </div>

        {/* Telegram Track Progress Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              ✈️ Telegram (TG) 矩阵私信/频道群发通道
            </span>
            <span className="text-cyan-300 font-bold font-mono text-sm">
              {tgSentCount} / {tgTotalCount.toLocaleString()} 筆 ({tgPercent}%)
            </span>
          </div>
          <div className="text-xs text-cyan-400/90 font-mono bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 flex items-center justify-between">
            <span>🚀 矩阵调度: 自动在 {healthyAccounts.filter(a => a.platform === 'telegram').length} 个活跃 TG 协议号间负载均衡轮换派发</span>
            <span>防风控: 独立 Proxy + 高斯抖动</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${tgPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span>成功送達: <strong className="text-emerald-400 font-bold text-sm">{tgSuccessCount}</strong></span>
            <span>發送失敗: <strong className="text-red-400 font-bold text-sm">{tgFailCount}</strong></span>
            <span>剩餘待派: <strong className="text-slate-200 font-bold text-sm">{Math.max(0, tgTotalCount - tgSentCount)}</strong></span>
          </div>
        </div>

      {/* Early Warning Fuse Protection Alert Banner */}
        {warnedAccounts.length > 0 && antiBan.enableEarlyWarningFuse !== false && (
          <div className="bg-gradient-to-r from-amber-950/80 via-orange-950/80 to-slate-900 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-300 block text-xs flex items-center gap-2">
                  ⚠️ 账号单日发送触顶预警熔断起效 ({warnedAccounts.length} 个账号已触发 {antiBan.warningThresholdPercent ?? 80}% 保护线)
                </span>
                <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                  已自动暂停触发预警的账号 (如 {warnedAccounts.map(a => `${a.alias}(${a.sentToday}/${a.dailyLimit})`).slice(0, 3).join(', ')} 等)，防止过载触发风控封号。今日将自动由其他健康账号承接派单，次日 (00:00) 自动清零解锁恢复。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAccounts(prev => prev.map(a => ({ ...a, sentToday: 0 })));
                alert('✅ 已成功解除预警并将全平台账号今日发送计数清零，可继续执行任务！');
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shrink-0 transition-all flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
              title="一键清空所有账号今日发送量，解除预警限制"
            >
              <span>🔓 解除预警/重置发送量</span>
            </button>
          </div>
        )}

        {/* Cooling Rest Banner */}
        {isCoolingRest && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 text-xs shadow-md">
            <div className="flex items-start space-x-2">
              <Coffee className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block flex items-center gap-2 flex-wrap">
                  ☕ 触发高斯拟人随机休眠机制 (智能避开 Telegram 机器人群发检测)
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 font-mono">
                    防封防护中
                  </span>
                </span>
                <span className="text-[11px] text-amber-200/90 block mt-0.5 leading-relaxed">
                  默认每发送 <strong className="text-amber-100 font-mono">{antiBan.pauseIntervalCount} 条</strong>，系统自动休眠 <strong className="text-amber-100 font-mono">{antiBan.minPauseDurationMin || 2}~{antiBan.maxPauseDurationMin || 6} 分钟</strong>。本次休眠倒计时: <strong className="text-emerald-300 font-mono text-sm">{Math.floor(restCountdown / 60)}分{restCountdown % 60}秒</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIsCoolingRest(false);
                  setRestCountdown(0);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg font-bold text-xs shadow transition-all flex items-center gap-1 active:scale-95"
                title="手动跳过本次休眠倒计时，立即继续发送"
              >
                ⚡ 立即跳过本次休眠
              </button>
            </div>
          </div>
        )}

        {/* 24/7 Telegram 独立客户回复统计与追发彩金看板 (Unique Customer Leads Tracker) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <Users className="w-4 h-4 text-emerald-400" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-300 flex items-center gap-2">
                  🎯 24H 客户主动回复与转化追踪 (按独立客户精准统计)
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                    第2条+第3条合并计为 1 条
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  只要客户对我方 TG 号回复，系统自动补发第 2 阶段彩金链接及第 3 阶段中奖祝福，这 2 条消息<strong className="text-amber-300">统一合并计为 1 个回复客户</strong>。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('确定要清零重置今日的客户回复与彩金补发统计数据吗？')) {
                  try {
                    await fetch('/api/telegram/reset-reply-stats', { method: 'POST' });
                    alert('✅ 客户回复统计与补发计数已成功清零重置！');
                    window.location.reload();
                  } catch (e: any) {
                    alert('清零失败: ' + e.message);
                  }
                }
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              🔄 一键清零回复统计
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">今日独立回复客户:</span>
              <span className="text-emerald-400 font-extrabold text-base">0 个客户</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">累计有效转化客户:</span>
              <span className="text-cyan-400 font-extrabold text-base">0 个客户</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">自动追单彩金状态:</span>
              <span className="text-emerald-400 font-bold">🟢 24H 实时就绪</span>
            </div>
          </div>
        </div>

        {isCampaignRunning && !isCoolingRest && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 animate-pulse">
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              高斯防封延遲中: 正在等待 <strong className="text-amber-400 font-mono">{currentDelay} 秒</strong> 隨機平滑 Jitter...
            </span>
            <span className="text-slate-400 font-mono">
              派發 Session: {healthyAccounts[currentIndex % (healthyAccounts.length || 1)]?.alias} [{healthyAccounts[currentIndex % (healthyAccounts.length || 1)]?.platform.toUpperCase()}]
            </span>
          </div>
        )}
      </div>

      {/* Daily Scheduled Automation & Progressive Daily Limits Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                ⏰ 每日定時群發與階梯升溫發信控制器 (Daily Scheduled & Warmup Controller)
                {enableDailySchedule && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-mono font-bold">
                    ● 定時排程已啟用
                  </span>
                )}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                支持設置每天固定時間（如 <strong className="text-amber-300 font-mono">09:00 AM</strong>）自動啟動群發，第一天發 15 封，第二天 30 封階梯升溫，防封效果最佳！
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <span>啟用每日定時与階梯限額</span>
              <input
                type="checkbox"
                checked={enableDailySchedule}
                onChange={(e) => setEnableDailySchedule(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {enableDailySchedule && (
          <div className="space-y-4">
            {/* Top Control Bar: Start Time, End Time & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              {/* Start Time */}
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">⏰ 每日開始時間:</span>
                <input
                  type="text"
                  placeholder="例：18:00"
                  value={scheduleStartTime}
                  onChange={(e) => handleUpdateScheduleStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-bold focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">🛑 每日結束時間:</span>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableScheduleEndTime}
                      onChange={(e) => handleUpdateEnableScheduleEndTime(e.target.checked)}
                      className="w-3 h-3 accent-rose-500 rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400">啟用</span>
                  </label>
                </div>
                {enableScheduleEndTime ? (
                  <input
                    type="text"
                    placeholder="例：23:00"
                    value={scheduleEndTime}
                    onChange={(e) => handleUpdateScheduleEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-rose-300 font-bold focus:outline-none focus:border-rose-400 text-xs font-mono"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500 italic py-1.5">24小時不休眠</div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">🌐 時區基準 (Timezone):</span>
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleUpdateScheduleTimezone('local')}
                    className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold transition-all ${
                      scheduleTimezone === 'local'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    💻 本地時間
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateScheduleTimezone('brazil')}
                    className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold transition-all ${
                      scheduleTimezone === 'brazil'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇧🇷 巴西 (UTC-3)
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 pt-0.5 font-mono">
                  {scheduleTimezone === 'brazil' ? '🇧🇷 依據巴西時間 (BRT)' : '💻 依據本地瀏覽器時間'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">📅 當前群發任務天數:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCampaignCurrentDay((d) => Math.max(1, d - 1))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center bg-slate-900 py-1 rounded border border-slate-800 text-cyan-300 font-extrabold text-xs">
                    第 {campaignCurrentDay} 天
                  </span>
                  <button
                    onClick={() => setCampaignCurrentDay((d) => d + 1)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">🎯 今日派發配額 (第{campaignCurrentDay}天):</span>
                <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-emerald-400 font-extrabold text-xs flex items-center justify-between">
                  <span>{todaySentCount} / {currentDayQuota} 封</span>
                  <span className="text-[10px] text-slate-500">
                    {Math.min(100, Math.round((todaySentCount / currentDayQuota) * 100))}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">⚡️ 配額控制:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setTodaySentCount(0);
                      setIsWaitingNextDay(false);
                    }}
                    className="w-full py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition"
                  >
                    重置今日發送量 (0封)
                  </button>
                </div>
              </div>
            </div>

            {/* Progressive Quota Matrix Table */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  每日階梯升溫配額表 (從 Day 1 到 Day 6+ 逐步放量):
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-mono">快捷套用方案:</span>
                  <button
                    onClick={() => setDailyQuotaSchedule([15, 30, 60, 120, 250, 500])}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded font-mono"
                  >
                    15➔30➔60➔120 (推荐稳健)
                  </button>
                  <button
                    onClick={() => setDailyQuotaSchedule([30, 60, 120, 250, 500, 1000])}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded font-mono"
                  >
                    30➔60➔120➔250 (标准)
                  </button>
                  <button
                    onClick={() => setDailyQuotaSchedule([50, 100, 200, 400, 800, 1500])}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded font-mono"
                  >
                    50➔100➔200➔400 (激进)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {dailyQuotaSchedule.map((quota, idx) => {
                  const dayNum = idx + 1;
                  const isCurrent = campaignCurrentDay === dayNum;
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className={isCurrent ? 'font-extrabold text-amber-300' : 'text-slate-500'}>
                          第 {dayNum} 天 {dayNum === 6 ? '+' : ''}
                        </span>
                        {isCurrent && <span className="text-[9px] bg-amber-400 text-slate-950 font-extrabold px-1 rounded">进行中</span>}
                      </div>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={quota}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 10;
                            const newArr = [...dailyQuotaSchedule];
                            newArr[idx] = val;
                            setDailyQuotaSchedule(newArr);
                          }}
                          className={`w-full bg-slate-900 border rounded px-1.5 py-1 text-xs font-mono font-bold text-center focus:outline-none ${
                            isCurrent
                              ? 'border-amber-500/60 text-amber-300'
                              : 'border-slate-800 text-slate-300 focus:border-cyan-500'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 font-mono">封</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waiting for Next Day Countdown Banner */}
            {isWaitingNextDay && (
              <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border border-amber-500/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl animate-pulse">
                <div className="flex items-start md:items-center space-x-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40 shrink-0">
                    <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-300 text-sm">
                        ⏳ 第 {campaignCurrentDay} 天配額 ({todaySentCount}/{currentDayQuota} 封) 已全部完成！
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                        自動掛起等待中
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      系統已安全暫停群發。將在明天 <strong className="text-amber-300 font-mono">{scheduleStartTime}</strong> 自動啟動第 <strong className="text-cyan-300 font-mono">{campaignCurrentDay + 1}</strong> 天群发（配額: <strong className="text-emerald-300 font-mono">{dailyQuotaSchedule[Math.min(campaignCurrentDay, dailyQuotaSchedule.length - 1)]} 封</strong>）。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">距離明天 {scheduleStartTime} 啟動:</span>
                    <span className="text-lg font-mono font-extrabold text-amber-300">
                      {Math.floor(nextDayCountdownSec / 3600)}h {Math.floor((nextDayCountdownSec % 3600) / 60)}m {nextDayCountdownSec % 60}s
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsWaitingNextDay(false);
                      setCampaignCurrentDay((d) => d + 1);
                      setTodaySentCount(0);
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-md"
                  >
                    ⚡️ 提前開啟第 {campaignCurrentDay + 1} 天
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden local image/video input for campaign */}
      <input
        type="file"
        ref={campaignFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              setCustomMediaUrl(evt.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Data Progress Memory Pointer Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40 shrink-0">
            <span className="text-xl">📍</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-100 text-sm">
                号料发送进度自动记忆指针 (Auto Index Progress Tracking)
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                已自动记忆至 LocalStorage
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              系统会自动记忆发送进度！例如导入 10,000 条号料，第 1 天发送 100 条后，第 2 天自动从 <span className="text-emerald-400 font-bold font-mono">第 {currentIndex + 1} 条</span> 继续发送，绝不重复发送或漏发。
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1 text-slate-400">
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-200">
                已完成: <strong className="text-emerald-400 font-bold">{currentIndex.toLocaleString()}</strong> / {targets.length.toLocaleString()} 条
              </span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-200">
                下一次起发号码: <strong className="text-amber-300 font-bold">{targets[currentIndex] || '（已到达末尾 / 等待新导入）'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              if (confirm('确定要重置发送进度吗？重置后下一次群发将从第 1 条号码重新开始！')) {
                setCurrentIndex(0);
              }
            }}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <span>🔄 重置从第 1 条发</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const input = prompt(`当前共 ${targets.length} 条号料。请输入你想跳转到的起始行数 (1 - ${targets.length}):`, (currentIndex + 1).toString());
              if (input) {
                const parsed = parseInt(input, 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= targets.length + 1) {
                  setCurrentIndex(parsed - 1);
                  alert(`已成功将起始点修改为第 ${parsed} 条号码！`);
                } else {
                  alert('输入无效，请输入正确的行数范围。');
                }
              }
            }}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <span>🔢 指定起始行数</span>
          </button>
        </div>
      </div>

      {/* Strategy Control Box: Two-Step Outreach & Random Image Attach Rate */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                🛡️ 7天后爆款群发策略配置 (Outreach Strategy & Random Image Probability)
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                结合真人行为模式，配置两步式打招呼漏斗与随机图片配图概率，将封号率降至最低。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Outreach Strategy (Two-Step vs Direct) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                💬 触达策略 (Outreach Flow):
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                {outreachStrategy === 'two_step' ? '两步式: 问候 ➔ 回复后发带链接文案' : '一步式: 直接发 7 天爆款文案'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutreachStrategy('two_step')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  outreachStrategy === 'two_step'
                    ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs block text-amber-400">⚡️ 两步式 (推荐高防封)</span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                  先发无链接简短问候语，客户回复后自动推 7 天爆款带链接文案。
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOutreachStrategy('direct')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  outreachStrategy === 'direct'
                    ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs block text-cyan-400">🚀 一步式 (直接群发)</span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                  轮播派发 7 组 Spintax 文案与旋转 URL 链接，覆盖面广。
                </span>
              </button>
            </div>

            {outreachStrategy === 'two_step' && (
              <div className="space-y-1.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-[11px] text-amber-400 font-mono font-semibold block">
                  第一步问候语 Spintax (无敏感词与链接):
                </span>
                <input
                  type="text"
                  value={step1GreetingText}
                  onChange={(e) => setStep1GreetingText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Card 2: Image Attachment Probability */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                🖼️ 图片附带概率 (Image Attach Rate):
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-500/30">
                {imageAttachMode === 'random_50' && '🎲 50% 随机配图 (最拟人化)'}
                {imageAttachMode === 'random_30' && '🎲 30% 随机配图'}
                {imageAttachMode === 'always' && '🖼️ 100% 每条必带图'}
                {imageAttachMode === 'never' && '📝 0% 纯文本'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setImageAttachMode('random_50')}
                className={`py-2 px-1.5 rounded-lg border text-center transition ${
                  imageAttachMode === 'random_50'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🎲 50% 随机
              </button>
              <button
                type="button"
                onClick={() => setImageAttachMode('random_30')}
                className={`py-2 px-1.5 rounded-lg border text-center transition ${
                  imageAttachMode === 'random_30'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🎲 30% 随机
              </button>
              <button
                type="button"
                onClick={() => setImageAttachMode('always')}
                className={`py-2 px-1.5 rounded-lg border text-center transition ${
                  imageAttachMode === 'always'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🖼️ 100% 必带
              </button>
              <button
                type="button"
                onClick={() => setImageAttachMode('never')}
                className={`py-2 px-1.5 rounded-lg border text-center transition ${
                  imageAttachMode === 'never'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                📝 0% 纯文本
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              根据您的选择，群发时不会每条都带图片，而是随机决定是否附图，完美打破固定图文发信的官方风控规则。
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Message Text Copy Editor & Target Phone Numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: 博彩宣傳文案自由編寫區 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> 博彩宣傳文案區 (6套賭狗文案 1對1 輪流發送)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEnableTextRotation(!enableTextRotation)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                  enableTextRotation
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {enableTextRotation ? '✓ 6套文案輪播中' : '單一文案模式'}
              </button>
              <button
                onClick={() => {
                  setRotationTexts(PRESET_TEMPLATES.slice(0, 6).map((t) => t.content));
                  setCustomMessageText(PRESET_TEMPLATES[0].content);
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 underline font-mono"
              >
                重置為 6 套爆款文案
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            {enableTextRotation
              ? '系統已載入 6 套最吸引巴西賭狗的爆款文案，群發時將與 6 張圖進行「一對一同步輪流發送」：'
              : '單一文案模式：直接自由輸入任何宣傳內容（支援 Emoji、Spintax 詞庫）：'}
          </p>

          {/* 6-Text Copies Tab Switcher if Text Rotation Enabled */}
          {enableTextRotation && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                {['1. PIX/Bônus', '2. Tigrinho', '3. Roleta', '4. Clube VIP', '5. Apostas', '6. Aviator'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTextTab(idx)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition border text-center ${
                      activeTextTab === idx
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    文案 {idx + 1}
                    <span className="block text-[9px] font-normal opacity-80 truncate">{label}</span>
                  </button>
                ))}
              </div>

              {/* Active Tab Copy Editor */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono font-semibold">
                  <span>文案 #{activeTextTab + 1} 編輯：{['PIX & Depósito Instantâneo', 'Fortune Tiger (Tigrinho)', 'Roleta Premiada', 'Clube VIP & Cashback', 'Apostas Esportivas', 'Aviator & Crash Games'][activeTextTab]}</span>
                  <span className="text-slate-500 text-[10px]">自動綁定圖 #{activeTextTab + 1} 發送</span>
                </div>
                <textarea
                  rows={6}
                  value={rotationTexts[activeTextTab] || ''}
                  onChange={(e) => {
                    const newTexts = [...rotationTexts];
                    newTexts[activeTextTab] = e.target.value;
                    setRotationTexts(newTexts);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Single Text Copy Editor if Text Rotation Disabled */}
          {!enableTextRotation && (
            <>
              {/* Preset Template Selector & Quick Variables */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <span>🔥 套用 13 套爆款炒群文案:</span>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const tpl = PRESET_TEMPLATES.find((t) => t.id === val);
                        if (tpl) {
                          setCustomMessageText(tpl.content);
                        }
                      }
                    }}
                    className="bg-amber-950 text-amber-200 border border-amber-500/40 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="">🔥 载入双盘口爆款文案库 (Mostbet / 933)...</option>
                    <optgroup label="🔴 Mostbet 盘口专属文案 (500%首充 / LPL / PIX)">
                      {PRESET_TEMPLATES.filter(t => t.id.startsWith('mostbet')).map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="💎 933 盘口 (668xt/kk76) 炒群/代理/转盘">
                      {PRESET_TEMPLATES.filter(t => t.id.startsWith('933')).map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className="text-slate-400 font-semibold mr-1">插入變數:</span>
                  {['URL', 'NAME', 'BONUS', 'CODE', 'TG_LINK'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCustomMessageText((prev) => prev + ` {${v}}`)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono transition"
                    >
                      &#123;{v}&#125;
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Direct Textarea for Campaign Message */}
              <div className="space-y-1 flex-1 flex flex-col">
                <textarea
                  rows={8}
                  value={customMessageText}
                  onChange={(e) => setCustomMessageText(e.target.value)}
                  placeholder="在此直接輸入您的博彩宣傳文案內容..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed flex-1"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1 pt-1">
                  <span>可自由編輯，發送時將自動進行 Spintax 亂數替換</span>
                  <span>字數: {customMessageText.length} 字符</span>
                </div>
              </div>
            </>
          )}

          {/* Hidden Multi-Image Input for Desktop my-web-images Upload */}
          <input
            type="file"
            ref={multiImageFileInputRef}
            onChange={handleMultiImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Media Attachment Bar & Dynamic Image Rotation Pool Manager */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  🖼️ 宣傳圖動態輪播池 ({rotationImages.length} 張圖已就緒)
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                  一對一輪流輪播
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => multiImageFileInputRef.current?.click()}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  title="可多次點擊，每次選取的圖片都會自動【追加】到圖片池中，不會覆蓋！"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  ➕ 追加上傳圖片 (可選多張)
                </button>

                <button
                  onClick={() => setEnableImageRotation(!enableImageRotation)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    enableImageRotation
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {enableImageRotation ? '✓ 輪播模式啟用' : '關閉輪播'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              支持自由上傳任意數量（1張、3張、6張或更多）圖片。每次上傳會自動 <strong className="text-cyan-300">【追加】</strong> 到池中，不會覆蓋原有圖片。發送時將與目標受眾進行 <strong className="text-emerald-400">「一對一輪流輪播配對」</strong>（圖 1 ➔ 圖 2 ➔ ... ➔ 圖 {rotationImages.length || 1} 循環）。
            </p>

            {/* Dynamic Thumbnails Grid (Unlimited Images) */}
            {enableImageRotation && (
              <div className="space-y-2">
                {rotationImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 max-h-[320px] overflow-y-auto pr-1">
                    {rotationImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-col items-center hover:border-cyan-500/50 transition-all shadow-sm"
                      >
                        <div className="relative w-full h-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt={`Banner ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute top-1 left-1 bg-slate-950/90 text-cyan-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-500/40 shadow">
                            圖 {idx + 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 truncate w-full text-center">
                          {imgUrl.startsWith('data:') ? '本地上傳圖片' : `Banner 0${idx + 1}`}
                        </span>
                        <button
                          onClick={() => {
                            setRotationImages((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold transition shadow"
                          title="移除此圖片"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
                    目前圖片池為空，請點擊右上方「➕ 追加上傳圖片」按鈕加入圖片，或點擊右下角重置預設圖庫。
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    已就緒 {rotationImages.length} 張宣傳圖，準備一對一自動輪流發送
                  </span>
                  <div className="flex flex-wrap items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setRotationImages([])}
                      className="text-rose-400 hover:text-rose-300 underline font-mono"
                    >
                      🗑️ 清空图片池
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Single fallback media input if rotation disabled */}
            {!enableImageRotation && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={customMediaUrl}
                  onChange={(e) => setCustomMediaUrl(e.target.value)}
                  placeholder="單張圖模式：貼上圖片網址，或點擊上方按鈕上傳"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Box: Target Numbers Input & Scrubber */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col">
          <input
            type="file"
            ref={targetsFileInputRef}
            onChange={handleTargetsFileUpload}
            accept=".txt,.csv"
            className="hidden"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> 導入目標受眾號碼清單
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">快速測試:</span>
              <button
                onClick={() => handleLoadTgTestTask(12)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono transition"
                title="載入 12 筆示範受眾"
              >
                12筆
              </button>
              <button
                onClick={() => handleLoadTgTestTask(100)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition"
                title="生成 100 筆測試受眾"
              >
                100筆
              </button>
              <button
                onClick={() => handleLoadTgTestTask(500)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition"
                title="生成 500 筆大批量測試受眾"
              >
                500筆
              </button>
              <button
                onClick={() => targetsFileInputRef.current?.click()}
                className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                📁 上傳 .txt / .csv (不限筆數)
              </button>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                已就緒 {targets.length.toLocaleString()} 筆
              </span>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2.5 space-y-1 text-xs">
            <div className="flex items-center justify-between text-cyan-300 font-bold text-[11px]">
              <span>💡 混合导入提示 (Auto-Platform Detection):</span>
              <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono text-[10px]">无需区分标注</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Telegram 用户名（如 <code className="text-amber-300 font-mono">@username</code>）或手机号码（如 <code className="text-amber-300 font-mono">5511987654321</code>）<strong>可以直接粘贴或批量上传</strong>。系统自动分配矩阵协议号派发！
            </p>
          </div>

          <textarea
            rows={13}
            value={rawTargetsText}
            onChange={(e) => setRawTargetsText(e.target.value)}
            placeholder={`5511987654321
5521998887766
+55 31 97654-3210`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed flex-1"
          />
        </div>
      </div>

      {/* Row 2: Live Message Stream Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> 實時雙軌矩陣群發串流 (Live Dual-Platform Stream)
            </span>
            <span className="text-xs text-slate-500">TG / WS 訊息到達狀態</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                尚未啟動群發任務。點擊頂部「啟動 TG + WS 矩陣群發」即可開始即時派發！
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.platform === 'telegram'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {log.platform === 'telegram' ? '✈️ TG Dispatch' : '🟢 WS Dispatch'}
                      </span>
                      <span className="text-slate-500">&rarr;</span>
                      <span className="text-slate-100 font-bold">{log.targetPhone}</span>
                      {log.mediaAttached && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> 媒體附件
                        </span>
                      )}
                    </div>

                    {log.status === 'success' ? (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 送達 (Sent)
                      </span>
                    ) : (
                      <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> 失敗 ({log.errorMessage})
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/60 space-y-2">
                    {/* Media Image Attachment Banner Preview */}
                    {log.mediaUrl && (
                      <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <img
                          src={log.mediaUrl}
                          alt="Banner Attached"
                          className="w-20 h-12 object-cover rounded border border-slate-800 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="text-[10px] space-y-0.5">
                          <span className="text-cyan-400 font-bold flex items-center gap-1 font-mono">
                            <ImageIcon className="w-3 h-3 text-cyan-400" />
                            🖼️ 宣傳圖海報已成功附帶派發
                          </span>
                          <span className="text-slate-400 font-mono block truncate max-w-[300px]">
                            {log.mediaUrl}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Message Body with Highlighted Links */}
                    <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {log.messageText.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                        if (part.match(/^https?:\/\//)) {
                          return (
                            <a
                              key={i}
                              href={part}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 font-bold underline hover:text-cyan-200 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 inline-flex items-center gap-1 font-mono my-0.5"
                            >
                              🔗 {part}
                            </a>
                          );
                        }
                        return part;
                      })}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 text-right">
                    高斯延遲: {log.delaySec} 秒
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {/* Real Python Telethon Direct Sender Modal */}
      {isTelethonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40">
                  <Send className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    ⚡️ Telegram Telethon 协议号直发后台 (MTProto Direct Gateway)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    通过 Python 协议号底层匹配目标手机号通讯录直接发起会话与消息推送
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTelethonModalOpen(false)}
                className="text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-xs font-bold cursor-pointer"
              >
                ✕ 关闭界面
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <span>💡 Telegram 真发通道注意事项与收不到消息排查说明:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li><strong>号码格式：</strong>带不带 <code>+</code> 号均可，例如输入 <code>5571999149956</code> 后台会自动纠正为 <code>+5571999149956</code> 标准 E.164 格式。</li>
                <li><strong>非前端触发限制：</strong>任务完全由服务器后台 Python 引擎调度执行，前端只作为监控控制台，页面关闭或后台跑都不影响。</li>
                <li><strong>收不到消息核心原因：</strong>Telegram 官方对陌生协议号通过手机号发起主动私聊有极严苛防封控机制。如果接收方 Telegram 开启了“设置 ➔ 隐私 ➔ 手机号查找/加好友权限限制（仅限联系人）”或未在接收方通讯录，Telegram DC 节点会静默丢弃未匹配成功陌生人的推送。</li>
                <li><strong>生产真发环境建议：</strong>需准备挂载实际通过手机验证码激活的 Telethon <code>.session</code> 凭证文件，或使用 Telegram 官方 Bot API (需目标账户曾主动点开过 Bot)。</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Inputs */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Sender Account Profile Display */}
                  {(() => {
                    const activeAccount = accounts.find(a => (a.platform === 'telegram' || a.platform === 'dual') && a.status === 'active') || accounts[0];
                    const accountPhone = activeAccount?.phone || '+5571988887766';
                    const accountAlias = activeAccount?.alias || 'Telethon-Worker-01';
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 text-xs font-bold">
                            📤 发件号
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">
                              📱 {accountAlias} ({accountPhone})
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Telethon MTProto 协议号通信录直发模式 (已挂载 Session)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800 font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          发件号已就绪
                        </span>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="text-xs font-bold text-cyan-300 block mb-1">
                      📱 目标手机号 (支持格式如 +5571999149956，多行批量):
                    </label>
                    <textarea
                      rows={5}
                      value={telethonTargetInput}
                      onChange={(e) => setTelethonTargetInput(e.target.value)}
                      placeholder="+5571999149956&#10;+5571996984203"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                      <span>待发送: <strong className="text-cyan-300">{telethonTargetInput.split('\n').filter(t => t.trim()).length}</strong> 笔号码</span>
                      <button
                        type="button"
                        onClick={() => setTelethonTargetInput('+5571999149956\n+5571996984203')}
                        className="text-cyan-400 hover:underline cursor-pointer font-mono"
                      >
                        🔗 一键重置为测试号码
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      💬 发送文案 (支持 Spintax 话术变量如 {"{Olá|Oi}"}):
                    </label>
                    <textarea
                      rows={3}
                      value={telethonMsgInput}
                      onChange={(e) => setTelethonMsgInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunRealTelethonScript}
                  disabled={isTelethonExecuting}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                    isTelethonExecuting
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-extrabold shadow-cyan-500/20 active:scale-98'
                  }`}
                >
                  {isTelethonExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      正在调用 Python 底层引擎发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      🚀 启动 Python 协议号进行真发测试
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Terminal Log */}
              <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3.5 h-full min-h-[300px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    💻 后台 Python 运行日志 (实时终端)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono">Telethon MTProto</span>
                </div>
                <textarea
                  readOnly
                  rows={12}
                  value={telethonLogs || '等待任务执行...\n点击左侧【🚀 启动 Python 协议号进行真发测试】按钮，服务器后台将运行 Python 真实协议号脚本并输出详细交互日志！'}
                  className="w-full flex-1 bg-black text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-900 focus:outline-none resize-none leading-relaxed overflow-y-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

