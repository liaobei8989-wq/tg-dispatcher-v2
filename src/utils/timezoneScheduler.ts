import { ScheduledCampaignConfig, TimezoneClock } from '../types';

export const SCHEDULED_STORAGE_KEY = 'tg_cross_tz_scheduled_campaign_v2';

export const DEFAULT_THREE_WAVES = [
  {
    id: 'wave-1-lunch',
    name: '第一波：午间摸鱼 (12:00~14:00)',
    brazilTime: '12:30',
    indonesiaTime: '22:30',
    enabled: true,
    targetCountSuggestion: '2,000 ~ 2,500 条 (执行约25分钟 ➔ 强制深度休眠 5 小时)',
    fileName: '',
    dataText: '',
    targetList: [],
    sentOffset: 0,
    status: 'waiting' as const,
    targetGroupTag: 'ALL'
  },
  {
    id: 'wave-2-dinner',
    name: '第二波：晚饭下班 (18:30~20:30)',
    brazilTime: '18:30',
    indonesiaTime: '04:30',
    enabled: true,
    targetCountSuggestion: '2,200 ~ 2,600 条 (执行约22分钟 ➔ 强制休眠 90 分钟供接待进粉)',
    fileName: '',
    dataText: '',
    targetList: [],
    sentOffset: 0,
    status: 'waiting' as const,
    targetGroupTag: '主力爆破A组'
  },
  {
    id: 'wave-3-night',
    name: '第三波：夜间高峰 (20:30~22:30)',
    brazilTime: '20:30',
    indonesiaTime: '06:30',
    enabled: true,
    targetCountSuggestion: '2,000 ~ 2,400 条 (执行约20分钟 ➔ 全天收工进入 15 小时夜间休眠)',
    fileName: '',
    dataText: '',
    targetList: [],
    sentOffset: 0,
    status: 'waiting' as const,
    targetGroupTag: 'ALL'
  }
];

export const DEFAULT_SCHEDULED_CONFIG: ScheduledCampaignConfig = {
  id: 'sched-brazil-evening-1900',
  name: '🇧🇷 巴西 3 波错峰极品防封排期 (全天 6,000~8,000 动态浮动)',
  enabled: true,
  recurring: true,
  targetTimeBrazil: '18:30',
  targetTimeIndonesia: '04:30',
  primaryTimezone: 'brazil',
  autoStopBrazilTime: '22:00',
  enableAutoStop: true,
  speedMode: 'conservative',
  strategyMode: 'two_stage',
  batchLimitCount: 0,
  status: 'waiting',
  waves: DEFAULT_THREE_WAVES
};

/**
 * Get current synchronized clocks across Brazil (BRT, UTC-3), Indonesia (WIB, UTC+7), China (CST, UTC+8) and Local
 */
export function getCurrentClocks(): {
  brazil: TimezoneClock;
  indonesia: TimezoneClock;
  china: TimezoneClock;
  local: TimezoneClock;
} {
  const now = new Date();

  // Brazil (America/Sao_Paulo or UTC-3)
  const brtFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const brtDateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Sao_Paulo',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });

  // Indonesia (Asia/Jakarta or UTC+7)
  const wibFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const wibDateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Jakarta',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });

  // China (Asia/Shanghai or UTC+8)
  const cstFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const cstDateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });

  // Local
  const localTimeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
  const localDateStr = now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' });

  const brtTimeStr = brtFormatter.format(now);
  const brtHour = parseInt(brtTimeStr.split(':')[0], 10);
  const isBrtNight = brtHour >= 22 || brtHour < 7;

  const wibTimeStr = wibFormatter.format(now);
  const wibHour = parseInt(wibTimeStr.split(':')[0], 10);
  const isWibNight = wibHour >= 23 || wibHour < 6;

  return {
    brazil: {
      name: '巴西圣保罗/巴西利亚',
      code: 'BRT (UTC-3)',
      flag: '🇧🇷',
      timeStr: brtTimeStr,
      dateStr: brtDateFormatter.format(now),
      offsetLabel: '目标客户市场 (晚高峰 18:00~23:00)',
      isNight: isBrtNight
    },
    indonesia: {
      name: '印尼雅加达/西印尼',
      code: 'WIB (UTC+7)',
      flag: '🇮🇩',
      timeStr: wibTimeStr,
      dateStr: wibDateFormatter.format(now),
      offsetLabel: '操作员您所在时区 (时差 +10 小时)',
      isNight: isWibNight
    },
    china: {
      name: '中国北京/香港',
      code: 'CST (UTC+8)',
      flag: '🇨🇳',
      timeStr: cstFormatter.format(now),
      dateStr: cstDateFormatter.format(now),
      offsetLabel: '国内标准时间 (时差 +11 小时)'
    },
    local: {
      name: '本地浏览器环境',
      code: 'Local',
      flag: '💻',
      timeStr: localTimeStr,
      dateStr: localDateStr,
      offsetLabel: '本机系统时间'
    }
  };
}

