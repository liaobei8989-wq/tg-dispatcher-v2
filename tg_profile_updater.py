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

    first_name = item_data.get("firstName") or random.choice(BRAZILIAN_FEMALE_NAMES).split()[0]
    last_name = item_data.get("lastName") or (random.choice(BRAZILIAN_FEMALE_NAMES).split()[1] if len(random.choice(BRAZILIAN_FEMALE_NAMES).split()) > 1 else "")
    about = item_data.get("about") or random.choice(BRAZILIAN_BIOS)
    username = item_data.get("username")
    avatar_base64 = item_data.get("avatarBase64")

    if not is_valid_telethon_session(session_path):
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
        try:
            await asyncio.wait_for(client.connect(), timeout=12.0)
        except Exception as ce:
            if proxy_tuple:
                logs.append(f"⚠️ [代理响应慢]: 切入直连更新 [{session_basename}]...")
                try:
                    await client.disconnect()
                except Exception:
                    pass
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
            else:
                raise ce

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

        # 3. Upload User Avatar Photo (STRICT: ONLY if user explicitly uploaded a local image/base64; NEVER use network URLs or automatic fallbacks)
        avatar_src = avatar_base64 or item_data.get("avatarUrl")
        
        # Strictly reject any network HTTP/HTTPS URLs - only process local base64 images or local files
        if avatar_src and isinstance(avatar_src, str) and not avatar_src.startswith("http"):
            try:
                img_data = None
                if avatar_src.startswith("data:image") or len(avatar_src) > 500:
                    clean_b64 = re.sub(r'^data:image/\w+;base64,', '', avatar_src)
                    img_data = base64.b64decode(clean_b64)
                elif os.path.exists(avatar_src):
                    with open(avatar_src, "rb") as f_img:
                        img_data = f_img.read()

                if img_data and len(img_data) > 200:
                    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tf:
                        tf.write(img_data)
                        tmp_img_path = tf.name

                    logs.append(f"🖼️ [{session_basename}] 正在向 Telegram 官方 CDN 上传您上传的自定义头像 ({(len(img_data)/1024):.1f} KB)...")
                    uploaded_file = await client.upload_file(tmp_img_path)
                    await client(UploadProfilePhotoRequest(file=uploaded_file))
                    logs.append(f"🎉 [{session_basename}] 自定义头像已成功写入 Telegram 官方服务器！")
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
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
            items = payload.get("items", []) if isinstance(payload, dict) else payload
        except Exception:
            pass

    # Discover sessions across all common directories
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

    logs = []
    logs.append("==================================================")
    logs.append("👤 Telegram 账号真实资料与头像 MTProto 同步上传引擎 (Python Telethon)")
    logs.append("==================================================")
    logs.append(f"📱 扫描到服务器现有协议号文件: {len(session_files)} 个")

    updated_count = 0

    if not items and session_files:
        # Default batch modification
        for idx, sf in enumerate(session_files):
            item_data = {
                "firstName": BRAZILIAN_FEMALE_NAMES[idx % len(BRAZILIAN_FEMALE_NAMES)].split()[0],
                "lastName": BRAZILIAN_FEMALE_NAMES[idx % len(BRAZILIAN_FEMALE_NAMES)].split()[1] if len(BRAZILIAN_FEMALE_NAMES[idx % len(BRAZILIAN_FEMALE_NAMES)].split()) > 1 else "",
                "about": BRAZILIAN_BIOS[idx % len(BRAZILIAN_BIOS)]
            }
            res = await update_single_account(sf, item_data, logs)
            if res:
                updated_count += 1
            await asyncio.sleep(1.0)
    else:
        for idx, item in enumerate(items):
            phone = str(item.get("phone", "")).replace("+", "").replace(" ", "").replace("-", "")
            target_sf = None
            for sf in session_files:
                if phone and phone in sf:
                    target_sf = sf
                    break
            if not target_sf and session_files:
                target_sf = session_files[idx % len(session_files)]

            if target_sf:
                res = await update_single_account(target_sf, item, logs)
                if res:
                    updated_count += 1
                await asyncio.sleep(1.0)

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
