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
  '200.152.155.148:12323:14a5a773a873a:4d841434c6',
  '200.152.152.137:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.152.113:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.154.37:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.153.126:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.154.149:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.153.70:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.154.77:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.152.82:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.154.254:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.152.175:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.152.155:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.152.243:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.155.124:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.152.195:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.155.35:12323:14abdb1a0db2e:cb8f30f1a9',
  '200.152.153.232:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.28.25:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.30.11:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.30.68:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.28.245:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.19:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.28.13:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.30.220:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.184:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.31.110:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.31.46:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.28.23:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.119:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.36:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.253:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.243:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.28.236:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.29.245:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.0.215:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.1.54:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.3.105:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.0.59:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.0.160:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.2.172:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.2.252:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.1.147:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.2.23:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.0.181:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.3.145:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.2.3:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.2.173:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.0.151:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.1.5:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.1.37:12323:14abdb1a0db2e:cb8f30f1a9',
  '144.225.2.209:12323:14abdb1a0db2e:cb8f30f1a9'
];

export function getDedicatedProxyForPhone(rawPhone?: string, index: number = 0): string {
  if (!rawPhone) return BRAZIL_PROXIES_POOL[index % BRAZIL_PROXIES_POOL.length];
  const clean = rawPhone.replace(/\D/g, '');
  return BRAZIL_DEDICATED_PROXIES_MAP[clean] || BRAZIL_PROXIES_POOL[index % BRAZIL_PROXIES_POOL.length];
}

// 60 Brazilian Female Names for realistic protocol account profiles
const BRAZILIAN_FEMALE_NAMES: string[] = [
  'Ana', 'Beatriz', 'Juliana', 'Camila', 'Fernanda',
  'Larissa', 'Gabriela', 'Isabela', 'Mariana', 'Rafaela',
  'Carolina', 'Bruna', 'Leticia', 'Jessica', 'Vanessa',
  'Patricia', 'Aline', 'Renata', 'Thais', 'Natalia',
  'Luana', 'Priscila', 'Flavia', 'Tatiane', 'Bianca',
  'Debora', 'Sabrina', 'Monique', 'Talita', 'Alice',
  'Yasmin', 'Heloisa', 'Laura', 'Manuela', 'Sophia',
  'Valentina', 'Lorena', 'Giovanna', 'Luiza', 'Eduarda',
  'Maria', 'Julia', 'Helena', 'Isadora', 'Melissa',
  'Nicole', 'Sarah', 'Rebeca', 'Clara', 'Livia',
  'Cecilia', 'Maitê', 'Eloah', 'Agatha', 'Isis',
  'Maya', 'Aurora', 'Antonella', 'Luna', 'Vitoria'
];

// Real 60+1 Brazilian Phones uploaded by user (10 original + 51 newly uploaded session & json files)
export const USER_60_REAL_PHONES: string[] = [
  // 10 Original accounts
  '5586994428117', '5586994581839', '5586994709226', '5586994684213', '5586994687152',
  '5586994850500', '5586994918471', '5586994927293', '5586994943285', '5586995160291',
  // 51 Newly uploaded accounts
  '5598984569687', '5598984627175', '5598984670055', '5598984671221', '5598984730611',
  '5598984731615', '5598984734606', '5598984804947', '5598984844174', '5598984845235',
  '5598984887183', '5598984906227', '5598984949562', '5598984953483', '5598984955625',
  '5598985089834', '5598985109474', '5598985162664', '5598985254155', '5598985259933',
  '5598985323153', '5598985338413', '5598985369605', '5598985432467', '5598985473494',
  '5598985487547', '5598985535121', '5598985583075', '5598985585283', '5598985602056',
  '5598985656993', '5598985703552', '5598985709101', '5598985759825', '5598985864741',
  '5598985926947', '5598985966188', '5598986270576', '5598987077789', '5598987743687',
  '5599984026594', '5599984139898', '5599984168673', '5599984179798', '5599984185644',
  '5599984232476', '5599984276272', '5599984277793', '5599984348008', '5599984387026',
  '5599984388206'
];

export const USER_50_REAL_PHONES = USER_60_REAL_PHONES;

function formatBrPhone(raw: string): string {
  if (raw.length === 13) {
    return `+${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 9)}-${raw.slice(9)}`;
  } else if (raw.length === 12) {
    return `+${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 8)}-${raw.slice(8)}`;
  }
  return `+${raw}`;
}

export const INITIAL_MOCK_ACCOUNTS: AccountSession[] = USER_60_REAL_PHONES.map((rawPhone, idx) => {
  const isTop5 = idx < 5;
  const proxy = BRAZIL_PROXIES_POOL[idx] || BRAZIL_PROXIES_POOL[idx % BRAZIL_PROXIES_POOL.length];
  const name = BRAZILIAN_FEMALE_NAMES[idx % BRAZILIAN_FEMALE_NAMES.length] || `Atendente ${idx + 1}`;
  const warmupDay = isTop5 ? 7 : (idx < 25 ? 5 : 4);
  const groupTag = idx < 30 ? '主力爆破A组' : '新买养号B组';
  const dailyLimit = 120;

  return {
    id: `acc-tg-${rawPhone}`,
    phone: formatBrPhone(rawPhone),
    alias: `TG-BR-${rawPhone} (${name})`,
    platform: 'telegram',
    type: 'tg_userbot',
    status: 'active',
    proxy: proxy,
    healthScore: 99,
    sentToday: 0,
    dailyLimit: dailyLimit,
    totalSent: 120,
    successRate: 100,
    createdAt: '2026-08-31',
    lastActive: '刚刚',
    warmupDay: warmupDay,
    baseWarmupDay: warmupDay,
    twoFactorPassword: '548508',
    avatarUrl: '',
    tgApiId: '2040',
    tgApiHash: 'b18441a1ff607e10a989891a5462e627',
    spambotStatus: 'clean',
    sessionValid: true,
    sessionFile: `${rawPhone}.session`,
    groupTag: groupTag
  };
});


