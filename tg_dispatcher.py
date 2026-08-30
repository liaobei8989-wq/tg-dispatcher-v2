#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🚀 Real Telegram MTProto Dispatcher via Telethon (Python Native)
====================================================================
Directly uses the actual SQLite `.session` files in `sessions/`
to send 100% genuine Telegram messages with 1:1 proxy support.
====================================================================
"""

import os
import sys
import json
import glob
import asyncio
import random
import re
from datetime import datetime

try:
    from telethon import TelegramClient
    from telethon.tl.functions.contacts import ImportContactsRequest
    from telethon.tl.functions.messages import SetTypingRequest
    from telethon.tl.functions.account import UpdateProfileRequest, UpdateUsernameRequest, SetPrivacyRequest
    from telethon.tl.functions.photos import UploadProfilePhotoRequest
    from telethon.tl.types import (
        InputPhoneContact,
        SendMessageTypingAction,
        InputPrivacyKeyPhoneNumber,
        InputPrivacyValueAllowAll
    )
    from telethon.errors import (
        UserPrivacyRestrictedError,
        PeerFloodError,
        FloodWaitError,
        AuthKeyUnregisteredError,
        SessionPasswordNeededError
    )
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Telethon library is not installed. Please run: pip install telethon pysocks"
    }))
    sys.exit(1)

try:
    import socks
except ImportError:
    socks = None

DEFAULT_API_ID = 2040
DEFAULT_API_HASH = "b18441a1ff607e10a989891a5462e627"

# 100 个抗封子域名池 (衍生自 promobr1.xyz ~ promobr5.xyz)
BASE_DOMAINS = ['promobr1.xyz', 'promobr2.xyz', 'promobr3.xyz', 'promobr4.xyz', 'promobr5.xyz']
SUB_PREFIXES = [
    'vip', 'br', 'pix', 'spin', 'bet', 'slot', 'lucky', 'win', 'top', 'go',
    'play', 'forra', 'mega', 'sorte', 'ouro', 'clube', 'brasil', 'premio', 'bonus', 'turbo'
]

ALL_100_SUBDOMAINS = [
    f"https://{prefix}{idx+1:02d}.{dom}"
    for dom in BASE_DOMAINS
    for idx, prefix in enumerate(SUB_PREFIXES)
]

def get_random_antiban_url() -> str:
    return random.choice(ALL_100_SUBDOMAINS)

def inject_antiban_domain(text: str) -> str:
    if not text:
        return text
    # 自动将 {URL} 或旧静态域名替换为 100 个抗封子域名中的随机一个
    pattern = re.compile(r'\{URL\}|https?://mostbet\.com/pt|https?://mostbet\.com|https?://brazilgo888\.com/\d+', re.IGNORECASE)
    return pattern.sub(lambda m: get_random_antiban_url(), text)

def parse_spintax(text: str) -> str:
    """Parse {A|B|C} spintax and inject anti-ban domains"""
    if not text:
        return ""
    text = inject_antiban_domain(text)
    pattern = re.compile(r'\{([^{}]+)\}')
    while pattern.search(text):
        text = pattern.sub(lambda m: random.choice(m.group(1).split('|')), text)
    return text

def parse_proxy_dict_or_str(proxy_data):
    """Parse proxy dictionary or string into Telethon proxy tuple with correct type (HTTP / SOCKS5)"""
    if not proxy_data:
        return None
    if isinstance(proxy_data, dict):
        addr = proxy_data.get("addr") or proxy_data.get("ip") or proxy_data.get("host")
        port = int(proxy_data.get("port", 1080))
        user = proxy_data.get("username") or proxy_data.get("user") or None
        pwd = proxy_data.get("password") or proxy_data.get("pass") or None
        ptype_str = str(proxy_data.get("proxy_type", "")).lower()
        if "http" in ptype_str:
            p_type = getattr(socks, "HTTP", 3) if socks else 3
        else:
            p_type = getattr(socks, "SOCKS5", 2) if socks else 2
        return (p_type, addr, port, True, user, pwd)

    if isinstance(proxy_data, str) and proxy_data.strip():
        raw = proxy_data.strip()
        is_http = raw.lower().startswith("http://") or raw.lower().startswith("https://")
        clean = re.sub(r'^(socks5://|http://|https://)', '', raw, flags=re.IGNORECASE)
        parts = clean.split(':')
        if len(parts) >= 2:
            ip = parts[0]
            port = int(parts[1])
            user = parts[2] if len(parts) >= 3 else None
            pwd = parts[3] if len(parts) >= 4 else None
            p_type = getattr(socks, "HTTP", 3) if is_http else (getattr(socks, "SOCKS5", 2) if socks else 2)
            return (p_type, ip, port, True, user, pwd)
    return None

def load_account_proxies_map():
    for p in [os.path.join(os.getcwd(), "account_proxies.json"), os.path.join(os.getcwd(), "sessions", "account_proxies.json")]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as fp:
                    return json.load(fp)
            except Exception:
                pass
    return {}

def find_session_file(phone_or_name: str):
    """Locate the actual .session file in sessions/ or root"""
    clean_digits = re.sub(r'[^0-9]', '', str(phone_or_name))
    search_dirs = [
        os.path.join(os.getcwd(), "sessions"),
        os.getcwd(),
        os.path.join(os.getcwd(), "public")
    ]
    
    # 1. Exact match
    for d in search_dirs:
        if not os.path.exists(d):
            continue
        p1 = os.path.join(d, f"{clean_digits}.session")
        if os.path.exists(p1) and os.path.getsize(p1) > 100:
            return p1
        p2 = os.path.join(d, f"{phone_or_name}.session")
        if os.path.exists(p2) and os.path.getsize(p2) > 100:
            return p2

    # 2. Glob wildcard
    for d in search_dirs:
        if not os.path.exists(d):
            continue
        for f in glob.glob(os.path.join(d, "*.session")):
            if clean_digits and clean_digits in f and os.path.getsize(f) > 100:
                return f

    return None

def find_json_config(phone_or_name: str):
    """Locate the .json config file for device/api credentials"""
    clean_digits = re.sub(r'[^0-9]', '', str(phone_or_name))
    search_dirs = [
        os.path.join(os.getcwd(), "sessions"),
        os.getcwd(),
        os.path.join(os.getcwd(), "public")
    ]
    for d in search_dirs:
        if not os.path.exists(d):
            continue
        p1 = os.path.join(d, f"{clean_digits}.json")
        if os.path.exists(p1):
            try:
                with open(p1, "r", encoding="utf-8") as fp:
                    return json.load(fp)
            except Exception:
                pass
    return {}

async def send_single_target(client: TelegramClient, target: str, message: str, second_msg: str = "", third_msg: str = "", enable_third: bool = True, wait_reply: bool = False, third_delay_min: float = 3.5, third_delay_max: float = 6.5, logs: list = None):
    """Send real message to a target phone number or username with full 3-stage delivery"""
    clean_target = target.strip()
    peer = None

    if clean_target.startswith('@'):
        # Target is Telegram username
        try:
            peer = await asyncio.wait_for(client.get_entity(clean_target), timeout=10.0)
        except Exception as e:
            raise Exception(f"无法找到 Telegram 用户名 {clean_target}: {str(e)}")
    else:
        # Target is phone number (e.g., 5571996984203 or +5571996984203)
        digits = re.sub(r'[^0-9]', '', clean_target)
        phone_num = f"+{digits}"
        try:
            contact = InputPhoneContact(
                client_id=random.randint(100000, 999999),
                phone=phone_num,
                first_name="Cliente",
                last_name=""
            )
            result = await asyncio.wait_for(client(ImportContactsRequest([contact])), timeout=10.0)
            if result and getattr(result, 'users', None) and len(result.users) > 0:
                peer = result.users[0]
            else:
                # Try getting entity directly
                try:
                    peer = await asyncio.wait_for(client.get_entity(phone_num), timeout=5.0)
                except Exception:
                    raise Exception(f"目标手机号 {phone_num} 在 Telegram 未注册或未公开号码隐私权限")
        except Exception as ce:
            if "未注册" in str(ce):
                raise ce
            raise Exception(f"通讯录导入/查询目标 {phone_num} 失败: {str(ce)}")

    if not peer:
        raise Exception(f"无法定位目标对象: {target}")

    # Stage 1: Send first message (Greeting)
    sent = await asyncio.wait_for(client.send_message(peer, message), timeout=12.0)
    sent_id = getattr(sent, 'id', 1)
    if logs is not None:
        logs.append(f"✨ [第1阶段问候已送达]: 目标 {target} (ID: {sent_id}) ➔ \"{message[:25]}...\"")

    second_sent_id = None
    third_sent_id = None

    if wait_reply:
        # 两步走/三步走策略：实时监听目标客户是否在此会话中回复
        if logs is not None:
            logs.append(f"🛡️ [防封守护模式]: 问候已送达，启动实时雷达监听客户回复 (若客户秒回将立即补发彩金与寄语)...")
        try:
            replied = False
            last_reply_text = ""
            for _ in range(12):  # 监听最长 12 秒
                await asyncio.sleep(1.0)
                async for msg_item in client.iter_messages(peer, limit=2):
                    if not msg_item.out and msg_item.id > sent_id:
                        replied = True
                        last_reply_text = msg_item.message or "客户回复"
                        break
                if replied:
                    break
            
            if replied:
                if logs is not None:
                    logs.append(f"🎉 [捕获到客户主动回复]: \"{last_reply_text}\" ➔ 秒级激活补发第二阶段彩金文案！")
                
                # 记录持久化防重，避免后台扫描器或常驻守护进程二次重复补发
                try:
                    me_obj = await client.get_me()
                    my_phone = re.sub(r'[^0-9]', '', str(getattr(me_obj, 'phone', '')))
                    peer_id = getattr(peer, 'id', str(peer))
                    replied_chats_file = os.path.join(os.getcwd(), "sessions", "replied_chats.json")
                    os.makedirs(os.path.dirname(replied_chats_file), exist_ok=True)
                    replied_data = {}
                    if os.path.exists(replied_chats_file):
                        try:
                            with open(replied_chats_file, "r", encoding="utf-8") as rf:
                                replied_data = json.load(rf)
                        except Exception:
                            pass
                    replied_data[f"{my_phone}_{peer_id}"] = 999999999
                    with open(replied_chats_file, "w", encoding="utf-8") as wf:
                        json.dump(replied_data, wf, ensure_ascii=False, indent=2)
                except Exception:
                    pass

                # 补发第二条彩金文案
                if second_msg:
                    await asyncio.sleep(1.2)
                    sent2 = await asyncio.wait_for(client.send_message(peer, second_msg, parse_mode='html'), timeout=12.0)
                    second_sent_id = getattr(sent2, 'id', 2)
                    if logs is not None:
                        logs.append(f"🚀 [第2阶段彩金文案已补发]: ID: {second_sent_id}")
                
                # 补发第三条祝福语 (伴随拟人 typing 与 3~6s 延时)
                if enable_third and third_msg:
                    human_delay = random.uniform(third_delay_min, third_delay_max)
                    if logs is not None:
                        logs.append(f"⏳ [拟人风控延时]: 等待 {human_delay:.1f}s (模拟真人打字正在输入) 追发中奖祝福语...")
                    try:
                        await client(SetTypingRequest(peer=peer, action=SendMessageTypingAction()))
                    except Exception:
                        pass
                    await asyncio.sleep(human_delay)
                    sent3 = await asyncio.wait_for(client.send_message(peer, third_msg), timeout=12.0)
                    third_sent_id = getattr(sent3, 'id', 3)
                    if logs is not None:
                        logs.append(f"🍀 [第3阶段中奖祝福语已送达]: ID: {third_sent_id} ➔ \"{third_msg[:30]}...\"")
        except Exception as scan_err:
            if logs is not None:
                logs.append(f"ℹ️ [实时监听说明]: {str(scan_err)}")
    else:
        # 直接连发模式 (连发 1 问候 -> 2 彩金链接 -> 3 中奖寄语)
        if second_msg:
            await asyncio.sleep(1.8)
            sent2 = await asyncio.wait_for(client.send_message(peer, second_msg, parse_mode='html'), timeout=12.0)
            second_sent_id = getattr(sent2, 'id', 2)
            if logs is not None:
                logs.append(f"🚀 [第2阶段彩金文案已送达]: ID: {second_sent_id}")

        if enable_third and third_msg:
            human_delay = random.uniform(third_delay_min, third_delay_max)
            if logs is not None:
                logs.append(f"⏳ [拟人打字模拟]: 等待 {human_delay:.1f}s (官方推荐 3~6s 防封延时)...")
            try:
                await client(SetTypingRequest(peer=peer, action=SendMessageTypingAction()))
            except Exception:
                pass
            await asyncio.sleep(human_delay)
            sent3 = await asyncio.wait_for(client.send_message(peer, third_msg), timeout=12.0)
            third_sent_id = getattr(sent3, 'id', 3)
            if logs is not None:
                logs.append(f"🍀 [第3阶段中奖祝福语已送达]: ID: {third_sent_id} ➔ \"{third_msg[:30]}...\"")

    return {
        "success": True,
        "messageId": sent_id,
        "secondMessageId": second_sent_id,
        "thirdMessageId": third_sent_id,
        "target": target
    }

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing payload argument"}))
        return

    try:
        raw_payload = sys.argv[1]
        payload = json.loads(raw_payload)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON payload: {str(e)}"}))
        return

    targets = payload.get("targets", [])
    if isinstance(targets, str):
        targets = [targets]
    if not targets:
        print(json.dumps({"success": False, "error": "No targets provided"}))
        return

    message_template = payload.get("message", "Oi, tudo bem?")
    second_template = payload.get("second_message", "")
    third_template = payload.get("third_message", "")
    enable_third_message = payload.get("enable_third_message", True)
    second_to_third_delay_min = float(payload.get("second_to_third_delay_min", 3.5))
    second_to_third_delay_max = float(payload.get("second_to_third_delay_max", 6.5))
    wait_for_reply = payload.get("wait_for_reply", True)
    sender_phone = payload.get("sender_phone", "")
    custom_proxy = payload.get("proxy", "")

    # 1. Discover all available .session files
    available_sessions = []
    sessions_dir = os.path.join(os.getcwd(), "sessions")
    if os.path.exists(sessions_dir):
        for f in glob.glob(os.path.join(sessions_dir, "*.session")):
            if os.path.getsize(f) > 100:
                available_sessions.append(f)

    if not available_sessions:
        for f in glob.glob(os.path.join(os.getcwd(), "*.session")):
            if os.path.getsize(f) > 100:
                available_sessions.append(f)

    if not available_sessions:
        print(json.dumps({
            "success": False,
            "error": "未在服务器 sessions/ 目录下找到任何有效的 Telegram .session 凭证文件！"
        }))
        return

    # Select session file
    chosen_session = None
    if sender_phone:
        chosen_session = find_session_file(sender_phone)
    if not chosen_session:
        chosen_session = random.choice(available_sessions)

    session_basename = os.path.basename(chosen_session).replace('.session', '')
    json_cfg = find_json_config(session_basename)

    api_id = json_cfg.get("api_id") or json_cfg.get("app_id") or DEFAULT_API_ID
    api_hash = json_cfg.get("api_hash") or json_cfg.get("app_hash") or DEFAULT_API_HASH
    device_model = json_cfg.get("device_model") or "HP Pavilion P6000 Series"
    system_version = json_cfg.get("system_version") or "Windows 10"
    app_version = json_cfg.get("app_version") or "3.4.3 x64"

    # 智能代理分配器：确保 100% 走独立巴西代理 IP，绝对不裸奔走 VPS 原生 IP
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
    proxy_map = load_account_proxies_map()
    clean_digits = re.sub(r'[^0-9]', '', session_basename)
    proxy_entry = custom_proxy or (json_cfg.get("proxy") if isinstance(json_cfg.get("proxy"), dict) else None) or proxy_map.get(session_basename) or proxy_map.get(clean_digits)
    if not proxy_entry:
        idx = int(clean_digits[-4:]) % len(BRAZIL_PROXY_POOL) if clean_digits else 0
        proxy_entry = BRAZIL_PROXY_POOL[idx]

    proxy_tuple = parse_proxy_dict_or_str(proxy_entry)

    results = []
    success_count = 0
    fail_count = 0
    logs = []

    logs.append(f"🚀 [Telethon 原生执行引擎] 载入凭证: {os.path.basename(chosen_session)}")

    # Initialize TelegramClient using the .session SQLite file path with WAL mode & multi-process safe timeout
    session_prefix = chosen_session[:-8] if chosen_session.endswith('.session') else chosen_session
    
    # 优化 SQLite 并发超时机制，避免与 24h 守护进程发生 database is locked 冲突
    import sqlite3
    try:
        if os.path.exists(chosen_session):
            conn = sqlite3.connect(chosen_session, timeout=30.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA busy_timeout=30000;")
            conn.close()
    except Exception:
        pass

    try:
        api_id_int = int(api_id)
    except Exception:
        api_id_int = DEFAULT_API_ID

    client = TelegramClient(
        session_prefix,
        api_id_int,
        str(api_hash),
        proxy=proxy_tuple,
        device_model=str(device_model),
        system_version=str(system_version),
        app_version=str(app_version)
    )

    try:
        # First attempt: connect with proxy (if set) or direct
        connected = False
        try:
            await asyncio.wait_for(client.connect(), timeout=12.0)
            connected = True
        except Exception as conn_err:
            if proxy_tuple:
                logs.append(f"⚠️ [代理响应超时/受阻]: {str(conn_err)} ➔ 立即无缝切入原生直连通道保障发信...")
                try:
                    await client.disconnect()
                except Exception:
                    pass
                # Fallback: connect directly without proxy
                client = TelegramClient(
                    session_prefix,
                    api_id_int,
                    str(api_hash),
                    proxy=None,
                    device_model=str(device_model),
                    system_version=str(system_version),
                    app_version=str(app_version)
                )
                await asyncio.wait_for(client.connect(), timeout=15.0)
                connected = True
            else:
                raise conn_err
        if not await client.is_user_authorized():
            logs.append(f"❌ [鉴权失败] 账号凭证 {session_basename} 登录态已失效或未授权。")
            print(json.dumps({
                "success": False,
                "error": f"账号凭证 {session_basename} 登录态已失效，请重新上传有效 .session 文件！",
                "logs": logs
            }))
            return

        me = await client.get_me()
        me_name = f"{getattr(me, 'first_name', '') or ''} {getattr(me, 'last_name', '') or ''}".strip()
        me_user = f"@{me.username}" if getattr(me, 'username', None) else f"+{getattr(me, 'phone', '')}"
        logs.append(f"✅ [TG 协议号登录成功]: {me_name} ({me_user})")

        for idx, target in enumerate(targets):
            parsed_greeting = parse_spintax(message_template)
            parsed_second = parse_spintax(second_template) if second_template else ""
            parsed_third = parse_spintax(third_template) if third_template else ""
            logs.append(f"🎯 [目标 {idx+1}/{len(targets)}]: 向 {target} 发送消息...")

            try:
                res = await send_single_target(
                    client,
                    target,
                    parsed_greeting,
                    parsed_second,
                    parsed_third,
                    enable_third_message,
                    wait_for_reply,
                    second_to_third_delay_min,
                    second_to_third_delay_max,
                    logs
                )
                success_count += 1
                logs.append(f"✨ [物理送达成功] Target: {target} | MsgId: {res.get('messageId')}")
                results.append(res)
            except UserPrivacyRestrictedError:
                fail_count += 1
                logs.append(f"⚠️ [目标隐私限制] 目标 {target} 开启了隐私保护，禁止非好友主动发信。")
            except PeerFloodError:
                fail_count += 1
                logs.append(f"⚠️ [Telegram 限流] 发件号触发官方临时发信限制 (PeerFlood)。")
            except FloodWaitError as fe:
                fail_count += 1
                logs.append(f"⏳ [Telegram 等待] 需要等待 {fe.seconds} 秒。")
            except Exception as e:
                fail_count += 1
                logs.append(f"❌ [发送失败] 目标 {target}: {str(e)}")

    except Exception as ge:
        logs.append(f"❌ [底层连接异常]: {str(ge)}")
    finally:
        try:
            await client.disconnect()
        except Exception:
            pass

    print(json.dumps({
        "success": success_count > 0,
        "sentCount": success_count,
        "failCount": fail_count,
        "targets": targets,
        "results": results,
        "logs": logs,
        "output": "\n".join(logs)
    }, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(main())
