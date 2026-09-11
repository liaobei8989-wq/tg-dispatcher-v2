#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🤖 24/7 Telegram Auto-Responder Daemon (24小时全自动追单/彩金守护守护进程)
====================================================================
1. 24小时常驻后台监听所有 .session 账号收到的新私信 (NewMessage)
2. 只要客户回复（无论过了10分钟、1小时还是隔天），立即自动触发：
   - 第2阶段：100个抗封子域名的彩金文案 + 链接
   - 第3阶段：拟人打字 (Typing 3~6s) + 祝老板中奖/暴富祝福语
3. 智能防重复：每个客户只触发追发一次，避免刷屏打扰客户
====================================================================
"""

import os
import sys
import json
import glob
import asyncio
import random
import re
import time
from datetime import datetime

try:
    from telethon import TelegramClient, events
    from telethon.tl.functions.messages import SetTypingRequest
    from telethon.tl.types import SendMessageTypingAction
except ImportError:
    print("[ERROR] 请先安装 Telethon: pip install telethon pysocks")
    sys.exit(1)

try:
    import socks
except ImportError:
    socks = None

import sqlite3

BANNED_OBSOLETE_PHONES = {'5538988630899', '5538991977854', '5538992304845', '5541987023810', '5586995118207'}

def is_valid_telethon_session(session_path: str) -> bool:
    """检查文件是否为有效的 Telethon SQLite 数据库文件"""
    try:
        real_path = session_path if session_path.endswith('.session') else f"{session_path}.session"
        if not os.path.exists(real_path) or os.path.getsize(real_path) < 100:
            return False
        with open(real_path, 'rb') as f:
            header = f.read(16)
            if b'SQLite format 3' not in header:
                return False
        conn = sqlite3.connect(real_path, timeout=3.0)
        conn.execute("SELECT 1 FROM sqlite_master LIMIT 1")
        conn.close()
        return True
    except Exception:
        return False

def backup_and_heal_session(session_path: str) -> bool:
    """【SQLite 自动备份机制】启动前自动建立 .session.bak 镜像；若检测到损坏，自动秒级无损还原！"""
    real_path = session_path if session_path.endswith('.session') else f"{session_path}.session"
    bak_path = f"{real_path}.bak"
    
    # 1. 若当前文件健康有效，自动同步创建最新镜像备份
    if is_valid_telethon_session(real_path):
        try:
            shutil.copy2(real_path, bak_path)
            return True
        except Exception:
            return True
            
    # 2. 若当前文件损坏/异常，但存在健康 .bak 镜像，立即自动无损还原救治
    if os.path.exists(bak_path) and is_valid_telethon_session(bak_path):
        try:
            print(f"🛡️ [SQLite 自动自愈系统] 检测到主文件损坏/异常 ({os.path.basename(real_path)})，正在从健康备份 ({os.path.basename(bak_path)}) 秒级无损还原！")
            shutil.copy2(bak_path, real_path)
            return True
        except Exception as heal_err:
            print(f"❌ [自愈还原失败]: {heal_err}")
            
    return is_valid_telethon_session(real_path)

def is_session_locked_by_dispatcher(clean_digits: str) -> bool:
    """【读写分离与锁保护】检查账号当前是否正由调度器 (tg-dispatcher) 独占进行批量发送"""
    candidates = [
        os.path.join(os.getcwd(), "sessions", f".lock_{clean_digits}"),
        f"/root/tg-dispatcher/sessions/.lock_{clean_digits}",
        f"/root/tg-dispatcher-v2/sessions/.lock_{clean_digits}",
        os.path.join(os.getcwd(), "sessions", ".dispatcher_active.lock"),
        "/root/tg-dispatcher/sessions/.dispatcher_active.lock"
    ]
    for lf in candidates:
        if os.path.exists(lf):
            try:
                # 检查锁文件是否超过 10 分钟未更新，防止意外死锁
                mtime = os.path.getmtime(lf)
                if time.time() - mtime > 600:
                    os.unlink(lf)
                    return False
                return True
            except Exception:
                return True
    return False

DEFAULT_API_ID = 2040
DEFAULT_API_HASH = "b18441a1ff607e10a989891a5462e627"

# 100 个抗封子域名池 (从 5 个副域名衍生出 100 个子域名 -> 轮流跳转主网站 -> 7个博彩盘口)
BASE_DOMAINS = ['promobr1.xyz', 'promobr2.xyz', 'promobr3.xyz', 'promobr4.xyz', 'promobr5.xyz']
SUB_PREFIXES = [
    'vip', 'br', 'pix', 'spin', 'bet', 'slot', 'lucky', 'win', 'top', 'go',
    'play', 'forra', 'mega', 'sorte', 'ouro', 'clube', 'brasil', 'premio', 'bonus', 'turbo'
]

ALL_100_SUBDOMAINS = [
    f"https://{prefix}{idx+1:02d}.{dom}/pt"
    for dom in BASE_DOMAINS
    for idx, prefix in enumerate(SUB_PREFIXES)
]

# ==============================================================================
# 🇧🇷 2026 巴西本土实战高转化率话术库 (真人人设 + 免充心智 + Tigrinho 爆款)
# ==============================================================================

# 意图 1：当客户询问身份（"Quem é?", "De onde me conhece?", "Não te conheço", "O que é?"）
INTENT_WHO_ARE_YOU_TEMPLATES = [
    "Haha sou eu do grupo de apostas/slots do Telegram! Vim te avisar porque liberou um saldo teste de R$ 15 a R$ 20 grátis no cadastro hoje 🐯 Sem depósito, se forrar o saque cai direto no seu PIX. Dá uma olhada aqui antes de fecharem: {URL}",
    "Opa, te vi num dos grupos de jogos! Passei pra te avisar que a plataforma nova liberou bônus de teste pro pessoal do TG hoje 🎰💵 Sem pegadinha de depósito, paga no PIX na hora: {URL}",
    "Haha sou jogadora também! Vi seu perfil no grupo e lembrei de mandar: liberou um saldo de cortesia de R$ 15 no cadastro com saque imediato no PIX! O link é esse: {URL}",
    "E aí! Sou eu que te mandei um oi antes. Vim te dar a dica do bônus sem depósito que liberou hoje no Tigrinho 🐯 Aproveita pra rodar de graça: {URL}"
]

# 意图 2：当客户询问玩法/真假/索要链接（"Como funciona?", "É verdade?", "Paga mesmo?", "Quero", "Manda", "Passa o link"）
INTENT_HOW_IT_WORKS_TEMPLATES = [
    "É bem simples mano! É só cadastrar rapidinho pelo link oficial que o saldo teste cai na hora pra você rodar o Tigrinho 🐯 Não precisa pôr dinheiro do bolso, e se forrar o PIX cai em menos de 1 minuto: {URL}",
    "Paga sim chefe, 100% no PIX! O sistema tá dando de R$ 15 a R$ 20 grátis pras primeiras contas hoje. Cria a conta em 30 segundos e vai direto no Fortune Tiger que tá pagando agora: {URL}",
    "Com certeza irmão! Plataforma oficial com saque instantâneo no PIX. Pega seu bônus de cortesia sem depósito aqui e boa forra: {URL}",
    "Super fácil amigo! Clica no link, faz o cadastro básico e o bônus já ativa na conta pra você jogar sem arriscar seu dinheiro: {URL}"
]

# 意图 3：通用回复与问候（"Oi", "Olá", "1", "Bom dia", "Boa tarde", "E aí", 或其他一般回复）
SECOND_MESSAGE_TEMPLATES = [
    "Haha então! Vim te avisar que liberou teste grátis no Tigrinho hoje! 🐯 Tá pagando de R$ 15 a R$ 20 no cadastro com saque direto no PIX sem depósito. Aproveita enquanto tá soltando carta: {URL}",
    "Opa! É que liberou um evento de bônus na plataforma nova hoje! 🎁 De R$ 15 a R$ 20 de cortesia no cadastro com saque rápido no PIX. Testa aí antes que acabe: {URL}",
    "Olha só, liberaram giros de cortesia + saldo no cadastro pra testar hoje! 🎰💵 Sem pegadinha de depósito, o dinheiro cai na hora no PIX se forrar. Confere aqui: {URL}",
    "E aí! Passei pra te avisar do evento dos minutos pagantes no Tigrinho 🐯 Liberou saldo de teste grátis no cadastro pro pessoal rodar e sacar no PIX: {URL}",
    "Haha vi você online e lembrei de te mandar: liberou um saldo de teste de R$ 15 a R$ 20 grátis pra novos cadastros no PIX! 🔥 Dá uma rodada lá: {URL}"
]

# 默认官方沉淀频道/社群（支持环境变量 TG_CHANNEL_LINK 或 sessions/tg_channel.txt 自定义）
DEFAULT_TG_CHANNEL = "https://t.me/brazilgo_chat (@brazilgo_chat)"

def get_tg_channel_link() -> str:
    chan = os.environ.get("TG_CHANNEL_LINK")
    if chan:
        return chan.strip()
    for p in ["sessions/tg_channel.txt", "tg_channel.txt", "/root/tg-dispatcher-v2/sessions/tg_channel.txt"]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        return content
            except Exception:
                pass
    return DEFAULT_TG_CHANNEL

# 第 3 阶段：真人有温度的关照与指导 + 沉淀到官方 TG 频道/社群（100% 可点击完整链接）
THIRD_BLESSING_TEMPLATES = [
    "🎯 Torcendo pelo seu forro hoje! {Se precisar de dicas de slots é só chamar|Bora lucrar muito}! 🎲💎 Não esquece de acompanhar nosso canal VIP de sinais e horários pagantes: 👉 {CHANNEL} 🚀👑",
    "✨ Dica de ouro: joga no Tigrinho na aposta mínima com calma que a cartinha tá solta hoje! 🎰💵 Cola no nosso canal VIP pra não perder os bônus diários: 👉 {CHANNEL} 😉💎",
    "🐯 {Qualquer dúvida me dá um toque aqui que te ajudo a resgatar|Vai com tudo amigo}! E entra também no nosso grupo oficial de estratégias do Tigrinho: 👉 {CHANNEL} {pra pegar os minutos pagantes|onde a gente solta as melhores brechas}! 🍀💵",
    "💸 {Lembrete importante: usa a mesma chave PIX do CPF pro saque cair na hora|Bons giros irmão}! Dá uma passada no nosso grupo VIP de sinais: 👉 {CHANNEL} {Tamo junto|Qualquer dúvida estou por aqui}! 👑✨"
]

def get_random_url() -> str:
    return random.choice(ALL_100_SUBDOMAINS)

def parse_spintax(text: str) -> str:
    if not text:
        return ""
    # 替换各种形式的 URL 占位符或旧静态域名
    rand_url = get_random_url()
    chan_link = get_tg_channel_link()
    text = re.sub(r'\{URL\}|\bURL\b|https?://mostbet\.com/pt|https?://mostbet\.com|https?://brazilgo888\.com/\d+', rand_url, text, flags=re.IGNORECASE)
    text = re.sub(r'\{CHANNEL\}|\bCHANNEL\b', chan_link, text, flags=re.IGNORECASE)
    pattern = re.compile(r'\{([^{}]+)\}')
    while pattern.search(text):
        text = pattern.sub(lambda m: random.choice(m.group(1).split('|')), text)
    return text

# 智能防刷保护（20秒防抖）：防止客户连发两句话时重复回复，但活人每次说话都会必定触发彩金与祝福语
last_reply_timestamps = {}

def check_and_mark_reply(track_key: str, cooldown_seconds: int = 20) -> bool:
    now = time.time()
    last_time = last_reply_timestamps.get(track_key, 0)
    if now - last_time < cooldown_seconds:
        return False
    last_reply_timestamps[track_key] = now
    return True

BRAZIL_DEDICATED_PROXIES = {
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
}

BRAZIL_PROXY_POOL = [
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
    '200.152.153.232:12323:14abdb1a0db2e:cb8f30f1a9'
]

# Load dynamic proxy pool from proxies.txt if exists
try:
    _ptxt = os.path.join(os.getcwd(), "proxies.txt")
    if os.path.exists(_ptxt):
        with open(_ptxt, "r", encoding="utf-8") as _pf:
            _lines = [l.strip() for l in _pf.readlines() if l.strip()]
            if len(_lines) > 0:
                BRAZIL_PROXY_POOL = _lines
except Exception:
    pass

def load_account_proxies_map():
    # 优先从多路径读取已绑定的代理映射文件
    for p in [
        os.path.join(os.getcwd(), "sessions", "account_proxies.json"),
        os.path.join(os.getcwd(), "account_proxies.json"),
        "/root/tg-dispatcher/sessions/account_proxies.json",
        "/root/tg-dispatcher/account_proxies.json",
        "/root/tg-dispatcher-v2/sessions/account_proxies.json",
        "/root/tg-dispatcher-v2/account_proxies.json"
    ]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data and isinstance(data, dict):
                        return data
            except Exception:
                pass
    return BRAZIL_DEDICATED_PROXIES

def get_proxy_for_account(session_basename: str, json_cfg: dict = None) -> tuple:
    """智能代理分配器：确保 100% 走独立巴西代理 IP，绝对不漏网走 VPS 原生 IP"""
    # 1. 优先检查 account_proxies.json 权威独立映射
    proxy_map = load_account_proxies_map()
    clean_phone = re.sub(r'[^0-9]', '', session_basename)
    
    proxy_str = proxy_map.get(clean_phone) or proxy_map.get(session_basename)
    if proxy_str:
        parsed = parse_proxy_str(proxy_str)
        if parsed:
            return parsed

    # 2. 检查 json_cfg 中自带的 proxy
    if json_cfg and isinstance(json_cfg.get("proxy"), dict):
        p = json_cfg["proxy"]
        if p.get("addr") and p.get("port"):
            p_str = f"{p.get('addr')}:{p.get('port')}:{p.get('username') or ''}:{p.get('password') or ''}"
            parsed = parse_proxy_str(p_str)
            if parsed:
                return parsed

    # 3. 自动从巴西 60 个独立代理池中按手机号 Hash 唯一分配空闲独享代理（绝不走 VPS 直连）
    try:
        idx = int(clean_phone[-4:]) % len(BRAZIL_PROXY_POOL) if (clean_phone and clean_phone[-4:].isdigit()) else 0
    except Exception:
        idx = hash(session_basename) % len(BRAZIL_PROXY_POOL)
    
    fallback_proxy = BRAZIL_PROXY_POOL[idx]
    return parse_proxy_str(fallback_proxy)

def parse_proxy_str(proxy_str):
    if not proxy_str or not isinstance(proxy_str, str):
        return None
    try:
        parts = proxy_str.strip().split(':')
        if len(parts) >= 4:
            return (socks.SOCKS5 if socks else 2, parts[0], int(parts[1]), True, parts[2], parts[3])
        elif len(parts) == 2:
            return (socks.SOCKS5 if socks else 2, parts[0], int(parts[1]))
    except Exception:
        pass
    return None

def record_auto_reply_stat(session_basename: str, sender_id: str, sender_name: str, incoming_msg: str, second_msg: str, url: str):
    """持久化记录 24 小时自动回复与追发彩金统计数据，并实时同步写入真实客资库与聚合收件箱"""
    try:
        possible_dirs = [
            os.path.join(os.getcwd(), "sessions"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "sessions"),
            "/root/tg-dispatcher/sessions",
            "/root/tg-dispatcher-v2/sessions"
        ]
        stats_file = None
        sessions_folder = None
        for p in possible_dirs:
            if os.path.exists(p):
                sessions_folder = p
                stats_file = os.path.join(p, "auto_scanner_stats.json")
                break
        if not stats_file:
            sessions_folder = os.path.join(os.getcwd(), "sessions")
            stats_file = os.path.join(sessions_folder, "auto_scanner_stats.json")
            os.makedirs(sessions_folder, exist_ok=True)

        data = {}
        if os.path.exists(stats_file):
            try:
                with open(stats_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = {}

        now_dt = datetime.now()
        now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")

        data["todayCount"] = data.get("todayCount", 0) + 1
        data["totalCount"] = data.get("totalCount", 0) + 1
        data["lastScanTime"] = now_str

        if "accountStats" not in data or not isinstance(data["accountStats"], dict):
            data["accountStats"] = {}
        if session_basename not in data["accountStats"]:
            data["accountStats"][session_basename] = {"name": session_basename, "todaySent": 0, "totalSent": 0}

        data["accountStats"][session_basename]["todaySent"] = data["accountStats"][session_basename].get("todaySent", 0) + 1
        data["accountStats"][session_basename]["totalSent"] = data["accountStats"][session_basename].get("totalSent", 0) + 1

        if "logs" not in data or not isinstance(data["logs"], list):
            data["logs"] = []

        log_entry = {
            "timestamp": now_str[11:19],
            "msg": f"账号 +{session_basename} 自动感知客户 {sender_id} ({sender_name or '客户'}) 回复，已成功秒级补发第2条彩金链接",
            "account": session_basename,
            "target": sender_id,
            "incoming": incoming_msg or "Oi",
            "url": url
        }
        data["logs"].insert(0, log_entry)
        data["logs"] = data["logs"][:100]

        with open(stats_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 📥 同步持久化写入真实已回复客资库 (replied_customers.json)
        replied_cust_file = os.path.join(sessions_folder, "replied_customers.json")
        cust_list = []
        if os.path.exists(replied_cust_file):
            try:
                with open(replied_cust_file, "r", encoding="utf-8") as rf:
                    cust_list = json.load(rf)
                if not isinstance(cust_list, list):
                    cust_list = []
            except Exception:
                cust_list = []

        # 剔除旧 demo 数据 (2026-09-06) 和相同客户ID
        cust_list = [c for c in cust_list if str(c.get("id")) != str(sender_id) and not str(c.get("repliedAt", "")).startswith("2026-09-06")]

        new_cust_entry = {
            "id": str(sender_id),
            "username": "",
            "firstName": sender_name or f"Cliente {sender_id}",
            "lastName": "",
            "fullName": sender_name or f"Cliente {sender_id}",
            "phone": "",
            "receivedByAccount": session_basename,
            "receivedByAccountName": f"TG协议号-{session_basename[-4:]}",
            "lastReplyText": incoming_msg or "Oi",
            "repliedAt": now_str[:16],
            "repliedAtIso": now_dt.isoformat(),
            "directChatUrl": f"tg://user?id={sender_id}"
        }
        cust_list.insert(0, new_cust_entry)
        with open(replied_cust_file, "w", encoding="utf-8") as wf:
            json.dump(cust_list, wf, ensure_ascii=False, indent=2)

        # 💬 同步持久化写入聚合收件箱 (inbox_conversations.json)
        inbox_file = os.path.join(sessions_folder, "inbox_conversations.json")
        inbox_list = []
        if os.path.exists(inbox_file):
            try:
                with open(inbox_file, "r", encoding="utf-8") as ifile:
                    inbox_list = json.load(ifile)
                if not isinstance(inbox_list, list):
                    inbox_list = []
            except Exception:
                inbox_list = []

        # 剔除 demo 数据
        inbox_list = [c for c in inbox_list if not str(c.get("lastMessageTime", "")).startswith("2026-09-06")]

        conv_id = f"conv-{sender_id}"
        existing_conv = next((c for c in inbox_list if c.get("id") == conv_id), None)
        cur_ts = now_str[11:16]
        m_in = {
            "id": f"m-in-{int(time.time()*1000)}",
            "conversationId": conv_id,
            "senderType": "customer",
            "senderName": sender_name or "Cliente",
            "text": incoming_msg or "Oi",
            "timestamp": cur_ts,
            "status": "delivered"
        }
        m_out = {
            "id": f"m-out-{int(time.time()*1000)+1}",
            "conversationId": conv_id,
            "senderType": "account",
            "senderName": f"TG协议号-{session_basename[-4:]}",
            "text": second_msg,
            "timestamp": cur_ts,
            "status": "read"
        }

        if existing_conv:
            inbox_list.remove(existing_conv)
            existing_conv["unreadCount"] = existing_conv.get("unreadCount", 0) + 1
            existing_conv["lastMessageText"] = incoming_msg or second_msg
            existing_conv["lastMessageTime"] = now_str[:16]
            if "messages" not in existing_conv or not isinstance(existing_conv["messages"], list):
                existing_conv["messages"] = []
            existing_conv["messages"].extend([m_in, m_out])
            inbox_list.insert(0, existing_conv)
        else:
            new_conv = {
                "id": conv_id,
                "customerName": sender_name or f"Cliente {sender_id}",
                "customerPhone": "",
                "customerUsername": "",
                "assignedAccountPhone": session_basename,
                "assignedAccountName": f"TG协议号-{session_basename[-4:]}",
                "tag": "hot_lead",
                "unreadCount": 1,
                "lastMessageText": incoming_msg or "Oi",
                "lastMessageTime": now_str[:16],
                "messages": [m_in, m_out]
            }
            inbox_list.insert(0, new_conv)

        with open(inbox_file, "w", encoding="utf-8") as iwf:
            json.dump(inbox_list, iwf, ensure_ascii=False, indent=2)
        print(f"✅ [收件箱同步成功] 客户 {sender_id} ({sender_name}) 已实时进入聚合收件箱第一位！")
    except Exception as e:
        print(f"⚠️ [写入客资库与收件箱失败]: {e}")

async def process_and_reply_customer(client, session_basename, chat_id, incoming_msg_id, msg_text, sender_name):
    try:
        sender_id = str(chat_id)
        track_key = f"{session_basename}_{sender_id}"

        replied_chats_file = os.path.join(os.getcwd(), "sessions", "replied_chats.json")
        replied_history = {}
        if os.path.exists(replied_chats_file):
            try:
                with open(replied_chats_file, "r", encoding="utf-8") as rf:
                    replied_history = json.load(rf)
            except Exception:
                replied_history = {}

        last_recorded_id = replied_history.get(track_key, 0)
        if incoming_msg_id > 0 and incoming_msg_id <= last_recorded_id:
            return False

        # 检查最新消息是否已回复过
        try:
            recent_msgs = await client.get_messages(chat_id, limit=6)
            has_replied_already = False
            if recent_msgs:
                for rm in recent_msgs:
                    if rm.out and rm.id > incoming_msg_id:
                        has_replied_already = True
                        break
            if has_replied_already:
                replied_history[track_key] = incoming_msg_id
                try:
                    with open(replied_chats_file, "w", encoding="utf-8") as wf:
                        json.dump(replied_history, wf, ensure_ascii=False, indent=2)
                except Exception:
                    pass
                return False
        except Exception:
            pass

        # 20秒防抖
        if not check_and_mark_reply(track_key, cooldown_seconds=20):
            return False

        replied_history[track_key] = incoming_msg_id
        try:
            os.makedirs(os.path.dirname(replied_chats_file), exist_ok=True)
            with open(replied_chats_file, "w", encoding="utf-8") as wf:
                json.dump(replied_history, wf, ensure_ascii=False, indent=2)
        except Exception:
            pass

        msg_text = str(msg_text or "").strip()
        lower_msg = msg_text.lower()
        print(f"\n📩 [感知客户私聊回复] 账号: +{session_basename} | 客户: {sender_id} ({sender_name or '客户'}) | 内容: \"{msg_text}\"")

        # 智能客户意图匹配
        if any(k in lower_msg for k in ['quem', 'onde', 'conhece', 'sabe', 'qual e', 'nao te conheco', 'de onde', 'oq e', 'q e isso', 'quem e']):
            matched_intent = "身份释疑"
            rand_template = random.choice(INTENT_WHO_ARE_YOU_TEMPLATES)
        elif any(k in lower_msg for k in ['como', 'funciona', 'paga', 'verdade', 'golpe', 'quero', 'manda', 'passa', 'link', 'pix', 'onde clica']):
            matched_intent = "玩法/领福利"
            rand_template = random.choice(INTENT_HOW_IT_WORKS_TEMPLATES)
        else:
            matched_intent = "通用问候"
            rand_template = random.choice(SECOND_MESSAGE_TEMPLATES)

        print(f"🧠 [意图识别引擎]: 判定意图为【{matched_intent}】，已匹配精准真人解答话术")

        # 拟人延时 2.0 ~ 3.8 秒后发送第 2 阶段彩金链接
        await asyncio.sleep(random.uniform(2.0, 3.8))
        
        rand_url = get_random_url()
        second_msg = parse_spintax(rand_template).replace("{URL}", rand_url)
        
        try:
            try:
                await client.send_message(chat_id, second_msg, parse_mode='html')
            except Exception:
                await client.send_message(chat_id, second_msg)
            print(f"🚀 [自动补发第2条成功] 已向客户 {sender_id} 推送 100 抗封子域名彩金: {rand_url}")
            record_auto_reply_stat(session_basename, sender_id, sender_name, msg_text, second_msg, rand_url)
        except Exception as e2:
            print(f"❌ [第2条发送失败]: {e2}")
            return False

        # 拟人打字 (Typing) 5.0 ~ 7.5 秒，循环持续发送 typing 动作，确保客户手机端持续显示 "digitando..." (正在打字)
        human_delay = random.uniform(5.0, 7.5)
        print(f"⏳ [模拟真人打字]: 持续输入态 {human_delay:.1f}s 后发送第3阶段频道引流与祝福语...")
        typing_start = time.time()
        while time.time() - typing_start < human_delay:
            try:
                await client(SetTypingRequest(peer=chat_id, action=SendMessageTypingAction()))
            except Exception:
                pass
            await asyncio.sleep(2.0)

        # 发送第 3 阶段祝福语
        third_msg = parse_spintax(random.choice(THIRD_BLESSING_TEMPLATES))
        try:
            await client.send_message(chat_id, third_msg)
            print(f"🍀 [自动补发第3条成功] 已向客户 {sender_id} 推送祝福语: \"{third_msg}\"")
        except Exception as e3:
            print(f"❌ [第3条发送失败]: {e3}")
            return False

        return True
    except Exception as handler_err:
        print(f"⚠️ [处理消息事件异常]: {handler_err}")
        return False

async def start_account_listener(session_path: str, scan_once: bool = False):
    session_basename = os.path.basename(session_path).replace('.session', '')
    clean_digits = re.sub(r'[^0-9]', '', session_basename)
    if clean_digits in BANNED_OBSOLETE_PHONES:
        print(f"🛑 [黑名单过滤] 跳过已弃用/封禁旧号码: +{clean_digits}")
        return

    session_prefix = session_path[:-8] if session_path.endswith('.session') else session_path
    
    # 开启 SQLite WAL 预写日志与并发等待 (30秒超时)，彻底消除多进程 database is locked
    try:
        if os.path.exists(session_path):
            conn = sqlite3.connect(session_path, timeout=30.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA busy_timeout=30000;")
            conn.close()
    except Exception:
        pass
    
    json_path = session_path.replace('.session', '.json')
    json_cfg = {}
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as jf:
                json_cfg = json.load(jf)
        except Exception:
            pass

    api_id = int(json_cfg.get("api_id") or json_cfg.get("app_id") or DEFAULT_API_ID)
    api_hash = str(json_cfg.get("api_hash") or json_cfg.get("app_hash") or DEFAULT_API_HASH)
    device_model = str(json_cfg.get("device_model") or "HP Pavilion P6000 Series")
    system_version = str(json_cfg.get("system_version") or "Windows 10")
    app_version = str(json_cfg.get("app_version") or "3.4.3 x64")

    # 智能 100% 巴西专属独享代理分配
    proxy_tuple = get_proxy_for_account(session_basename, json_cfg)

    # 【SQLite 自动备份机制】运行前自动创建 .session.bak 镜像或损坏自愈
    if not backup_and_heal_session(session_path):
        print(f"⚠️ [跳过无效/空文件]: 账号文件 [{session_basename}.session] 并非有效 Telethon 数据库格式且无健康备份。")
        return

    retry_count = 0
    while True:
        # 【读写分离与锁保护】若调度器正在对此账号执行批量群发，主动让出句柄避让，防止 SQLite 锁死与坏块
        if is_session_locked_by_dispatcher(clean_digits):
            print(f"⏸️ [读写分离保护] 账号 +{clean_digits} 当前正由 tg-dispatcher 进行任务发送，自动让出句柄避让 12 秒...")
            await asyncio.sleep(12)
            continue

        client = None
        try:
            print(f"📡 [{'单次扫描' if scan_once else '24h常驻监听'}] 正在挂载并连接账号: {session_basename} ...")
            
            connected_ok = False
            active_proxy = proxy_tuple
            if active_proxy:
                try:
                    client = TelegramClient(
                        session_prefix,
                        api_id,
                        api_hash,
                        proxy=active_proxy,
                        device_model=device_model,
                        system_version=system_version,
                        app_version=app_version,
                        connection_retries=2,
                        retry_delay=1,
                        auto_reconnect=True,
                        timeout=8
                    )
                    await asyncio.wait_for(client.connect(), timeout=12.0)
                    connected_ok = True
                except Exception as p1_err:
                    try:
                        await client.disconnect()
                    except Exception:
                        pass
                    client = None

            # 若主力代理握手超时，尝试备用巴西代理节点，【绝对禁止 VPS 机房 IP 直连 proxy=None】
            if not connected_ok and len(BRAZIL_PROXY_POOL) > 0:
                backup_idx = (int(clean_digits[-4:]) if (clean_digits and clean_digits[-4:].isdigit()) else 0) % len(BRAZIL_PROXY_POOL)
                backup_proxy_str = BRAZIL_PROXY_POOL[backup_idx]
                backup_tuple = parse_proxy_str(backup_proxy_str)
                if backup_tuple:
                    try:
                        print(f"🔄 [代理故障转移] 账号 +{clean_digits} 主力代理响应慢，切换备用巴西节点重试...")
                        client = TelegramClient(
                            session_prefix,
                            api_id,
                            api_hash,
                            proxy=backup_tuple,
                            device_model=device_model,
                            system_version=system_version,
                            app_version=app_version,
                            connection_retries=2,
                            retry_delay=1,
                            auto_reconnect=True,
                            timeout=10
                        )
                        await asyncio.wait_for(client.connect(), timeout=15.0)
                        connected_ok = True
                    except Exception:
                        try:
                            await client.disconnect()
                        except Exception:
                            pass
                        client = None

            # 🚨 【绝对安全红线】：若全部代理均未通，宁可休眠重试，严禁直连裸连！
            if not connected_ok:
                print(f"🛑 [绝对防封阻断] 账号 +{clean_digits} 代理节点暂不可达，严禁 VPS 机房 IP 裸连直连！休眠 25 秒后重试...")
                await asyncio.sleep(25)
                continue

            if not await client.is_user_authorized():
                print(f"⚠️ [未授权] 账号 {session_basename} 未登录或 Session 已失效。")
                if scan_once:
                    try:
                        await client.disconnect()
                    except Exception:
                        pass
                    return
                try:
                    await client.disconnect()
                except Exception:
                    pass
                await asyncio.sleep(60)
                continue
            
            me = await client.get_me()
            phone_num = getattr(me, 'phone', '') or session_basename
            first_name = getattr(me, 'first_name', '') or ''
            print(f"🟢 [{'扫描' if scan_once else '24h守护就绪'}] 账号 +{phone_num} ({first_name}) 自动追发服务在线！")
            retry_count = 0

            # 初始离线历史扫尾：检查最近私聊，若有客户最新发言未被回复，立即触发补发！
            try:
                dialogs = await client.get_dialogs(limit=25)
                for d in dialogs:
                    if d.is_user and not (getattr(d.entity, 'bot', False)):
                        c_msgs = await client.get_messages(d.entity, limit=3)
                        if c_msgs and not c_msgs[0].out:
                            # 最新一条是客户发言！说明我们还没回！
                            latest_incoming = c_msgs[0]
                            c_sender_id = str(d.entity.id)
                            c_sender_name = getattr(d.entity, 'first_name', '') or getattr(d.entity, 'username', '') or 'Cliente'
                            c_text = str(latest_incoming.message or latest_incoming.text or '')
                            await process_and_reply_customer(
                                client=client,
                                session_basename=session_basename,
                                chat_id=d.entity.id,
                                incoming_msg_id=latest_incoming.id,
                                msg_text=c_text,
                                sender_name=c_sender_name
                            )
            except Exception as sweep_err:
                print(f"ℹ️ [初始离线扫尾提示]: {sweep_err}")

            if scan_once:
                print(f"✅ 账号 +{phone_num} 扫描补发完毕。")
                return

            # 引擎 1：实时长连接 NewMessage 监听事件
            @client.on(events.NewMessage(incoming=True))
            async def handle_incoming_message(event):
                try:
                    if not event.is_private:
                        return
                    sender_name = ""
                    try:
                        sender = await event.get_sender()
                        if sender:
                            sender_name = getattr(sender, 'first_name', '') or getattr(sender, 'username', '') or ''
                    except Exception:
                        pass
                    msg_text = str(event.text or event.raw_text or "").strip()
                    await process_and_reply_customer(
                        client=client,
                        session_basename=session_basename,
                        chat_id=event.chat_id,
                        incoming_msg_id=getattr(event.message, 'id', 0),
                        msg_text=msg_text,
                        sender_name=sender_name
                    )
                except Exception as e:
                    print(f"⚠️ [事件分发异常]: {e}")

            # 引擎 2（双保险）：后台定时巡检扫尾协程（每 20~30 秒自动巡检一次最近对话，防止网络断流、事件漏推）
            async def background_periodic_sweep():
                while True:
                    try:
                        await asyncio.sleep(random.uniform(20.0, 30.0))
                        if not client.is_connected():
                            continue
                        recent_dialogs = await client.get_dialogs(limit=25)
                        for d in recent_dialogs:
                            if d.is_user and not (getattr(d.entity, 'bot', False)):
                                c_msgs = await client.get_messages(d.entity, limit=2)
                                if c_msgs and not c_msgs[0].out:
                                    latest_incoming = c_msgs[0]
                                    c_text = str(latest_incoming.message or latest_incoming.text or '')
                                    c_sender_name = getattr(d.entity, 'first_name', '') or getattr(d.entity, 'username', '') or 'Cliente'
                                    await process_and_reply_customer(
                                        client=client,
                                        session_basename=session_basename,
                                        chat_id=d.entity.id,
                                        incoming_msg_id=latest_incoming.id,
                                        msg_text=c_text,
                                        sender_name=c_sender_name
                                    )
                    except asyncio.CancelledError:
                        break
                    except Exception as loop_sweep_err:
                        await asyncio.sleep(10.0)

            # 引擎 3（保活心跳）：长连接防假死与心跳探活（每 45 秒向 TG 发送轻量探针，一旦假死立即自愈重连）
            async def background_keep_alive():
                while True:
                    try:
                        await asyncio.sleep(45.0)
                        if client.is_connected():
                            from telethon.tl.functions.updates import GetStateRequest
                            await asyncio.wait_for(client(GetStateRequest()), timeout=10.0)
                    except asyncio.CancelledError:
                        break
                    except Exception as hb_err:
                        print(f"⚠️ [心跳检测到网络断开] 账号 {session_basename}: {hb_err}，立即触发自愈重连...")
                        try:
                            await client.disconnect()
                        except Exception:
                            pass
                        break

            sweep_task = asyncio.create_task(background_periodic_sweep())
            hb_task = asyncio.create_task(background_keep_alive())

            try:
                # 保持长连接常驻
                await client.run_until_disconnected()
                print(f"ℹ️ [连接断开] 账号 {session_basename} 守护连接已断开，3秒后自动重新建立...")
            finally:
                sweep_task.cancel()
                hb_task.cancel()

        except Exception as err:
            retry_count += 1
            print(f"⚠️ [账号 {session_basename} 守护异常]: {err}")
            if scan_once:
                return
        finally:
            if client:
                try:
                    await client.disconnect()
                except Exception:
                    pass
            if scan_once:
                return
            await asyncio.sleep(3.0)

async def main():
    scan_once = "--scan-once" in sys.argv
    mode_name = "单次全网扫描补发" if scan_once else "24小时自动追发常驻守护 (Daemon)"
    print("==================================================")
    print(f"🤖 Telegram {mode_name}")
    print("==================================================")

    # 单例进程锁保护（防止后台与 PM2 重复启动两个实例导致 SQLite 文件锁冲突）
    if not scan_once:
        pid_file = os.path.join(os.getcwd(), "sessions", "auto_responder.pid")
        try:
            os.makedirs(os.path.dirname(pid_file), exist_ok=True)
            if os.path.exists(pid_file):
                try:
                    with open(pid_file, "r") as pf:
                        old_pid = int(pf.read().strip())
                    if old_pid != os.getpid():
                        # 检查旧 PID 是否还存活
                        try:
                            os.kill(old_pid, 0)
                            print(f"ℹ️ [单例保护] 已有守护实例在运行 (PID: {old_pid})，当前进程直接退出，避免冲突。")
                            return
                        except OSError:
                            pass
                except Exception:
                    pass
            with open(pid_file, "w") as pf:
                pf.write(str(os.getpid()))
        except Exception:
            pass

    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_dirs = [
        os.path.join(script_dir, "sessions"),
        script_dir,
        os.path.join(os.getcwd(), "sessions"),
        os.getcwd(),
        "/root/tg-dispatcher-v2/sessions",
        "/root/tg-dispatcher-v2",
        "/root/tg-dispatcher/sessions",
        "/root/tg-dispatcher"
    ]

    session_files = []
    seen = set()
    for p_dir in possible_dirs:
        if os.path.exists(p_dir):
            for sf in glob.glob(os.path.join(p_dir, "*.session")):
                basename = os.path.basename(sf)
                digits = re.sub(r'[^0-9]', '', basename)
                if digits in BANNED_OBSOLETE_PHONES:
                    continue
                if sf not in seen and is_valid_telethon_session(sf):
                    seen.add(sf)
                    session_files.append(sf)

    print(f"📱 扫描到已挂载有效账号: {len(session_files)} 个")
    if not session_files:
        print("未发现有效 .session 文件，退出")
        return

    # 并发执行每个账号的独立监听，return_exceptions=True 保证任意单个账号报错不影响集群
    tasks = [start_account_listener(sf, scan_once=scan_once) for sf in session_files]
    await asyncio.gather(*tasks, return_exceptions=True)

if __name__ == "__main__":
    asyncio.run(main())
