#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🩺 Telegram 协议号真实健康与风控状态检测器 (tg_health_detector.py)
====================================================================
三级真机穿透检测：
1. MTProto 握手校验：检测 Session 是否掉线、注销或封号 (get_me)
2. 代理穿透与自适应：支持 HTTP / SOCKS5 代理穿透
3. 官方 @SpamBot 穿透测试 (支持英葡双语):
   - 向官方 @SpamBot 发送 /start 命令并分析官方真实回复
   - 提取精确解封时间 (UTC / 本地时间)
   - 支持 --json 输出模式，无缝供 Web 控制台一键调度
====================================================================
"""

import os
import sys
import glob
import json
import time
import asyncio
import re
from typing import Dict, Any, List

try:
    from telethon import TelegramClient
    from telethon.errors import (
        UserDeactivatedError,
        AuthKeyUnregisteredError,
        UserDeactivatedBanError,
        FloodWaitError,
        PhoneNumberBannedError
    )
except ImportError:
    try:
        os.system("pip3 install telethon pysocks || pip install telethon pysocks")
        from telethon import TelegramClient
        from telethon.errors import (
            UserDeactivatedError,
            AuthKeyUnregisteredError,
            UserDeactivatedBanError,
            FloodWaitError,
            PhoneNumberBannedError
        )
    except Exception:
        TelegramClient = None

try:
    import socks
except ImportError:
    socks = None

DEFAULT_API_ID = 2040
DEFAULT_API_HASH = "b18441a1ff607e10a989891a5462e627"

def parse_proxy(proxy_str: str):
    """解析 host:port:user:pass 代理，默认使用 HTTP (socks.HTTP)"""
    if not proxy_str or not isinstance(proxy_str, str):
        return None
    try:
        parts = proxy_str.strip().split(':')
        ptype = socks.HTTP if (socks and hasattr(socks, 'HTTP')) else 2
        if len(parts) >= 4:
            return (ptype, parts[0], int(parts[1]), True, parts[2], parts[3])
        elif len(parts) == 2:
            return (ptype, parts[0], int(parts[1]))
    except Exception:
        pass
    return None

def load_account_configs(sessions_dir: str = "sessions") -> List[Dict[str, Any]]:
    """扫描所有 session 文件及关联配置"""
    accounts = []
    proxy_map = {}
    
    # 尝试读取代理映射
    for candidate in ["account_proxies.json", os.path.join(sessions_dir, "account_proxies.json")]:
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    proxy_map.update(json.load(f))
            except Exception:
                pass

    if not os.path.exists(sessions_dir):
        return accounts

    session_files = glob.glob(os.path.join(sessions_dir, "*.session"))
    json_files = glob.glob(os.path.join(sessions_dir, "*.json"))
    
    all_phones = set()
    for sf in session_files:
        basename = os.path.basename(sf).replace(".session", "")
        if re.match(r'^\d+$', basename):
            all_phones.add(basename)
    for jf in json_files:
        basename = os.path.basename(jf).replace(".json", "")
        if re.match(r'^\d+$', basename):
            all_phones.add(basename)

    for phone in sorted(list(all_phones)):
        json_path = os.path.join(sessions_dir, f"{phone}.json")
        session_path = os.path.join(sessions_dir, f"{phone}.session")
        cfg = {
            "phone": phone,
            "session_path": session_path,
            "api_id": DEFAULT_API_ID,
            "api_hash": DEFAULT_API_HASH,
            "proxy_str": proxy_map.get(phone, "")
        }
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    jdata = json.load(f)
                    cfg["api_id"] = int(jdata.get("api_id") or jdata.get("app_id") or DEFAULT_API_ID)
                    cfg["api_hash"] = str(jdata.get("api_hash") or jdata.get("app_hash") or DEFAULT_API_HASH)
                    if not cfg["proxy_str"] and jdata.get("proxy"):
                        p = jdata["proxy"]
                        if isinstance(p, dict) and p.get("addr"):
                            cfg["proxy_str"] = f"{p['addr']}:{p.get('port')}:{p.get('username')}:{p.get('password')}"
            except Exception:
                pass
        accounts.append(cfg)
        
    return accounts

async def check_single_account(acc: Dict[str, Any]) -> Dict[str, Any]:
    phone = acc["phone"]
    session_file = os.path.join("sessions", phone)
    proxy_tuple = parse_proxy(acc.get("proxy_str"))
    
    result = {
        "phone": phone,
        "auth_status": "未知",
        "spambot_status": "未检测",
        "restriction_detail": "无",
        "can_send_today": False,
        "health_score": 0,
        "user_name": "",
        "unban_date": ""
    }
    
    if not TelegramClient:
        result["auth_status"] = "❌ 缺少Telethon库"
        result["restriction_detail"] = "运行环境未安装 telethon"
        return result

    client = None
    try:
        client = TelegramClient(
            session_file,
            acc["api_id"],
            acc["api_hash"],
            proxy=proxy_tuple,
            timeout=12
        )
        await client.connect()
        
        if not await client.is_user_authorized():
            result["auth_status"] = "❌ 凭证失效/未登录"
            result["spambot_status"] = "❌ 无法通过授权验证"
            result["health_score"] = 0
            return result
            
        me = await client.get_me()
        user_name = f"{me.first_name or ''} {me.last_name or ''}".strip() or me.username or phone
        result["user_name"] = user_name
        result["auth_status"] = f"✅ 正常在线 ({user_name})"
        
        # 查询官方 @SpamBot
        try:
            spambot = await client.get_entity("SpamBot")
            await client.send_message(spambot, "/start")
            await asyncio.sleep(2.2)  # 等待机器人应答
            
            messages = await client.get_messages(spambot, limit=2)
            bot_reply = messages[0].text if messages else ""
            reply_lower = bot_reply.lower()

            is_clean = ("good news" in reply_lower and "no limits" in reply_lower) or \
                       ("boas notícias" in reply_lower and "nenhum limite" in reply_lower)
            
            if is_clean:
                result["spambot_status"] = "🟢 100% 完全健康 (无限制)"
                result["restriction_detail"] = "官方官方确认无任何风控限制 (可自由发信)"
                result["can_send_today"] = True
                result["health_score"] = 99
            elif "limited until" in reply_lower or "limitations" in reply_lower or "limitações" in reply_lower:
                match = re.search(r'until\s+([^\n\.]+)', bot_reply, re.IGNORECASE)
                until_time = match.group(1) if match else "时间待定"
                result["unban_date"] = until_time
                result["spambot_status"] = "🟡 临时双向限制 (PeerFlood)"
                result["restriction_detail"] = f"受限中，解封时间: {until_time}"
                result["can_send_today"] = False
                result["health_score"] = 45
            else:
                result["spambot_status"] = "⚠️ 存在异常限制"
                result["restriction_detail"] = bot_reply[:60].replace('\n', ' ')
                result["can_send_today"] = False
                result["health_score"] = 30
                
        except FloodWaitError as fe:
            result["spambot_status"] = f"⏳ 遭遇 FloodWait ({fe.seconds}秒)"
            result["restriction_detail"] = f"需冷却等待 {fe.seconds} 秒后自动恢复"
            result["can_send_today"] = False
            result["health_score"] = 55
        except Exception as se:
            result["spambot_status"] = "❓ 探测受阻"
            result["restriction_detail"] = str(se)[:40]
            result["health_score"] = 60
            
    except (UserDeactivatedError, UserDeactivatedBanError, PhoneNumberBannedError):
        result["auth_status"] = "🚫 官方永久封号 (Banned)"
        result["spambot_status"] = "❌ 账号已销毁"
        result["health_score"] = 0
    except AuthKeyUnregisteredError:
        result["auth_status"] = "❌ 密钥已注销 (AuthKey Revoked)"
        result["spambot_status"] = "❌ 无法登录"
        result["health_score"] = 0
    except Exception as e:
        err_msg = str(e)
        if "file is not a database" in err_msg:
            result["auth_status"] = "⚠️ 凭证格式需转换"
            result["spambot_status"] = "需转为SQLite格式"
        else:
            result["auth_status"] = f"⚠️ 连接异常: {err_msg[:25]}"
            result["spambot_status"] = "网络或代理超时"
        result["health_score"] = 20
    finally:
        if client:
            try:
                await client.disconnect()
            except Exception:
                pass
                
    return result

async def main():
    as_json = "--json" in sys.argv
    accounts = load_account_configs()
    
    if as_json:
        if not accounts:
            print(json.dumps({"success": False, "total": 0, "results": [], "summary": {"clean": 0, "limited": 0, "dead": 0}}))
            return
        results = []
        clean_count, limited_count, dead_count = 0, 0, 0
        for acc in accounts:
            res = await check_single_account(acc)
            results.append(res)
            if res["health_score"] >= 90:
                clean_count += 1
            elif res["health_score"] >= 30:
                limited_count += 1
            else:
                dead_count += 1
            await asyncio.sleep(0.5)
            
        print(json.dumps({
            "success": True,
            "total": len(accounts),
            "clean_count": clean_count,
            "limited_count": limited_count,
            "dead_count": dead_count,
            "results": results
        }, ensure_ascii=False))
        return

    print("=" * 70)
    print("🩺 Telegram 账号健康与风控检测 (已支持英葡双语识别)")
    print("=" * 70)
    
    if not accounts:
        print("⚠️ 未在 sessions/ 目录下找到可检测的 .session 账号文件！")
        return
        
    print(f"📋 共加载检测目标: {len(accounts)} 个账号\n")
    print(f"{'手机号':<15} | {'Session在线状态':<22} | {'@SpamBot真实风控':<25} | {'发信建议'}")
    print("-" * 75)
    
    clean_count, limited_count, dead_count = 0, 0, 0
    for i, acc in enumerate(accounts):
        print(f"🔍 正在穿透检测 [{i+1}/{len(accounts)}] +{acc['phone']} ...", end="\r")
        res = await check_single_account(acc)
        advice = "🚀 可安全发信" if res["can_send_today"] else "🛑 暂停发信/建议冷却"
        if res["health_score"] >= 90:
            clean_count += 1
        elif res["health_score"] >= 30:
            limited_count += 1
        else:
            dead_count += 1
        print(f"+{res['phone']:<14} | {res['auth_status']:<20} | {res['spambot_status']:<23} | {advice}")
        if res["restriction_detail"] != "无":
            print(f"   └── 详情: {res['restriction_detail']}")
        await asyncio.sleep(0.8)
        
    print("-" * 75)
    print(f"📊 真实检测汇总完成: 🟢健康: {clean_count} | 🟡受限: {limited_count} | 🔴失效: {dead_count}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
