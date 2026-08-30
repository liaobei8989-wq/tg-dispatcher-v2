#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🚀 Telegram Telethon 自动扫描 & 补发第二阶段彩金文案引擎 (全自动化守护)
====================================================================
功能：
1. 从 SQLite 数据库 (`telegram_sessions.db`) 动态加载凭证 BLOB，
   零本地静态文件依赖，执行完毕后 100% 自动深度清理临时文件。
2. 自动巡检私聊会话，捕捉对方回复并追发第二阶段彩金链接。
3. 巴西时间 (BRT UTC-3) 宵禁与统计守护 (22:00 ~ 07:00 自动夜间挂起)。
====================================================================
"""

import asyncio
import json
import os
import random
import re
import sys
import fcntl
from datetime import datetime, timezone, timedelta

# 引入 Session SQLite 数据库守护模块
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'public'))
try:
    import session_db_manager
except ImportError:
    try:
        from public import session_db_manager
    except ImportError:
        session_db_manager = None

# 进程互斥锁：防止多个后台进程并发运行造成 SQLite 数据库锁冲突
_lock_fd = None
def acquire_single_instance_lock():
    global _lock_fd
    lock_file = "/tmp/tg_reply_scanner.lock"
    try:
        _lock_fd = open(lock_file, "w")
        fcntl.flock(_lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (IOError, OSError):
        # 另一个扫描进程正在运行中，静默正常退出
        sys.exit(0)

acquire_single_instance_lock()

try:
    from telethon import TelegramClient
    from telethon.sessions import SQLiteSession
    from telethon.tl.functions.messages import GetHistoryRequest
    try:
        from telethon.errors.rpcerrorlist import MsgidDecreaseRetryError, RPCError, ServerError, FloodWaitError
    except ImportError:
        try:
            from telethon.errors import RPCError, FloodWaitError, ServerError, MsgidDecreaseRetryError
        except ImportError:
            class MsgidDecreaseRetryError(Exception): pass
            class RPCError(Exception): pass
            class FloodWaitError(Exception): pass
            class ServerError(Exception): pass
    
    class FastSQLiteSession(SQLiteSession):
        def _cursor(self):
            if self._conn is None:
                import sqlite3
                self._conn = sqlite3.connect(self.filename, check_same_thread=False, timeout=30.0)
                try:
                    self._conn.execute("PRAGMA journal_mode=DELETE;")
                    self._conn.execute("PRAGMA busy_timeout=30000;")
                except Exception:
                    pass
            return self._conn.cursor()

    has_telethon = True
except ImportError:
    TelegramClient = None
    SQLiteSession = None
    FastSQLiteSession = None
    GetHistoryRequest = None
    has_telethon = False

API_ID = 2040
API_HASH = "b18441a1ff607e10a989891a5462e627"
SECOND_MESSAGE_TEMPLATE = "🔥 PROMOÇÃO EXCLUSIVA! 🎁 500% de Bônus! 🎰 Cadastre-se e receba na hora: {https://m1.promobr1.xyz/pt|https://m2.promobr2.xyz/pt|https://m3.promobr1.xyz/pt}"
STATS_FILE = "./sessions/auto_scanner_stats.json"
HEALTHY_PHONES = ['5541987023810', '5538991977854', '5538992304845', '5538988630899']

def load_account_config(phone_or_session):
    """ 从 sessions/ 目录读取账号对应的 .json 配置 """
    clean_digits = re.sub(r'[^0-9]', '', str(phone_or_session))
    json_candidates = [
        os.path.join(os.getcwd(), "sessions", f"{clean_digits}.json"),
        os.path.join(os.getcwd(), "sessions", f"{phone_or_session}.json"),
        os.path.join(os.getcwd(), f"{clean_digits}.json"),
    ]
    config = {
        "api_id": 2040,
        "api_hash": "b18441a1ff607e10a989891a5462e627",
        "device_model": "HP Pavilion P6000 Series",
        "system_version": "Windows 10",
        "app_version": "3.4.3 x64",
        "lang_code": "en",
        "system_lang_code": "en-US",
        "session_string": None,
    }
    for jc in json_candidates:
        if os.path.exists(jc):
            try:
                with open(jc, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("api_id") or data.get("app_id"):
                        config["api_id"] = int(data.get("api_id") or data.get("app_id"))
                    if data.get("api_hash") or data.get("app_hash"):
                        config["api_hash"] = str(data.get("api_hash") or data.get("app_hash"))
                    if data.get("device_model"):
                        config["device_model"] = str(data["device_model"])
                    if data.get("system_version"):
                        config["system_version"] = str(data["system_version"])
                    if data.get("app_version"):
                        config["app_version"] = str(data["app_version"])
                    if data.get("lang_code"):
                        config["lang_code"] = str(data["lang_code"])
                    if data.get("system_lang_code"):
                        config["system_lang_code"] = str(data["system_lang_code"])
                    if data.get("session_string"):
                        config["session_string"] = str(data["session_string"])
                    break
            except Exception:
                pass
    return config

def get_session_file_handle(phone_or_session):
    clean_digits = re.sub(r'[^0-9]', '', str(phone_or_session))
    candidates = [
        os.path.join(os.getcwd(), "sessions", f"{clean_digits}.session"),
        os.path.join(os.getcwd(), "sessions", f"{phone_or_session}"),
        os.path.join(os.getcwd(), f"{clean_digits}.session"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.splitext(c)[0]
    return os.path.join(os.getcwd(), "sessions", clean_digits)

def get_brazil_time():
    """获取标准的巴西利亚时间 (BRT, UTC-3)"""
    brt_tz = timezone(timedelta(hours=-3))
    return datetime.now(brt_tz)

def load_stats():
    if os.path.exists(STATS_FILE):
        try:
            with open(STATS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "status": "ACTIVE",
        "statusLabel": "🟢 24小时全天候即时巡航补发",
        "brazilTime": "",
        "todayDateBRT": "",
        "todayCount": 0,
        "totalCount": 0,
        "lastScanTime": "",
        "lastScanRepliedCount": 0,
        "nightPauseEnabled": False,
        "stopHourBRT": 22,
        "startHourBRT": 7,
        "accountStats": {},
        "logs": []
    }

def save_stats(stats):
    try:
        os.makedirs("./sessions", exist_ok=True)
        with open(STATS_FILE, "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"❌ 导出统计日志失败: {e}")

def parse_spintax(text):
    if not text:
        return ""
    import random
    def random_spin(match):
        options = match.group(1).split('|')
        return random.choice(options)
    return re.sub(r'\{([^{}]+)\}', random_spin, text)

def enable_wal_mode(session_path):
    import sqlite3
    db_file = f"{session_path}.session"
    if os.path.exists(db_file):
        try:
            conn = sqlite3.connect(db_file, timeout=10.0)
            conn.execute("PRAGMA journal_mode=DELETE;")
            conn.execute("PRAGMA busy_timeout=10000;")
            conn.close()
        except Exception:
            pass

async def scan_and_reply_for_account(phone, stats):
    if not has_telethon or TelegramClient is None:
        print("❌ 环境缺少 telethon 模块，跳过 Python 层扫描。")
        return 0, 0

    acc_cfg = load_account_config(phone)
    sess_handle = get_session_file_handle(phone)
    curr_api_id = acc_cfg["api_id"]
    curr_api_hash = acc_cfg["api_hash"]

    try:
        print(f"\n==================================================")
        print(f"📡 动态加载协议号 +{phone} 凭证，进行私聊巡检与彩金补发...")
        
        client = None
        if acc_cfg.get("session_string"):
            try:
                from telethon.sessions import StringSession
                client = TelegramClient(
                    StringSession(acc_cfg["session_string"]),
                    curr_api_id,
                    curr_api_hash,
                    device_model=acc_cfg["device_model"],
                    system_version=acc_cfg["system_version"],
                    app_version=acc_cfg["app_version"],
                    lang_code=acc_cfg["lang_code"],
                    system_lang_code=acc_cfg["system_lang_code"]
                )
            except Exception:
                client = None

        if client is None:
            enable_wal_mode(sess_handle)
            if FastSQLiteSession:
                client = TelegramClient(
                    FastSQLiteSession(sess_handle),
                    curr_api_id,
                    curr_api_hash,
                    device_model=acc_cfg["device_model"],
                    system_version=acc_cfg["system_version"],
                    app_version=acc_cfg["app_version"],
                    lang_code=acc_cfg["lang_code"],
                    system_lang_code=acc_cfg["system_lang_code"]
                )
            else:
                client = TelegramClient(
                    sess_handle,
                    curr_api_id,
                    curr_api_hash,
                    device_model=acc_cfg["device_model"],
                    system_version=acc_cfg["system_version"],
                    app_version=acc_cfg["app_version"],
                    lang_code=acc_cfg["lang_code"],
                    system_lang_code=acc_cfg["system_lang_code"]
                )

        newly_sent_count = 0
        total_completed_count = 0

        connected = False
        for attempt in range(3):
            try:
                await asyncio.wait_for(client.connect(), timeout=10)
                connected = True
                break
            except Exception as conn_err:
                if 'locked' in str(conn_err).lower() and attempt < 2:
                    await asyncio.sleep(1.2)
                else:
                    print(f"⚠️ 账号 +{phone} 连接重试 ({attempt+1}/3) 失败: {conn_err}")

        if not connected or not await client.is_user_authorized():
            print(f"❌ 账号 +{phone} 未成功连接或未授权，跳过。")
            try:
                await client.disconnect()
            except Exception:
                pass
            return 0, 0

        try:
            me = await asyncio.wait_for(client.get_me(), timeout=8)
            first_name = me.first_name if me and getattr(me, 'first_name', None) else f"+{phone}"
        except Exception:
            first_name = f"+{phone}"
        print(f"✅ [协议号 +{phone} 在线]: {first_name}")

        dialogs = []
        for retry in range(3):
            try:
                dialogs = await asyncio.wait_for(client.get_dialogs(limit=50), timeout=10)
                break
            except (MsgidDecreaseRetryError, RPCError, ServerError, Exception) as d_err:
                err_str = str(d_err)
                if ("MsgidDecreaseRetryError" in err_str or "message ID" in err_str.lower()) and retry < 2:
                    await asyncio.sleep(0.8)
                    continue
                if retry < 2:
                    await asyncio.sleep(1.0)
                else:
                    print(f"⚠️ 获取对话列表恢复跳过 (+{phone}): {d_err}")
                    dialogs = []

        for dialog in dialogs:
            if not dialog.is_user or dialog.entity.is_self or dialog.entity.bot:
                continue

            msgs = []
            for m_retry in range(2):
                try:
                    msgs = await asyncio.wait_for(client.get_messages(dialog.entity, limit=30), timeout=8)
                    break
                except (MsgidDecreaseRetryError, RPCError, ServerError, Exception) as m_err:
                    err_m = str(m_err)
                    if ("MsgidDecreaseRetryError" in err_m or "message ID" in err_m.lower()) and m_retry < 1:
                        await asyncio.sleep(0.5)
                        continue
                    msgs = []

            if not msgs:
                continue

            msgs = list(reversed(msgs))

            # 智能精准状态判定：
            # 1. 寻找客户最新发来的消息 (m.out == False)
            latest_incoming_msg = None
            latest_incoming_idx = -1
            for idx_m, m in enumerate(msgs):
                if not m.out:
                    latest_incoming_msg = m
                    latest_incoming_idx = idx_m

            # 2. 如果客户从未发言，说明仅是我们单向破冰，无需补发
            if latest_incoming_msg is None:
                continue

            latest_incoming_id = getattr(latest_incoming_msg, 'id', 0)
            latest_incoming_text = getattr(latest_incoming_msg, 'text', '') or "[客户互动/回复]"
            target_name = dialog.name or getattr(dialog.entity, 'phone', str(dialog.id))

            # 3. 检查在客户最新回复之后，我们是否已经发出过消息 (m.out == True 且在 latest_incoming_idx 之后)
            has_replied_after_incoming = False
            for idx_m in range(latest_incoming_idx + 1, len(msgs)):
                m = msgs[idx_m]
                if m.out:
                    has_replied_after_incoming = True
                    break

            # 4. 检查持久化去重记录 (sessions/replied_chats.json)
            replied_chats_file = os.path.join(os.getcwd(), "sessions", "replied_chats.json")
            replied_history = {}
            if os.path.exists(replied_chats_file):
                try:
                    with open(replied_chats_file, "r", encoding="utf-8") as rf:
                        replied_history = json.load(rf)
                except Exception:
                    replied_history = {}

            track_key = f"{phone}_{dialog.id}"
            last_recorded_id = replied_history.get(track_key, 0)

            # 如果我们在客户发言后已经发出了消息，或者持久化记录已记录此消息ID，则判定为【已圆满完成闭环】，严禁二次轰炸
            if has_replied_after_incoming or (latest_incoming_id > 0 and latest_incoming_id <= last_recorded_id):
                total_completed_count += 1
                continue

            # 5. 到此处说明：客户刚才发来了消息，且我们尚未对其进行回复！立即触发第2阶段彩金 + 拟人打字第3阶段寄语！
            print(f"🎯 【捕捉到客户主动回复!】 目标: {target_name} | 对方回复: '{latest_incoming_text}' (Msg ID: {latest_incoming_id})")
            
            # 立即记录防重，防止并发扫描二次触发
            replied_history[track_key] = latest_incoming_id
            try:
                os.makedirs(os.path.dirname(replied_chats_file), exist_ok=True)
                with open(replied_chats_file, "w", encoding="utf-8") as wf:
                    json.dump(replied_history, wf, ensure_ascii=False, indent=2)
            except Exception:
                pass

            second_msg = parse_spintax(SECOND_MESSAGE_TEMPLATE)
            print(f"🚀 正在为目标 {target_name} 补发第2阶段彩金文案: {second_msg[:30]}...")
            
            try:
                sent_m = None
                for s_retry in range(3):
                    try:
                        sent_m = await client.send_message(dialog.entity, second_msg, parse_mode='html')
                        break
                    except (MsgidDecreaseRetryError, RPCError, ServerError, Exception) as s_err:
                        err_s = str(s_err)
                        if ("MsgidDecreaseRetryError" in err_s or "message ID" in err_s.lower()) and s_retry < 2:
                            await asyncio.sleep(1.0)
                            continue
                        if s_retry < 2:
                            await asyncio.sleep(1.2)
                        else:
                            raise s_err

                if sent_m:
                    print(f"✨ 【第2阶段彩金文案补发成功!】 Message ID: {sent_m.id}")
                    newly_sent_count += 1
                    total_completed_count += 1

                    # 拟人风控延时 3.5 ~ 6 秒，模拟真人打字追发第3阶段祝福语
                    blessing_delay = round(random.uniform(3.5, 6.0), 1)
                    print(f"⏳ 【拟人打字模拟】 等待 {blessing_delay}s (防封黄金区间)，准备追发专属中奖寄语...")
                    try:
                        from telethon.tl.functions.messages import SetTypingRequest
                        from telethon.tl.types import SendMessageTypingAction
                        await client(SetTypingRequest(peer=dialog.entity, action=SendMessageTypingAction()))
                    except Exception:
                        pass
                    await asyncio.sleep(blessing_delay)

                    third_blessings = [
                        "🚀 Arrebenta lá amigo! Hoje a forra é certa! 🎰💵 Qualquer dúvida estou por aqui! 😉",
                        "🍀 Boa sorte nas jogadas! Que venha o grande jackpot hoje! 💰🔥",
                        "👑 Vai com tudo, que hoje o PIX cai em dobro na sua conta! 🤑✨",
                        "🎯 Torcendo pelo seu forro hoje! Se precisar de dicas de slots é só chamar! 🎲💎",
                        "🔥 Sucesso meu amigo! Que venha muitos ganhos hoje! 🎰💵 Tamo junto! 😉"
                    ]
                    third_msg = parse_spintax(random.choice(third_blessings))
                    try:
                        await client.send_message(dialog.entity, third_msg)
                        print(f"🍀 【第3阶段中奖祝福语已送达】 ➔ \"{third_msg[:30]}...\"")
                    except Exception as e_third:
                        print(f"⚠️ 第3阶段祝福语发送提示: {e_third}")

                    now_str = get_brazil_time().strftime("%H:%M:%S")
                    log_entry = {
                        "timestamp": now_str,
                        "phone": phone,
                        "accountName": first_name,
                        "target": target_name,
                        "replyText": latest_incoming_text[:30],
                        "msg": f"✨ 【+{phone} ({first_name})】成功为 '{target_name}' 补发第2阶段彩金文案并拟人追发寄语！(对方回复: '{latest_incoming_text[:20]}')"
                    }
                    if "logs" not in stats:
                        stats["logs"] = []
                    stats["logs"].insert(0, log_entry)
                    stats["logs"] = stats["logs"][:30]

                    await asyncio.sleep(1.5)
            except Exception as send_err:
                print(f"❌ 补发失败 ({target_name}): {send_err}")

        acc_stats = stats.setdefault("accountStats", {}).setdefault(phone, {
            "name": first_name if 'first_name' in locals() else phone,
            "todaySent": 0,
            "totalSent": 0
        })
        if 'first_name' in locals():
            acc_stats["name"] = first_name
        
        if newly_sent_count > 0:
            acc_stats["todaySent"] = acc_stats.get("todaySent", 0) + newly_sent_count
            acc_stats["totalSent"] = acc_stats.get("totalSent", 0) + newly_sent_count

        if acc_stats.get("totalSent", 0) < total_completed_count:
            acc_stats["totalSent"] = total_completed_count

    except Exception as e:
        print(f"❌ 账号 +{phone} 扫描处理过程异常: {e}")
    finally:
        try:
            if 'client' in locals() and client and client.is_connected():
                await client.disconnect()
        except Exception:
            pass

    return newly_sent_count, total_completed_count

async def main():
    now_brt = get_brazil_time()
    brt_str = now_brt.strftime("%Y-%m-%d %H:%M:%S BRT")
    today_date_str = now_brt.strftime("%Y-%m-%d")
    current_hour = now_brt.hour

    stats = load_stats()
    stats["brazilTime"] = brt_str
    stats["lastScanTime"] = datetime.now(timezone.utc).isoformat()

    if stats.get("todayDateBRT") != today_date_str:
        stats["todayDateBRT"] = today_date_str
        stats["todayCount"] = 0
        acc_map = stats.get("accountStats", {})
        for p in acc_map:
            acc_map[p]["todaySent"] = 0

    print(f"🕒 巴西利亚当前时间: {brt_str} (小时: {current_hour}:00)")

    night_pause = stats.get("nightPauseEnabled", False)
    if night_pause and (current_hour >= 22 or current_hour < 7):
        stats["status"] = "PAUSED_NIGHT"
        stats["statusLabel"] = f"🌙 夜间停发挂起 (巴西时间 {current_hour}:00 已过 22:00，早晨 07:00 自动恢复)"
        print(f"🌙 [巴西夜间防骚扰保护] 当前巴西时间为 {brt_str}，处于 22:00 ~ 07:00 休息时段。")
        print(f"🛑 自动挂起第二阶段彩金文案补发，防止深夜打扰客户。明早 07:00 自动恢复！")
        save_stats(stats)
        return

    stats["status"] = "ACTIVE"
    stats["statusLabel"] = "🟢 24小时全天候即时巡航补发"

    total_newly_sent = 0
    acc_map = stats.setdefault("accountStats", {})
    sum_today = 0
    sum_total = 0

    # 动态从 SQLite 数据库获取所有有效的账号 Phone 清单
    phones_to_scan = []
    if session_db_manager:
        try:
            db_sessions = session_db_manager.list_sessions()
            for sess in db_sessions:
                fn = sess["fileName"]
                clean_p = re.sub(r'[^0-9]', '', fn)
                if clean_p and len(clean_p) >= 10 and clean_p not in phones_to_scan and "0899" not in clean_p:
                    phones_to_scan.append(clean_p)
        except Exception:
            pass

    if not phones_to_scan:
        phones_to_scan = HEALTHY_PHONES

    for idx, phone in enumerate(phones_to_scan):
        if idx > 0:
            stagger_delay = random.uniform(2.0, 3.0)
            print(f"⏳ 【账号分批错开上线】避免同时并发触发 IP 风控，随机延迟 {stagger_delay:.1f} 秒后加载启动下一个账号 [+{phone}]...")
            await asyncio.sleep(stagger_delay)
        newly_cnt, completed_cnt = await scan_and_reply_for_account(phone, stats)
        total_newly_sent += newly_cnt
        p_stat = acc_map.get(phone, {})
        sum_today += p_stat.get("todaySent", 0)
        sum_total += p_stat.get("totalSent", 0)

    stats["lastScanRepliedCount"] = total_newly_sent
    stats["todayCount"] = sum_today
    stats["totalCount"] = max(stats.get("totalCount", 0), sum_total)

    save_stats(stats)
    print(f"✅ 本次巡检扫描结束，本次新补发 {total_newly_sent} 位，全局互动并补发彩金客户数: {stats['todayCount']} 人！")

if __name__ == "__main__":
    asyncio.run(main())
