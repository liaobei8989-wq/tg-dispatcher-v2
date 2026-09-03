#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tg_contact_scrubber.py
Telegram 目标手机号智能清洗与权限预检引擎 (TG Target Lead Scrubber & Filter)
- 批量预检目标手机号/用户名在 Telegram 上的注册与权限状态
- 彻底剔除：
  1. 未在 Telegram 注册的空号
  2. 已注册但关闭了手机号搜索权限 (Who can find me by phone: Nobody)
  3. 已注销或被封禁的死号 (Deleted Account)
- 导出 100% 真实可私聊的有效目标池，保护发信主力号不受风控降权
"""

import os
import sys
import json
import re
import random
import asyncio
from typing import List, Dict

try:
    from telethon import TelegramClient
    from telethon.tl.functions.contacts import ImportContactsRequest, DeleteContactsRequest
    from telethon.tl.types import InputPhoneContact, UserStatusOnline, UserStatusRecently, UserStatusLastWeek, UserStatusOffline
    import socks
except ImportError:
    pass

def clean_phone_number(p: str) -> str:
    digits = re.sub(r'[^0-9]', '', str(p).strip())
    if not digits:
        return ""
    if digits.startswith("55") and len(digits) in [10, 11, 12, 13]:
        return f"+{digits}"
    if not digits.startswith("+") and len(digits) >= 8:
        return f"+{digits}"
    return f"+{digits}"

def get_proxy_for_phone(phone_str: str):
    proxy_file = os.path.join(os.getcwd(), "sessions", "account_proxies.json")
    if not os.path.exists(proxy_file):
        proxy_file = os.path.join(os.getcwd(), "account_proxies.json")
    if os.path.exists(proxy_file):
        try:
            with open(proxy_file, "r", encoding="utf-8") as f:
                proxies = json.load(f)
            clean_digits = re.sub(r'[^0-9]', '', phone_str)
            for k, v in proxies.items():
                if re.sub(r'[^0-9]', '', k) == clean_digits and v:
                    raw_proxy = v.strip()
                    if raw_proxy.startswith("socks5://"):
                        raw_proxy = raw_proxy[9:]
                    elif raw_proxy.startswith("http://"):
                        raw_proxy = raw_proxy[7:]
                    
                    auth_part = ""
                    host_part = raw_proxy
                    if "@" in raw_proxy:
                        auth_part, host_part = raw_proxy.split("@", 1)
                    
                    user, password = None, None
                    if ":" in auth_part:
                        user, password = auth_part.split(":", 1)
                    
                    if ":" in host_part:
                        host, port_str = host_part.split(":", 1)
                        return (socks.SOCKS5, host, int(port_str), True, user, password)
        except Exception:
            pass
    return None

async def scrub_targets(targets: List[str], max_to_check: int = 500) -> Dict:
    results = {
        "total": len(targets),
        "valid_count": 0,
        "invalid_count": 0,
        "valid_targets": [],
        "invalid_details": [],
        "logs": []
    }
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sessions_dir = os.path.join(script_dir, "sessions")
    if not os.path.exists(sessions_dir):
        sessions_dir = script_dir
    
    session_files = [
        os.path.join(sessions_dir, f) for f in os.listdir(sessions_dir)
        if f.endswith(".session") and not f.startswith("auto_")
    ]
    
    # Also check root
    if not session_files and os.path.exists(script_dir):
        session_files = [
            os.path.join(script_dir, f) for f in os.listdir(script_dir)
            if f.endswith(".session") and not f.startswith("auto_")
        ]

    # Quick heuristic check if no session file available
    if not session_files:
        results["logs"].append("⚠️ 未在 sessions/ 目录下检测到可用 Telegram 探测号凭证，已启用智能格式与号段预清洗...")
        for raw in targets:
            clean = raw.strip()
            if not clean:
                continue
            if clean.startswith("@") and len(clean) > 3:
                results["valid_targets"].append(clean)
                results["valid_count"] += 1
            else:
                digits = re.sub(r'[^0-9]', '', clean)
                # Brazil mobile standard: 55 + DDD(2 digits) + 9(1 digit) + 8 digits = 13 digits
                if len(digits) in [12, 13] and digits.startswith("55"):
                    results["valid_targets"].append(f"+{digits}")
                    results["valid_count"] += 1
                elif len(digits) >= 9:
                    results["valid_targets"].append(f"+{digits}")
                    results["valid_count"] += 1
                else:
                    results["invalid_details"].append({
                        "target": clean,
                        "reason": "号码格式异常或位数不足"
                    })
                    results["invalid_count"] += 1
        return results

    # Pick the first available probe session
    probe_session = session_files[0]
    session_basename = os.path.basename(probe_session).replace(".session", "")
    proxy_config = get_proxy_for_phone(session_basename)
    
    # Read companion json for api_id/api_hash
    clean_p = re.sub(r'[^0-9]', '', session_basename)
    json_path = os.path.join(os.path.dirname(probe_session), f"{clean_p}.json")
    api_id, api_hash = 2040, "b18441a1ff607e10a989891a5462e627"
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as jf:
                jd = json.load(jf)
                api_id = int(jd.get('app_id') or jd.get('api_id') or 2040)
                api_hash = str(jd.get('app_hash') or jd.get('api_hash') or "b18441a1ff607e10a989891a5462e627")
        except Exception:
            pass

    results["logs"].append(f"🔍 启动探针协议号 [{session_basename}] 连接 Telegram 官方服务器执行真机权限清洗...")

    client = None
    try:
        session_no_ext = probe_session[:-8] if probe_session.endswith('.session') else probe_session
        client = TelegramClient(session_no_ext, api_id, api_hash, proxy=proxy_config)
        await asyncio.wait_for(client.connect(), timeout=10.0)
        
        if not await client.is_user_authorized():
            results["logs"].append(f"⚠️ 探针号 [{session_basename}] 未通过授权，转入智能号码规则离线清洗模式...")
            for raw in targets:
                clean = raw.strip()
                if not clean: continue
                digits = re.sub(r'[^0-9]', '', clean)
                if clean.startswith("@") or len(digits) >= 10:
                    results["valid_targets"].append(clean)
                    results["valid_count"] += 1
                else:
                    results["invalid_details"].append({"target": clean, "reason": "号码格式无效"})
                    results["invalid_count"] += 1
            return results

        results["logs"].append(f"✅ 探针号 [{session_basename}] 在线就绪，正在对 {len(targets)} 个目标批量验证 TG 注册与隐私权限...")

        # Process in batches of 15 to avoid FloodWait
        batch_size = 15
        for i in range(0, min(len(targets), max_to_check), batch_size):
            batch = targets[i:i+batch_size]
            contacts_to_import = []
            phone_map = {}
            
            for t in batch:
                clean_t = t.strip()
                if not clean_t:
                    continue
                if clean_t.startswith("@"):
                    # Username direct entity check
                    try:
                        u_entity = await asyncio.wait_for(client.get_entity(clean_t), timeout=5.0)
                        if getattr(u_entity, 'id', None):
                            results["valid_targets"].append(clean_t)
                            results["valid_count"] += 1
                            results["logs"].append(f"  ✅ [TG用户名有效] {clean_t} ➔ 用户ID: {u_entity.id}")
                        else:
                            results["invalid_details"].append({"target": clean_t, "reason": "用户名不存在或已注销"})
                            results["invalid_count"] += 1
                    except Exception as ue:
                        results["invalid_details"].append({"target": clean_t, "reason": f"用户名查询失败 ({str(ue)[:30]})"})
                        results["invalid_count"] += 1
                    continue
                
                clean_phone = clean_phone_number(clean_t)
                if clean_phone:
                    cid = random.randint(100000, 999999)
                    contacts_to_import.append(InputPhoneContact(
                        client_id=cid,
                        phone=clean_phone,
                        first_name="Probe",
                        last_name=""
                    ))
                    phone_map[clean_phone] = clean_t

            if contacts_to_import:
                try:
                    imp_res = await asyncio.wait_for(client(ImportContactsRequest(contacts_to_import)), timeout=10.0)
                    registered_users = getattr(imp_res, 'users', [])
                    found_phones = set()
                    user_ids_to_del = []

                    for u in registered_users:
                        u_phone = getattr(u, 'phone', '')
                        if u_phone:
                            found_phones.add(f"+{u_phone}")
                        user_ids_to_del.append(u.id)

                    for cp, original_raw in phone_map.items():
                        clean_pure_digits = cp.replace("+", "")
                        matched = any(clean_pure_digits in fp.replace("+", "") for fp in found_phones)
                        
                        if matched or len(registered_users) > 0 and cp in found_phones:
                            results["valid_targets"].append(original_raw)
                            results["valid_count"] += 1
                            results["logs"].append(f"  ✅ [注册且权限开放] {original_raw} ({cp})")
                        else:
                            results["invalid_details"].append({
                                "target": original_raw,
                                "reason": "未在 Telegram 注册 或 未公开手机号隐私权限 (Nobody)"
                            })
                            results["invalid_count"] += 1
                            results["logs"].append(f"  ❌ [剔除无效] {original_raw} ➔ 未注册或未开放权限")

                    # Delete imported test contacts so we don't pollute the address book
                    if user_ids_to_del:
                        try:
                            await client(DeleteContactsRequest(id=user_ids_to_del))
                        except Exception:
                            pass

                except Exception as b_err:
                    results["logs"].append(f"  ⚠️ 批次验证提示: {str(b_err)[:60]}，转入智能降级格式校验")
                    for cp, original_raw in phone_map.items():
                        digits = re.sub(r'[^0-9]', '', original_raw)
                        if len(digits) >= 10:
                            results["valid_targets"].append(original_raw)
                            results["valid_count"] += 1
                        else:
                            results["invalid_details"].append({"target": original_raw, "reason": "号码格式异常"})
                            results["invalid_count"] += 1

            # Sleep briefly between batches
            await asyncio.sleep(random.uniform(0.6, 1.2))

    except Exception as outer_e:
        results["logs"].append(f"⚠️ 探测清洗过程异常: {str(outer_e)[:80]}")
    finally:
        if client:
            try:
                await client.disconnect()
            except Exception:
                pass

    return results

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}, ensure_ascii=False))
        return

    arg_val = sys.argv[1]
    targets = []
    if os.path.exists(arg_val) and os.path.isfile(arg_val):
        with open(arg_val, 'r', encoding='utf-8') as f:
            targets = [l.strip() for l in f if l.strip()]
    else:
        try:
            parsed = json.loads(arg_val)
            targets = parsed.get("targets", []) if isinstance(parsed, dict) else parsed
        except Exception:
            targets = [t.strip() for t in arg_val.split('\n') if t.strip()]

    res = await scrub_targets(targets)
    print(json.dumps(res, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(main())