/**
 * Convert Brazil time (HH:mm) to Indonesia time (HH:mm) + day note
 * Offset: +10 hours
 */
export function convertBrazilToIndonesia(brazilTimeStr: string): {
  timeStr: string;
  isNextDay: boolean;
  dayOffset: number;
  label: string;
} {
  const parts = (brazilTimeStr || '19:00').split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;

  const totalMin = h * 60 + m + 10 * 60; // add 10 hours
  const totalHours = Math.floor(totalMin / 60);
  const newH = totalHours % 24;
  const newM = totalMin % 60;
  const isNextDay = totalHours >= 24;

  const formatted = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  return {
    timeStr: formatted,
    isNextDay,
    dayOffset: isNextDay ? 1 : 0,
    label: isNextDay ? `次日 ${formatted} (印尼早晨)` : `当天 ${formatted}`
  };
}

/**
 * Convert Indonesia time (HH:mm) to Brazil time (HH:mm) + day note
 * Offset: -10 hours
 */
export function convertIndonesiaToBrazil(indonesiaTimeStr: string): {
  timeStr: string;
  isPrevDay: boolean;
  dayOffset: number;
  label: string;
} {
  const parts = (indonesiaTimeStr || '05:00').split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;

  let totalMin = h * 60 + m - 10 * 60; // minus 10 hours
  let isPrevDay = false;
  if (totalMin < 0) {
    totalMin += 24 * 60;
    isPrevDay = true;
  }
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;

  const formatted = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  return {
    timeStr: formatted,
    isPrevDay,
    dayOffset: isPrevDay ? -1 : 0,
    label: isPrevDay ? `前日 ${formatted} (巴西傍晚/夜间)` : `当天 ${formatted}`
  };
}

/**
 * Calculate next execution timestamp and remaining countdown
 */
export function calculateNextRunInfo(targetTimeBrazil: string = '19:00', lastExecutedAt?: string): {
  nextRunTimestampMs: number;
  remainingMs: number;
  remainingFormatted: string;
  isDueNow: boolean;
  brazilTargetStr: string;
  indonesiaTargetStr: string;
} {
  const now = new Date();
  
  // Get current Brazil date and time in 24h format
  const brtFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const brtParts = brtFormatter.formatToParts(now);
  const curH = parseInt(brtParts.find(p => p.type === 'hour')?.value || '0', 10);
  const curM = parseInt(brtParts.find(p => p.type === 'minute')?.value || '0', 10);
  const curS = parseInt(brtParts.find(p => p.type === 'second')?.value || '0', 10);

  const parts = (targetTimeBrazil || '19:00').split(':');
  const targetH = parseInt(parts[0], 10) || 19;
  const targetM = parseInt(parts[1], 10) || 0;

  const curBrtSecondsOfDay = curH * 3600 + curM * 60 + curS;
  const targetBrtSecondsOfDay = targetH * 3600 + targetM * 60;

  let secondsDiff = targetBrtSecondsOfDay - curBrtSecondsOfDay;
  
  // Check if it's currently due within the target minute (e.g. 0 to 59 seconds after trigger time)
  const isWithinTriggerMinute = curH === targetH && curM === targetM;
  
  // Check if already executed in the last 2 minutes
  let recentlyExecuted = false;
  if (lastExecutedAt) {
    try {
      const lastMs = new Date(lastExecutedAt).getTime();
      if (Date.now() - lastMs < 120000) {
        recentlyExecuted = true;
      }
    } catch (e) {}
  }

  const isDueNow = isWithinTriggerMinute && !recentlyExecuted;

  let isNextDay = false;
  if (secondsDiff < 0) {
    // Target time already passed earlier today in Brazil
    secondsDiff += 24 * 3600;
    isNextDay = true;
  }

  const remainingMs = Math.max(0, secondsDiff * 1000);
  const nextRunTimestampMs = Date.now() + remainingMs;

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const remainingFormatted = `${String(hours).padStart(2, '0')}小时 ${String(minutes).padStart(2, '0')}分 ${String(seconds).padStart(2, '0')}秒`;
  const idInfo = convertBrazilToIndonesia(targetTimeBrazil);

  return {
    nextRunTimestampMs,
    remainingMs,
    remainingFormatted,
    isDueNow,
    brazilTargetStr: `${isNextDay ? '明日 ' : '今日 '}${targetTimeBrazil} BRT`,
    indonesiaTargetStr: `${idInfo.label} WIB`
  };
}

