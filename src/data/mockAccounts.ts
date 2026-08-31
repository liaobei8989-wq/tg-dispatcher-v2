import { AccountSession } from '../types';

/**
 * Automatically calculates the dynamic warmup day for an account.
 * Accounts automatically advance +1 warmup day for each elapsed calendar day (rolling over daily at 00:00).
 * @param createdAtStr Account creation / warmup start date string (e.g. '2026-08-24' or ISO)
 * @param baseWarmupDay Starting day baseline at createdAt (default: 1)
 * @returns Current rolled-over warmup day (e.g. Day 1 -> Day 2 -> Day 3...)
 */
export function calculateWarmupDays(createdAtStr?: string, baseWarmupDay: number = 1): number {
  const initialBaseDay = (baseWarmupDay && baseWarmupDay > 0) ? baseWarmupDay : 1;
  if (!createdAtStr) return initialBaseDay;

  try {
    const createdDate = new Date(createdAtStr.includes('T') ? createdAtStr : createdAtStr + 'T00:00:00');
    if (isNaN(createdDate.getTime())) return initialBaseDay;

    const now = new Date();
    // Compare dates at midnight in local / calendar day to compute exact elapsed days
    const createdMid = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const elapsedDays = Math.max(0, Math.floor((nowMid - createdMid) / (1000 * 60 * 60 * 24)));

    return initialBaseDay + elapsedDays;
  } catch {
    return initialBaseDay;
  }
}

// 10 Dedicated Brazilian Native Proxies (1:1 strictly mapped to prevent account association)
export const BRAZIL_DEDICATED_PROXIES_MAP: Record<string, string> = {
  '5586994428117': '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
  '5586994581839': '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
  '5586994709226': '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
  '5586994684213': '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
  '5586994687152': '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
  '5586994850500': '200.152.153.65:12323:14a5a773a873a:4d841434c6',
  '5586994918471': '200.152.154.182:12323:14a5a773a873a:4d841434c6',
  '5586994927293': '200.152.153.188:12323:14a5a773a873a:4d841434c6',
  '5586995118207': '200.152.153.181:12323:14a5a773a873a:4d841434c6',
  '5586995160291': '200.152.155.148:12323:14a5a773a873a:4d841434c6'
};

export const BRAZIL_PROXIES_POOL: string[] = [
  '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
  '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
  '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
  '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
  '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
  '200.152.153.65:12323:14a5a773a873a:4d841434c6',
  '200.152.154.182:12323:14a5a773a873a:4d841434c6',
  '200.152.153.188:12323:14a5a773a873a:4d841434c6',
  '200.152.153.181:12323:14a5a773a873a:4d841434c6',
  '200.152.155.148:12323:14a5a773a873a:4d841434c6'
];

export function getDedicatedProxyForPhone(rawPhone?: string, index: number = 0): string {
  if (!rawPhone) return BRAZIL_PROXIES_POOL[index % BRAZIL_PROXIES_POOL.length];
  const clean = rawPhone.replace(/\D/g, '');
  return BRAZIL_DEDICATED_PROXIES_MAP[clean] || BRAZIL_PROXIES_POOL[index % BRAZIL_PROXIES_POOL.length];
}

export const INITIAL_MOCK_ACCOUNTS: AccountSession[] = [
  {
    id: 'acc-tg-5586994428117',
    phone: '+55 86 99442-8117',
    alias: 'TG-BR-5586994428117 (Ana)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'active',
    proxy: '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 120,
    totalSent: 120,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 7,
    baseWarmupDay: 7,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '主力爆破A组'
  },
  {
    id: 'acc-tg-5586994581839',
    phone: '+55 86 99458-1839',
    alias: 'TG-BR-5586994581839 (Beatriz)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'active',
    proxy: '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 120,
    totalSent: 120,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 7,
    baseWarmupDay: 7,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '主力爆破A组'
  },
  {
    id: 'acc-tg-5586994709226',
    phone: '+55 86 99470-9226',
    alias: 'TG-BR-5586994709226 (Juliana)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'active',
    proxy: '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 120,
    totalSent: 120,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 7,
    baseWarmupDay: 7,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '主力爆破A组'
  },
  {
    id: 'acc-tg-5586994684213',
    phone: '+55 86 99468-4213',
    alias: 'TG-BR-5586994684213 (Camila)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'active',
    proxy: '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 120,
    totalSent: 120,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 7,
    baseWarmupDay: 7,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '主力爆破A组'
  },
  {
    id: 'acc-tg-5586994687152',
    phone: '+55 86 99468-7152',
    alias: 'TG-BR-5586994687152 (Fernanda)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'active',
    proxy: '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 120,
    totalSent: 120,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 7,
    baseWarmupDay: 7,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '主力爆破A组'
  },
  {
    id: 'acc-tg-5586994850500',
    phone: '+55 86 99485-0500',
    alias: 'TG-BR-5586994850500 (Larissa)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'warming',
    proxy: '200.152.153.65:12323:14a5a773a873a:4d841434c6',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 60,
    totalSent: 0,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 3,
    baseWarmupDay: 3,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '新买养号B组'
  },
  {
    id: 'acc-tg-5586994918471',
    phone: '+55 86 99491-8471',
    alias: 'TG-BR-5586994918471 (Gabriela)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'warming',
    proxy: '200.152.154.182:12323:14a5a773a873a:4d841434c6',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 60,
    totalSent: 0,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 3,
    baseWarmupDay: 3,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '新买养号B组'
  },
  {
    id: 'acc-tg-5586994927293',
    phone: '+55 86 99492-7293',
    alias: 'TG-BR-5586994927293 (Isabela)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'warming',
    proxy: '200.152.153.188:12323:14a5a773a873a:4d841434c6',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 60,
    totalSent: 0,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 3,
    baseWarmupDay: 3,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '新买养号B组'
  },
  {
    id: 'acc-tg-5586995118207',
    phone: '+55 86 99511-8207',
    alias: 'TG-BR-5586995118207 (Mariana)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'warming',
    proxy: '200.152.153.181:12323:14a5a773a873a:4d841434c6',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 60,
    totalSent: 0,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 3,
    baseWarmupDay: 3,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '新买养号B组'
  },
  {
    id: 'acc-tg-5586995160291',
    phone: '+55 86 99516-0291',
    alias: 'TG-BR-5586995160291 (Rafaela)',
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'warming',
    proxy: '200.152.155.148:12323:14a5a773a873a:4d841434c6',
    healthScore: 99,
    sentToday: 0,
    dailyLimit: 60,
    totalSent: 0,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: 3,
    baseWarmupDay: 3,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    groupTag: '新买养号B组'
  }
];


