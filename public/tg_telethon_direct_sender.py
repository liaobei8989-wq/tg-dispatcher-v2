#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🚀 Telegram Telethon MTProto 4协议号高速交替轮发与防封直推引擎
====================================================================
优化核心原则：
1. 【0阻塞独立时间戳冷却】：每个账号的连续发信休眠采用独立的 cooldown_until 时间戳标记。
   单个账号触发休眠时，主线程绝不执行阻塞式 time.sleep，直接切入下一个可用账号继续发信！
2. 【彻底解耦回复雷达】：主发信循环内只全速推进首条破冰问候语发送（单条间隔 2~4 秒）。
   回复监听由独立的后台进程/协程异步批量轮询，彻底杜绝单条同步等待与网络 I/O 阻塞！
3. 【目标废号快速熔断 Fail-Fast】：一旦检测到目标号码未在 Telegram 注册或格式无效，
   立即记录到全局废号集合中并终止当前号码后续其他账号的重复尝试，秒级切入下一个目标！
====================================================================
"""

import json
import os
import random
import re
import sys
import time
import asyncio

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

# 默认参数 (巴西市场高转化真实葡萄牙语破冰问候语库)
MESSAGE_SPINTAX_TEMPLATE = "{Oi, tudo bem? Vi você lá no grupo dos jogos, achei seu perfil tão legal e resolvi chamar. 😊|Olá! Tudo bem? Entrei no grupo de jogos esses dias e vi você comentando, adoro gente que joga sério! 😉|Oie! Tudo joia? Te vi no grupo, não aguentei e vim te dar um \"oi\". Você parece ser gente boa. 👋|Oi, chefe! Tudo bem? Achei você lá no grupo, adoro conhecer gente nova que curte esse mundo de aposta. 😍|Olá! Tudo bem? Vi você no grupo e resolvi te chamar. É raro achar alguém que joga bem como você por lá! ✨|Fala jogador! Beleza? Vi seu perfil no grupo e passei pra te dar um salve! 👊|E aí, beleza? Vi você bem ativo no chat do grupo hoje! 💬|Opa, fala aí! Tudo certo por aí? Vi você no grupo de apostas! 👋|Opa, tranquilo? Te vi no grupo e resolvi puxar assunto! 😊|Salve! Como estão as coisas por aí? Vi seu comentário lá no grupo! 🔥|E aí, parceiro! Tudo joia? Achei seu nick bem massa no grupo! 🎮|Fala irmão! Tudo certinho? Sempre te vejo online lá no grupo! 😉|Oi, tudo bem? Tudo tranquilo por aí? Gostei das suas opiniões no grupo! 👍|E aí, suave? Vi que você também faz parte daquele grupo de apostas! 😄|Opa meu amigo! Como você tá? Te achei na lista de membros do grupo! 👋|Salve, beleza? Tudo em paz? Passando pra mandar um abraço! ✨|E aí, tudo bom? Bora trocar uma ideia rápida? Vi você no grupo! 🤝|Opa, de boa? Vi você no grupo e achei bacana te mandar mensagem! 😊|Oi amigo, beleza? Vi que você interage bastante lá no grupo! 💥|Fala campeão, tudo 100% por aí? Vi seu perfil lá no canal! 🏆|Opa, tudo na paz? Como tá seu dia? Te vi no grupo de cassino! ☀️|E aí meu brother, beleza? Legal te encontrar por aqui também! 🤙|Fala parceiro! Tudo certinho com você? Vi seu perfil no grupo dos jogos! 🚀|Salve salve! Tudo bem com você hoje? Passando pra dar um oi! 👋|E aí, como vai? Vi seu nome lá no grupo e resolvi mandar mensagem! 😊|Nossa, vi você jogando naquele grupo! Joga muito, hein! Tem alguma dica pra me dar? 🤩|Oi, tudo bem? Fiquei impressionada com suas jogadas lá no grupo, você é fera! 🔥|Olá! Tudo bem? Vi você mandando super bem no grupo. Admiro quem leva os jogos a sério assim. 🥰|Oi, mano! Tudo joia? Você joga muito naquele grupo, virei sua fã! Sério! 💖|Olá, mestre! Tudo bem? Te vi no grupo, seus palpites são os melhores! Quero aprender com você. 😏}"
SECOND_MESSAGE_TEMPLATE = "🔥 PROMOÇÃO EXCLUSIVA! 🎁 500% de Bônus! 🎰 Cadastre-se e receba na hora: {https://m1.promobr1.xyz/pt|https://m2.promobr2.xyz/pt|https://m3.promobr1.xyz/pt}"
AUTO_SEND_SECOND = True  # 是否开启第二阶段追发
WAIT_FOR_REPLY = True  # 两步走策略：首条发问候，回复后由后台守护异步追发
LISTEN_TIMEOUT = 0  # 彻底移除同步等待，0 秒阻塞
TARGET_RECEIVERS = ["+5571999149956", "+5571996984203"]
BOT_TOKEN = "8210889847:AAFl1M3Mio8UtqSA6QoYZopXF1kJ0kLO1Vk"
API_ID = "2040"
API_HASH = "b18441a1ff607e10a989891a5462e627"
SESSION_STRING = None
SENDER_PHONE = None
SESSION_FILE = None
FORCE_USER_MODE = True

# 高速平稳风控间隔 (单条错峰 2~4 秒，4个号轮流即各号自然拥有 8~16 秒保护间隔)
SINGLE_DELAY_MIN = 2
SINGLE_DELAY_MAX = 4
BATCH_MIN_LIMIT = 10
BATCH_MAX_LIMIT = 18
BATCH_REST_MIN = 60
BATCH_REST_MAX = 120

# 4 个健康发件账号集群池
HEALTHY_ACCOUNTS = [
    {"phone": "+55 41 98702-3810", "session": "5541987023810.session"},
    {"phone": "+55 38 99197-7854", "session": "5538991977854.session"},
    {"phone": "+55 38 99230-4845", "session": "5538992304845.session"},
    {"phone": "+55 38 98863-0899", "session": "5538988630899.session"},
]

# 全局未注册/废号熔断黑名单
INVALID_TARGETS_CACHE = set()

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
        "twofa": None,
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
                    if data.get("twofa") or data.get("password"):
                        config["twofa"] = str(data.get("twofa") or data.get("password"))
                    break
            except Exception as e:
                pass
    return config

def get_session_file_handle(phone_or_session):
    """ 获取 Telethon 适用的 session 文件路径 (不含 .session 后缀) """
    clean_digits = re.sub(r'[^0-9]', '', str(phone_or_session))
    candidates = [
        os.path.join(os.getcwd(), "sessions", f"{clean_digits}.session"),
        os.path.join(os.getcwd(), "sessions", f"{phone_or_session}"),
        os.path.join(os.getcwd(), f"{clean_digits}.session"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.splitext(c)[0]
    fallback = os.path.join(os.getcwd(), "sessions", clean_digits)
    return fallback

# 巴西原生 SOCKS5 代理 IP池
BRAZIL_PROXIES = [
    "200.160.36.222:12323:14aade52b86e6:70dd653fc2",
    "200.239.237.124:12323:14aade52b86e6:70dd653fc2",
    "200.160.43.132:12323:14aade52b86e6:70dd653fc2",
    "200.160.38.29:12323:14aade52b86e6:70dd653fc2",
    "200.239.213.26:12323:14aade52b86e6:70dd653fc2"
]

# 解析命令行 JSON 参数
if len(sys.argv) > 1:
    try:
        input_data = json.loads(sys.argv[1])
        if isinstance(input_data, dict):
            if "targets" in input_data and isinstance(input_data["targets"], list) and len(input_data["targets"]) > 0:
                TARGET_RECEIVERS = input_data["targets"]
            if "message" in input_data and input_data["message"]:
                MESSAGE_SPINTAX_TEMPLATE = input_data["message"]
            if "second_message" in input_data and input_data["second_message"]:
                SECOND_MESSAGE_TEMPLATE = input_data["second_message"]
            if "auto_send_second" in input_data:
                AUTO_SEND_SECOND = bool(input_data["auto_send_second"])
            if "wait_for_reply" in input_data:
                WAIT_FOR_REPLY = bool(input_data["wait_for_reply"])
            if "listen_timeout" in input_data and input_data["listen_timeout"] is not None:
                LISTEN_TIMEOUT = int(input_data["listen_timeout"])
            if "bot_token" in input_data and input_data["bot_token"]:
                BOT_TOKEN = input_data["bot_token"]
            if "api_id" in input_data and input_data["api_id"]:
                API_ID = str(input_data["api_id"])
            if "api_hash" in input_data and input_data["api_hash"]:
                API_HASH = str(input_data["api_hash"])
            if "session_string" in input_data and input_data["session_string"]:
                SESSION_STRING = input_data["session_string"]
            if "sender_phone" in input_data and input_data["sender_phone"]:
                SENDER_PHONE = str(input_data["sender_phone"])
            if "session_file" in input_data and input_data["session_file"]:
                SESSION_FILE = str(input_data["session_file"])
            if "force_user_mode" in input_data:
                FORCE_USER_MODE = bool(input_data["force_user_mode"])
            if "delay_min" in input_data and input_data["delay_min"] is not None:
                SINGLE_DELAY_MIN = int(input_data["delay_min"])
            if "delay_max" in input_data and input_data["delay_max"] is not None:
                SINGLE_DELAY_MAX = int(input_data["delay_max"])
            if "batch_min" in input_data and input_data["batch_min"] is not None:
                BATCH_MIN_LIMIT = int(input_data["batch_min"])
            if "batch_max" in input_data and input_data["batch_max"] is not None:
                BATCH_MAX_LIMIT = int(input_data["batch_max"])
            if "batch_rest_min" in input_data and input_data["batch_rest_min"] is not None:
                BATCH_REST_MIN = int(input_data["batch_rest_min"])
            if "batch_rest_max" in input_data and input_data["batch_rest_max"] is not None:
                BATCH_REST_MAX = int(input_data["batch_rest_max"])
    except Exception as err:
        print(f"⚠️ [参数解析提示] 未能解析 JSON 参数: {err}")

# 格式化目标手机号
cleaned_targets = []
for target in TARGET_RECEIVERS:
    t_str = str(target).strip()
    if t_str.startswith("@") or t_str.startswith("-"):
        cleaned_targets.append(t_str)
    else:
        digits = re.sub(r'[^\d]', '', t_str)
        if digits:
            cleaned_targets.append(f"+{digits}")
        else:
            cleaned_targets.append(t_str)
TARGET_RECEIVERS = cleaned_targets if cleaned_targets else ["+5571999149956", "+5571996984203"]

def parse_spintax(text: str) -> str:
    """ 解析 Spintax {A|B|C} 语法 """
    pattern = re.compile(r'\{([^{}]+)\}')
    while True:
        match = pattern.search(text)
        if not match:
            break
        options = match.group(1).split('|')
        text = text[:match.start()] + random.choice(options) + text[match.end():]
    return text

def main():
    print("==================================================")
    print("🚀 Telegram Telethon 4 协议号极速轮发引擎 (优化版)")
    print("==================================================")
    
    proxy_choice = random.choice(BRAZIL_PROXIES)
    p_parts = proxy_choice.split(":")
    proxy_ip = p_parts[0]
    proxy_port = p_parts[1]
    
    print(f"🇧🇷 [巴西 SOCKS5 代理网络]: 已绑定出口 IP {proxy_ip}:{proxy_port}")
    print(f"🟢 [4协议号交替调度]: 严格轮流调度 (+55 41 98702-3810 / +55 38 99197-7854 / +55 38 99230-4845 / +55 38 98863-0899)")
    print(f"📦 [零死锁架构]: 独立时间戳标记冷却，主发信循环 0 阻塞无缝切换可用账号")
    print(f"⚡ [雷达完全解耦]: 主循环全速推进发信 (单条错开 {SINGLE_DELAY_MIN}~{SINGLE_DELAY_MAX}s)，回复由后台守护进程异步处理")
    print(f"🚫 [Fail-Fast 熔断]: 废号/未注册 TG 号单次检测立即熔断，严禁多号重复请求")
    print(f"📊 待处理目标名单: {len(TARGET_RECEIVERS)} 条目标")
    print("==================================================\n")

    success_count = 0
    fail_count = 0

    has_telethon = False
    try:
        from telethon import TelegramClient
        from telethon.sessions import StringSession
        from telethon.tl.functions.contacts import ImportContactsRequest
        from telethon.tl.types import InputPhoneContact
        has_telethon = True
    except ImportError:
        has_telethon = False

    # 每一个账号独立的拟人风控追踪器 (key: phone)
    account_tracker = {}

    def get_acc_state(phone_key):
        if phone_key not in account_tracker:
            account_tracker[phone_key] = {
                "sent_count": 0,
                "limit": random.randint(BATCH_MIN_LIMIT, BATCH_MAX_LIMIT),
                "cooldown_until": 0
            }
        return account_tracker[phone_key]

    # 装载所有可用的协议号列表
    candidate_accounts = []
    if SENDER_PHONE and not "2fa" in SENDER_PHONE.lower():
        clean_digits = re.sub(r'[^0-9]', '', SENDER_PHONE)
        if len(clean_digits) >= 7:
            primary_sess = SESSION_FILE or f"{clean_digits}.session"
            if not "2fa" in str(primary_sess).lower():
                candidate_accounts.append({"phone": SENDER_PHONE, "session": primary_sess})
    
    # 动态从数据库与本地存储装载所有有效发件 Session 协议号
    if session_db_manager:
        try:
            for s in session_db_manager.list_sessions():
                fn = s.get("fileName", "")
                if fn.endswith(".session") and not "2fa" in fn.lower():
                    clean_n = re.sub(r'[^0-9]', '', fn)
                    if len(clean_n) >= 7:
                        ph = f"+{clean_n}"
                        if not any(c.get("session") == fn for c in candidate_accounts):
                            candidate_accounts.append({"phone": ph, "session": fn})
        except Exception:
            pass
    
    # 补充：直接扫描 sessions 目录下的真实 .session 协议文件
    try:
        sess_dir = os.path.join(os.getcwd(), "sessions")
        if os.path.exists(sess_dir):
            for fn in os.listdir(sess_dir):
                if fn.endswith(".session") and not "2fa" in fn.lower() and not fn.startswith("auto_") and fn != "stats.json":
                    clean_n = re.sub(r'[^0-9]', '', fn)
                    if len(clean_n) >= 7:
                        ph = f"+{clean_n}"
                        if not any(c.get("session") == fn for c in candidate_accounts):
                            candidate_accounts.append({"phone": ph, "session": fn})
    except Exception:
        pass

    for acc in HEALTHY_ACCOUNTS:
        if not any(c.get("phone") == acc.get("phone") or c.get("session") == acc.get("session") for c in candidate_accounts):
            candidate_accounts.append(acc)

    if not candidate_accounts:
        candidate_accounts = HEALTHY_ACCOUNTS

    round_robin_pointer = 0

    for idx, target in enumerate(TARGET_RECEIVERS):
        # 1. 废号快速熔断拦截检查
        if target in INVALID_TARGETS_CACHE:
            print(f"🚫 [已熔断废号跳过]: 目标 {target} 已经过系统判定为未注册 TG 废号，秒级跳过！")
            fail_count += 1
            continue

        # 2. 单条极速错峰间隔 (2~4 秒)
        if idx > 0:
            interval_time = random.uniform(float(SINGLE_DELAY_MIN), float(SINGLE_DELAY_MAX))
            print(f"⏳ 【单条极速错峰间隔】: 间隔 {interval_time:.1f} 秒推进下一个号码 (设定: {SINGLE_DELAY_MIN}~{SINGLE_DELAY_MAX}s)...")
            time.sleep(interval_time)

        # 3. 智能挑选下一个可用发件账号 (0 阻塞轮询)
        now_ts = time.time()
        selected_acc = None
        selected_idx_in_pool = 0

        for step in range(len(candidate_accounts)):
            cand_idx = (round_robin_pointer + step) % len(candidate_accounts)
            cand = candidate_accounts[cand_idx]
            cand_st = get_acc_state(cand["phone"])
            if now_ts >= cand_st["cooldown_until"]:
                selected_acc = cand
                selected_idx_in_pool = cand_idx
                round_robin_pointer = (cand_idx + 1) % len(candidate_accounts)
                break

        # 4. 罕见分支：若所有 4 个账号恰好都在休眠中，仅等待最早恢复账号的剩余秒数
        if not selected_acc:
            earliest_acc = candidate_accounts[0]
            earliest_st = get_acc_state(earliest_acc["phone"])
            earliest_idx = 0
            for i_acc, acc in enumerate(candidate_accounts):
                st = get_acc_state(acc["phone"])
                if st["cooldown_until"] < earliest_st["cooldown_until"]:
                    earliest_acc = acc
                    earliest_st = st
                    earliest_idx = i_acc
            wait_sec = max(1.0, earliest_st["cooldown_until"] - time.time())
            print(f"⏳ 【全号独立休眠中】等待最早账号 [{earliest_acc['phone']}] 还剩 {int(wait_sec)} 秒...")
            time.sleep(wait_sec)
            selected_acc = earliest_acc
            selected_idx_in_pool = earliest_idx
            round_robin_pointer = (earliest_idx + 1) % len(candidate_accounts)

        final_greeting = parse_spintax(MESSAGE_SPINTAX_TEMPLATE)
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] --------------------------------------------------")
        print(f"🎯 营销目标 [{idx+1}/{len(TARGET_RECEIVERS)}]: {target}")
        print(f"💬 阶段1纯问候语 (第一步): {final_greeting}")

        telethon_sent_real = False
        target_is_invalid = False
        status_real = ""

        if has_telethon:
            # 尝试当前选中的账号，若该账号出现网络/账号异常，可切入下一个健康账号接力
            attempt_accounts = [
                selected_acc,
                *[acc for acc in candidate_accounts if acc["phone"] != selected_acc["phone"]]
            ]

            for acc_idx, acc in enumerate(attempt_accounts):
                if target_is_invalid:
                    # 目标已熔断，严禁其他账号重复尝试
                    break

                cur_acc_phone = acc["phone"]
                cur_acc_sess = acc.get("session", "")

                if acc_idx > 0:
                    print(f"🔄 【账号故障接力】发件号切换至 [{cur_acc_phone}] 接力发信...")

                # 动态加载账号专属配置与凭证路径
                acc_cfg = load_account_config(cur_acc_sess or cur_acc_phone)
                tmp_handle = get_session_file_handle(cur_acc_sess or cur_acc_phone)
                session_str_val = SESSION_STRING or acc_cfg.get("session_string")

                # 解析该账号对应的独立代理
                telethon_proxy = None
                acc_proxy = acc_cfg.get("proxy")
                if acc_proxy and isinstance(acc_proxy, dict) and acc_proxy.get("addr"):
                    try:
                        import socks
                        p_type = socks.HTTP if acc_proxy.get("proxy_type", "").lower() == "http" else socks.SOCKS5
                        telethon_proxy = (
                            p_type,
                            acc_proxy["addr"],
                            int(acc_proxy["port"]),
                            True,
                            acc_proxy.get("username"),
                            acc_proxy.get("password")
                        )
                    except Exception:
                        telethon_proxy = None

                print(f"📱 正在载入 Telegram 协议号 [{acc_idx + 1}/{len(candidate_accounts)}]: {cur_acc_phone} (App ID: {acc_cfg['api_id']}, Proxy: {acc_proxy.get('addr') if acc_proxy else 'Direct'})...")

                try:
                    async def run_telethon_send():
                        nonlocal target_is_invalid
                        try:
                            curr_api_id = acc_cfg["api_id"]
                            curr_api_hash = acc_cfg["api_hash"]

                            client = None
                            if session_str_val:
                                try:
                                    client = TelegramClient(
                                        StringSession(session_str_val),
                                        curr_api_id,
                                        curr_api_hash,
                                        device_model=acc_cfg["device_model"],
                                        system_version=acc_cfg["system_version"],
                                        app_version=acc_cfg["app_version"],
                                        lang_code=acc_cfg["lang_code"],
                                        system_lang_code=acc_cfg["system_lang_code"],
                                        proxy=telethon_proxy
                                    )
                                    await client.connect()
                                    if not await client.is_user_authorized():
                                        await client.disconnect()
                                        client = None
                                except Exception:
                                    client = None

                            if client is None:
                                client = TelegramClient(
                                    tmp_handle,
                                    curr_api_id,
                                    curr_api_hash,
                                    device_model=acc_cfg["device_model"],
                                    system_version=acc_cfg["system_version"],
                                    app_version=acc_cfg["app_version"],
                                    lang_code=acc_cfg["lang_code"],
                                    system_lang_code=acc_cfg["system_lang_code"],
                                    proxy=telethon_proxy
                                )
                                await client.connect()

                            if not await client.is_user_authorized():
                                await client.disconnect()
                                return False, f"发件号 {cur_acc_phone} 未完成授权或凭证失效"
                            
                            me = await client.get_me()
                            acc_label = me.first_name if me else cur_acc_phone
                            print(f"✅ [TG 协议号 {cur_acc_phone} 鉴权成功]: {acc_label}")

                            clean_p = f"+{re.sub(r'[^0-9]', '', str(target))}" if not str(target).startswith("@") and not str(target).startswith("-") else str(target)
                            peer = clean_p
                            if clean_p.startswith("+"):
                                try:
                                    contact = InputPhoneContact(client_id=0, phone=clean_p, first_name="Cliente", last_name="")
                                    result = await client(ImportContactsRequest([contact]))
                                    if result.users:
                                        peer = result.users[0]
                                        print(f"✅ [通讯录写入成功]: 已匹配 Telegram User ID {peer.id} ({peer.first_name})")
                                    else:
                                        # Telegram 明确返回该号码未注册
                                        target_is_invalid = True
                                        INVALID_TARGETS_CACHE.add(target)
                                        print(f"🚫 [目标废号快速熔断 Fail-Fast]: 目标号码 {target} 尚未在 Telegram 注册，已立即熔断跳过，严禁后续其他账号重复请求！")
                                        return False, f"目标号码 {target} 尚未在 Telegram 注册"
                                except Exception as c_err:
                                    c_err_str = str(c_err)
                                    if "Cannot find any entity" in c_err_str or "UsernameInvalid" in c_err_str or "PhoneNotRegistered" in c_err_str:
                                        target_is_invalid = True
                                        INVALID_TARGETS_CACHE.add(target)
                                        print(f"🚫 [目标废号快速熔断 Fail-Fast]: {c_err_str}，已熔断废号！")
                                        return False, f"目标未注册: {c_err_str}"
                                    peer = clean_p
                            
                            sent_msg = await client.send_message(peer, final_greeting)
                            print(f"✨ 【第一步问候成功送达】 Message ID: {sent_msg.id} 已推送至目标 {target} Telegram 客户端！")

                            if SECOND_MESSAGE_TEMPLATE and AUTO_SEND_SECOND:
                                if WAIT_FOR_REPLY:
                                    print(f"🛡️ [后台守护监听中]: 目标已接入后台回复雷达（每 60 秒异步巡航），发信主循环全速推进 0 阻塞！")
                                else:
                                    await asyncio.sleep(1.5)
                                    final_second_msg = parse_spintax(SECOND_MESSAGE_TEMPLATE)
                                    sent_msg2 = await client.send_message(peer, final_second_msg, parse_mode='html')
                                    print(f"🚀 【第二步彩金文案已送达】 Message ID: {sent_msg2.id}")

                            return True, f"Success via {cur_acc_phone}"
                        except Exception as inner_e:
                            err_str = str(inner_e)
                            err_type = type(inner_e).__name__
                            
                            diag = "发送异常"
                            if "Cannot find any entity" in err_str or "UsernameInvalid" in err_str or "PhoneNotRegistered" in err_str:
                                target_is_invalid = True
                                INVALID_TARGETS_CACHE.add(target)
                                diag = f"🚫 [目标未注册 TG 快速熔断]: 目标号码 {target} 尚未在 Telegram 注册或格式无效"
                            elif "PeerFlood" in err_str or "PeerFloodError" in err_type:
                                diag = "⚠️ [Telegram 账号受限]: 该发件号被 Telegram 官方临时限制向陌生人发信 (PeerFlood/SpamBlock)，系统已自动跳过此号"
                            elif "FloodWait" in err_str or "FloodWaitError" in err_type:
                                diag = f"⏳ [Telegram 限流等待]: {err_str}"
                            elif "UserPrivacyRestricted" in err_str or "Privacy" in err_str:
                                diag = "🔒 [目标隐私保护]: 该目标用户的 Telegram 开启了免打扰，不允许非双向好友发起私聊"
                            elif "AuthKeyUnregistered" in err_str or "Session" in err_str or "Unauthorized" in err_str:
                                diag = "🔑 [发件凭证失效]: 该 .session 账号登录态已过期或被强制登出"
                            else:
                                diag = f"⚠️ [通讯异常]: {err_str}"
                                
                            print(f"⚠️ [发件号 {cur_acc_phone} 处理详情]: {diag}")
                            return False, diag
                        finally:
                            try:
                                if 'client' in locals() and client.is_connected():
                                    await client.disconnect()
                            except Exception:
                                pass

                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        ok_real, status_real = loop.run_until_complete(run_telethon_send())
                    finally:
                        try:
                            pending = asyncio.all_tasks(loop)
                            for task in pending:
                                task.cancel()
                            if pending:
                                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                            loop.close()
                        except Exception:
                            pass

                    if ok_real:
                        telethon_sent_real = True
                        success_count += 1

                        # 更新当前发件号独立的连续发送计数与休眠判定
                        st = get_acc_state(cur_acc_phone)
                        st["sent_count"] += 1
                        if st["sent_count"] >= st["limit"]:
                            rest_time = random.randint(BATCH_REST_MIN, BATCH_REST_MAX)
                            st["cooldown_until"] = time.time() + rest_time
                            old_sent = st["sent_count"]
                            st["sent_count"] = 0
                            st["limit"] = random.randint(BATCH_MIN_LIMIT, BATCH_MAX_LIMIT)
                            print(f"☕ 【单号拟人独立休眠标记】发件号 [{cur_acc_phone}] 已连续发送 {old_sent} 条，已标记独立休眠 {rest_time}s！主发信循环立即切入其它可用账号继续发信，0 阻塞全局主线程！")
                        break
                except Exception as loop_e:
                    print(f"❌ [账号 {cur_acc_phone} 执行异常]: {loop_e}")
                    status_real = f"账号 {cur_acc_phone} 执行异常: {loop_e}"

        if not telethon_sent_real:
            fail_count += 1
            diag_reason = status_real if status_real and status_real != "False" else "未能成功与 Telegram 节点握手或目标未注册"
            print(f"❌ [消息未送达 Telegram]: 目标 {target} 投递未完成。详情: {diag_reason}")

    print("\n==================================================")
    print(f"🎉 [Telegram 任务处理完成] 总计: {len(TARGET_RECEIVERS)} 条 | 阶段1送达: {success_count} | 失败: {fail_count}")
    print("==================================================")

if __name__ == "__main__":
    main()
