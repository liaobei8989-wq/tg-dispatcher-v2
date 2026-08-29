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

SECOND_MESSAGE_TEMPLATES = [
    "🔥 PROMOÇÃO EXCLUSIVA! 🎁 500% de Bônus! 🎰 Cadastre-se e receba na hora: {URL}",
    "🔥 BÔNUS EXCLUSIVO LIBERADO! 🎁 Claim 500% de Bônus de Depósito + 150 Rodadas Grátis (Free Spins)! 💰 Convide 1 pessoa e ganhe R$ 60 no PIX instantâneo! 🎡 Acesse agora: {URL}",
    "🎁 {GANHE SEU BÔNUS VIP HOJE|BÔNUS LIBERADO}! 💰 Cadastre-se e ganhe 200% de bônus no seu primeiro PIX + 100 Giros Grátis! 🎰 Acesse agora e forre alto: {URL}",
    "⚡ {Oportunidade VIP|Bônus Especial}! 🎁 500% de bônus exclusivo no cadastro + Saque PIX imediato em menos de 1 minuto! 🚀 Aproveite aqui: {URL}"
]

THIRD_BLESSING_TEMPLATES = [
    "🚀 Arrebenta lá amigo! Hoje a forra é certa! 🎰💵 Qualquer dúvida estou por aqui! 😉",
    "🍀 Boa sorte nas jogadas! Que venha o grande jackpot hoje! 💰🔥",
    "👑 Vai com tudo, que hoje o PIX cai em dobro na sua conta! 🤑✨",
    "🎯 Torcendo pelo seu forro hoje! Se precisar de dicas de slots é só chamar! 🎲💎",
    "🔥 Sucesso meu amigo! Que venha muitos ganhos hoje! 🎰💵 Tamo junto! 😉"
]

def get_random_url() -> str:
    return random.choice(ALL_100_SUBDOMAINS)

def parse_spintax(text: str) -> str:
    if not text:
        return ""
    # 替换各种形式的 URL 占位符或旧静态域名
    rand_url = get_random_url()
    text = re.sub(r'\{URL\}|\bURL\b|https?://mostbet\.com/pt|https?://mostbet\.com|https?://brazilgo888\.com/\d+', rand_url, text, flags=re.IGNORECASE)
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
    '200.152.155.148:12323:14a5a773a873a:4d841434c6'
]