/**
 * Find the closest upcoming wave among all active waves
 */
export function findNextUpcomingWave(waves: any[] = []): {
  nextWave: any | null;
  dueWave: any | null;
  countdown: ReturnType<typeof calculateNextRunInfo>;
  activeWavesCount: number;
} {
  const activeWaves = waves.filter(w => w.enabled);
  if (activeWaves.length === 0) {
    const defaultInfo = calculateNextRunInfo('18:30');
    return { nextWave: null, dueWave: null, countdown: defaultInfo, activeWavesCount: 0 };
  }

  let minRemainingMs = Infinity;
  let nextWave: any = activeWaves[0];
  let dueWave: any = null;
  let bestCountdown = calculateNextRunInfo(activeWaves[0].brazilTime || '18:30');

  for (const wave of activeWaves) {
    const waveTime = wave.brazilTime || '18:30';
    const info = calculateNextRunInfo(waveTime, wave.lastExecutedAt);
    if (info.isDueNow && !dueWave) {
      dueWave = wave;
    }
    if (info.remainingMs < minRemainingMs) {
      minRemainingMs = info.remainingMs;
      nextWave = wave;
      bestCountdown = info;
    }
  }

  return {
    nextWave,
    dueWave,
    countdown: bestCountdown,
    activeWavesCount: activeWaves.length
  };
}

/**
 * Add or subtract minutes from HH:mm time string
 */
export function addMinutesToTime(timeStr: string = '19:00', deltaMinutes: number): string {
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10) || 0;
  let m = parseInt(parts[1], 10) || 0;

  let totalMinutes = h * 60 + m + deltaMinutes;
  while (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  totalMinutes = totalMinutes % (24 * 60);

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Add or subtract hours from HH:mm time string
 */
export function addHoursToTime(timeStr: string = '19:00', deltaHours: number): string {
  return addMinutesToTime(timeStr, deltaHours * 60);
}

/**
 * Load scheduled campaign config from localStorage
 */
export function loadScheduledCampaignConfig(): ScheduledCampaignConfig {
  try {
    const raw = localStorage.getItem(SCHEDULED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const waves = parsed.waves && Array.isArray(parsed.waves) && parsed.waves.length > 0
        ? parsed.waves
        : DEFAULT_THREE_WAVES;
      return { ...DEFAULT_SCHEDULED_CONFIG, ...parsed, waves };
    }
  } catch (e) {
    console.warn('Failed to load scheduled campaign config from storage:', e);
  }
  return DEFAULT_SCHEDULED_CONFIG;
}

/**
 * Fetch scheduled campaign config directly from server disk (sessions/scheduled_campaign_config.json)
 */
export async function fetchScheduledCampaignConfigFromServer(): Promise<ScheduledCampaignConfig | null> {
  try {
    const res = await fetch('/api/scheduled/config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.config) {
        const waves = data.config.waves && Array.isArray(data.config.waves) && data.config.waves.length > 0
          ? data.config.waves
          : DEFAULT_THREE_WAVES;
        const completeConfig = { ...DEFAULT_SCHEDULED_CONFIG, ...data.config, waves };
        localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(completeConfig));
        return completeConfig;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch scheduled config from server API:', e);
  }
  return null;
}

/**
 * Save scheduled campaign config to localStorage and sync to server
 */
export function saveScheduledCampaignConfig(config: ScheduledCampaignConfig): void {
  try {
    localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save scheduled campaign config:', e);
  }

  // Auto push to server-side daemon so VPS backend scheduled execution is 100% in sync
  try {
    fetch('/api/scheduled/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).catch(() => {});
  } catch (e) {}
}


