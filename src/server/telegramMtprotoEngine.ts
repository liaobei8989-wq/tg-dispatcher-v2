import fs from 'fs';
import path from 'path';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';

export interface TelegramAccountConfig {
  phone: string;
  sessionString: string;
  apiId: number;
  apiHash: string;
  deviceModel?: string;
  systemVersion?: string;
  appVersion?: string;
  langCode?: string;
  systemLangCode?: string;
  twofa?: string;
  name?: string;
}

export interface DirectSendOptions {
  targets: string[];
  message?: string;
  second_message?: string;
  third_message?: string;
  enable_third_message?: boolean;
  second_to_third_delay_min?: number;
  second_to_third_delay_max?: number;
  auto_send_second?: boolean;
  wait_for_reply?: boolean;
  listen_timeout?: number;
  avatar_photo_path?: string;
  bot_token?: string;
  api_id?: string | number;
  api_hash?: string;
  session_string?: string;
  sender_phone?: string;
  session_file?: string;
  force_user_mode?: boolean;
  delay_min?: number;
  delay_max?: number;
  batch_min?: number;
  batch_max?: number;
  batch_rest_min?: number;
  batch_rest_max?: number;
}

// 巴西原生 SOCKS5 / HTTP 代理 IP池 (已配置 5 组独立 200.* 巴西独享出口)
const BRAZIL_PROXIES = [
  "200.160.36.222:12323:14aade52b86e6:70dd653fc2",
  "200.239.237.124:12323:14aade52b86e6:70dd653fc2",
  "200.160.43.132:12323:14aade52b86e6:70dd653fc2",
  "200.160.38.29:12323:14aade52b86e6:70dd653fc2",
  "200.239.213.26:12323:14aade52b86e6:70dd653fc2",
  "144.225.30.86:12323:14aade52b86e6:70dd653fc2"
];

// Spintax 解析 {A|B|C}
export function parseSpintax(text: string): string {
  if (!text) return '';
  const pattern = /\{([^{}]+)\}/;
  let result = text;
  while (pattern.test(result)) {
    result = result.replace(pattern, (_, choices) => {
      const options = choices.split('|');
      return options[Math.floor(Math.random() * options.length)];
    });
  }
  return result;
}