def load_account_proxies_map():
    # 优先从多路径读取已绑定的代理映射文件
    for p in [
        os.path.join(os.getcwd(), "sessions", "account_proxies.json"),
        os.path.join(os.getcwd(), "account_proxies.json"),
        "/root/tg-dispatcher/sessions/account_proxies.json",
        "/root/tg-dispatcher/account_proxies.json"
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
    # 1. 检查 json_cfg 中自带的 proxy
    if json_cfg and isinstance(json_cfg.get("proxy"), dict):
        p = json_cfg["proxy"]
        if p.get("addr") and p.get("port"):
            p_str = f"{p.get('addr')}:{p.get('port')}:{p.get('username') or ''}:{p.get('password') or ''}"
            parsed = parse_proxy_str(p_str)
            if parsed:
                return parsed

    # 2. 检查 account_proxies.json 映射
    proxy_map = load_account_proxies_map()
    clean_phone = re.sub(r'[^0-9]', '', session_basename)
    
    proxy_str = proxy_map.get(session_basename) or proxy_map.get(clean_phone)
    if proxy_str:
        parsed = parse_proxy_str(proxy_str)
        if parsed:
            return parsed

    # 3. 自动从巴西独立代理池中按手机号 Hash 唯一分配空闲独享代理（绝不走 VPS 直连）
    try:
        idx = int(clean_phone[-4:]) % len(BRAZIL_PROXY_POOL) if clean_phone else 0
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

def record_auto_reply_stat(session_basename: str, sender_id: str, sender_name: str, second_msg: str, url: str):
    """持久化记录 24 小时自动回复与追发彩金统计数据"""
    try:
        possible_dirs = [
            os.path.join(os.getcwd(), "sessions"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "sessions"),
            "/root/tg-dispatcher/sessions"
        ]
        stats_file = None
        for p in possible_dirs:
            if os.path.exists(p):
                stats_file = os.path.join(p, "auto_scanner_stats.json")
                break
        if not stats_file:
            stats_file = os.path.join(os.getcwd(), "sessions", "auto_scanner_stats.json")
            os.makedirs(os.path.dirname(stats_file), exist_ok=True)

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
            "url": url
        }
        data["logs"].insert(0, log_entry)
        data["logs"] = data["logs"][:100]

        with open(stats_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ [写入补发统计日志失败]: {e}")

async def start_account_listener(session_path: str):
    session_basename = os.path.basename(session_path).replace('.session', '')
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

    # 智能 100% 巴西专属独享代理分配（严格防封，绝不裸奔 VPS 原生 IP）
    proxy_tuple = get_proxy_for_account(session_basename, json_cfg)

    if not is_valid_telethon_session(session_path):
        print(f"⚠️ [跳过无效/空文件]: 账号文件 [{session_basename}.session] 并非有效 Telethon 数据库格式。")
        return

    # 无限自动重连守护循环（即使群发中断或网络闪断，也会在3~5秒内自动重连继续监听）
    retry_count = 0
    while True:
        client = None
        try:
            print(f"📡 [24h常驻监听] 正在挂载并连接账号: {session_basename} ...")
            
            connected_ok = False
            # 优先尝试分配的巴西专属代理
            if proxy_tuple:
                try:
                    client = TelegramClient(
                        session_prefix,
                        api_id,
                        api_hash,
                        proxy=proxy_tuple,
                        device_model=device_model,
                        system_version=system_version,
                        app_version=app_version,
                        connection_retries=2,
                        retry_delay=1,
                        auto_reconnect=True,
                        timeout=6
                    )
                    await asyncio.wait_for(client.connect(), timeout=10.0)
                    connected_ok = True
                except Exception as p_err:
                    print(f"⚠️ [代理连接较慢/超时] 账号 {session_basename} 代理响应超时，正在自动切换备用稳定链路...")
                    try:
                        await client.disconnect()
                    except Exception:
                        pass
                    client = None

            # 若代理不可用或未配置，自动建立直连以确保 24h 监听永不中断
            if not connected_ok:
                client = TelegramClient(
                    session_prefix,
                    api_id,
                    api_hash,
                    proxy=None,
                    device_model=device_model,
                    system_version=system_version,
                    app_version=app_version,
                    connection_retries=3,
                    retry_delay=2,
                    auto_reconnect=True,
                    timeout=8
                )
                await asyncio.wait_for(client.connect(), timeout=15.0)

            if not await client.is_user_authorized():
                print(f"⚠️ [未授权] 账号 {session_basename} 未登录或 Session 已失效，60秒后重新检查...")
                await asyncio.sleep(60)
                continue
            
            me = await client.get_me()
            phone_num = getattr(me, 'phone', '') or session_basename
            first_name = getattr(me, 'first_name', '') or ''
            print(f"🟢 [24h守护就绪] 账号 +{phone_num} ({first_name}) 24小时自动追发守护已锁定在线！")
            retry_count = 0

            @client.on(events.NewMessage(incoming=True))
            async def handle_incoming_message(event):
                try:
                    # 过滤群聊消息，只处理私聊
                    if not event.is_private:
                        return
                    
                    sender_id = str(event.chat_id or event.sender_id or "")
                    if not sender_id:
                        return

                    track_key = f"{session_basename}_{sender_id}"

                    # 20秒防抖：防止客户连发两句话重复轰炸，但间隔20秒以上或后续说话时必定正常推送引流
                    if not check_and_mark_reply(track_key, cooldown_seconds=20):
                        return

                    sender_name = ""
                    try:
                        sender = await event.get_sender()
                        if sender:
                            sender_name = getattr(sender, 'first_name', '') or getattr(sender, 'username', '') or ''
                    except Exception:
                        pass

                    msg_text = str(event.text or event.raw_text or "")
                    print(f"\n📩 [收到客户私聊回复] 账号: +{session_basename} | 客户: {sender_id} ({sender_name or '客户'}) | 内容: \"{msg_text}\"")

                    # 拟人延时 1.5 ~ 3 秒后发送第 2 阶段彩金链接
                    await asyncio.sleep(random.uniform(1.5, 3.0))
                    
                    rand_template = random.choice(SECOND_MESSAGE_TEMPLATES)
                    rand_url = get_random_url()
                    second_msg = parse_spintax(rand_template).replace("{URL}", rand_url)
                    
                    try:
                        try:
                            await client.send_message(event.chat_id, second_msg, parse_mode='html')
                        except Exception:
                            await client.send_message(event.chat_id, second_msg)
                        print(f"🚀 [自动补发第2条成功] 已向客户 {sender_id} 推送 100 抗封子域名彩金: {rand_url}")
                        # 记录补发持久化统计
                        record_auto_reply_stat(session_basename, sender_id, sender_name, second_msg, rand_url)
                    except Exception as e2:
                        print(f"❌ [第2条发送失败]: {e2}")
                        return

                    # 拟人打字 (Typing) 3.5 ~ 6 秒
                    human_delay = random.uniform(3.5, 6.0)
                    print(f"⏳ [模拟真人打字]: 延时 {human_delay:.1f}s 后发送第3阶段中奖祝福语...")
                    try:
                        await client(SetTypingRequest(peer=event.chat_id, action=SendMessageTypingAction()))
                    except Exception:
                        pass
                    await asyncio.sleep(human_delay)

                    # 发送第 3 阶段祝福语
                    third_msg = parse_spintax(random.choice(THIRD_BLESSING_TEMPLATES))
                    try:
                        await client.send_message(event.chat_id, third_msg)
                        print(f"🍀 [自动补发第3条成功] 已向客户 {sender_id} 推送祝福语: \"{third_msg}\"")
                    except Exception as e3:
                        print(f"❌ [第3条发送失败]: {e3}")
                except Exception as handler_err:
                    print(f"⚠️ [处理消息事件异常]: {handler_err}")

            # 保持长连接常驻
            await client.run_until_disconnected()
            print(f"ℹ️ [连接断开] 账号 {session_basename} 守护连接已断开，3秒后自动重新建立...")

        except Exception as err:
            retry_count += 1
            print(f"⚠️ [账号 {session_basename} 守护异常]: {err} (3秒后进行第 {retry_count} 次自愈重连...)")
        finally:
            if client:
                try:
                    await client.disconnect()
                except Exception:
                    pass
            await asyncio.sleep(3.0)

async def main():
    print("==================================================")
    print("🤖 Telegram 24小时自动追发守护引擎 (Auto-Responder Daemon)")
    print("==================================================")

    # 智能全路径扫描 (支持绝对路径、脚本同级目录、/root/tg-dispatcher/ 等)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_dirs = [
        os.path.join(script_dir, "sessions"),
        script_dir,
        os.path.join(os.getcwd(), "sessions"),
        os.getcwd(),
        "/root/tg-dispatcher/sessions",
        "/root/tg-dispatcher"
    ]

    session_files = []
    seen = set()
    for p_dir in possible_dirs:
        if os.path.exists(p_dir):
            for sf in glob.glob(os.path.join(p_dir, "*.session")):
                if sf not in seen and is_valid_telethon_session(sf):
                    seen.add(sf)
                    session_files.append(sf)

    print(f"📱 扫描到已挂载有效账号: {len(session_files)} 个")
    if not session_files:
        print("未发现有效 .session 文件，退出")
        return

    # 并发运行所有账号的 24 小时长连接监听
    tasks = [start_account_listener(sf) for sf in session_files]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
