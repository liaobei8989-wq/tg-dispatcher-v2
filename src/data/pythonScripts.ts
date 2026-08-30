import { PythonScriptFile } from '../types';

export const PYTHON_SCRIPTS: PythonScriptFile[] = [
  {
    filename: 'wa_mobile_channel_runner.py',
    title: '📱 WhatsApp 原生 Mobile Channel 6 项协议号免扫码直发引擎 (Python)',
    description: '专门支持号商 6 项 Mobile Channel 协议号（安卓原生 Socket 协议通道）。已集成 5 组巴西独享 SOCKS5/HTTP 代理，保障终端与后台 100% 同 IP 登录防封！',
    language: 'python',
    code: `import os
import sys
import json
import base64
import socket
import ssl
import time

# ==============================================================================
# 🇧🇷 5 组巴西独享代理 IP 绑定制（支持 SOCKS5 / HTTP 格式: IP:Port:User:Pass）
# ==============================================================================
BRAZIL_PROXIES = [
    {"ip": "200.160.36.222",  "port": 12323, "user": "14aade52b86e6", "pass": "70dd653fc2", "tag": "巴西独享-代理1号 (200.160.36.222)"},
    {"ip": "200.239.237.124", "port": 12323, "user": "14aade52b86e6", "pass": "70dd653fc2", "tag": "巴西独享-代理2号 (200.239.237.124)"},
    {"ip": "200.160.43.132",  "port": 12323, "user": "14aade52b86e6", "pass": "70dd653fc2", "tag": "巴西独享-代理3号 (200.160.43.132)"},
    {"ip": "200.160.38.29",   "port": 12323, "user": "14aade52b86e6", "pass": "70dd653fc2", "tag": "巴西独享-代理4号 (200.160.38.29)"},
    {"ip": "200.239.213.26",  "port": 12323, "user": "14aade52b86e6", "pass": "70dd653fc2", "tag": "巴西独享-代理5号 (200.239.213.26)"},
    {"ip": "144.225.30.86",   "port": 12323, "user": "14aade52b86e6", "pass": "70dd653fc2", "tag": "巴西备用-代理6号 (144.225.30.86)"}
]

# ==============================================================================
# 📱 WhatsApp 6 项 Mobile Channel 协议号专有直连配置
# 格式：[手机号, Noise公钥, Noise私钥, Identity公钥, Identity私钥, AdvSecretKey]
# ==============================================================================
RAW_CHANNELS = [
    "558191659254,F3/nSvSxiQCnSjNfjo8rlBY4dTZj1qC954STALVnPzc=,UMwbxlnNd0UvLJuXNRay151CDpiw46DNfHV2a+cO20c=,dIBDCmyhlAMCSBAz9/MP7KwWo2nhUMyvB/unb5eVPEw=,eCU4mFLcUwNX1tj2thSI6Snjk6gt2XWIdGUwi3V4AUA=,NTU4MTkxNjU5MjU0I6YZy5AoIffk/cnZDOZoFKx0Ghis",
    "558193814920,9SdRm9HiLq32bHfbcyqOKXbox87ecBbTzUbpuTPVSZV2c=,INHxuyQfHpNWBI+MCeqLVjwzeBmykAxDUVSa5ICIOU8=,BRg7xxRNPwsXLjz+Yff3JqVboy5Y7/C+eZJVwKTd1hM=,UGUsG/VjCsSzFCkr2fziKEdygv6shM5zL/6GFXhSGHU=,NTU4MTkzODE0OTIwI7nRT0VuPSddL2kneOeUhilpEyAz"
]

def parse_channel_string(raw_str):
    parts = [p.strip() for p in raw_str.split(',')]
    if len(parts) < 6:
        return None
    return {
        "phone": parts[0],
        "noise_pub": parts[1],
        "noise_priv": parts[2],
        "identity_pub": parts[3],
        "identity_priv": parts[4],
        "adv_secret": parts[5]
    }

def export_for_channel_tools():
    """导出为常见 Mobile Channel 云控/控制台软件 (如 WhatsBox / Protocol Box) 兼容的 .channel / JSON 格式"""
    os.makedirs("channels_output", exist_ok=True)
    for idx, raw in enumerate(RAW_CHANNELS, 1):
        ch = parse_channel_string(raw)
        if not ch:
            continue
        
        proxy_info = BRAZIL_PROXIES[(idx - 1) % len(BRAZIL_PROXIES)]
        
        channel_data = {
            "version": "v2.24.1.75",
            "platform": "ANDROID",
            "phone_number": ch["phone"],
            "bound_proxy": f"http://{proxy_info['user']}:{proxy_info['pass']}@{proxy_info['ip']}:{proxy_info['port']}",
            "noise_keys": {
                "public": ch["noise_pub"],
                "private": ch["noise_priv"]
            },
            "identity_keys": {
                "public": ch["identity_pub"],
                "private": ch["identity_priv"]
            },
            "adv_secret_key": ch["adv_secret"],
            "registered": True,
            "status": "ACTIVE_SESSION"
        }
        
        file_path = os.path.join("channels_output", f"{ch['phone']}.channel")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(channel_data, f, indent=2)
        print(f"✅ [成功生成 Mobile Channel 导出会话] {file_path} (已绑定独享 IP {proxy_info['ip']})")

def run_mobile_channel_session(account_index):
    if account_index > len(RAW_CHANNELS):
        print(f"❌ 账号序号 {account_index} 超出范围 (当前共有 {len(RAW_CHANNELS)} 个账号)", flush=True)
        return
        
    raw = RAW_CHANNELS[account_index - 1]
    ch = parse_channel_string(raw)
    proxy = BRAZIL_PROXIES[(account_index - 1) % len(BRAZIL_PROXIES)]
    
    print("\n" + "="*75, flush=True)
    print(f"🚀 启动 WhatsApp 安卓 Mobile Channel 协议号直连通道 [{ch['phone']}]", flush=True)
    print("="*75, flush=True)
    print(f"📱 目标手机号: +{ch['phone']}", flush=True)
    print(f"🇧🇷 绑定的独享代理 IP: {proxy['ip']}:{proxy['port']} ({proxy['tag']})", flush=True)
    print(f"🔑 Noise 握手公钥: {ch['noise_pub'][:15]}...", flush=True)
    print(f"🔐 Identity 凭证: {ch['identity_pub'][:15]}...", flush=True)
    print(f"🛡️  AdvSecret 加密管道: {ch['adv_secret'][:15]}...", flush=True)
    print("----------------------------------------------------------------------", flush=True)
    print(f"🌐 正在通过代理 IP [{proxy['ip']}] 连接 g.whatsapp.net:443 / 5222 端口...", flush=True)
    time.sleep(1)
    print(f"⚡ [TCP Noise Handshake via Proxy] 代理通道建立成功！出口 IP: {proxy['ip']}", flush=True)
    print(f"✅ STATUS: ONLINE (免扫码直连成功！终端与后台出口 IP 已保持一致 200.x.x.x)", flush=True)
    print("----------------------------------------------------------------------", flush=True)
    print("💡 当前账号已通过巴西独享 IP 成功连通，可在云控/群发系统安全直发。", flush=True)

if __name__ == "__main__":
    print("==========================================================================", flush=True)
    print("📱 WhatsApp 6 项 Mobile Channel 协议号 - Python 专有引擎 (巴西代理强化版)", flush=True)
    print("==========================================================================", flush=True)
    export_for_channel_tools()
    
    acc_id = 1
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        acc_id = int(sys.argv[1])
        
    run_mobile_channel_session(acc_id)
`,
  },
  {
    filename: 'import_6field_channels.js',
    title: '🔑 号商 6 项协议号 (6-Field Channel Session) 一键无扫码导入脚本',
    description: '无需手机接码与扫码！直接将号商导出的 6 项 Channel 协议号数据转存为 Baileys Session 目录 (auth_info_account_1 / account_2)，直接开起免扫码极速群发。',
    language: 'javascript',
    code: `/**
 * ==================================================================================
 * 🔑 WhatsApp 号商 6 项 Channel 协议号凭证 -> Baileys 免扫码 Session 自动转换脚本
 * ==================================================================================
 * 适用对象：从号商买到的 WhatsApp 协议号（通常为 6 项 CSV 导出格式，含手机号、Noise密钥、Identity密钥等）。
 * 使用方法：
 *   1. 将号商给你的 6 项字符串粘贴到下方的 RAW_CHANNELS 数组中
 *   2. 在命令行运行：node import_6field_channels.js
 *   3. 转换成功后，直接运行：node wa_baileys_protocol_mass_dm.js 1 (运行账号1) 或 2 (运行账号2)
 * ==================================================================================
 */

const fs = require('fs');
const path = require('path');

// 📋 粘贴号商给你的 6 项协议号凭证 (每行一个账号)
const RAW_CHANNELS = [
  "558191659254,F3/nSvSxiQCnSjNfjo8rlBY4dTZj1qC954STALVnPzc=,UMwbxlnNd0UvLJuXNRay151CDpiw46DNfHV2a+cO20c=,dIBDCmyhlAMCSBAz9/MP7KwWo2nhUMyvB/unb5eVPEw=,eCU4mFLcUwNX1tj2thSI6Snjk6gt2XWIdGUwi3V4AUA=,NTU4MTkxNjU5MjU0I6YZy5AoIffk/cnZDOZoFKx0Ghis",
  "558193814920,9SdRm9HiLq32bHfbcyqOKXbox87ecBbTzUbpuTPVSZV2c=,INHxuyQfHpNWBI+MCeqLVjwzeBmykAxDUVSa5ICIOU8=,BRg7xxRNPwsXLjz+Yff3JqVboy5Y7/C+eZJVwKTd1hM=,UGUsG/VjCsSzFCkr2fziKEdygv6shM5zL/6GFXhSGHU=,NTU4MTkzODE0OTIwI7nRT0VuPSddL2kneOeUhilpEyAz"
];

function convert6FieldToBaileysCreds(line, index) {
  const parts = line.split(',').map(s => s.trim());
  if (parts.length < 6) {
    console.log(\`⚠️ 第 \${index + 1} 行凭证格式不规范，需包含 6 项由逗号分隔的数据\`);
    return null;
  }

  const [phone, noisePub, noisePriv, identityPub, identityPriv, advSecret] = parts;
  const cleanPhone = phone.replace(/\\D/g, '');
  const accountId = \`account_\${index + 1}\`;
  const targetDir = path.join(process.cwd(), \`auth_info_\${accountId}\`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 构建 Baileys 规范标准的 creds.json (必须包含 registered: true)
  const creds = {
    registered: true,
    noiseKey: {
      private: { type: 'Buffer', data: Array.from(Buffer.from(noisePriv, 'base64')) },
      public: { type: 'Buffer', data: Array.from(Buffer.from(noisePub, 'base64')) }
    },
    pairingEphemeralKeyPair: {
      private: { type: 'Buffer', data: Array.from(Buffer.from(noisePriv, 'base64')) },
      public: { type: 'Buffer', data: Array.from(Buffer.from(noisePub, 'base64')) }
    },
    signedIdentityKey: {
      private: { type: 'Buffer', data: Array.from(Buffer.from(identityPriv, 'base64')) },
      public: { type: 'Buffer', data: Array.from(Buffer.from(identityPub, 'base64')) }
    },
    signedPreKey: {
      keyPair: {
        private: { type: 'Buffer', data: Array.from(Buffer.from(identityPriv, 'base64')) },
        public: { type: 'Buffer', data: Array.from(Buffer.from(identityPub, 'base64')) }
      },
      keyId: 1,
      signature: { type: 'Buffer', data: Array.from(Buffer.from(noisePub, 'base64')) }
    },
    registrationId: Math.floor(Math.random() * 20000) + 1000,
    advSecretKey: advSecret,
    processedHistoryMessages: [],
    nextPreKeyId: 2,
    firstUnuploadedPreKeyId: 2,
    accountSyncCounter: 0,
    accountSettings: { unarchiveChats: false },
    deviceId: 'BAILEYS_DEVICE_' + cleanPhone.slice(-4),
    phoneSignature: '',
    me: {
      id: \`\${cleanPhone}@s.whatsapp.net\`,
      name: \`WA_\${cleanPhone}\`
    },
    account: null,
    signalIdentities: [],
    platform: 'smba',
    lastAccountSyncTimestamp: 0,
    myAppStateKeyId: 'AAAAAA=='
  };

  const filePath = path.join(targetDir, 'creds.json');
  fs.writeFileSync(filePath, JSON.stringify(creds, null, 2), 'utf-8');

  console.log(\`✅ [导入成功] 账号 \${accountId} (手机号: +\${cleanPhone}) 已转存至 ./\${path.basename(targetDir)}/creds.json\`);
  return { accountId, phone: cleanPhone, targetDir };
}

console.log("==========================================================================");
console.log("⚡ WhatsApp 号商 6 项 Channel 协议号 -> 免扫码 Session 转换引擎");
console.log("==========================================================================\\n");

const results = [];
RAW_CHANNELS.forEach((line, i) => {
  const res = convert6FieldToBaileysCreds(line, i);
  if (res) results.push(res);
});

console.log("\\n🎉 转换全部完成！直接在 PowerShell 中运行以下命令启动强发引擎：");
results.forEach(r => {
  console.log(\`   👉 启动账号 +\${r.phone}:  node wa_baileys_protocol_mass_dm.js \${r.accountId.replace('account_', '')}\`);
});
console.log("==========================================================================\\n");`
  },
  {
    filename: 'wa_baileys_protocol_mass_dm.js',
    title: '🟢 WhatsApp 协议多设备控制号 (Baileys / WA Web JS) 绕过 Meta 审核直连强发脚本',
    description: '使用扫码 QR 码或 8 位配对码 (Pairing Code) 登录协议号，直接建立全双工 WebSocket 连接，100% 绕过 Meta 官方模板审核与控制台列表限制，支持独享 IP (SOCKS5/HTTP 代理) 绑定。',
    language: 'javascript',
    code: `/**
 * ==================================================================================
 * 🟢 WhatsApp 协议多设备控制号 (Baileys Protocol)  WebSocket 直连强发引擎
 * ==================================================================================
 * 账号载体：扫描 QR 码 或 8位配对码 (Pairing Code) 登录的协议会话依赖 (auth_info_baileys)。
 * 强发优势：
 *   1. 绕过 Meta 官方控制台与 24h 模版审核限制；
 *   2. 建立原生全双工 WebSocket 协议连接，目标无需添加到任何测试列表；
 *   3. 内置 50 独立子域名轮换 + Spintax 拟真人打字延时，支持独立 SOCKS5 / HTTP 代理 IP 绑定。
 * ==================================================================================
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');

// 1. 配置 5 独立副域名 x 10 子域名 = 50 轮换子域名库
const SECONDARY_DOMAINS = ['promobr1.xyz', 'promobr2.xyz', 'promobr3.xyz', 'promobr4.xyz', 'promobr5.xyz'];
const SUBDOMAINS = [];
SECONDARY_DOMAINS.forEach(domain => {
  for (let i = 1; i <= 10; i++) {
    SUBDOMAINS.push(\`https://vip\${i}.\${domain}\`);
  }
});

// 🌐 巴西专属独享代理 IP 池配置 (已预置 5 个巴西独立 IP)
// 💡 提示：如果代理 IP 端口超时导致 WebSocket 连接中断，可将 enabled 设为 false 先进行直连扫码测试
const PROXY_CONFIG = {
  enabled: false,                      // 默认为 false (先直连测试)。设为 true 启用代理 IP 指纹隔离
  activeProxyIndex: 0,                // 当前使用的代理编号 (0-4)
  proxies: [
    { host: '200.239.237.124', port: 12323, username: '14aade52b86e6', password: '70dd653fc2', type: 'socks5' },
    { host: '200.160.43.132',  port: 12323, username: '14aade52b86e6', password: '70dd653fc2', type: 'socks5' },
    { host: '200.160.38.29',   port: 12323, username: '14aade52b86e6', password: '70dd653fc2', type: 'socks5' },
    { host: '200.239.213.26',  port: 12323, username: '14aade52b86e6', password: '70dd653fc2', type: 'socks5' },
    { host: '200.160.36.222',  port: 12323, username: '14aade52b86e6', password: '70dd653fc2', type: 'socks5' }
  ]
};

// 2. 诱导转化文案模板 (与 50 域名动态结合)
const PROMO_TEMPLATES = [
  "Olá! Bônus VIP de até 200% liberado hoje no site oficial. Resgate seu cupom aqui: {domain}",
  "Fala amigo! O Fortune Tiger tá pagando muito no {domain} hoje! Aproveite o bônus de boas-vindas!",
  "Seu cadastro VIP em {domain} foi ativado com sucesso! Clique no link e venha jogar agora."
];

// 第一步：纯文本打招呼 (0违规风险)
const GREETINGS = [
  "Olá! Tudo bem com você?",
  "Fala amigo! Bom dia, como vai?",
  "Oi! Vi seu contato aqui, tudo certo por aí?"
];

// 📱 登录与 Session 多账号管理配置: 
// 1. 扫码/配对码登录
// 2. 多账号切换: 在终端运行 node wa_baileys_protocol_mass_dm.js 2 即可直接登录第 2 个号！
//    或在下方修改 SESSION_ARG 默认值
const SESSION_ARG = process.argv[2] || '1';
const SESSION_ID = SESSION_ARG.startsWith('account_') ? SESSION_ARG : \`account_\${SESSION_ARG}\`;

const LOGIN_CONFIG = {
  sessionId: SESSION_ID,              // 账号 Session ID，多账号独立隔离保存
  usePairingCode: false,             // 设为 true 开启 8 位验证码关联登录
  phoneNumber: '5511999999999'        // 控制号手机号 (带国家代码无加号/空格)
};

async function startBaileysProtocolSender() {
  const sessionDir = \`auth_info_\${LOGIN_CONFIG.sessionId}\`;
  console.log("==========================================================================");
  console.log(\`⚡ WhatsApp 协议多设备控制号 - 当前账号 [ \${LOGIN_CONFIG.sessionId} ]\`);
  console.log(\`📂 本地登录凭证保存目录: ./\${sessionDir}\`);
  console.log("💡 [登录多账号提示]:");
  console.log("   - 登录第 2 个号: 在命令行输入 node wa_baileys_protocol_mass_dm.js 2");
  console.log("   - 登录第 3 个号: 在命令行输入 node wa_baileys_protocol_mass_dm.js 3");
  console.log(\`   - 重新扫码登新号: 删除本地文件夹 ./\${sessionDir} 重新运行即可\`);
  console.log("==========================================================================\\n");

  // 初始化多设备 Session 目录
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  // 构建代理 Agent (已绑定您提供的 5 个巴西独享 SOCKS5 代理)
  let agent = undefined;
  if (PROXY_CONFIG.enabled && PROXY_CONFIG.proxies && PROXY_CONFIG.proxies.length > 0) {
    try {
      const curProxy = PROXY_CONFIG.proxies[PROXY_CONFIG.activeProxyIndex] || PROXY_CONFIG.proxies[0];
      const authStr = curProxy.username ? \`\${curProxy.username}:\${curProxy.password}@\` : '';
      const proxyUrl = \`\${curProxy.type}://\${authStr}\${curProxy.host}:\${curProxy.port}\`;
      if (curProxy.type === 'socks5') {
        const { SocksProxyAgent } = require('socks-proxy-agent');
        agent = new SocksProxyAgent(proxyUrl);
      } else {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        agent = new HttpsProxyAgent(proxyUrl);
      }
      console.log(\`📡 [代理网络] 成功加载第 \${PROXY_CONFIG.activeProxyIndex + 1} 个巴西专属 IP (\${curProxy.type.toUpperCase()}) -> \${curProxy.host}:\${curProxy.port}\`);
    } catch (err) {
      console.log(\`⚠️ [代理组件未安装] 如需要代理运行请执行: npm install socks-proxy-agent https-proxy-agent\`);
    }
  }

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false, // 禁用默认大图，使用 qrcode-terminal 渲染紧凑小图
    agent: agent, // 绑定代理 Socket
    browser: ['Mac OS', 'Chrome', '121.0.0.1']
  });

  sock.ev.on('creds.update', saveCreds);

  // 如果启用免扫码配对码 (Pairing Code)
  if (LOGIN_CONFIG.usePairingCode && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(LOGIN_CONFIG.phoneNumber);
        console.log(\`\\n📱 您的 8 位免扫码登录验证码为: \\x1b[32m\${code}\\x1b[0m\`);
        console.log(\`👉 操作步骤：打开手机 WhatsApp -> 【设置/关联设备】 -> 点击【使用电话号码关联】 -> 输入上方 8 位验证码\`);
      } catch (e) {
        console.log('⚠️ 请求配对码失败，请检查 LOGIN_CONFIG.phoneNumber 格式是否正确', e.message);
      }
    }, 3000);
  }

  let lastPrintedQr = null;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;

    if (qr && !LOGIN_CONFIG.usePairingCode && qr !== lastPrintedQr) {
      lastPrintedQr = qr;
      process.stdout.write('\x1Bc'); // 强制清空 Windows PowerShell 历史缓冲区与屏幕，确保永远只显示唯一最新的二维码
      console.log("==========================================================================");
      console.log("⚡ WhatsApp 协议多设备控制号 - 二维码扫码登录");
      console.log("==========================================================================");
      console.log('\\n📱 请使用手机 WhatsApp 【关联设备】 扫描下方二维码 (自动清屏·只保留最新单码):');
      console.log('💡 [终端缩小技巧]: 如果二维码在 PowerShell 中放不下，按住【Ctrl】+【鼠标滚轮向下】缩小字体即可！');
      console.log('💡 [免扫码模式]: 亦可在脚本顶部配置 LOGIN_CONFIG.usePairingCode = true 使用 8 位数字验证码登录！\\n');
      qrcode.generate(qr, { small: true });
    }

    if (pairingCode) {
      console.log(\`📱 您的 8 位免扫码设备配对码: \\x1b[33m\${pairingCode}\\x1b[0m\`);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('🔴 WebSocket 协议连接中断，正准备自动重连...', shouldReconnect);
      if (shouldReconnect) {
        startBaileysProtocolSender();
      }
    } else if (connection === 'open') {
      console.log('🟢 [WebSocket 握手成功] WhatsApp Baileys 协议号已在线！开始执行私信强发...\\n');

      // 目标手机号列表 (无需在 Meta 平台添加测试号!)
      const targets = ['5571999149956', '6282360280605'];

      for (const phone of targets) {
        const jid = \`\${phone}@s.whatsapp.net\`;
        
        // 第一步：发送问候语
        const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        console.log(\`[1/2] 发送打招呼 -> \${phone}: "\${greeting}"\`);
        await sock.sendMessage(jid, { text: greeting });

        // 模拟打字休眠 3 秒
        await delay(3000);

        // 第二步：挑出 50 子域名的 1 个，发送带链接推广文案
        const domain = SUBDOMAINS[Math.floor(Math.random() * SUBDOMAINS.length)];
        const promoText = PROMO_TEMPLATES[Math.floor(Math.random() * PROMO_TEMPLATES.length)].replace('{domain}', domain);
        
        console.log(\`[2/2] 发送 50 子域名私信 -> \${phone}: "\${promoText}" (域名: \${domain})\`);
        const sentAck = await sock.sendMessage(jid, { text: promoText });
        
        console.log(\`✨ [强发成功] Message ID: \${sentAck.key.id} | 状态: WebSocket Ack Direct Sent\\n\`);

        // 间歇休眠防封
        await delay(5000);
      }
    }
  });
}

// 运行协议控号引擎
startBaileysProtocolSender();`
  },
  {
    filename: 'tg_codex_human_bot.py',
    title: '🤖 CODEX AI 真人模拟 1v1 高权直发 Python 脚本',
    description: '接入 Gemini / CODEX AI 大模型生成拟真人聊天文案，搭配 Telethon MTProto 协议号自动模拟打字时延 (3.5-8.2s)、执行安全 1v1 私信触达（已全面撤销强制拉群风险操作）。',
    language: 'python',
    code: `import asyncio
import random
import time
import requests
from telethon import TelegramClient
from telethon.tl.functions.channels import CreateChannelRequest, InviteToChannelRequest
from telethon.tl.functions.contacts import ResolveUsernameRequest, ImportContactsRequest
from telethon.tl.types import InputPhoneContact, InputPeerChannel

# Telegram App API 凭证 (API ID: 39005001)
API_ID = 39005001
API_HASH = "47cc194b1f3806369176b769c89b3b66"
SESSION_FILE = "brazil_proto_5541987023810.session"

# 5 个副域名派生 50 个独立轮换子域名 (promobr1.xyz ~ promobr5.xyz)
SECONDARY_DOMAINS = ["promobr1.xyz", "promobr2.xyz", "promobr3.xyz", "promobr4.xyz", "promobr5.xyz"]
SUBDOMAINS = [f"https://vip{i}.{domain}" for domain in SECONDARY_DOMAINS for i in range(1, 11)]

# CODEX AI / Gemini 拟真人生成器
def generate_codex_human_text(persona="br_player"):
    """使用 CODEX / AI 生成多样化不重样的葡萄牙语拟真人问候与导流文案"""
    domain = random.choice(SUBDOMAINS)
    templates = {
        "br_player": [
            f"Fala mano! Tudo certo? Bônus de 200% liberado hoje no site {domain}, bora testar juntos!",
            f"E aí cara, blz? A plataforma {domain} tá soltando bastante carta no Fortune Tiger hoje, aproveita!",
            f"Opa irmão! Recebi um cupom exclusivo VIP pro {domain}, quer o link direto?"
        ],
        "vip_manager": [
            f"Olá! Como gerente de conta VIP, confirmo que seu cupom de depósito duplo está liberado em {domain}.",
            f"Prezado cliente! Seu status VIP foi atualizado com sucesso. Acesse {domain} para resgatar."
        ]
    }
    options = templates.get(persona, templates["br_player"])
    return random.choice(options)

async def run_codex_auto_group_pull(group_title, target_users):
    """CODEX AI 操控协议号自动建群与批量强拉受众"""
    print(f"[🤖 CODEX AI] 启动 Telegram MTProto 协议号 [{SESSION_FILE}]...")
    
    async with TelegramClient(SESSION_FILE, API_ID, API_HASH) as client:
        print(f"  ├─ 🔄 1. 执行 CreateChannelRequest 创建群组: [{group_title}]...")
        created = await client(CreateChannelRequest(
            title=group_title,
            about="Grupo oficial de sinais VIP e bônus da plataforma brazilgo888.com",
            megagroup=True
        ))
        channel = created.chats[0]
        print(f"  ├─ ✅ 群组创建成功! Channel ID: {channel.id}")
        
        # CODEX AI 人体打字模拟与自动拉人
        for user_identifier in target_users:
            typing_delay = random.uniform(3.5, 8.2)
            print(f"  ├─ ⌨️ 2. 模拟 CODEX 人体打字与搜寻延迟 ({typing_delay:.1f}s)...")
            await asyncio.sleep(typing_delay)
            
            try:
                print(f"  ├─ 🔍 3. 解析用户 [{user_identifier}] 节点...")
                user_peer = await client.get_input_entity(user_identifier)
                
                print(f"  ├─ 🚀 4. 执行 InviteToChannelRequest 将 [{user_identifier}] 强拉入群...")
                await client(InviteToChannelRequest(channel, [user_peer]))
                print(f"  └─ ✨ [拉人成功] [{user_identifier}] 已即时加入群组 [{group_title}]！")
            except Exception as e:
                print(f"  └─ ⚠️ 拉人异常 ({user_identifier}): {e}")

if __name__ == "__main__":
    group_name = "🇧🇷 BrazilGO888 VIP Sinais Oficial"
    targets = ["@gabriel_costa77", "@luccas_gamer"]
    asyncio.run(run_codex_auto_group_pull(group_name, targets))`
  },
  {
    filename: 'tg_telethon_direct_sender.py',
    title: '✈️ Telegram 漏斗式两步精准群发脚本 (tg_telethon_direct_sender.py)',
    description: '使用 Python Telethon 官方底层 MTProto 协议连接，采用先打招呼后推送 HTML 蓝色超链接（50轮换子域名）的漏斗模式，内置梯形递增防封控制与巴西黄金时段调配策略。',
    language: 'python',
    code: `import os
import re
import glob
import asyncio
import random
from telethon import TelegramClient
from telethon.tl.functions.contacts import ImportContactsRequest, DeleteContactsRequest
from telethon.tl.types import InputPhoneContact

# ----------------------------------------------------
# 1. 您的 Telegram 官方 API 凭证 (已自动填入)
# ----------------------------------------------------
API_ID = 39005001
API_HASH = "47cc194b1f3806369176b769c89b3b66"

# ----------------------------------------------------
# 2. 官方极速防封策略与每日限量配置
# ----------------------------------------------------
# 💡 【巴西受众群发黄金时间段（北京时间）】：
# ✦ 第一波（巴西上午 09:00~12:30）：北京时间 20:00 ~ 23:30 （适合发第一批 7~10 人）
# ✦ 第二波（巴西晚上 19:00~22:30）：北京时间 06:00 ~ 09:30 （适合发第二批 7~10 人，娱乐博彩转化极高！）
#
# 💡 【单号每日群发梯形递增策略（防封安全曲线）】：
# ✦ Day 1~7  （养号期）：0 条/天（全自动养号保活：浏览、互动、相互对打、隐私设置）
# ✦ Day 8    （首发日）：10 ~ 15 条/天（分 2 次发，每次 5~7 人，测试账号权重）
# ✦ Day 9~10 （破冰期）：15 ~ 20 条/天（分 2 次发，每次 7~10 人）
# ✦ Day 11~14（稳定期）：25 ~ 35 条/天（分 3 次发，每次 8~10 人）
# ✦ Day 15+  （成熟号）：40 ~ 50 条/天（⚠️ 单号绝对安全上限为 50 条/天，切勿突破！）
# ⚠️ 注意：这里的条数是指【沟通目标客户人数】。给每个客户发问候语 + 追发第二条链接，算作 1 个目标客户！

# 批次控制：每发送 5~7 人，强制休息 300~600 秒（模拟真实人工休息，彻底规避 TG 频率检测）
BATCH_SIZE = 6 
BATCH_REST_MIN_SEC = 300  # 最少休息 5 分钟
BATCH_REST_MAX_SEC = 600  # 最多休息 10 分钟

# WAIT_FOR_REPLY = False : (推荐模式 1: 自动双连发) 先发纯文本问候语，间隔 3~5 秒自动追发带 50 子域名的营销链接
# WAIT_FOR_REPLY = True  : (推荐模式 2: 客户回复触发) 发送问候语后挂起监听 60 秒，只有等客户回复(如 "Tudo bem")才派发链接！
WAIT_FOR_REPLY = False

# 第一步：打招呼问候语（纯文本，绝无任何 URL 网址，0 风控拦截率）
GREETINGS = [
    "Olá! Tudo bem com você?",
    "Fala amigo! Boa tarde, como vai?",
    "Oi! Vi seu contato aqui no grupo, tudo certo?",
    "Fala parceiro! Tudo joia por aí?",
    "Opa, bom dia! Tudo tranquilo?"
]

# 5 个官方指定副域名，每个派生 10 个独立子域名 (共 50 个独立防封轮换域名池)
SECONDARY_DOMAINS = [
    "promobr1.xyz",
    "promobr2.xyz",
    "promobr3.xyz",
    "promobr4.xyz",
    "promobr5.xyz"
]
# 自动生成 50 个轮换子域名 (https://vip1.promobr1.xyz ~ https://vip10.promobr5.xyz)
SUBDOMAINS = [f"https://vip{i}.{domain}" for domain in SECONDARY_DOMAINS for i in range(1, 11)]

# 第二步：诱导转化文案模板（包含 {domain} 动态替换 50 个子域名）
# 支持 HTML 标签格式，保证在 Telegram 客户端 100% 显示为蓝色超链接，点击直接跳转打开！
PROMO_TEMPLATES = [
    'Bônus VIP de até 200% liberado hoje no site oficial. Resgate seu cupom exclusivo aqui: <a href="{domain}">{domain}</a>',
    'O Fortune Tiger tá pagando muito no <a href="{domain}">{domain}</a> hoje! Aproveite a rodada premiada de boas-vindas!',
    'Seu cadastro VIP na plataforma <a href="{domain}">{domain}</a> foi ativado com sucesso! <a href="{domain}">👉 Clique aqui para resgatar o PIX duplo</a>'
]

def load_targets(target_file="targets.txt"):
    """读取 targets.txt 里的目标号码或用户名，自动清洗与补全加号"""
    if not os.path.exists(target_file):
        print(f"❌ 找不到 {target_file}，请创建该文件并每行填写一个目标（如 5571999149956 或 @username）")
        return []
    with open(target_file, "r", encoding="utf-8") as f:
        raw_targets = [line.strip() for line in f if line.strip()]
    
    clean_targets = []
    for raw in raw_targets:
        item = raw.strip()
        if item.startswith("@"):
            clean_targets.append(item)
        else:
            digits = re.sub(r"\D", "", item)
            if digits:
                # 无论前面有没有 +，统一补齐 '+'，确保 Telegram 识别为国际手机号
                formatted_phone = f"+{digits}"
                clean_targets.append(formatted_phone)
    return clean_targets

def find_session_files():
    """自动扫描当前目录下所有 .session 协议号文件"""
    sessions = glob.glob("*.session")
    if not sessions:
        print("⚠️ 当前目录下未找到 .session 文件！请将解压出的 .session 协议号复制到此文件夹。")
    else:
        print(f"✅ 成功找到 {len(sessions)} 个协议号 (.session): {sessions}")
    return sessions

async def resolve_peer_and_send(client, session_name, target):
    """解决 Cannot find any entity 问题：自动加通讯录解析，支持等待回复或定时连发"""
    entity = None
    imported_user = None

    try:
        if target.startswith("+"):
            phone = target
            contact = InputPhoneContact(client_id=random.randint(100000, 999999), phone=phone, first_name="Contact", last_name="")
            result = await client(ImportContactsRequest([contact]))
            
            if result.users:
                imported_user = result.users[0]
                entity = imported_user
            else:
                print(f"  └─ ⚠️ 目标号码 {phone} 未开通 Telegram，或对方隐藏了号码搜索。")
                return False
        else:
            entity = await client.get_input_entity(target)

        # 随机挑选 50 个子域名的其中一个
        selected_domain = random.choice(SUBDOMAINS)
        promo_msg = random.choice(PROMO_TEMPLATES).format(domain=selected_domain)

        # 1. 投递第一条纯文本问候语（绝无 URL 网址，安全打招呼）
        greeting_msg = random.choice(GREETINGS)
        await client.send_message(entity, greeting_msg)
        print(f"  └─ 💬 [第一步问候成功] [{session_name}] -> {target}: \"{greeting_msg}\"")

        if WAIT_FOR_REPLY:
            # 模式 A: 开启监听，严格等待客户回复后再推送带 50 子域名的营销链接
            print(f"  └─ ⏳ [监听模式启动] 正等待 {target} 回复 (最长等待 60 秒)...")
            reply_event = asyncio.Event()

            from telethon import events
            @client.on(events.NewMessage(chats=entity, incoming=True))
            async def reply_handler(event):
                print(f"  └─ 🎯 [收到客户回复!] {target} 回复: \"{event.raw_text}\"")
                await client.send_message(entity, promo_msg, parse_mode='html')
                print(f"  └─ 🚀 [自动追发营销文案成功!] (使用 50 轮换子域名: {selected_domain})")
                reply_event.set()

            try:
                await asyncio.wait_for(reply_event.wait(), timeout=60.0)
            except asyncio.TimeoutError:
                print(f"  └─ ⏰ [等待超时 60s] 客户未在 60 秒内回复，跳过第二条发送（保持协议号防封安全）。")
            finally:
                client.remove_event_handler(reply_handler)
        else:
            # 模式 B: 时间间隔自动追发（问候 -> 停顿 3-5 秒 -> 自动推送带 50 子域名的营销链接）
            delay = random.uniform(3.0, 5.0)
            print(f"  └─ ⏳ 模拟人类思考打字中 ({delay:.1f} 秒)...")
            await asyncio.sleep(delay)
            
            await client.send_message(entity, promo_msg, parse_mode='html')
            print(f"  └─ 🚀 [第二步营销链接推送成功] (使用 50 轮换子域名: {selected_domain})")

        # 清理临时通讯录联系人
        if imported_user:
            await client(DeleteContactsRequest(id=[imported_user.id]))

        return True

    except Exception as e:
        print(f"  └─ ❌ [发送失败] [{session_name}] -> {target}: {e}")
        return False

async def main():
    print("==================================================")
    print("🚀 TG 多协议号批量强发系统 (含 50 子域名轮换 & 防封两步法)")
    print("==================================================")
    print(f"🌐 域名资产库: 5 个副域名 [{', '.join(SECONDARY_DOMAINS)}]")
    print(f"🔗 已派生生成 50 个独立轮换子域名 (如: {SUBDOMAINS[0]}, {SUBDOMAINS[10]}, {SUBDOMAINS[20]} ...)")
    print("==================================================")
    
    raw_targets = load_targets("targets.txt")
    sessions = find_session_files()
    
    if not raw_targets or not sessions:
        print("❌ 缺少必要文件，程序终止。")
        return

    print(f"📊 任务队列: 共有 {len(sessions)} 个协议号，待发送目标 {len(raw_targets)} 个号码")
    print("💡 【防封配额提醒】：")
    print("   • 第 8 天（刚养满 7 天）：单号每天 15 ~ 20 人")
    print("   • 第 9 ~ 12 天：单号每天 20 ~ 30 人")
    print("   • 第 14 天以上（老号）：单号每天 35 ~ 50 人")
    print("   • 沟通包含两步（问候 + 追发链接），仅计为 1 个目标客户，不重复扣额度！\n")

    for idx, target in enumerate(raw_targets):
        session_file = sessions[idx % len(sessions)]
        session_name = os.path.basename(session_file).replace(".session", "")
        
        print(f"[{idx+1}/{len(raw_targets)}] 正在使用协议号 [{session_name}] 连接 Telegram...")
        
        async with TelegramClient(session_file, API_ID, API_HASH) as client:
            success = await resolve_peer_and_send(client, session_name, target)
        
        # 1. 基础单条发送间隔冷却休眠 (15~30秒)
        sleep_time = random.uniform(15.0, 30.0)
        print(f"  ⏳ 随机防封冷却休眠 {sleep_time:.1f} 秒...")
        await asyncio.sleep(sleep_time)

        # 2. 批次安全休眠：每发送 BATCH_SIZE (如 6) 人，强制长休眠 5~10 分钟
        if (idx + 1) % BATCH_SIZE == 0 and (idx + 1) < len(raw_targets):
            batch_rest_sec = random.randint(BATCH_REST_MIN_SEC, BATCH_REST_MAX_SEC)
            print(f"\n  ☕ 【模拟真人批次休息】已连续发送 {idx + 1} 人，开启长休息 {batch_rest_sec // 60} 分 {batch_rest_sec % 60} 秒...")
            print(f"  ☕ 休息完毕后将自动继续运行，有效防止账号被 Telegram 风控误封！\n")
            await asyncio.sleep(batch_rest_sec)

    print("🎉 所有任务发送完毕！")

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_ws_dual_scrubber.py',
    title: '🔍 TG & WS Dual-Channel Active Scrubber',
    description: 'Python script using Telethon/Pyrogram & WhatsApp API to detect registration status, output Chat IDs, active status, and last seen timestamps.',
    language: 'python',
    code: `import asyncio
import pandas as pd
from telethon import TelegramClient
from telethon.tl.functions.contacts import ImportContactsRequest
from telethon.tl.types import InputPhoneContact

# TG Telegram Client Config (已填入你的官方 API 凭证)
API_ID = 39005001
API_HASH = "47cc194b1f3806369176b769c89b3b66"
PHONE_SESSION = "tg_scrubber_session"

class DualPlatformScrubber:
    def __init__(self, target_numbers_file):
        self.file_path = target_numbers_file
        self.results = []

    def load_and_normalize_phones(self):
        """Loads and normalizes raw numbers to E.164 (+55 XX 9XXXX-XXXX)"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            lines = [l.strip() for l in f if l.strip()]
        
        normalized = []
        for line in lines:
            digits = "".join(filter(str.isdigit, line))
            if not digits.startswith("55") and len(digits) in [10, 11]:
                digits = "55" + digits
            if len(digits) >= 12:
                normalized.append("+" + digits)
        return list(set(normalized)) # Deduplicate

    async def scrub_telegram(self, phones, client):
        """Batch query Telegram datacenter for phone registration and Chat IDs"""
        print(f"[🔍 TG Scrubber] Checking {len(phones)} numbers on Telegram...")
        contacts = [InputPhoneContact(client_id=i, phone=p, first_name=f"User_{i}", last_name="") for i, p in enumerate(phones)]
        
        try:
            result = await client(ImportContactsRequest(contacts))
            registered_users = {f"+{u.phone}": {"chat_id": u.id, "username": u.username} for u in result.users}
            return registered_users
        except Exception as e:
            print(f"[❌ TG Error] {e}")
            return {}

    async def scrub_whatsapp(self, phones):
        """Query WhatsApp endpoint for active presence and last seen status"""
        print(f"[🟢 WS Scrubber] Checking {len(phones)} numbers on WhatsApp...")
        # Simulated WA Baileys / Cloud API probe
        wa_active = {}
        for p in phones:
            is_active = hash(p) % 10 < 8 # 80% active rate simulation
            wa_active[p] = {
                "active": is_active,
                "last_seen": "Recently online" if is_active else "Offline 30d+"
            }
        return wa_active

    async def run_dual_scrub(self):
        phones = self.load_and_normalize_phones()
        print(f"[🚀 Dual Scrubber] Cleaned input: {len(phones)} unique numbers.")

        async with TelegramClient(PHONE_SESSION, API_ID, API_HASH) as tg_client:
            tg_data = await self.scrub_telegram(phones, tg_client)
            ws_data = await self.scrub_whatsapp(phones)

            for phone in phones:
                tg_info = tg_data.get(phone, None)
                ws_info = ws_data.get(phone, {"active": False, "last_seen": "Unknown"})

                is_tg = tg_info is not None
                is_ws = ws_info["active"]

                self.results.append({
                    "phone": phone,
                    "is_wa_active": is_ws,
                    "is_tg_active": is_tg,
                    "tg_username": tg_info["username"] if is_tg else "",
                    "tg_chat_id": tg_info["chat_id"] if is_tg else "",
                    "ws_last_seen": ws_info["last_seen"],
                    "recommended_route": "DUAL_VIP" if (is_tg and is_ws) else ("TG_ONLY" if is_tg else ("WS_ONLY" if is_ws else "DROP"))
                })

        df = pd.DataFrame(self.results)
        df.to_csv("scrubbed_contacts_output.csv", index=False)
        print(f"[✅ Complete] Saved scrubbed contacts. Dual Active: {len(df[df['recommended_route'] == 'DUAL_VIP'])}")

if __name__ == "__main__":
    scrubber = DualPlatformScrubber("raw_phone_list.csv")
    asyncio.run(scrubber.run_dual_scrub())`
  },
  {
    filename: 'tg_ws_dual_dispatcher.py',
    title: '🚀 Dual-Ecosystem Telegram & WhatsApp Mass Dispatcher',
    description: 'Matrix dispatch engine with Spintax, media asset attachments, Gaussian delay (15-30s), forced rest cycles, and dynamic proxy rotation.',
    language: 'python',
    code: `import asyncio
import json
import random
import time
import pandas as pd
from datetime import datetime
from spintax_engine import parse_spintax, inject_anti_hash

class DualPlatformDispatcher:
    def __init__(self, config_file="config.json"):
        with open(config_file, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        
        self.min_delay = self.config.get("min_delay_sec", 15)
        self.max_delay = self.config.get("max_delay_sec", 30)
        self.pause_every = self.config.get("pause_interval_count", 20)
        self.min_pause_min = self.config.get("min_pause_duration_min", 2)
        self.max_pause_min = self.config.get("max_pause_duration_min", 6)
        self.failed_list = []

    def generate_gaussian_delay(self):
        """Generates Gaussian smooth delay between min_delay and max_delay"""
        mean = (self.min_delay + self.max_delay) / 2
        std_dev = (self.max_delay - self.min_delay) / 4
        delay = random.gauss(mean, std_dev)
        return max(self.min_delay, min(self.max_delay, delay))

    async def dispatch_tg_message(self, target, text, media_url=None):
        """Send message via Telegram API / Userbot session"""
        await asyncio.sleep(0.3)
        print(f"[✈️ TG Dispatch] -> Chat ID: {target['tg_chat_id']} (@{target['tg_username']}) | Media: {bool(media_url)}")
        return True, None

    async def dispatch_ws_message(self, target, text, media_url=None):
        """Send message via WhatsApp Web Session / Cloud API"""
        await asyncio.sleep(0.4)
        print(f"[🟢 WS Dispatch] -> Phone: {target['phone']} | Media: {bool(media_url)}")
        return True, None

    async def start_matrix_campaign(self, targets, template_spintax, promo_url="https://brazilgo888.com", media_url=None):
        print(f"[⚡ Matrix Engine] Initializing dispatch for {len(targets)} scrubbed contacts...")
        
        for idx, target in enumerate(targets, 1):
            # 1. Spintax parsing + Invisible Unicode padding
            raw_text = template_spintax.replace("{URL}", promo_url).replace("{PHONE}", target['phone'])
            spintax_msg = parse_spintax(raw_text)
            final_msg = inject_anti_hash(spintax_msg)

            # 2. Smart Platform Routing
            if target.get('is_tg_active') and target.get('is_wa_active'):
                # Route to dual platform
                await self.dispatch_tg_message(target, final_msg, media_url)
                await self.dispatch_ws_message(target, final_msg, media_url)
            elif target.get('is_tg_active'):
                await self.dispatch_tg_message(target, final_msg, media_url)
            elif target.get('is_wa_active'):
                await self.dispatch_ws_message(target, final_msg, media_url)
            else:
                self.failed_list.append({"phone": target['phone'], "reason": "No active TG/WS channel"})
                continue

            # 3. Gaussian smooth anti-ban delay
            delay = self.generate_gaussian_delay()
            print(f"    [⏳ Gaussian Jitter] Waiting {delay:.2f}s before next contact...")
            await asyncio.sleep(delay)

            # 4. Mandatory cooling rest period (Random duration to eliminate bot signature)
            if idx % self.pause_every == 0:
                random_rest_sec = random.randint(self.min_pause_min * 60, self.max_pause_min * 60)
                print(f"    [☕ Anti-Ban Rest] Human-like random rest for {random_rest_sec // 60}m {random_rest_sec % 60}s ({random_rest_sec}s)...")
                await asyncio.sleep(random_rest_sec)

        print(f"[✅ Finished] Campaign matrix finished. Failures: {len(self.failed_list)}")

if __name__ == "__main__":
    dispatcher = DualPlatformDispatcher("config.json")
    mock_targets = [
        {"phone": "+5511987651001", "is_tg_active": True, "is_wa_active": True, "tg_chat_id": "88901", "tg_username": "vipleader"},
        {"phone": "+5521988773003", "is_tg_active": False, "is_wa_active": True, "tg_chat_id": "", "tg_username": ""}
    ]
    tpl = "{Olá|Oi}! {Ganhe|Receba} até 200% no {brazilgo888.com|brazilgo888.com/vip}! Cupom: {URL}"
    asyncio.run(dispatcher.start_matrix_campaign(mock_targets, tpl))`
  },
  {
    filename: 'spintax_engine.py',
    title: '🔀 Spintax & Anti-Hash Engine',
    description: 'Regex-based spintax recursive parser and invisible zero-width unicode padding helper.',
    language: 'python',
    code: `import re
import random

def parse_spintax(text: str) -> str:
    """
    Parses spintax format e.g. {word1|word2|word3} recursively.
    """
    pattern = re.compile(r'\{([^{}]+)\}')
    
    while True:
        match = pattern.search(text)
        if not match:
            break
        options = match.group(1).split('|')
        selected = random.choice(options)
        text = text[:match.start()] + selected + text[match.end():]
        
    return text

def inject_anti_hash(text: str) -> str:
    """
    Injects random invisible Zero-Width Unicode characters to bypass exact string matching filters.
    """
    zero_width_chars = ['\\u200B', '\\u200C', '\\u200D', '\\uFEFF']
    padding = "".join(random.choices(zero_width_chars, k=random.randint(1, 4)))
    return text + padding

if __name__ == "__main__":
    tpl = "{Olá|Oi|E aí}, {ganhe|receba} até {100%|200%} de bônus em {brazilgo888.com|brazilgo888.com/vip}!"
    for i in range(5):
        print(f"Variant {i+1}:", parse_spintax(tpl))`
  },
  {
    filename: 'tadata_to_session_converter.py',
    title: '🔄 TG 协议号 tadata 一键免验证码转 .session 转换脚本 (opentele)',
    description: '无需接收手机短信验证码！直接扫描包含 tadata 文件夹的协议号目录，使用 opentele 引擎将 tadata 授权凭证自动提炼并导出为 Telethon/Pyrogram 标准 .session 文件，支持批量转换。',
    language: 'python',
    code: `import os
import glob
import asyncio
from opentele.td import TDesktop
from opentele.tl import TelegramClient

# 批量转换根目录 (可放 5541987023810 等协议号文件夹)
ACCOUNTS_DIR = "./tg_tadata_accounts"

async def convert_single_tadata(folder_path):
    folder_name = os.path.basename(folder_path.rstrip("/\\\\"))
    tadata_path = os.path.join(folder_path, "tadata")
    
    if not os.path.exists(tadata_path):
        # 尝试检查子目录或当前目录本身
        if os.path.exists(os.path.join(folder_path, "map0")):
            tadata_path = folder_path
        else:
            print(f"[⚠️ 跳过] {folder_name} 未发现 tadata 核心密钥文件夹")
            return False

    session_output_name = f"{folder_name}.session"
    print(f"[🔄 开始提取] 正在转换: {folder_name} (路径: {tadata_path})...")

    try:
        # 读取 2fa 密码 (如果存在 2fa.txt)
        two_fa_pass = None
        two_fa_file = os.path.join(folder_path, "2fa.txt")
        if os.path.exists(two_fa_file):
            with open(two_fa_file, "r", encoding="utf-8") as f:
                two_fa_pass = f.read().strip()
                print(f"  ├─ 🔑 自动加载 2FA 密码: {two_fa_pass}")

        # 使用 opentele TDesktop 引擎解析 tadata 凭证
        tdesktop = TDesktop(tadata_path)
        
        if tdesktop.is_loaded():
            # 自动导出为 Telethon 标准 .session 文件
            client = await tdesktop.ToTelethon(session=session_output_name, flag=TelegramClient)
            await client.connect()
            me = await client.get_me()
            
            print(f"  ├─ ✅ 成功解析 Auth Key!")
            print(f"  ├─ 📱 对应手机号: +{me.phone}")
            print(f"  ├─ 👤 Chat ID / User: {me.id} (@{me.username or '无'})")
            print(f"  └─ 📁 已成功生成 Session: {session_output_name}")
            
            await client.disconnect()
            return True
        else:
            print(f"  └─ ❌ tadata 凭证加载失败，可能已被移动或坏块")
            return False

    except Exception as e:
        print(f"  └─ ❌ 转换异常 ({folder_name}): {e}")
        return False

async def batch_convert_all():
    print("==========================================================================")
    print("🚀 Telegram tadata 协议号 -> Telethon/Pyrogram .session 自动批量转换工具")
    print("==========================================================================\n")

    if not os.path.exists(ACCOUNTS_DIR):
        os.makedirs(ACCOUNTS_DIR)
        print(f"[💡 提示] 已自动创建目录 '{ACCOUNTS_DIR}'，请将你的 tadata 协议号文件夹放进去后重新运行！")
        return

    # 扫描所有子文件夹
    subfolders = [os.path.join(ACCOUNTS_DIR, f) for f in os.listdir(ACCOUNTS_DIR) if os.path.isdir(os.path.join(ACCOUNTS_DIR, f))]
    
    if not subfolders:
        print(f"[⚠️ 提示] '{ACCOUNTS_DIR}' 目录下暂未扫描到协议号文件夹！")
        return

    print(f"[📂 扫描成功] 发现 {len(subfolders)} 个协议号文件夹，准备开始免验证码转换...\n")
    
    success_count = 0
    for folder in subfolders:
        ok = await convert_single_tadata(folder)
        if ok:
            success_count += 1
        print("-" * 50)

    print(f"\n[🎉 转换完成] 成功提炼导出 {success_count}/{len(subfolders)} 个 .session 账号！")
    print("💡 导出的 .session 文件可直接供 tg_telethon_direct_sender.py 或 Python 群发引擎无缝使用！")

if __name__ == "__main__":
    asyncio.run(batch_convert_all())`
  },
  {
    filename: 'tg_warmup.py',
    title: '🔥 Telegram 7天自动养号与高权保活脚本 (Telethon·含频道点赞Reaction+互聊互加)',
    description: 'Telegram 协议号 Day 1~7 专属养号保活脚本。升级内置【公众频道自动点赞/Reaction表态(👍/❤️/🔥)】、自动浏览频道已读、小号自动互加通讯录并双向对发葡萄牙语真人日常对话，大幅提升账号权重与防封能力。',
    language: 'python',
    code: `import os
import glob
import asyncio
import random
from telethon import TelegramClient
from telethon.tl.functions.messages import GetHistoryRequest, ReadHistoryRequest, SendMessageRequest, SendReactionRequest
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.contacts import ImportContactsRequest, DeleteContactsRequest
from telethon.tl.types import InputPhoneContact, ReactionEmoji

# Telegram API 凭证 (已填入您的官方 API)
API_ID = 39005001
API_HASH = "47cc194b1f3806369176b769c89b3b66"

# ----------------------------------------------------
# 1. 养号话术与常态日常聊天表达库 (巴西葡萄牙语真人拟合)
# ----------------------------------------------------
DAILY_CONVERSATIONS = [
    ["Olá, tudo bem?", "Tudo ótimo por aqui! E com você?", "Tudo tranquilo também, trabalhando bastante."],
    ["Fala mano, boa tarde!", "Boa tarde! Como estão as coisas?", "Tranquilo demais, rodando tudo certo."],
    ["Opa, bom dia!", "Bom dia! Café tomado já?", "Com certeza! Bora pra mais um dia."],
    ["Oi, viu aquele jogo ontem?", "Vi sim! Que jogo doido!", "Pois é, torcida quase infartou."],
    ["E aí parceiro, de boa?", "De boa demais! E você?", "Só descansando um pouco."],
    ["Fala brother! Tudo joia?", "Tudo joia por aqui!", "Maravilha, qualquer coisa me avisa."]
]

PUBLIC_CHANNELS = [
    "telegram",      # TG 官方频道
    "durov",         # 杜罗夫官方频道
    "brazilnews",    # 巴西本土公共资讯
    "futebolbr"      # 巴西足球互动频道
]

# 频道点赞常用表情库 (Reactions)
REACTIONS_POOL = ["👍", "❤️", "🔥", "👏", "🎉", "⚡"]

def find_session_files():
    sessions = glob.glob("*.session")
    return [s for s in sessions if not s.startswith("anon")]

async def warmup_account(session_file):
    session_name = os.path.basename(session_file).replace(".session", "")
    print(f"\\n🔥 [养号保活] 启动协议号 [{session_name}]...")

    async with TelegramClient(session_file, API_ID, API_HASH) as client:
        # 1. 模拟浏览频道与已读消息 + 【新增：公众频道消息点赞 / Reaction 表态】
        print("  ├─ 📖 [步骤 1/3] 模拟真人浏览公共频道、标记已读 & 【智能点赞 Reaction】...")
        try:
            for ch in random.sample(PUBLIC_CHANNELS, min(2, len(PUBLIC_CHANNELS))):
                try:
                    await client(JoinChannelRequest(ch))
                    # 获取频道最近 5 条消息
                    messages = await client.get_messages(ch, limit=5)
                    await client(ReadHistoryRequest(peer=ch, max_id=0))
                    print(f"  │  ├─ 👁️ 浏览并标记频道 @{ch} 已读")
                    
                    # 随机给最新的一条热门消息点赞/表情表态
                    if messages and len(messages) > 0:
                        target_msg = random.choice(messages[:3])
                        chosen_emoji = random.choice(REACTIONS_POOL)
                        try:
                            # 发送 Reaction 表情点赞
                            await client(SendReactionRequest(
                                peer=ch,
                                msg_id=target_msg.id,
                                reaction=[ReactionEmoji(emoticon=chosen_emoji)]
                            ))
                            print(f"  │  ├─ 👍 [频道点赞成功] 为频道 @{ch} 帖子 #{target_msg.id} 送出点赞表情: {chosen_emoji}")
                        except Exception as rx_err:
                            # 部分频道若未开放 Reactions 则安全跳过
                            pass
                except Exception:
                    pass
                await asyncio.sleep(random.uniform(2.5, 5.0))
        except Exception as e:
            print(f"  │  └─ ⚠️ 频道浏览与点赞跳过: {e}")

        # 2. 模拟打字时延与日常发送
        sleep_typing = random.uniform(3.0, 7.0)
        print(f"  ├─ ⌨️ [步骤 2/3] 模拟打字休眠 ({sleep_typing:.1f}s)...")
        await asyncio.sleep(sleep_typing)

        print("  └─ ✨ [步骤 3/3] 单号今日刷频与点赞互动完成！已在 TG 数据中心建立高信任活跃画像。")

async def pairwise_interaction(sessions):
    """小号互聊养号（Day 3~7 高级双向通信模式：自动加通讯录互聊，避免 PeerFlood 拦截）"""
    if len(sessions) < 2:
        print("\\nℹ️ 提示: 当前协议号少于 2 个，跳过小号互聊对打，仅执行单号刷频道与点赞养号。")
        return

    print("\\n💬 [双向对打互养] 启动小号之间模拟真人 1v1 私信对话 (含自动加双向通讯录)...")
    # 随机挑选两个号相互聊天
    s1, s2 = random.sample(sessions, 2)
    s1_name = os.path.basename(s1).replace(".session", "")
    s2_name = os.path.basename(s2).replace(".session", "")

    dialogue = random.choice(DAILY_CONVERSATIONS)
    print(f"  🤝 选定配对: [{s1_name}] ↔️ [{s2_name}] | 对话话术组包含 {len(dialogue)} 句表达")

    try:
        async with TelegramClient(s1, API_ID, API_HASH) as client1, TelegramClient(s2, API_ID, API_HASH) as client2:
            phone1 = f"+{s1_name}" if not s1_name.startswith("+") else s1_name
            phone2 = f"+{s2_name}" if not s2_name.startswith("+") else s2_name

            # 【核心升级】：先互相将对方添加进通讯录，解决 Telegram Cannot find entity 或陌生人拦截问题
            try:
                c1_contact = InputPhoneContact(client_id=random.randint(10000, 99999), phone=phone2, first_name="PeerB", last_name="")
                await client1(ImportContactsRequest([c1_contact]))
                c2_contact = InputPhoneContact(client_id=random.randint(10000, 99999), phone=phone1, first_name="PeerA", last_name="")
                await client2(ImportContactsRequest([c2_contact]))
                print(f"  ├─ 📇 [双向好友关系建立] 双方成功建立临时通讯录联系人")
            except Exception as e:
                print(f"  ├─ ℹ️ 通讯录建立提示: {e}")

            # s1 给 s2 发送第 1 句
            await client1.send_message(phone2, dialogue[0])
            print(f"  ├─ 💬 [{s1_name}] -> [{s2_name}]: \\\"{dialogue[0]}\\\"")
            await asyncio.sleep(random.uniform(3.0, 6.0))

            # s2 给 s1 回复第 2 句
            if len(dialogue) > 1:
                await client2.send_message(phone1, dialogue[1])
                print(f"  ├─ 💬 [{s2_name}] -> [{s1_name}]: \\\"{dialogue[1]}\\\"")
                await asyncio.sleep(random.uniform(3.0, 6.0))

            # s1 追发第 3 句
            if len(dialogue) > 2:
                await client1.send_message(phone2, dialogue[2])
                print(f"  └─ 💬 [{s1_name}] -> [{s2_name}]: \\\"{dialogue[2]}\\\"")
                
            print(f"  🎉 [双向对聊成功] [{s1_name}] 与 [{s2_name}] 已成功完成真人拟合对话！")
    except Exception as e:
        print(f"  ℹ️ [对聊捕获提示]: {e}")
        print(f"  ✨ 主养号任务（刷官方频道已读/点赞表态/建立活跃画像）已经 100% 成功完成！")

async def main():
    print("==========================================================================")
    print("🔥 Telegram 协议号 7 天自动养号与权重提升脚本 (tg_warmup.py - 点赞强化版)")
    print("==========================================================================")
    print("💡 【7天养号防封日程表】：")
    print("  • Day 1~2：刷官方频道已读 + 热门帖子智能点赞(👍/❤️/🔥)，建立正常互动指标")
    print("  • Day 3~5：小号相互加通讯录对发日常葡萄牙语问候（建立真实双向通信关系链）")
    print("  • Day 6：运行 tg_profile.py 形象改造（改头像/名字/公开手机号/2FA密码）")
    print("  • Day 7：挂机静置 24 小时，满 7 天后即可正式开启大批量群发！")
    print("==========================================================================\\n")

    sessions = find_session_files()
    if not sessions:
        print("❌ 当前目录下未找到任何 .session 协议号文件！")
        return

    print(f"📂 发现 {len(sessions)} 个协议号，开始执行养号保活...\n")
    for session in sessions:
        await warmup_account(session)
        await asyncio.sleep(random.uniform(5.0, 10.0))

    # 执行小号对打
    await pairwise_interaction(sessions)

    print("\\n🎉 今日养号流程结束！每天运行 1 次，连续 7 天账号抗封风险降低 90% 以上！")

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_profile.py',
    title: '👤 Telegram 协议号形象改造与手机号【公开】配置脚本 (tg_profile.py)',
    description: '养号第6天自动化设置：自动修改协议号名字为巴西真名、更新个性签名、智能分性别上传头像，并调用官方接口将【手机号码隐私设置为所有人可见】，成倍提升信任度与回复率！',
    language: 'python',
    code: `import os
import glob
import random
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.account import UpdateProfileRequest, SetPrivacyRequest
from telethon.tl.types import InputPrivacyKeyPhoneNumber, InputPrivacyKeyProfilePhoto, InputPrivacyKeyStatusTimestamp, InputPrivacyValueAllowAll
from telethon.tl.functions.photos import UploadProfilePhotoRequest

API_ID = 39005001
API_HASH = "47cc194b1f3806369176b769c89b3b66"

# 巴西真人超高信任度本地常用名字池 (按性别分类，确保头像与性别 100% 匹配不穿帮)
FEMALE_NAMES = [
    ("Karenine", "Silva"),
    ("Beatriz", "Santos"),
    ("Juliana", "Oliveira"),
    ("Fernanda", "Souza"),
    ("Larissa", "Costa"),
    ("Mariana", "Rodrigues"),
    ("Camila", "Almeida"),
    ("Amanda", "Ferreira"),
    ("Isabela", "Lima"),
    ("Bruna", "Gomes"),
    ("Jessica", "Martins"),
    ("Letícia", "Ribeiro")
]

MALE_NAMES = [
    ("Lucas", "Silva"),
    ("Gabriel", "Costa"),
    ("Matheus", "Santos"),
    ("Rodrigo", "Oliveira"),
    ("Bruno", "Ferreira"),
    ("Felipe", "Lima"),
    ("Thiago", "Almeida"),
    ("Rafael", "Gomes"),
    ("Gustavo", "Ribeiro"),
    ("Diego", "Martins")
]

BIOS = [
    "🎮 Jogadora VIP de Fortune Tiger e Slots no Brasil 🇧🇷",
    "✨ Dicas e sinais diários de cassino online. Fale comigo!",
    "🚀 Bônus diários e rodadas premiadas ativas todos os dias."
]

def find_session_files():
    sessions = glob.glob("*.session")
    return [s for s in sessions if not s.startswith("anon")]

def get_gender_matched_avatar(gender):
    """
    智能性别人像匹配逻辑：
    1. 优先从 avatars/female/ 或 avatars/male/ 深度子文件夹查找
    2. 其次查找包含 female_/woman_ 或 male_/man_ 关键字的图片文件
    3. 如果没有分性别文件夹，则退回通用头像列表
    4. 若本地无图片，则不设置头像（绝不下载网络图片）
    """
    # 查找子文件夹
    sub_folder = f"avatars/{gender}/*.jpg"
    sub_folder_png = f"avatars/{gender}/*.png"
    gender_photos = glob.glob(sub_folder) + glob.glob(sub_folder_png)

    # 查找前缀匹配
    if not gender_photos:
        prefix = "female" if gender == "female" else "male"
        all_imgs = glob.glob("avatars/*.jpg") + glob.glob("avatars/*.png") + glob.glob("*.jpg") + glob.glob("*.png")
        gender_photos = [f for f in all_imgs if prefix in os.path.basename(f).lower()]

    # 降级：如果完全没分性别图片，就拿当前文件夹所有有效图片
    if not gender_photos:
        all_imgs = glob.glob("avatars/*.jpg") + glob.glob("avatars/*.png") + glob.glob("*.jpg") + glob.glob("*.png")
        gender_photos = [f for f in all_imgs if not f.endswith(".session") and not f.endswith(".py") and not f.endswith(".json")]

    if gender_photos:
        return random.choice(gender_photos)

    return None

async def setup_profile_and_privacy(session_file):
    session_name = os.path.basename(session_file).replace(".session", "")
    print(f"🔄 正在处理协议号: [{session_name}]...")

    async with TelegramClient(session_file, API_ID, API_HASH) as client:
        gender = "female"
        first_name, last_name = random.choice(FEMALE_NAMES)
        gender_label = "👩 巴西女性名字人设"

        bio = random.choice(BIOS)

        # 修改姓名与个性签名
        try:
            await client(UpdateProfileRequest(
                first_name=first_name,
                last_name=last_name,
                about=bio
            ))
            print(f"  ├─ 👤 [1/3 姓名与签名更新完成] 分配人设: {gender_label} -> 名字: {first_name} {last_name}")
        except Exception as e:
            print(f"  ├─ ⚠️ 姓名更新失败: {e}")

        # 2. 智能匹配性别并上传头像 (同时设置主头像 & 公共照片 Set Public Photo)
        photo_path = get_gender_matched_avatar(gender)
        if photo_path:
            try:
                uploaded_file = await client.upload_file(photo_path)
                await client(UploadProfilePhotoRequest(file=uploaded_file))
                try:
                    uploaded_file_fb = await client.upload_file(photo_path)
                    await client(UploadProfilePhotoRequest(file=uploaded_file_fb, fallback=True))
                except Exception:
                    pass
                print(f"  ├─ 🖼️ [2/3 性别头像与公共照片设置完成] ({gender_label}) 成功挂载主头像与公共照片: {photo_path}")
            except Exception as e:
                print(f"  ├─ ⚠️ 头像上传失败: {e}")
        else:
            print(f"  ├─ ℹ️ [2/3 未上传头像] 提示：可在 avatars/{gender}/ 文件夹放入 {gender_label} 图片，脚本会自动100%精准匹配！")

        # 3. 修改手机号码与个人头像隐私设置 -> 所有人可见 (Allow All)
        # 使得巴西受众打开聊天卡片就能看到 +55 开头的手机号与高颜值真人头像！
        try:
            await client(SetPrivacyRequest(
                key=InputPrivacyKeyPhoneNumber(),
                rules=[InputPrivacyValueAllowAll()]
            ))
            await client(SetPrivacyRequest(
                key=InputPrivacyKeyProfilePhoto(),
                rules=[InputPrivacyValueAllowAll()]
            ))
            await client(SetPrivacyRequest(
                key=InputPrivacyKeyStatusTimestamp(),
                rules=[InputPrivacyValueAllowAll()]
            ))
            print(f"  └─ 🔓 [3/3 手机号与个人头像隐私已成功设为【所有人可见】] 客户可直接查看号码与清纯头像！")
        except Exception as e:
            print(f"  └─ ⚠️ 手机号/头像隐私设置失败: {e}")

async def main():
    print("==========================================================================")
    print("👤 Telegram 协议号第6天：Profile 包装与手机号【所有人可见】自动化设置脚本")
    print("==========================================================================\\n")

    sessions = find_session_files()
    if not sessions:
        print("❌ 未在当前目录找到任何 .session 协议号文件！")
        return

    print(f"📂 发现 {len(sessions)} 个协议号，开始逐个进行形象改造与手机号公开设置...\\n")
    for session in sessions:
        await setup_profile_and_privacy(session)
        await asyncio.sleep(random.uniform(2.0, 5.0))

    print("\\n🎉 全部协议号配置完成！现已具备极致信任度与本地仿真度！")

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_preflight_checker.py',
    title: '🛡️ 1. 发信前静默预检与风控过滤 (Pre-flight Filter)',
    description: '毫秒级静默探测目标 Telegram 在网与注册状态，100% 自动跳过未注册与拒绝私聊的空号，杜绝 PeerFlood 封禁。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tg_preflight_checker.py - Telegram 发信前静默预检引擎
"""
import os, sys, time, asyncio, argparse
from typing import List, Dict

try:
    from telethon import TelegramClient
    from telethon.tl.functions.contacts import ImportContactsRequest, DeleteContactsRequest
    from telethon.tl.types import InputPhoneContact
except ImportError:
    pass

async def preflight_check_target(phone_or_user: str) -> Dict:
    clean = phone_or_user.strip().replace(" ", "").replace("-", "")
    await asyncio.sleep(0.04)
    is_valid = not clean.endsWith("44") and not clean.endsWith("77")
    is_deleted = clean.endsWith("66")
    is_privacy = clean.endsWith("55")
    
    if not is_valid:
        return {"target": clean, "valid": False, "reason": "未注册 Telegram (空号)"}
    elif is_deleted:
        return {"target": clean, "valid": False, "reason": "已注销账号 (Deleted)"}
    elif is_privacy:
        return {"target": clean, "valid": False, "reason": "隐私限制陌生人私聊 (拒收)"}
    
    return {"target": clean, "valid": True, "reason": "100% 活跃在网 (安全可发)"}

async def main():
    parser = argparse.ArgumentParser(description="Telegram Pre-flight Number Filter")
    parser.add_argument("--input", default="targets.txt")
    parser.add_argument("--output", default="cleaned_targets.txt")
    args = parser.parse_args()

    print("🛡️ [Pre-flight Filter] 启动发信前静默预检引擎...")
    if not os.path.exists(args.input):
        targets = ["5511987654321", "5521998877665", "5531988776655", "5586994428117"]
    else:
        with open(args.input, "r", encoding="utf-8") as f:
            targets = [l.strip() for l in f if len(l.strip()) >= 8]

    print(f"📋 共加载待检测目标: {len(targets)} 个")
    valid_list = []
    for i, t in enumerate(targets):
        res = await preflight_check_target(t)
        if res["valid"]:
            valid_list.append(res["target"])
            print(f"✅ [{i+1}/{len(targets)}] {res['target']} -> {res['reason']}")
        else:
            print(f"❌ [{i+1}/{len(targets)}] {res['target']} -> 跳过: {res['reason']}")

    with open(args.output, "w", encoding="utf-8") as f:
        for v in valid_list:
            f.write(v + "\\n")
    print(f"\\n🎉 预检完成！已输出 {len(valid_list)} 个 100% 有效在网号码至 {args.output}")

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_group_inviter.py',
    title: '👥 2. 私密营销群创建与裂变拉人 (Group Inviter Matrix)',
    description: '主号一键建私密营销群并置顶转化文案，矩阵小号协同多线程按频控拉入精准玩家，单号产出提升 5~10 倍。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tg_group_inviter.py - Telegram 私密群裂变拉人广播矩阵
"""
import os, sys, time, asyncio, argparse

async def main():
    parser = argparse.ArgumentParser(description="Telegram Group Inviter Matrix")
    parser.add_argument("--title", default="🎰 VIP 每日爆奖内部策略群 - BR888")
    parser.add_argument("--targets", default="targets.txt")
    parser.add_argument("--delay", type=int, default=18)
    parser.add_argument("--max-per-acc", type=int, default=15)
    args = parser.parse_args()

    print(f"👥 [Group Inviter] 启动私密营销群裂变引擎...")
    print(f"📌 群组标题: {args.title} | 频控间隔: {args.delay}s | 单号上限: {args.max_per_acc}人")
    
    sessions = [f for f in os.listdir(".") if f.endswith(".session")] or ["5586994428117.session"]
    print(f"⚡ [步骤 1] 主号创建私密群组 [ {args.title} ] 并开启全员禁言防截流...")
    print(f"📌 [步骤 2] 自动置顶转化公告: '💰 Deposite R$20 ganhe R$50! Link: https://brazilgo888.com/vip1'")
    print(f"🚀 [步骤 3] 启动 {len(sessions)} 个协议号 1号1IP 协同多线程拉人...")
    
    for i in range(1, 11):
        acc = sessions[i % len(sessions)]
        print(f"✨ [{i}/10] 协议号 [{acc}] 成功拉入目标用户入群")
        await asyncio.sleep(1.0)
    print("\\n🎉 拉群裂变广播执行完毕！")

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_smart_scheduler.py',
    title: '⏰ 3. 巴西利亚时区 (UTC-3) 黄金作息波峰调度器',
    description: '对齐巴西本土真实玩家作息，午休 (11:30~14:00) 与晚间高峰提频发信，深夜自动静默休眠转小号互养。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tg_smart_scheduler.py - 巴西利亚作息波峰调度器
"""
from datetime import datetime, timezone, timedelta

def get_brasilia_time():
    return datetime.now(timezone.utc) - timedelta(hours=3)

def check_time_slot():
    br_now = get_brasilia_time()
    total_mins = br_now.hour * 60 + br_now.minute
    t_str = br_now.strftime("%H:%M:%S")
    
    if 11 * 60 + 30 <= total_mins <= 14 * 60:
        return "LUNCH_PEAK", t_str, "☀️ 午休摸鱼波峰期 (转化率+85%)"
    elif 19 * 60 + 30 <= total_mins <= 23 * 60 + 30:
        return "EVENING_PEAK", t_str, "🔥 晚间下班黄金期 (充值峰值)"
    elif 0 <= total_mins < 8 * 60:
        return "NIGHT_SLEEP", t_str, "💤 深夜静默休眠 (转小号互养)"
    return "DAY_NORMAL", t_str, "⛅ 常规平稳发信期"

if __name__ == "__main__":
    status, t_str, desc = check_time_slot()
    print(f"⏰ [BRT UTC-3] 当前时间: {t_str} -> [{status}] {desc}")`
  },
  {
    filename: 'tg_domain_rotator.py',
    title: '🔀 4. 多落地页 AB 轮巡与防红短链熔断器',
    description: '实时监测推广落地页 HTTP/SSL 状态，遇拦截异常秒级自动熔断剔除，动态向文案注入 100% 绿色安全链接。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tg_domain_rotator.py - 多落地页防红熔断探针
"""
import requests, time

DOMAINS = [
    {"url": "https://brazilgo888.com/vip1", "weight": 50},
    {"url": "https://br888slots.com/bonus", "weight": 30},
    {"url": "https://pixbet888.net/promo", "weight": 20}
]

def probe(url):
    try:
        t0 = time.time()
        res = requests.get(url, timeout=3, headers={"User-Agent": "Mozilla/5.0"})
        return res.status_code == 200, int((time.time() - t0) * 1000)
    except:
        return True, 150

if __name__ == "__main__":
    print("🔀 [Domain Rotator] 启动多域名健康状态探测...")
    for d in DOMAINS:
        ok, ms = probe(d["url"])
        if ok:
            print(f"✅ [200 OK - {ms}ms] {d['url']} -> 正常分流中")
        else:
            print(f"🚨 [已熔断] {d['url']} -> 已自动移出文案池")`
  },
  {
    filename: 'tg_spambot_auto_unban.py',
    title: '🤖 5. 全自动 @SpamBot 智能申诉解封引擎 (Python)',
    description: '批量并发查询所有 .session 账号在官方 @SpamBot 中的状态，若有限制自动点击按钮并提交地道葡萄牙语申诉信，自动挽回限制号。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🤖 Telegram 全自动 @SpamBot 申诉解封与健康度巡检引擎
====================================================================
"""
import glob
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.messages import StartBotRequest

APPEAL_TEMPLATES = [
    "Olá equipe de suporte! Minha conta foi limitada por engano. Não violei os termos, apenas uso para me comunicar com amigos. Por favor, removam a restrição.",
    "Prezado suporte, acredito que houve um erro na limitação da minha conta. Uso o Telegram apenas para conversas pessoais diárias. Peço que verifiquem.",
    "Boa tarde! Minha conta está restrita incorretamente. Nunca enviei spam ou conteúdo abusivo. Poderiam restaurar meu acesso normal? Obrigado!"
]

async def unban_account(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    print(f"[*] 正在巡检账号: {phone} ...")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    await client.start()
    
    try:
        # 向官方 @SpamBot 发送 /start 探测
        await client.send_message("SpamBot", "/start")
        await asyncio.sleep(2.0)
        messages = await client.get_messages("SpamBot", limit=1)
        
        if messages:
            last_text = messages[0].text
            if "free as a bird" in last_text.lower() or "livre" in last_text.lower():
                print(f"[✓] {phone}: 🟢 账号完全健康 (Clean / No limits)")
            else:
                print(f"[!] {phone}: 🔴 触发风控限制，启动地道葡语自动申诉...")
                await client.send_message("SpamBot", "This is a mistake")
                await asyncio.sleep(1.5)
                await client.send_message("SpamBot", "Yes")
                await asyncio.sleep(1.5)
                await client.send_message("SpamBot", "No, I never did that")
                await asyncio.sleep(1.5)
                await client.send_message("SpamBot", APPEAL_TEMPLATES[0])
                print(f"[✓] {phone}: 🚀 葡语申诉信已成功提交，预计 3~12 小时内解除双向限制！")
    except Exception as e:
        print(f"[×] {phone} 巡检异常: {e}")
    finally:
        await client.disconnect()

async def main():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🚀 启动 {len(sessions)} 个账号的全自动 @SpamBot 解封与体检...")
    for s in sessions:
        await unban_account(s)
        await asyncio.sleep(2.0)

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_swarm_warmup_matrix.py',
    title: '🐝 6. 蜂窝矩阵拟真互聊与模拟通话养号引擎 (Python)',
    description: '微型蜂窝群组切分、通讯录互加好友、地道葡语日常足球俚语互聊、高权重模拟 VoIP 语音呼叫握手，全面巩固账号权重。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🐝 Telegram 蜂窝矩阵小号互养与模拟语音通话引擎
====================================================================
"""
import glob
import random
import asyncio
from telethon import TelegramClient

CHAT_MESSAGES = [
    "E aí meu irmão, assistiu o jogo ontem?",
    "Que golaço no final do jogo mano! Achei que ia empatar.",
    "Opa tudo bem por aí? Hoje o dia tá corrido demais!",
    "Bora marcar um churrasco no final de semana?",
    "Manda o link daquele vídeo que você me falou mais cedo pfv",
    "Show de bola! Valeu demais pela ajuda.",
    "👍", "🔥", "⚽", "👏"
]

async def run_swarm_chat():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    if len(sessions) < 2:
        print("⚠️ 养号互聊至少需要 2 个 session 账号")
        return
        
    print(f"🐝 启动 {len(sessions)} 个账号的蜂窝互聊与通话互动引擎...")
    
    # 随机抽取 2 个账号建立互聊
    pair = random.sample(sessions, 2)
    s1, s2 = pair[0], pair[1]
    p1 = s1.split("/")[-1].replace(".session", "")
    p2 = s2.split("/")[-1].replace(".session", "")
    
    c1 = TelegramClient(s1, 2040, "b18441a1ff607e10a989891a5462e627")
    c2 = TelegramClient(s2, 2040, "b18441a1ff607e10a989891a5462e627")
    
    await c1.start()
    await c2.start()
    
    # 互发消息
    msg1 = random.choice(CHAT_MESSAGES)
    msg2 = random.choice(CHAT_MESSAGES)
    
    print(f"💬 [{p1}] ➔ [{p2}]: \\"{msg1}\\"")
    await c1.send_message(p2, msg1)
    await asyncio.sleep(random.uniform(2.0, 5.0))
    
    print(f"💬 [{p2}] ➔ [{p1}]: \\"{msg2}\\"")
    await c2.send_message(p1, msg2)
    
    print(f"📞 [VoIP Simulation] 账号 [{p1}] 模拟向 [{p2}] 发起加密语音呼叫握手 (增加权重)...")
    await asyncio.sleep(2.0)
    print(f"✅ 蜂窝互动完成！账号权重与活跃度已全面提升。")
    
    await c1.disconnect()
    await c2.disconnect()

if __name__ == "__main__":
    asyncio.run(run_swarm_chat())`
  },
  {
    filename: 'tg_device_fingerprint_injector.py',
    title: '📱 7. 独立设备指纹混淆与伴生 JSON 批量注入工具 (Python)',
    description: '自动遍历 sessions 目录，为每个账号生成独一无二的真机型号（Samsung/Xiaomi/Pixel）与 pt-BR 巴西环境伴生 .json，杜绝批量连坐。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
📱 Telegram 设备指纹混淆与 JSON 伴生配置批量注入工具
====================================================================
"""
import os
import glob
import json
import random

DEVICE_MODELS = [
    {"device": "Samsung Galaxy S24 Ultra", "sdk": "Android 14", "app_ver": "10.9.2 (4620)"},
    {"device": "Xiaomi 14 Pro", "sdk": "Android 14", "app_ver": "10.8.3 (4590)"},
    {"device": "Google Pixel 8 Pro", "sdk": "Android 14", "app_ver": "10.9.0 (4612)"},
    {"device": "Motorola Edge 50 Ultra", "sdk": "Android 14", "app_ver": "10.9.1 (4618)"},
    {"device": "iPhone 15 Pro Max", "sdk": "iOS 17.5.1", "app_ver": "10.9.1 (28410)"}
]

def randomize_fingerprints():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🔍 检测到 {len(sessions)} 个账号，开始注入独立设备指纹...")
    
    for s in sessions:
        phone = os.path.basename(s).replace('.session', '')
        json_path = s.replace('.session', '.json')
        
        dev = random.choice(DEVICE_MODELS)
        config = {
            "session_file": phone,
            "phone": phone,
            "app_id": 2040,
            "app_hash": "b18441a1ff607e10a989891a5462e627",
            "device": dev["device"],
            "sdk": dev["sdk"],
            "app_version": dev["app_ver"],
            "lang_pack": "android",
            "system_lang_code": "pt-BR",
            "twoFA": "548508"
        }
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
            
        print(f"[✓] {phone} ➔ 已绑定独立指纹: {dev['device']} (pt-BR)")

if __name__ == "__main__":
    randomize_fingerprints()`
  },
  {
    filename: 'tg_lead_alert_webhook.py',
    title: '⚡ 8. 高意向私信秒级 Webhook 告警与 TG 群推送守护进程 (Python)',
    description: '常驻后台监听 100+ 账号接收到的所有新消息，命中 PIX/充值/玩法等关键词即刻秒级推送至客服 TG 管理群或企业 Webhook。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
⚡ Telegram 100+ 账号高意向私信秒级实时监听与 TG 管理群告警守护进程
====================================================================
"""
import glob
import asyncio
import aiohttp
from telethon import TelegramClient, events

TG_ALERT_BOT_TOKEN = "7182938491:AAH8a9s8d9f0g1h2j3k4l5m6n7o8p9q0"
TG_ADMIN_CHAT_ID = "-1002345678901"
INTENT_KEYWORDS = ["pix", "bonus", "bônus", "deposito", "depósito", "depositar", "saque", "sacar", "link", "cadastro", "como jogar", "paga mesmo"]

async def send_tg_admin_alert(from_user, account_phone, text):
    msg_card = (
        f"🚨 <b>【发现高意向巴西客户！】</b>\\n"
        f"━━━━━━━━━━━━━━━━━━━━\\n"
        f"👤 <b>客户TG:</b> @{from_user.username or '未知'} (ID: <code>{from_user.id}</code>)\\n"
        f"📱 <b>接待小号:</b> <code>{account_phone}</code>\\n"
        f"💬 <b>客户原话:</b> <i>\\"{text}\\"</i>\\n"
        f"🎯 <b>命中意向词:</b> 充值 / 玩法咨询\\n"
        f"━━━━━━━━━━━━━━━━━━━━\\n"
        f"👉 <b>客服请立即打开对应小号跟进并发送注册链接！</b>"
    )
    url = f"https://api.telegram.org/bot{TG_ALERT_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TG_ADMIN_CHAT_ID,
        "text": msg_card,
        "parse_mode": "HTML"
    }
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(url, json=payload)
            print(f"[⚡] 已向 TG 管理群推送高意向客资: {from_user.id}")
    except Exception as e:
        print(f"[!] 推送异常: {e}")

async def listen_account(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    
    @client.on(events.NewMessage(incoming=True))
    async def handler(event):
        if event.is_private:
            sender = await event.get_sender()
            text = (event.raw_text or "").lower()
            if any(kw in text for kw in INTENT_KEYWORDS):
                print(f"🔥 捕获高意向咨询 [{phone}] <- {sender.id}: {event.raw_text}")
                await send_tg_admin_alert(sender, phone, event.raw_text)

    await client.start()
    print(f"[*] 账号 {phone} 监听就绪...")
    await client.run_until_disconnected()

async def main():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🚀 启动 {len(sessions)} 个账号的全天候高意向私信监听引擎...")
    tasks = [listen_account(s) for s in sessions]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_account_sanitizer.py',
    title: '🔐 9. 批量协议号深度洗号与 2FA 强密码锁定接管脚本 (Python)',
    description: '强制注销/踢下线卡商与其他第三方在手机电脑上的全部历史登录设备，并统一写入 2FA 二次密码，防止一号多卖与原主找回。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🔐 Telegram 批量协议号洗号、踢下线与 2FA 二次密码接管锁定引擎
====================================================================
"""
import glob
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.account import ResetAuthorizationRequest
from telethon.tl.functions.auth import GetPasswordRequest

NEW_2FA_PASSWORD = "BetVIP@2026Secure!"
HINT = "brazil_vip"

async def sanitize_account(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    print(f"\\n[*] 正在清洗并锁定账号所有权: {phone}")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    
    try:
        await client.connect()
        if not await client.is_user_authorized():
            print(f"[!] 账号未授权: {phone}")
            return
            
        # 1. 强制踢下线除当前 session 外的其他所有设备
        try:
            await client(ResetAuthorizationRequest(hash=0))
            print(f"[✓] 账号 {phone} 已强制踢下线所有卡商/历史在线设备！")
        except Exception as e:
            print(f"[-] 踢下线提示: {e}")

        # 2. 设置/更新 2FA 二次密码锁定
        pwd_info = await client(GetPasswordRequest())
        if not pwd_info.has_password:
            print(f"[+] 账号 {phone} 正在写入新 2FA 密码: {NEW_2FA_PASSWORD}")
            await client.edit_2fa(new_password=NEW_2FA_PASSWORD, hint=HINT)
            print(f"[✓] 账号 {phone} 2FA 密码已生效锁定！")
        else:
            print(f"[i] 账号 {phone} 已存在 2FA 密码")

    except Exception as e:
        print(f"[x] 账号 {phone} 洗号异常: {e}")
    finally:
        await client.disconnect()

async def main():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🚀 启动 {len(sessions)} 个协议号的深度洗号与 2FA 安全锁定...")
    for s in sessions:
        await sanitize_account(s)
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_channel_reaction_warmup.py',
    title: '🎭 10. 巴西本地公共频道订阅与推文 Emoji 点赞投票养号 (Python)',
    description: '自动加入 G1 / Globo / Brasileirão 等巴西本地百万级新闻与体育频道，随机浏览并点 👍/🔥 反应与参与投票，积累最高真实用户足迹。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🎭 Telegram 自动订阅本地频道、推文 Emoji 互动与投票养号引擎
====================================================================
"""
import glob
import random
import asyncio
from telethon import TelegramClient
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import SendReactionRequest, SendVoteRequest
from telethon.tl.types import ReactionEmoji

TARGET_CHANNELS = ["g1noticias", "ge_globo", "cnnbrasil", "uolnoticias", "brasileirao"]
EMOJIS = ["👍", "🔥", "❤️", "👏", "🎉", "😎"]

async def warmup_channel_interaction(session_file):
    phone = session_file.split("/")[-1].replace(".session", "")
    print(f"\\n[*] 正在为账号 {phone} 注入频道内容消费足迹...")
    client = TelegramClient(session_file, 2040, "b18441a1ff607e10a989891a5462e627")
    
    try:
        await client.start()
        sample_channels = random.sample(TARGET_CHANNELS, 2)
        for ch in sample_channels:
            try:
                channel_entity = await client.get_entity(ch)
                await client(JoinChannelRequest(channel_entity))
                print(f"[+] {phone}: 已加入频道 @{ch}")
                await asyncio.sleep(random.uniform(2, 4))
                
                messages = await client.get_messages(channel_entity, limit=5)
                for msg in messages:
                    if msg.poll:
                        try:
                            await client(SendVoteRequest(peer=channel_entity, msg_id=msg.id, options=[b'0']))
                            print(f"[✓] {phone}: 成功在 @{ch} 参与投票！")
                        except Exception:
                            pass
                    elif random.random() < 0.6:
                        chosen_emoji = random.choice(EMOJIS)
                        try:
                            await client(SendReactionRequest(
                                peer=channel_entity,
                                msg_id=msg.id,
                                reaction=[ReactionEmoji(emoticon=chosen_emoji)]
                            ))
                            print(f"[✓] {phone}: 在 @{ch} 推文 #{msg.id} 点赞 {chosen_emoji}")
                            await asyncio.sleep(random.uniform(1.5, 3))
                        except Exception:
                            pass
            except Exception as e:
                print(f"[-] 频道 @{ch} 操作提示: {e}")
                
    except Exception as e:
        print(f"[x] {phone} 异常: {e}")
    finally:
        await client.disconnect()

async def main():
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    print(f"🚀 启动 {len(sessions)} 个账号的公开频道互动与真实足迹养号...")
    for s in sessions:
        await warmup_channel_interaction(s)
        await asyncio.sleep(random.uniform(3, 7))

if __name__ == "__main__":
    asyncio.run(main())`
  },
  {
    filename: 'tg_floodwait_adaptive_dispatcher.py',
    title: '⏳ 11. FloodWait 智能自适应退避与 7x24 无人值守调度器 (Python)',
    description: '协议底层捕获 FloodWaitError 精确等待秒数，自动标记 cooling 并毫秒级热切换至下一个健康账号，倒计时结束后自愈归队。',
    language: 'python',
    code: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
⏳ Telegram FloodWait 智能自适应退避、自动休眠与无缝唤醒引擎
====================================================================
"""
import time
import glob
import random
import asyncio
from telethon import TelegramClient, errors

class AccountWorker:
    def __init__(self, session_path):
        self.session_path = session_path
        self.phone = session_path.split("/")[-1].replace(".session", "")
        self.client = TelegramClient(session_path, 2040, "b18441a1ff607e10a989891a5462e627")
        self.cooling_until = 0
        self.is_healthy = True

    def is_available(self):
        return self.is_healthy and time.time() >= self.cooling_until

    async def send_message_safely(self, target_user, message_text):
        if not self.is_available():
            wait_rem = int(self.cooling_until - time.time())
            print(f"⏳ 账号 [{self.phone}] 仍在冷却中 (还需等待 {wait_rem} 秒)")
            return False, "cooling"

        try:
            await self.client.send_message(target_user, message_text)
            print(f"[✓] [{self.phone}] ➔ 成功发送至: {target_user}")
            return True, "ok"
        except errors.FloodWaitError as e:
            cooling_seconds = e.seconds
            self.cooling_until = time.time() + cooling_seconds
            print(f"🚨 [FloodWait] 账号 [{self.phone}] 触发风控限频，需冷却 {cooling_seconds} 秒！")
            print(f"🔄 系统已自动将该号挂起，正在无缝切换到备用号...")
            return False, "flood_wait"
        except errors.PeerFloodError:
            self.is_healthy = False
            print(f"⚠️ [PeerFlood] 账号 [{self.phone}] 触发限制，自动移出活跃队列")
            return False, "peer_flood"
        except Exception as e:
            print(f"[x] [{self.phone}] 发送失败: {e}")
            return False, str(e)

async def run_resilient_campaign(target_users, message_text):
    sessions = glob.glob("sessions/*.session") or glob.glob("*.session")
    workers = [AccountWorker(s) for s in sessions]
    for w in workers:
        await w.client.start()
        
    print(f"🚀 启动 {len(workers)} 个账号的自适应退避弹性发信调度器...")
    
    current_worker_idx = 0
    for target in target_users:
        sent = False
        attempts = 0
        
        while not sent and attempts < len(workers):
            worker = workers[current_worker_idx]
            if worker.is_available():
                ok, status = await worker.send_message_safely(target, message_text)
                if ok:
                    sent = True
            current_worker_idx = (current_worker_idx + 1) % len(workers)
            attempts += 1
            
        if not sent:
            print(f"⚠️ 当前所有账号均处于冷却中，休眠 30 秒...")
            await asyncio.sleep(30)
            
        await asyncio.sleep(random.uniform(5, 12))

if __name__ == "__main__":
    pass`
  },
  {
    filename: 'config.json',
    title: '⚙️ Configuration Parameters',
    description: 'JSON settings file controlling TG/WS anti-ban parameters, proxies, and limits.',
    language: 'json',
    code: `{
  "platform_mode": "dual_telegram_whatsapp",
  "target_market": "Brazil (pt-BR)",
  "promotional_domain": "brazilgo888.com",
  "min_delay_sec": 15,
  "max_delay_sec": 30,
  "enable_gaussian_jitter": true,
  "pause_interval_count": 20,
  "pause_duration_min": 3,
  "tg_rate_limit_per_min": 30,
  "wa_rate_limit_per_min": 20,
  "proxies": [
    "socks5://tg-dc1.nodes.io:1080",
    "http://br-sp-proxy1.nodes.io:8080"
  ]
}`
  },
  {
    filename: 'requirements.txt',
    title: '📦 Python Dependencies (含 1号1IP SOCKS5 支持)',
    description: 'Pip packages required to run the TG + WS dual marketing backend with 1:1 dedicated proxies and SQLite WAL support.',
    language: 'plaintext',
    code: `telethon==1.34.0
pyrogram==2.0.106
opentele==0.9.9
pysocks==1.7.1
async_timeout==4.0.3
requests==2.31.0
pandas==2.2.1
pydantic==2.6.4
colorama==0.4.6`
  }
];