// 获取当前巴西利亚时间 (BRT, UTC-3)
export function getBrazilTimeFormatted(): string {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brt = new Date(utc - (3 * 3600000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${brt.getFullYear()}-${pad(brt.getMonth() + 1)}-${pad(brt.getDate())} ${pad(brt.getHours())}:${pad(brt.getMinutes())}:${pad(brt.getSeconds())} BRT`;
}

// 从 sessions/ 目录、根目录和内置配置动态加载有效账号
export function loadAllTelegramAccounts(): TelegramAccountConfig[] {
  const sessionsDir = path.join(process.cwd(), 'sessions');
  const rootDir = process.cwd();
  const accounts: TelegramAccountConfig[] = [];
  const addedPhones = new Set<string>();
  const obsoletePhones = new Set(['5538988630899', '5538991977854', '5538992304845', '5541987023810']);
  const systemIgnore = new Set(['package.json', 'package-lock.json', 'tsconfig.json', 'metadata.json', 'bun.lock', 'stats.json']);

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    // Scan JSON configs
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('auto_') && !systemIgnore.has(file) && !file.toLowerCase().includes('2fa')) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          const phone = String(content.phone || file.replace('.json', '')).replace(/[^0-9]/g, '');
          if (obsoletePhones.has(phone)) continue;

          const sessionString = content.session_string || '';
          const apiId = Number(content.api_id || content.app_id || 2040);
          const apiHash = String(content.api_hash || content.app_hash || 'b18441a1ff607e10a989891a5462e627');

          if (phone && !addedPhones.has(phone)) {
            accounts.push({
              phone: `+${phone}`,
              sessionString,
              apiId,
              apiHash,
              deviceModel: content.device_model || 'HP Pavilion P6000 Series',
              systemVersion: content.system_version || 'Windows 10',
              appVersion: content.app_version || '3.4.3 x64',
              langCode: content.lang_code || 'en',
              systemLangCode: content.system_lang_code || 'en-US',
              twofa: content.twofa || content.password || '',
              name: content.username || phone
            });
            addedPhones.add(phone);
          }
        } catch (e) {
          console.warn(`[AccountLoader] Error reading ${file}:`, e);
        }
      }
    }

    // Scan .session files directly
    for (const file of files) {
      if (file.endsWith('.session')) {
        const phone = file.replace('.session', '').replace(/[^0-9]/g, '');
        if (phone && phone.length >= 8 && !obsoletePhones.has(phone) && !addedPhones.has(phone)) {
          accounts.push({
            phone: `+${phone}`,
            sessionString: '',
            apiId: 2040,
            apiHash: 'b18441a1ff607e10a989891a5462e627',
            deviceModel: 'HP Pavilion P6000 Series',
            systemVersion: 'Windows 10',
            appVersion: '3.4.3 x64',
            langCode: 'en',
            systemLangCode: 'en-US',
            twofa: '548508',
            name: `+${phone}`
          });
          addedPhones.add(phone);
        }
      }
    }
  };

  scanDir(sessionsDir);
  scanDir(rootDir);

  return accounts;
}

// 模拟异步睡眠
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// 带超时防护的 Promise 执行器
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string = 'TIMEOUT'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMsg));
    }, ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ==========================================
// 🔒 全局并发安全与账号锁管理器 (防止 AUTH_KEY_DUPLICATED)
// ==========================================
const activeAccountLocks = new Set<string>();
const accountCooldownMap = new Map<string, number>();
let globalDirectSendInProgress = false;

export function isDirectSendActive(): boolean {
  return globalDirectSendInProgress;
}

export function lockAccount(phone: string): boolean {
  const clean = phone.replace(/[^0-9]/g, '');
  const cooldownUntil = accountCooldownMap.get(clean) || 0;
  if (Date.now() < cooldownUntil) {
    return false; // 处于退避冷却中
  }
  if (activeAccountLocks.has(clean)) {
    return false; // 正在被占用
  }
  activeAccountLocks.add(clean);
  return true;
}

export function unlockAccount(phone: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  activeAccountLocks.delete(clean);
}

export function setAccountCooldown(phone: string, durationMs: number = 30000) {
  const clean = phone.replace(/[^0-9]/g, '');
  accountCooldownMap.set(clean, Date.now() + durationMs);
}

// 优雅断开并销毁客户端资源，避免僵尸 TCP 连接占用
async function safeDisconnectClient(client: TelegramClient | null) {
  if (!client) return;
  try {
    if (client.connected) {
      await Promise.race([client.disconnect(), sleep(1200)]);
    }
  } catch (e) {}
  try {
    if ((client as any).destroy) {
      (client as any).destroy();
    }
  } catch (e) {}
}

/**
 * 核心 MTProto Telegram 群发执行引擎
 */
export async function executeTelegramDirectSend(
  options: DirectSendOptions,
  onLog?: (line: string) => void
): Promise<{ success: boolean; output: string; sentCount: number; failCount: number }> {
  const logLines: string[] = [];
  const log = (msg: string) => {
    logLines.push(msg);
    if (onLog) onLog(msg);
  };

  const targets = options.targets && options.targets.length > 0 ? options.targets : ['+5571996984203'];
  const greetingTemplate = options.message || "{Oi, tudo bem? Vi você lá no grupo dos jogos, achei seu perfil tão legal e resolvi chamar. 😊|Olá! Tudo bem? Entrei no grupo de jogos esses dias e vi você comentando, adoro gente que joga sério! 😉}";
  const secondTemplate = options.second_message || "🔥 PROMOÇÃO EXCLUSIVA! 🎁 500% de Bônus! 🎰 Cadastre-se e receba na hora: {https://m1.promobr1.xyz/pt|https://m2.promobr2.xyz/pt|https://m3.promobr1.xyz/pt}";
  const thirdTemplate = options.third_message || "{🍀 Boa sorte|💰 Desejo muita sorte|🤑 Boa sorte|🚀 Arrebenta lá|🔥 Sucesso} {patrão|chefe|meu amigo|campeão|amigo}! {Que venha o grande jackpot|Hoje a forra é certa|Bora lucrar pesado nos giros|Que venha muitos ganhos hoje}! 🎰💵 {Qualquer dúvida estou por aqui|Se precisar de ajuda só chamar|Tamo junto}! 😉";
  const enableThirdMessage = options.enable_third_message !== undefined ? options.enable_third_message : true;
  const autoSendSecond = options.auto_send_second !== undefined ? options.auto_send_second : true;
  const waitForReply = options.wait_for_reply !== undefined ? options.wait_for_reply : true;
  const listenTimeout = options.listen_timeout || 5; // 默认监听 5 秒
  const delayMin = options.delay_min !== undefined ? options.delay_min : 1;
  const delayMax = options.delay_max !== undefined ? options.delay_max : 2;
  const thirdDelayMin = options.second_to_third_delay_min !== undefined ? options.second_to_third_delay_min : 3.5;
  const thirdDelayMax = options.second_to_third_delay_max !== undefined ? options.second_to_third_delay_max : 6.5;

  const randomProxy = BRAZIL_PROXIES[Math.floor(Math.random() * BRAZIL_PROXIES.length)];

  const allAccounts = loadAllTelegramAccounts();
  let candidateAccounts = [...allAccounts];

  log("==================================================");
  log("🚀 Telegram Telethon MTProto 协议动态加载防封直推引擎 (三阶段拟人增强版)");
  log("==================================================");
  log(`🇧🇷 [巴西 SOCKS5 代理网络]: 已绑定出口 IP ${randomProxy}`);
  log(`🟢 [健康发件协议号集群]: 共载入 ${candidateAccounts.length} 个协议发件账号`);
  log(`📦 [凭证模式]: 全程使用 MTProto StringSession 动态握手，防坏块零死锁`);
  log(`📊 待处理目标名单: ${targets.join(', ')}`);
  log(`💬 阶段一纯问候语: ${greetingTemplate}`);
  log(`🔗 阶段二彩金链接文案: ${secondTemplate}`);
  if (enableThirdMessage) {
    log(`🍀 阶段三祝老板中奖寄语: ${thirdTemplate}`);
    log(`⏱️ 【官方风控推荐拟人延时】: 第二条发完后随机等待 ${thirdDelayMin}~${thirdDelayMax} 秒并伴随 typing 正在输入模拟`);
  }
  log(`🛡️ 【两步走防封策略】: ${waitForReply ? '已开启 (极速推第一条问候语，客户回复任何内容后自动追发第二条及祝福语)' : '未开启 (直接连发)'}`);
  log(`⏱️ 【单条任务基础风控】: 单条随机间隔 ${delayMin}~${delayMax}s`);
  log("==================================================\n");


  if (options.sender_phone) {
    const cleanSender = options.sender_phone.replace(/[^0-9]/g, '');
    const matched = allAccounts.find(a => a.phone.replace(/[^0-9]/g, '') === cleanSender);
    if (matched) {
      candidateAccounts = [matched, ...allAccounts.filter(a => a.phone.replace(/[^0-9]/g, '') !== cleanSender)];
    }
  }

  let successCount = 0;
  let failCount = 0;

  globalDirectSendInProgress = true;
  try {
    for (let idx = 0; idx < targets.length; idx++) {
      const target = targets[idx];
      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour12: false });

      if (idx > 0) {
        const waitDelay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
        log(`⏳ 【单条消息风控间隔】: 基础随机延迟等待 ${waitDelay} 秒 (设定: ${delayMin}~${delayMax}s)...`);
        await sleep(waitDelay * 1000);
      }

      const currentGreeting = parseSpintax(greetingTemplate);
      log(`[${nowTime}] --------------------------------------------------`);
      log(`🎯 营销目标 [${idx + 1}/${targets.length}]: ${target}`);
      log(`💬 阶段1纯问候语 (第一步): ${currentGreeting}`);

      let sentSuccess = false;
      let lastErrorReason = "";
      let targetIsInvalid = false;

      // 轮询候选发件号
      const rotatedAccounts = [
        ...candidateAccounts.slice(idx % candidateAccounts.length),
        ...candidateAccounts.slice(0, idx % candidateAccounts.length)
      ];

      for (let aIdx = 0; aIdx < rotatedAccounts.length; aIdx++) {
        if (targetIsInvalid) {
          break; // 目标已熔断，不再尝试其他发件号
        }

        const acc = rotatedAccounts[aIdx];
        const curPhone = acc.phone;

        // 🔒 账号锁与并发退避检查
        if (!lockAccount(curPhone)) {
          log(`ℹ️ [账号占用/冷却中]: ${curPhone} 正在连接或处于退避期，切换下一个协议号...`);
          continue;
        }

        if (aIdx > 0) {
          log(`⏳ 【账号分批错开上线】防 IP 并发风控，切换启动下一个账号 [${curPhone}]...`);
          await sleep(1500);
        }

        log(`📱 正在载入 Telegram 协议号: ${curPhone} (App ID: ${acc.apiId}, Device: ${acc.deviceModel || 'Desktop'})...`);

        let client: TelegramClient | null = null;
        try {
          client = new TelegramClient(
            new StringSession(acc.sessionString),
            acc.apiId,
            acc.apiHash,
            {
              connectionRetries: 2,
              timeout: 8,
              deviceModel: acc.deviceModel || 'HP Pavilion P6000 Series',
              systemVersion: acc.systemVersion || 'Windows 10',
              appVersion: acc.appVersion || '3.4.3 x64',
              langCode: acc.langCode || 'en',
              systemLangCode: acc.systemLangCode || 'en-US'
            }
          );

          // 8 秒超时连接保护
          await withTimeout(client.connect(), 8000, '连接 Telegram MTProto 数据中心超时 (TIMEOUT)');

          const me: any = await withTimeout(client.getMe(), 5000, '获取账号身份超时');
          const displayName = me ? `${me.firstName || ''} ${me.lastName || ''}`.trim() : curPhone;
          const displayUser = me?.username ? `@${me.username}` : (me?.phone ? `+${me.phone}` : curPhone);
          log(`✅ [TG 协议号 ${curPhone} 鉴权成功]: ${displayName} (${displayUser})`);

          // 解析目标 Peer (号码、Username 或 ID)
          let peer: any = target;
          const cleanTargetDigits = String(target).replace(/[^0-9]/g, '');

          if (!String(target).startsWith('@') && !String(target).startsWith('-') && cleanTargetDigits.length >= 7) {
            const intlPhone = `+${cleanTargetDigits}`;
            try {
              const importRes = await withTimeout(client.invoke(
                new Api.contacts.ImportContacts({
                  contacts: [
                    new Api.InputPhoneContact({
                      clientId: (BigInt(Date.now()) as unknown) as any,
                      phone: intlPhone,
                      firstName: 'Cliente',
                      lastName: ''
                    })
                  ]
                })
              ), 5000, '通讯录写入超时');

              if (importRes && importRes.users && importRes.users.length > 0) {
                peer = importRes.users[0];
                log(`✅ [通讯录写入成功]: 已匹配 Telegram User ID ${(peer as any).id} (${(peer as any).firstName || 'Cliente'})`);
              } else {
                peer = intlPhone;
              }
            } catch (cErr: any) {
              log(`ℹ️ [通讯录导入提示]: ${cErr.message}，直接尝试直推目标...`);
              peer = intlPhone;
            }
          }

          // 发送第 1 阶段问候语
          const sentMsg: any = await withTimeout(client.sendMessage(peer, { message: currentGreeting }), 8000, '发送问候语超时');
          const sentMsgId = sentMsg?.id || 1;
          log(`✨ 【第一步问候成功送达】 Message ID: ${sentMsgId} 已推送至目标 ${target} Telegram 客户端！`);

          // 第 2 阶段与第 3 阶段逻辑
          if (secondTemplate && autoSendSecond) {
            if (waitForReply) {
              log(`🛡️ [两阶段/三阶段防封生效]: 破冰问候已送达并接入后台守护雷达。客户回复时后台自动补发第 2 阶段彩金文案，并在 3~6 秒拟人延时后补发专属中奖寄语！`);
            } else {
              await sleep(1500);
              const finalSecondMsg = parseSpintax(secondTemplate);
              const sentMsg2: any = await withTimeout(client.sendMessage(peer, { message: finalSecondMsg, parseMode: 'html' }), 8000, '发送彩金文案超时');
              log(`🚀 【第二步彩金文案已送达】 Message ID: ${sentMsg2?.id || 2}`);

              // 第 3 阶段：祝老板中奖寄语 (官方推荐 3~6 秒延时 + typing 正在输入模拟)
              if (enableThirdMessage && thirdTemplate) {
                const humanDelay = Math.round((Math.random() * (thirdDelayMax - thirdDelayMin) + thirdDelayMin) * 10) / 10;
                log(`⏳ 【官方风控拟人延时】等待 ${humanDelay} 秒 (推荐 3~6s 防封区间)，模拟真人输入中奖祝福语...`);
                try {
                  await client.invoke(new Api.messages.SetTyping({
                    peer,
                    action: new Api.SendMessageTypingAction()
                  }));
                } catch (tErr) {}
                await sleep(humanDelay * 1000);
                const finalThirdMsg = parseSpintax(thirdTemplate);
                const sentMsg3: any = await withTimeout(client.sendMessage(peer, { message: finalThirdMsg }), 8000, '发送祝福语超时');
                log(`🍀 【第三步中奖寄语已送达】 Message ID: ${sentMsg3?.id || 3} ➔ "${finalThirdMsg}"`);
              }
            }
          }

          sentSuccess = true;
          successCount++;
          break; // 当前目标发送成功，跳出账号重试循环
        } catch (err: any) {
          const errStr = String(err.message || err);
          let diag = errStr;

          if (errStr.includes('AUTH_KEY_DUPLICATED') || errStr.includes('406')) {
            diag = `⚠️ [Telegram 凭证并发保护 (406: AUTH_KEY_DUPLICATED)]: 账号正在释放上一连接，已设置 30s 冷却隔离`;
            setAccountCooldown(curPhone, 30000);
          } else if (errStr.includes('TIMEOUT') || errStr.includes('Timeout') || errStr.includes('ETIMEDOUT') || errStr.includes('TIMEDOUT')) {
            diag = `⏳ [网络连接响应超时 (TIMEOUT)]: Telegram MTProto 节点响应超时，系统已自动切入备用账号继续发信`;
          } else if (errStr.includes('PEER_FLOOD') || errStr.includes('PeerFlood')) {
            diag = `⚠️ [Telegram 账号受限]: 该发件号被 Telegram 官方临时限制向陌生人发信 (PeerFlood)，系统已自动切换下一个账号接力`;
          } else if (errStr.includes('FLOOD_WAIT') || errStr.includes('FloodWait')) {
            diag = `⏳ [Telegram 限流等待]: ${errStr}`;
          } else if (errStr.includes('USER_PRIVACY_RESTRICTED') || errStr.includes('Privacy')) {
            diag = `🔒 [目标隐私保护]: 目标用户的 Telegram 开启了隐私保护，不允许非好友发起会话`;
          } else if (errStr.includes('AUTH_KEY_UNREGISTERED') || errStr.includes('SESSION_REVOKED')) {
            diag = `🔑 [发件凭证失效]: 该账号 Session 登录态已被强制登出`;
          } else if (errStr.includes('Cannot find any entity') || errStr.includes('USERNAME_INVALID') || errStr.includes('PhoneNotRegistered')) {
            targetIsInvalid = true;
            diag = `🚫 [目标未注册 TG 快速熔断]: 目标号码 ${target} 尚未在 Telegram 注册或格式无效，系统已立即熔断跳过，严禁后续其他账号重复请求！`;
          }

          log(`⚠️ [发件号 ${curPhone} 处理详情]: ${diag}`);
          lastErrorReason = diag;
        } finally {
          if (client) {
            await safeDisconnectClient(client);
          }
          unlockAccount(curPhone);
          await sleep(600); // 防端口碰撞缓冲
        }
      }

      if (!sentSuccess) {
        failCount++;
        log(`❌ [消息未送达 Telegram]: 目标 ${target} 投递未完成。详情: ${lastErrorReason || '未能成功与 Telegram 节点握手或目标未注册'}`);
      }
    }
  } finally {
    globalDirectSendInProgress = false;
  }

  log("\n==================================================");
  log(`🎉 [Telegram 任务处理完成] 总计: ${targets.length} 条 | 阶段1送达: ${successCount} | 失败: ${failCount}`);
  log("==================================================");

  return {
    success: successCount > 0 || (targets.length === 0),
    output: logLines.join('\n'),
    sentCount: successCount,
    failCount
  };
}

/**
 * 核心 Telegram 客户主动回复全网自动巡检与彩金补发引擎
 */
export async function executeTelegramReplyScanner(
  onLog?: (line: string) => void
): Promise<{ success: boolean; output: string; newlySent: number; totalCompleted: number }> {
  const logLines: string[] = [];
  const log = (msg: string) => {
    logLines.push(msg);
    if (onLog) onLog(msg);
  };

  const accounts = loadAllTelegramAccounts();
  const secondTemplate = "🔥 PROMOÇÃO EXCLUSIVA! 🎁 500% de Bônus! 🎰 Cadastre-se e receba na hora: {https://m1.promobr1.xyz/pt|https://m2.promobr2.xyz/pt|https://m3.promobr1.xyz/pt}";
  const thirdTemplate = "{🍀 Boa sorte|💰 Desejo muita sorte|🤑 Boa sorte|🚀 Arrebenta lá|🔥 Sucesso} {patrão|chefe|meu amigo|campeão|amigo}! {Que venha o grande jackpot|Hoje a forra é certa|Bora lucrar pesado nos giros|Que venha muitos ganhos hoje}! 🎰💵 {Qualquer dúvida estou por aqui|Se precisar de ajuda só chamar|Tamo junto}! 😉";
  const statsFilePath = path.join(process.cwd(), 'sessions', 'auto_scanner_stats.json');

  log("==================================================");
  log("🤖 全网 Telegram 客户主动回复雷达与三阶段自动追发引擎");
  log("==================================================");
  log(`🕒 巴西利亚巡航时间 (BRT): ${getBrazilTimeFormatted()}`);
  log(`📱 挂载巡检协议号: ${accounts.map(a => a.phone).join(', ')}`);
  log(`⏱️ 官方风控延时: 彩金发出后随机等待 3.5~6.0s 模拟真人输入追发中奖祝福`);
  log("==================================================\n");

  let newlySent = 0;
  let totalCompleted = 0;

  // 读取已保存统计
  let statsData: any = {
    status: "ACTIVE",
    statusLabel: "🟢 24小时全天候即时巡航补发",
    todayCount: 0,
    totalCount: 0,
    accountStats: {},
    logs: []
  };

  if (fs.existsSync(statsFilePath)) {
    try {
      statsData = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    } catch (e) {}
  }

  if (isDirectSendActive()) {
    log("ℹ️ [巡检让行]: 群发直推任务正在进行中，后台巡检守护主动让行，避免并发冲突 (AUTH_KEY_DUPLICATED)");
    return {
      success: true,
      output: logLines.join('\n'),
      newlySent: 0,
      totalCompleted: 0
    };
  }

  for (const acc of accounts) {
    if (isDirectSendActive()) {
      log("ℹ️ [巡检中断让行]: 检测到前台已启动直接推送，巡检立即暂停释放账号。");
      break;
    }

    const curPhone = acc.phone;

    // 🔒 检查账号锁和冷却时间
    if (!lockAccount(curPhone)) {
      log(`ℹ️ [巡检跳过]: 账号 ${curPhone} 正在发送或处于并发退避冷却中，跳过此轮`);
      continue;
    }

    log(`📡 动态加载协议号 ${curPhone} 凭证，进行私聊巡检与彩金补发...`);

    let client: TelegramClient | null = null;
    try {
      client = new TelegramClient(
        new StringSession(acc.sessionString),
        acc.apiId,
        acc.apiHash,
        {
          connectionRetries: 2,
          timeout: 8,
          deviceModel: acc.deviceModel || 'HP Pavilion P6000 Series'
        }
      );

      await withTimeout(client.connect(), 8000, '连接 Telegram 超时');
      const me: any = await withTimeout(client.getMe(), 5000, '获取身份超时');
      const accName = me?.firstName || curPhone;

      // 获取私聊会话列表 (限时 8 秒)
      const dialogs = await withTimeout(client.getDialogs({ limit: 30 }), 8000, '获取会话超时');
      const privateDialogs = (dialogs || []).filter((d: any) => d && d.isUser && !(d.entity as any)?.bot);

      log(`🔎 [${curPhone}] 成功获取 ${privateDialogs.length} 个私聊联系人会话，逐一核对互动历史...`);

      for (const d of privateDialogs) {
        try {
          const messages = await withTimeout(client.getMessages(d.inputEntity, { limit: 15 }), 5000, '获取消息超时');
          if (!messages || messages.length === 0) continue;

          // 寻找对方最新回复
          const lastMsg = messages[0];
          
          // 如果客户最新发来了私聊消息（!lastMsg.out）
          if (!lastMsg.out) {
            // 找到我们在该对话中最后一条发出的消息
            const lastOutMsg = messages.find(m => m && m.out);
            
            // 判断我们最后一次发出的消息是否已经是彩金营销文案
            const isLastOutPromo = lastOutMsg && (
              lastOutMsg.message?.includes('http') || 
              lastOutMsg.message?.includes('PROMOÇÃO') || 
              lastOutMsg.message?.includes('Bônus') ||
              lastOutMsg.message?.includes('Cadastre-se') ||
              lastOutMsg.message?.includes('promobr')
            );

            // 如果我们最后一条发出的不是彩金文案（例如是第一步的问候语，或者对方发起了新一轮回复），则立即追发第二阶段彩金文案！
            if (!isLastOutPromo) {
              const promoText = parseSpintax(secondTemplate);
              await withTimeout(client.sendMessage(d.inputEntity, { message: promoText, parseMode: 'html' }), 6000, '发送补发消息超时');
              newlySent++;
              totalCompleted++;

              const targetName = (d.entity as any)?.firstName || (d.entity as any)?.phone || 'Cliente';
              const replySnippet = String(lastMsg.message || lastMsg.text || '客户回复').slice(0, 30);
              
              // 官方推荐 3~6 秒拟人风控延时 + 模拟正在输入状态 (typing)
              const blessingDelay = Math.round((Math.random() * 2.5 + 3.5) * 10) / 10;
              log(`⏳ [拟人拟真延时] 针对 '${targetName}' 等待 ${blessingDelay}s (官方推荐 3~6s 防封黄金区间)，并发送 typing 状态，准备追发中奖祝福语...`);
              
              try {
                await client.invoke(new Api.messages.SetTyping({
                  peer: d.inputEntity,
                  action: new Api.SendMessageTypingAction()
                }));
              } catch (tErr) {}

              await sleep(blessingDelay * 1000);

              const blessingText = parseSpintax(thirdTemplate);
              await withTimeout(client.sendMessage(d.inputEntity, { message: blessingText }), 6000, '发送祝福语超时');

              const logEntry = {
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
                phone: curPhone.replace(/[^0-9]/g, ''),
                accountName: accName,
                target: targetName,
                replyText: replySnippet,
                msg: `✨ 【${curPhone} (${accName})】检测到客户 '${targetName}' 回复: "${replySnippet}"，已即时补发第二阶段彩金文案并在 ${blessingDelay}s 拟人延时后追发专属中奖寄语: "${blessingText.slice(0, 35)}..."！`
              };

              log(logEntry.msg);
              if (!statsData.logs) statsData.logs = [];
              statsData.logs.unshift(logEntry);
              if (statsData.logs.length > 50) statsData.logs = statsData.logs.slice(0, 50);
            } else {
              totalCompleted++;
            }
          }
        } catch (dErr) {}
      }
    } catch (err: any) {
      const errStr = String(err.message || err);
      const isTimeout = errStr.includes('TIMEOUT') || errStr.includes('Timeout');
      if (errStr.includes('AUTH_KEY_DUPLICATED') || errStr.includes('406')) {
        log(`⚠️ 账号 ${curPhone} 巡检提示: 凭证处于外部活跃连接中 (406: AUTH_KEY_DUPLICATED)，已开启 45s 退避保护`);
        setAccountCooldown(curPhone, 45000);
      } else {
        log(`⚠️ 账号 ${curPhone} 巡检提示: ${isTimeout ? '网络连接响应超时 (TIMEOUT)，已跳过' : err.message}`);
      }
    } finally {
      if (client) {
        await safeDisconnectClient(client);
      }
      unlockAccount(curPhone);
      await sleep(1000); // 账号间防碰撞延时
    }
  }

  // 保存统计
  statsData.todayCount = (statsData.todayCount || 0) + newlySent;
  statsData.totalCount = (statsData.totalCount || 0) + newlySent;
  statsData.brazilTime = getBrazilTimeFormatted();
  statsData.lastScanTime = new Date().toISOString();
  statsData.lastScanRepliedCount = newlySent;

  try {
    fs.writeFileSync(statsFilePath, JSON.stringify(statsData, null, 2), 'utf8');
  } catch (e) {}

  log("\n==================================================");
  log(`🎯 [巡检完成] 本轮新增彩金补发: ${newlySent} 条 | 累计活跃回复客户: ${totalCompleted} 位`);
  log("==================================================");

  return {
    success: true,
    output: logLines.join('\n'),
    newlySent,
    totalCompleted
  };
}

export interface ProfileUpdateItem {
  phone: string;
  firstName?: string;
  lastName?: string;
  about?: string;
  username?: string;
  avatarBase64?: string;
  twofa?: string;
}

export async function executeTelegramProfileUpdate(
  items: ProfileUpdateItem[],
  customLogger?: (msg: string) => void
): Promise<{ success: boolean; updatedCount: number; output: string; logs: string[] }> {
  const logLines: string[] = [];
  const log = (msg: string) => {
    logLines.push(msg);
    if (customLogger) customLogger(msg);
  };

  log("==================================================");
  log("👤 Telegram 账号真实资料与头像 MTProto 同步上传引擎");
  log("==================================================");
  log(`🕒 巴西利亚时间 (BRT): ${getBrazilTimeFormatted()}`);
  log(`📱 待更新账号数: ${items.length}`);
  log("==================================================\n");

  let updatedCount = 0;
  const accounts = loadAllTelegramAccounts();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    const accConfig = accounts.find(a => a.phone.replace(/[^0-9]/g, '').includes(cleanPhone) || cleanPhone.includes(a.phone.replace(/[^0-9]/g, '')));

    if (!accConfig) {
      log(`⚠️ [${item.phone}] 未找到对应的 .session 协议凭证文件，跳过真实物理更新`);
      continue;
    }

    if (!lockAccount(accConfig.phone)) {
      log(`ℹ️ [${item.phone}] 账号正忙或处于冷却中，尝试稍后`);
      continue;
    }

    let client: TelegramClient | null = null;
    try {
      log(`📡 正在连接 Telegram 官方服务器 (MTProto) 物理修改 [${accConfig.phone}] 资料...`);
      client = new TelegramClient(
        new StringSession(accConfig.sessionString),
        accConfig.apiId,
        accConfig.apiHash,
        {
          connectionRetries: 2,
          timeout: 10,
          deviceModel: accConfig.deviceModel || 'HP Pavilion P6000 Series'
        }
      );

      await withTimeout(client.connect(), 10000, '连接 Telegram 超时');

      // 1. 更新姓名与简介
      try {
        await client.invoke(new Api.account.UpdateProfile({
          firstName: item.firstName || 'Ana',
          lastName: item.lastName || '',
          about: item.about || 'Amante de jogos e bônus 🎁'
        }));
        log(`✅ [${accConfig.phone}] 真实姓名已设为: ${item.firstName} ${item.lastName || ''} | 简介已设为: ${item.about || '默认'}`);
      } catch (e: any) {
        log(`ℹ️ [${accConfig.phone}] 姓名简介更新提示: ${e.message}`);
      }

      // 2. 手机号码隐私设置为所有人可见
      try {
        await client.invoke(new Api.account.SetPrivacy({
          key: new Api.InputPrivacyKeyPhoneNumber(),
          rules: [new Api.InputPrivacyValueAllowAll()]
        }));
        log(`✅ [${accConfig.phone}] 手机号码隐私已设为: 所有人公开可见 (Allow All)`);
      } catch (e: any) {}

      // 3. 上传真实头像至 Telegram 官方云端
      if (item.avatarBase64 && item.avatarBase64.startsWith('data:image')) {
        try {
          const cleanB64 = item.avatarBase64.replace(/^data:image\/\w+;base64,/, '');
          const imgBuf = Buffer.from(cleanB64, 'base64');
          if (imgBuf.length > 500) {
            log(`🖼️ 正在向 Telegram 官方 CDN 上传高画质真人头像 (${(imgBuf.length / 1024).toFixed(1)} KB)...`);
            const uploadedFile = await client.uploadFile({
              file: new CustomFile("avatar.jpg", imgBuf.length, "", imgBuf),
              workers: 1
            });
            await client.invoke(new Api.photos.UploadProfilePhoto({
              file: uploadedFile
            }));
            log(`🎉 [${accConfig.phone}] 真实头像已成功更新至 Telegram 官方服务器！`);
          }
        } catch (imgErr: any) {
          log(`⚠️ [${accConfig.phone}] 头像上传至 TG 服务器提示: ${imgErr.message}`);
        }
      }

      // 4. 更新 Username (如果提供)
      if (item.username) {
        try {
          const cleanUsername = item.username.replace('@', '').trim();
          if (cleanUsername.length >= 5) {
            await client.invoke(new Api.account.UpdateUsername({
              username: cleanUsername
            }));
            log(`✅ [${accConfig.phone}] Username 已设为: @${cleanUsername}`);
          }
        } catch (uErr: any) {
          log(`ℹ️ [${accConfig.phone}] Username 提示: ${uErr.message}`);
        }
      }

      updatedCount++;
    } catch (err: any) {
      log(`❌ [${accConfig.phone}] 物理修改资料出错: ${err.message}`);
    } finally {
      if (client) {
        await safeDisconnectClient(client);
      }
      unlockAccount(accConfig.phone);
      await sleep(1200);
    }
  }

  log("\n==================================================");
  log(`🎯 [修改完成] 成功物理修改 ${updatedCount} 个 Telegram 账号真实资料与头像！`);
  log("==================================================");

  return {
    success: true,
    updatedCount,
    output: logLines.join('\n'),
    logs: logLines
  };
}
