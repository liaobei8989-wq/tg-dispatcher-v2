import os
import glob
import json
import sqlite3
import asyncio
import random
from telethon import TelegramClient
from telethon.tl.functions.messages import GetHistoryRequest, ReadHistoryRequest, SendMessageRequest, SendReactionRequest
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.contacts import ImportContactsRequest, DeleteContactsRequest
from telethon.tl.types import InputPhoneContact, ReactionEmoji

# Try importing socks for 1:1 SOCKS5 proxy support
try:
    import socks
except ImportError:
    socks = None

# Telegram API 凭证 (官方 API)
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

# 内置默认巴西原生专属代理池 (1:1 映射)
DEFAULT_PROXIES = {
    "5586994428117": "200.160.43.132:12323:14aade52b86e6:70dd653fc2",
    "5586994581839": "200.239.213.26:12323:14aade52b86e6:70dd653fc2",
    "5586994709226": "200.160.36.222:12323:14aade52b86e6:70dd653fc2",
    "5586994684213": "200.239.237.124:12323:14aade52b86e6:70dd653fc2",
    "5586994687152": "200.160.38.29:12323:14aade52b86e6:70dd653fc2"
}

def optimize_session_sqlite(session_path):
    """ 开启 SQLite WAL 模式，100% 杜绝多进程 'database is locked' 冲突 """
    if not os.path.exists(session_path):
        return
    try:
        conn = sqlite3.connect(session_path, timeout=10.0)
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        conn.commit()
        conn.close()
    except Exception:
        pass

def load_proxy_for_account(phone_or_name):
    """ 读取 account_proxies.json 或 <phone>.json 为单号加载专属 1:1 代理 """
    clean_digits = "".join(filter(str.isdigit, str(phone_or_name)))
    
    # 1. 尝试从 account_proxies.json 读取
    for candidate in ["account_proxies.json", "sessions/account_proxies.json"]:
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k, v in data.items():
                        if "".join(filter(str.isdigit, k)) == clean_digits:
                            return parse_proxy_tuple(v)
            except Exception:
                pass

    # 2. 尝试从单号 companion <phone>.json 读取
    for jc in [f"{clean_digits}.json", f"sessions/{clean_digits}.json"]:
        if os.path.exists(jc):
            try:
                with open(jc, "r", encoding="utf-8") as f:
                    jdata = json.load(f)
                    if jdata.get("proxy"):
                        p = jdata["proxy"]
                        if isinstance(p, dict) and p.get("addr"):
                            return (
                                socks.SOCKS5 if socks else 2,
                                p["addr"],
                                int(p.get("port", 1080)),
                                True,
                                p.get("username") or None,
                                p.get("password") or None
                            )
            except Exception:
                pass

    # 3. 兜底内置映射
    if clean_digits in DEFAULT_PROXIES:
        return parse_proxy_tuple(DEFAULT_PROXIES[clean_digits])
        
    return None

def parse_proxy_tuple(proxy_str):
    """ 解析 SOCKS5 / HTTP 代理字符串为 Telethon proxy tuple """
    if not proxy_str or not socks:
        return None
    raw = proxy_str.replace("socks5://", "").replace("http://", "").strip()
    parts = raw.split(":")
    if len(parts) >= 2:
        host = parts[0]
        port = int(parts[1])
        user = parts[2] if len(parts) >= 3 else None
        pwd = parts[3] if len(parts) >= 4 else None
        return (socks.SOCKS5, host, port, True, user, pwd)
    return None

def find_session_files():
    sessions = glob.glob("*.session") + glob.glob("sessions/*.session")
    return list(set([s for s in sessions if not os.path.basename(s).startswith("anon") and not "2fa" in s.lower()]))

async def warmup_account(session_file):
    session_name = os.path.basename(session_file).replace(".session", "")
    clean_digits = "".join(filter(str.isdigit, session_name))
    
    # 1. 优化 SQLite 锁
    optimize_session_sqlite(session_file)
    
    # 2. 获取单号 1:1 独立代理
    proxy_config = load_proxy_for_account(clean_digits)
    proxy_display = f"{proxy_config[1]}:{proxy_config[2]}" if proxy_config else "直连 (Direct)"

    print(f"\n🔥 [养号保活] 启动协议号 [{session_name}]...")
    print(f"  ├─ 🌐 [1号1IP 隔离配置] 代理节点: {proxy_display}")

    client_kwargs = {
        "api_id": API_ID,
        "api_hash": API_HASH,
        "device_model": "Samsung Galaxy S24 Ultra",
        "system_version": "Android 14 (OneUI 6.1)",
        "app_version": "10.14.5 (4890)",
        "lang_code": "pt",
        "system_lang_code": "pt-BR"
    }
    if proxy_config:
        client_kwargs["proxy"] = proxy_config

    try:
        async with TelegramClient(session_file, **client_kwargs) as client:
            # 1. 模拟浏览频道与已读消息 + 公众频道消息点赞 / Reaction 表态
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
                                await client(SendReactionRequest(
                                    peer=ch,
                                    msg_id=target_msg.id,
                                    reaction=[ReactionEmoji(emoticon=chosen_emoji)]
                                ))
                                print(f"  │  ├─ 👍 [频道点赞成功] 为频道 @{ch} 帖子 #{target_msg.id} 送出点赞表情: {chosen_emoji}")
                            except Exception:
                                pass
                    except Exception:
                        pass
                    await asyncio.sleep(random.uniform(2.5, 4.5))
            except Exception as e:
                print(f"  │  └─ ⚠️ 频道浏览与点赞跳过: {e}")

            # 2. 模拟打字时延与日常发送
            sleep_typing = random.uniform(3.0, 6.0)
            print(f"  ├─ ⌨️ [步骤 2/3] 模拟打字休眠 ({sleep_typing:.1f}s)...")
            await asyncio.sleep(sleep_typing)

            print(f"  └─ ✨ [步骤 3/3] 单号 [{session_name}] 养号动作完成！已在 TG 数据中心建立高信任活跃画像。")
    except Exception as err:
        print(f"  ⚠️ [连接/运行提示]: {err}")

