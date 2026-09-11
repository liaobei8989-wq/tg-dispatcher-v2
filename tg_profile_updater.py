#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
👤 Real Telegram MTProto Profile & Avatar Updater via Telethon
====================================================================
Physically updates Name, Bio, Phone Privacy, and Uploads Real Avatars
to Telegram's Official Servers for all .session files in `sessions/`.
====================================================================
"""

import os
import sys
import json
import glob
import asyncio
import base64
import tempfile
import random
import re

try:
    from telethon import TelegramClient
    from telethon.tl.functions.account import UpdateProfileRequest, UpdateUsernameRequest, SetPrivacyRequest
    from telethon.tl.functions.photos import UploadProfilePhotoRequest
    from telethon.tl.types import InputPrivacyKeyPhoneNumber, InputPrivacyValueAllowAll
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Telethon is not installed. Please run: pip install telethon pysocks"
    }))
    sys.exit(1)

try:
    import socks
except ImportError:
    socks = None

import urllib.request
import ssl
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

def backup_and_heal_session(session_path: str) -> bool:
    """【SQLite 自动备份与自愈机制】自动建立 .session.bak 镜像；若损坏自动从备份无损还原"""
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

BANNED_OBSOLETE_PHONES = {
    '5586994428117', '5586994581839', '5586994709226', '5586994684213',
    '5586994687152', '5586994850500', '5586994918471', '5586994783355'
}

DEFAULT_API_ID = 2040
DEFAULT_API_HASH = "b18441a1ff607e10a989891a5462e627"

BRAZILIAN_FEMALE_NAMES = [
    "Ana Silva", "Beatriz Santos", "Camila Oliveira", "Fernanda Lima", "Juliana Costa",
    "Larissa Souza", "Carolina Pereira", "Gabriela Rodrigues", "Amanda Alves", "Bruna Carvalho",
    "Rafaela Ribeiro", "Leticia Ferreira", "Jessica Barbosa", "Patricia Gomes", "Mariana Costa"
]

BRAZILIAN_BIOS = [
    "Amante de jogos e bônus 🎁 | Chama no direct 😉",
    "Sempre em busca da melhor forra 🎰🔥",
    "Jogadora VIP 🌟 Dicas e bônus todos os dias",
    "Vivendo a vida e lucrando nos giros 🚀💰",
    "Apaixonada por slots e apostas online 🎲✨"
]

def load_account_proxies_map():
    map_file = os.path.join(os.getcwd(), "sessions", "account_proxies.json")
    if os.path.exists(map_file):
        try:
            with open(map_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

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

async def update_single_account(session_path: str, item_data: dict, logs: list):
    session_basename = os.path.basename(session_path).replace('.session', '')
    session_prefix = session_path[:-8] if session_path.endswith('.session') else session_path
    
    # Load json config
    json_path = session_path.replace('.session', '.json')
    json_cfg = {}
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as jf:
                json_cfg = json.load(jf)
        except Exception:
            pass

    api_id = json_cfg.get("api_id") or json_cfg.get("app_id") or DEFAULT_API_ID
    api_hash = json_cfg.get("api_hash") or json_cfg.get("app_hash") or DEFAULT_API_HASH
    device_model = json_cfg.get("device_model") or "HP Pavilion P6000 Series"
    system_version = json_cfg.get("system_version") or "Windows 10"
    app_version = json_cfg.get("app_version") or "3.4.3 x64"

    try:
        api_id_int = int(api_id)
    except Exception:
        api_id_int = DEFAULT_API_ID

    proxy_map = load_account_proxies_map()
    proxy_str = item_data.get("proxy") or proxy_map.get(session_basename)
    proxy_tuple = parse_proxy_str(proxy_str)

    raw_first = str(item_data.get("firstName") or "").strip()
    raw_last = str(item_data.get("lastName") or "").strip()
    raw_about = str(item_data.get("about") or "").strip()

    # 清洗卡商默认垃圾简介 (如 suiLnRU 或过短的随机无序字符串)
    is_junk_about = not raw_about or len(raw_about) < 4 or (len(raw_about.split()) <= 1 and len(raw_about) <= 10)
    about = random.choice(BRAZILIAN_BIOS) if is_junk_about else raw_about

    # 清洗无效名字
    if not raw_first or raw_first.isdigit() or len(raw_first) < 2:
        rand_name = random.choice(BRAZILIAN_FEMALE_NAMES).split()
        first_name = rand_name[0]
        last_name = rand_name[1] if len(rand_name) > 1 else ""
    else:
        first_name = raw_first
        last_name = raw_last

    username = item_data.get("username")
    avatar_base64 = item_data.get("avatarBase64")

    # 【SQLite 自动备份机制】运行前自动创建 .session.bak 镜像或损坏自愈
    if not backup_and_heal_session(session_path):
        logs.append(f"⚠️ [跳过无效/空文件]: 账号文件 [{session_basename}.session] 并非标准的 Telethon 数据库格式或大小为空。")
        return False

    logs.append(f"📡 [连接中] 正在连接 Telegram 官方服务器修改账号 [{session_basename}] 资料...")

    try:
        client = TelegramClient(
            session_prefix,
            api_id_int,
            str(api_hash),
            proxy=proxy_tuple,
            device_model=str(device_model),
            system_version=str(system_version),
            app_version=str(app_version)
        )
    except Exception as ie:
        logs.append(f"❌ [加载账号失败]: {session_basename} 异常: {str(ie)}")
        return False

    try:
        connected_ok = False
        try:
            await asyncio.wait_for(client.connect(), timeout=12.0)
            connected_ok = True
        except Exception as ce:
            if proxy_tuple and len(BRAZIL_PROXY_POOL) > 0:
                logs.append(f"🔄 [代理故障转移]: 切换备用巴西节点更新 [{session_basename}]...")
                try:
                    await client.disconnect()
                except Exception:
                    pass
                clean_phone = re.sub(r'[^0-9]', '', session_basename)
                idx = (int(clean_phone[-4:]) if (clean_phone and clean_phone[-4:].isdigit()) else 0) % len(BRAZIL_PROXY_POOL)
                backup_proxy_str = BRAZIL_PROXY_POOL[idx]
                backup_tuple = parse_proxy_str(backup_proxy_str)
                client = TelegramClient(
                    session_prefix,
                    api_id_int,
                    str(api_hash),
                    proxy=backup_tuple,
                    device_model=str(device_model),
                    system_version=str(system_version),
                    app_version=str(app_version)
                )
                try:
                    await asyncio.wait_for(client.connect(), timeout=15.0)
                    connected_ok = True
                except Exception as b_err:
                    logs.append(f"🛑 [绝对防封阻断]: 账号 [{session_basename}] 代理与备用节点均未通，严禁 VPS 机房 IP 直连裸改！跳过本号: {b_err}")
                    return False
            else:
                logs.append(f"🛑 [未配置可用代理]: 绝对禁止 VPS 机房 IP 裸连，跳过本号: {ce}")
                return False

        if not connected_ok:
            return False

        if not await client.is_user_authorized():
            logs.append(f"❌ [凭证未授权] 账号 {session_basename} 登录态失效")
            return False

        # 1. Update First / Last Name & Bio (About)
        try:
            await client(UpdateProfileRequest(
                first_name=first_name,
                last_name=last_name,
                about=about
            ))
            logs.append(f"✅ [{session_basename}] 真实姓名已设为: {first_name} {last_name} | 简介: {about[:20]}...")
        except Exception as pe:
            logs.append(f"ℹ️ [{session_basename}] 姓名更新提示: {str(pe)}")

        # 2. Set Phone Number Privacy to Allow All
        try:
            await client(SetPrivacyRequest(
                key=InputPrivacyKeyPhoneNumber(),
                rules=[InputPrivacyValueAllowAll()]
            ))
            logs.append(f"✅ [{session_basename}] 手机号码隐私已设为: 所有人公开可见 (Allow All)")
        except Exception:
            pass

        # 3. Upload User Avatar Photo (STRICT: ONLY if user explicitly uploaded a local image/base64; NEVER use network URLs)
        avatar_src = avatar_base64 or item_data.get("avatarUrl") or item_data.get("avatar")
        
        if avatar_src and isinstance(avatar_src, str) and not avatar_src.startswith("http"):
            try:
                img_data = None
                if "," in avatar_src and ("base64" in avatar_src or avatar_src.startswith("data:")):
                    clean_b64 = avatar_src.split(",", 1)[1].strip()
                elif avatar_src.startswith("data:"):
                    clean_b64 = re.sub(r'^data:[^;]+;base64,', '', avatar_src).strip()
                elif len(avatar_src) > 200 and not os.path.exists(avatar_src):
                    clean_b64 = avatar_src.strip()
                elif os.path.exists(avatar_src):
                    with open(avatar_src, "rb") as f_img:
                        img_data = f_img.read()
                    clean_b64 = None
                else:
                    clean_b64 = None

                if clean_b64:
                    clean_b64 = re.sub(r'\s+', '', clean_b64)
                    missing_padding = len(clean_b64) % 4
                    if missing_padding:
                        clean_b64 += '=' * (4 - missing_padding)
                    img_data = base64.b64decode(clean_b64)

                if img_data and len(img_data) > 200:
                    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tf:
                        tf.write(img_data)
                        tmp_img_path = tf.name

                    logs.append(f"🖼️ [{session_basename}] 正在向 Telegram 官方 CDN 上传高画质头像 ({(len(img_data)/1024):.1f} KB)...")
                    uploaded_file = await client.upload_file(tmp_img_path)
                    await client(UploadProfilePhotoRequest(file=uploaded_file))
                    logs.append(f"🎉 [{session_basename}] 真实头像已成功写入 Telegram 官方服务器！")
                    try:
                        os.unlink(tmp_img_path)
                    except Exception:
                        pass
            except Exception as ie:
                logs.append(f"⚠️ [{session_basename}] 头像上传异常: {str(ie)}")

        # 4. Update username if requested
        if username:
            clean_user = username.replace('@', '').strip()
            if len(clean_user) >= 5:
                try:
                    await client(UpdateUsernameRequest(username=clean_user))
                    logs.append(f"✅ [{session_basename}] Username 已设为: @{clean_user}")
                except Exception as ue:
                    logs.append(f"ℹ️ [{session_basename}] Username 提示: {str(ue)}")

        # 5. Update local companion JSON file so metadata stays permanently in sync
        clean_phone = re.sub(r'[^0-9]', '', session_basename)
        companion_json_path = os.path.join(os.path.dirname(session_path), f"{clean_phone}.json")
        if not os.path.exists(companion_json_path):
            companion_json_path = os.path.join(os.getcwd(), "sessions", f"{clean_phone}.json")

        if os.path.exists(companion_json_path):
            try:
                with open(companion_json_path, "r", encoding="utf-8") as f_cj:
                    cdata = json.load(f_cj)
                if first_name: cdata["first_name"] = first_name
                if last_name is not None: cdata["last_name"] = last_name
                if about: cdata["about"] = about
                if username: cdata["username"] = username
                if avatar_src: cdata["avatar"] = avatar_src
                with open(companion_json_path, "w", encoding="utf-8") as f_cj:
                    json.dump(cdata, f_cj, indent=2, ensure_ascii=False)
            except Exception:
                pass

        return True
    except Exception as e:
        logs.append(f"❌ [{session_basename}] 物理更新异常: {str(e)}")
        return False
    finally:
        try:
            await client.disconnect()
        except Exception:
            pass

async def main():
    items = []
    logs = []
    if len(sys.argv) > 1:
        arg_val = sys.argv[1]
        try:
            if os.path.exists(arg_val) and os.path.isfile(arg_val):
                with open(arg_val, 'r', encoding='utf-8') as pf:
                    payload = json.load(pf)
            else:
                payload = json.loads(arg_val)
            items = payload.get("items", []) if isinstance(payload, dict) else payload
        except Exception as pe:
            logs.append(f"⚠️ Payload 参数解析提示: {str(pe)}")

    # Discover sessions across all common directories
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
                base_p = os.path.basename(sf).replace('.session', '')
                clean_p = re.sub(r'\D', '', base_p)
                if clean_p in BANNED_OBSOLETE_PHONES or base_p in BANNED_OBSOLETE_PHONES:
                    continue
                if sf not in seen and is_valid_telethon_session(sf):
                    seen.add(sf)
                    session_files.append(sf)

    logs = []
    logs.append("==================================================")
    logs.append("👤 Telegram 账号真实资料与头像 MTProto 同步上传引擎 (Python Telethon)")
    logs.append("==================================================")
    logs.append(f"📱 扫描到可用协议号文件: {len(session_files)} 个 (已自动剔除废弃黑名单)")

    # 建立并发控制（最多 6 个账号同时连接 TG 服务器，避免触发官方连接频控，15秒内快速完结）
    sem = asyncio.Semaphore(6)
    updated_count = 0

    async def run_with_sem(sf, data):
        nonlocal updated_count
        async with sem:
            res = await update_single_account(sf, data, logs)
            if res:
                updated_count += 1
            await asyncio.sleep(0.3)
            return res

    tasks = []
    if not items and session_files:
        for idx, sf in enumerate(session_files):
            item_data = {
                "firstName": BRAZILIAN_FEMALE_NAMES[idx % len(BRAZILIAN_FEMALE_NAMES)].split()[0],
                "lastName": BRAZILIAN_FEMALE_NAMES[idx % len(BRAZILIAN_FEMALE_NAMES)].split()[1] if len(BRAZILIAN_FEMALE_NAMES[idx % len(BRAZILIAN_FEMALE_NAMES)].split()) > 1 else "",
                "about": BRAZILIAN_BIOS[idx % len(BRAZILIAN_BIOS)]
            }
            tasks.append(run_with_sem(sf, item_data))
    else:
        for idx, item in enumerate(items):
            phone = str(item.get("phone", "")).replace("+", "").replace(" ", "").replace("-", "")
            if phone in BANNED_OBSOLETE_PHONES:
                continue
            target_sf = None
            for sf in session_files:
                if phone and phone in sf:
                    target_sf = sf
                    break
            if not target_sf and session_files:
                target_sf = session_files[idx % len(session_files)]

            if target_sf:
                tasks.append(run_with_sem(target_sf, item))

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    logs.append("==================================================")
    logs.append(f"🎯 [物理更新完成] 成功更新 {updated_count} 个 Telegram 账号真实资料与头像！")
    logs.append("==================================================")

    print(json.dumps({
        "success": updated_count > 0,
        "updatedCount": updated_count,
        "logs": logs,
        "output": "\n".join(logs)
    }, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(main())
