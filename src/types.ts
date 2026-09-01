export type AccountStatus = 'active' | 'warming' | 'risk' | 'banned' | 'offline';

export type PlatformType = 'telegram';

export type SessionType = 
  | 'tg_userbot' 
  | 'tg_bot_api' 
  | 'tg_pyrogram';

export interface AccountSession {
  id: string;
  phone: string; // e.g. +55 11 98765-4321
  alias: string;
  platform: PlatformType;
  type: SessionType;
  status: AccountStatus;
  proxy?: string; // e.g. 187.23.44.12:8080
  healthScore: number; // 0 - 100
  sentToday: number;
  dailyLimit: number;
  totalSent: number;
  successRate: number; // percentage
  createdAt: string;
  lastActive: string;
  warmupDay: number;
  baseWarmupDay?: number;
  tgUsername?: string;
  tgChatId?: string;
  tgApiId?: string;
  tgApiHash?: string;
  tgSessionString?: string;
  otpUrl?: string; // e.g. https://tgbotchecker.com/GetHTML?uuid=...
  twoFactorPassword?: string; // e.g. qq1122
  recoveryEmail?: string; // e.g. liaobei8989@outiook.com
  isLoggedIn?: boolean; // whether Telegram MTProto session is logged in
  avatarUrl?: string; // Account avatar image URL
  accountAgeTag?: string; // e.g. "1-2年老号 (2024年注册)"
  estimatedRegYear?: string; // e.g. "2024"
  spambotStatus?: 'clean' | 'restricted' | 'banned'; // Telegram @SpamBot restriction status
  proxyPing?: string; // e.g. "118ms"
  sessionValid?: boolean; // whether session file/auth key is intact
  lastCheckTime?: string; // e.g. "2026-08-04 18:05"
  healthDiagnosticLog?: string; // Detailed diagnostic output
  groupTag?: string; // e.g. "主力爆破A组" | "新买养号B组" | "测试C组"
}

export interface AntiBanSettings {
  minDelaySec: number; // default 15
  maxDelaySec: number; // default 30
  enableGaussianJitter: boolean;
  pauseIntervalCount: number; // pause after N msgs (e.g. 20)
  pauseDurationMin: number; // legacy default (3)
  minPauseDurationMin: number; // min random pause (e.g. 2)
  maxPauseDurationMin: number; // max random pause (e.g. 6)
  enableRandomRestDuration: boolean; // avoid fixed duration bot patterns
  enableWarmupSchedule: boolean;
  scheduledStartTime?: string; // e.g. "09:00"
  enableScheduledEndTime?: boolean; // enable automatic daily stop
  scheduledEndTime?: string; // e.g. "22:00"
  scheduleTimezone?: 'local' | 'brazil'; // 'local' or 'brazil' (UTC-3)
  dailyWarmupLimits?: number[]; // e.g. [15, 35, 70, 150]
  autoRotateAccounts: boolean;
  rotationStrategy: 'round_robin' | 'sequential' | 'weighted_health';
  injectInvisibleUnicode: boolean; // anti-hash matching
  enableUrlRotator: boolean;
  urls: string[];
  tgDispatchRateLimit: number; // max per minute
  // Early warning fuse protection settings
  enableEarlyWarningFuse: boolean; // default true
  warningThresholdPercent: number; // default 80 (e.g., at 80% of daily limit, auto pause account for today)
  autoResumeNextDay: boolean; // default true
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  sizeMb: number;
  aspectRatio: string;
}

export interface PromotionalTemplate {
  id: string;
  name: string;
  category: 'fortune_tiger' | 'pix_payout' | 'sports_vip' | 'welcome_bonus' | 'tg_vip_channel' | 'custom';
  platformTarget: PlatformType;
  content: string; // Contains Spintax e.g. {Olá|Oi} ... {brazilgo888.com|brazilgo888.com/vip}
  mediaType: 'image' | 'video' | 'none';
  mediaUrl?: string;
  variables: string[]; // e.g. ["NAME", "BONUS", "URL", "CODE", "TG_LINK"]
  isDefault?: boolean;
}

export type LogStatus = 'success' | 'failed' | 'banned' | 'rate_limited' | 'queued';

export interface CampaignLog {
  id: string;
  campaignId: string;
  platform: 'telegram';
  accountId: string;
  accountPhone: string;
  targetPhone: string;
  tgChatId?: string;
  messageText: string;
  mediaAttached?: boolean;
  mediaUrl?: string;
  status: LogStatus;
  errorMessage?: string;
  delaySec: number;
  timestamp: string;
}

export interface ScrubbedContact {
  id: string;
  phone: string;
  formattedPhone: string;
  isTgActive: boolean;
  tgUsername?: string;
  tgChatId?: string;
  lastSeen?: string;
  status: 'unverified' | 'scrubbing' | 'tg_active' | 'inactive';
  avatarUrl?: string;
}

export interface ImportedBatchFile {
  id: string;
  fileName: string;
  fileSizeKb: number;
  totalLines: number;
  validPhoneCount: number;
  scrubbedTgCount: number;
  uploadedAt: string;
}

export interface CampaignState {
  id: string;
  name: string;
  targetPlatform: PlatformType;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  targetContacts: ScrubbedContact[];
  templateId: string;
  templateContent: string;
  totalTargets: number;
  sentCount: number;
  successCount: number;
  failCount: number;
  currentIndex: number;
  startTime?: string;
  endTime?: string;
}

export interface PythonScriptFile {
  filename: string;
  title: string;
  description: string;
  language: string;
  code: string;
}