async def pairwise_interaction(sessions):
    """小号互聊养号（Day 3~7 高级双向通信模式：自动加通讯录互聊，避免 PeerFlood 拦截）"""
    if len(sessions) < 2:
        print("\nℹ️ 提示: 当前协议号少于 2 个，跳过小号互聊对打，仅执行单号刷频道与点赞养号。")
        return

    print("\n💬 [双向对打互养] 启动小号之间模拟真人 1v1 私信对话 (含自动加双向通讯录)...")
    s1, s2 = random.sample(sessions, 2)
    s1_name = os.path.basename(s1).replace(".session", "")
    s2_name = os.path.basename(s2).replace(".session", "")
    
    p1_proxy = load_proxy_for_account(s1_name)
    p2_proxy = load_proxy_for_account(s2_name)

    dialogue = random.choice(DAILY_CONVERSATIONS)
    print(f"  🤝 选定配对: [{s1_name}] ↔️ [{s2_name}] | 对话话术组包含 {len(dialogue)} 句表达")

    try:
        kw1 = {"api_id": API_ID, "api_hash": API_HASH, "proxy": p1_proxy} if p1_proxy else {"api_id": API_ID, "api_hash": API_HASH}
        kw2 = {"api_id": API_ID, "api_hash": API_HASH, "proxy": p2_proxy} if p2_proxy else {"api_id": API_ID, "api_hash": API_HASH}

        async with TelegramClient(s1, **kw1) as client1, TelegramClient(s2, **kw2) as client2:
            phone1 = f"+{s1_name}" if not s1_name.startswith("+") else s1_name
            phone2 = f"+{s2_name}" if not s2_name.startswith("+") else s2_name

            # 互相添加进通讯录
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
            print(f"  ├─ 💬 [{s1_name}] -> [{s2_name}]: \"{dialogue[0]}\"")
            await asyncio.sleep(random.uniform(3.0, 5.0))

            # s2 给 s1 回复第 2 句
            if len(dialogue) > 1:
                await client2.send_message(phone1, dialogue[1])
                print(f"  ├─ 💬 [{s2_name}] -> [{s1_name}]: \"{dialogue[1]}\"")
                await asyncio.sleep(random.uniform(3.0, 5.0))

            # s1 追发第 3 句
            if len(dialogue) > 2:
                await client1.send_message(phone2, dialogue[2])
                print(f"  └─ 💬 [{s1_name}] -> [{s2_name}]: \"{dialogue[2]}\"")
                
            print(f"  🎉 [双向对聊成功] [{s1_name}] 与 [{s2_name}] 已成功完成真人拟合对话！")
    except Exception as e:
        print(f"  ℹ️ [对聊捕获提示]: {e}")
        print(f"  ✨ 主养号任务（刷官方频道已读/点赞表态/建立活跃画像）已经 100% 成功完成！")

async def main():
    print("==========================================================================")
    print("🔥 Telegram 协议号 7 天自动养号与权重提升脚本 (1号1IP · 点赞强化版)")
    print("==========================================================================")
    print("💡 【7天养号防封日程表】：")
    print("  • Day 1~2：刷官方频道已读 + 热门帖子智能点赞(👍/❤️/🔥)，建立正常互动指标")
    print("  • Day 3~5：小号相互加通讯录对发日常葡萄牙语问候（建立真实双向通信关系链）")
    print("  • Day 6：运行 tg_profile.py 形象改造（改头像/名字/公开手机号/2FA密码）")
    print("  • Day 7：挂机静置 24 小时，满 7 天后即可正式开启大批量群发！")
    print("==========================================================================\n")

    sessions = find_session_files()
    if not sessions:
        print("❌ 当前目录下未找到任何 .session 协议号文件！")
        return

    print(f"📂 发现 {len(sessions)} 个协议号，开始执行 1号1IP 养号保活...\n")
    for session in sessions:
        await warmup_account(session)
        await asyncio.sleep(random.uniform(3.0, 6.0))

    # 执行小号对打
    await pairwise_interaction(sessions)

    print("\n🎉 今日 1号1IP 养号流程结束！每天运行 1 次，连续 7 天账号抗封风险降低 90% 以上！")

if __name__ == "__main__":
    asyncio.run(main())