export interface ScheduledWaveConfig {
  id: string;
  name: string;
  brazilTime: string; // e.g. "12:30", "18:30", "20:30"
  indonesiaTime: string; // e.g. "22:30", "04:30", "06:30"
  enabled: boolean;
  targetCountSuggestion: string; // e.g. "2,000 ~ 3,000 条"
  fileName?: string;
  dataText: string;
  targetList: string[];
  sentOffset: number;
  status: 'waiting' | 'running' | 'completed' | 'paused';
  targetGroupTag?: string; // e.g. 'ALL' (全部分组), '主力爆破A组', '新买养号B组', '备用储备C组', '测试组'
}

export interface ScheduledCampaignConfig {
  id: string;
  name: string;
  enabled: boolean;
  recurring: boolean; // true = daily recurring, false = one-time
  targetTimeBrazil: string; // e.g. "19:00"
  targetTimeIndonesia: string; // e.g. "05:00" (+1 day)
  targetDate?: string; // e.g. "2026-08-17" for one-time
  primaryTimezone: 'brazil' | 'indonesia';
  autoStopBrazilTime?: string; // e.g. "22:00"
  enableAutoStop: boolean;
  speedMode: 'turbo' | 'balanced' | 'safe' | 'conservative';
  strategyMode: 'two_stage' | 'direct';
  batchLimitCount: number; // e.g. 50, 100, or 0 for all
  lastExecutedAt?: string;
  nextRunTimeBRT?: string;
  nextRunTimeWIB?: string;
  nextRunTimestampMs?: number;
  status: 'waiting' | 'running' | 'completed' | 'paused';
  // 3 Distinct Golden Wave Data Queues
  waves?: ScheduledWaveConfig[];
}

export interface TimezoneClock {
  name: string;
  code: string;
  flag: string;
  timeStr: string;
  dateStr: string;
  offsetLabel: string;
  isNight?: boolean;
}

// 🎯 Lead Scraper Types (获客雷达)
export interface ScrapedLead {
  id: string;
  targetId: string; // TG numeric user id or username
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accessHash?: string;
  sourceGroup?: string; // Group URL or title
  sourceType: 'group_members' | 'channel_comments' | 'active_chat';
  lastSeenStatus: 'online' | 'recently' | 'within_3_days' | 'within_week' | 'offline_long' | 'unknown';
  lastSeenText?: string;
  isBot: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  hasAvatar?: boolean;
  avatarUrl?: string;
  scrapedAt: string;
  selected?: boolean;
}

export interface ScrapeJobConfig {
  sourceUrl: string; // e.g. https://t.me/grupofortunetiger or @canalvip/128
  mode: 'group_members' | 'channel_comments';
  executorPhone?: string; // which session executes scraping
  filterOnlineOnly: boolean; // only online now
  filterActive3Days: boolean; // active in last 3 days
  filterActive7Days: boolean; // active in last 7 days
  excludeBots: boolean; // exclude bots
  excludeAdmins: boolean; // exclude admins
  excludeNoAvatar: boolean; // exclude accounts without photo
  limitCount: number; // max to scrape e.g. 500, 1000, 2000
}

export interface ScrapeJobResult {
  success: boolean;
  sourceTitle: string;
  memberCountTotal: number;
  scrapedCount: number;
  filteredCount: number;
  leads: ScrapedLead[];
  logs: string[];
}

// 🌐 Proxy & Fingerprint Types (独立代理与设备指纹)
export interface ProxyItem {
  id: string;
  ip: string;
  port: number;
  username?: string;
  password?: string;
  type: 'socks5' | 'http' | 'https';
  countryCode: string; // e.g. 'BR'
  location: string; // e.g. 'São Paulo, Brazil'
  pingMs?: number;
  status: 'active' | 'testing' | 'dead' | 'slow';
  assignedPhone?: string;
  lastChecked?: string;
}

export interface DeviceFingerprint {
  id: string;
  name: string; // e.g. "Samsung Galaxy S24 Ultra"
  brand: string;
  deviceModel: string;
  systemVersion: string; // e.g. "Android 14 (OneUI 6.1)"
  appVersion: string; // e.g. "10.14.5 (4890)"
  systemLangCode: string; // e.g. "pt-BR"
  langCode: string; // e.g. "pt"
  screenResolution: string; // e.g. "1440x3120"
}

// 💬 Web Inbox Types (统一客户消息聚合面板)
export interface InboxMessage {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'operator' | 'system_phase1' | 'system_phase2' | 'ai_assistant';
  senderPhone?: string;
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl?: string;
}

export interface InboxConversation {
  id: string; // unique conversation ID
  customerPhone: string;
  customerUsername?: string;
  customerName: string;
  customerAvatar?: string;
  assignedAccountPhone: string; // which protocol account received this
  assignedAccountAlias: string;
  stage: 'phase1_sent' | 'replied_interested' | 'phase2_pushed' | 'converting' | 'deposited' | 'closed';
  tag: 'hot_lead' | 'deposited' | 'asking_bonus' | 'asking_pix' | 'cold' | 'normal';
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  notes?: string;
  messages: InboxMessage[];
}

// ✨ AI Mutation & Spintax Types (Gemini 实时润色与多重嵌套变异)
export interface AiRewriteOption {
  id: string;
  name: string;
  description: string;
  persona: 'slang_player' | 'vip_concierge' | 'friendly_casual' | 'clean_minimal';
  sampleOutput: string;
}

export interface SpintaxTestResult {
  totalCombinations: number;
  previewSamples: string[];
  depthLevel: number;
  isValid: boolean;
  errors?: string[];
}

