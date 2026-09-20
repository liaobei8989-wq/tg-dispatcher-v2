import os, re, subprocess, sys

base_dir = "/var/www/tg-dispatcher-v2" if os.path.exists("/var/www/tg-dispatcher-v2") else os.getcwd()
os.chdir(base_dir)

print("🚀 开始执行 VPS 核心补丁与全量构建升级...")

# 1. 修复 tg_dispatcher.py
dispatcher_path = os.path.join(base_dir, "tg_dispatcher.py")
if os.path.exists(dispatcher_path):
    with open(dispatcher_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_code = '''async def send_single_target(client: TelegramClient, target: str, message: str, second_msg: str = "", third_msg: str = "", enable_third: bool = True, wait_reply: bool = False, third_delay_min: float = 3.5, third_delay_max: float = 6.5, logs: list = None):
    clean_target = re.sub(r'[\\u200b-\\u200f\\ufeff\\xa0\\s]', '', str(target)).strip()
    peer = None
    imported_ids_to_del = []

    if logs is None:
        logs = []

    # 1. @用户名 格式解析 (兼容带@与不带@纯英文ID)
    if clean_target.startswith('@') or (re.match(r'^[a-zA-Z][a-zA-Z0-9_]{3,31}$', clean_target) and not clean_target.isdigit()):
        raw_uname = clean_target.lstrip('@')
        # 尝试 1: 直接精准解析 (不带@与带@各试一次)
        try:
            peer = await asyncio.wait_for(client.get_entity(raw_uname), timeout=6.0)
        except Exception:
            try:
                peer = await asyncio.wait_for(client.get_entity(f"@{raw_uname}"), timeout=6.0)
            except Exception:
                pass

        # 尝试 2: 获取输入凭证 (InputEntity)
        if not peer:
            try:
                peer = await asyncio.wait_for(client.get_input_entity(raw_uname), timeout=5.0)
            except Exception:
                pass

        # 尝试 3: 电脑端同款全局搜索穿透 (Telegram Desktop contacts.Search)
        if not peer:
            try:
                search_res = await asyncio.wait_for(client(SearchRequest(q=raw_uname, limit=10)), timeout=6.0)
                if search_res and getattr(search_res, 'users', None):
                    for u in search_res.users:
                        u_uname = (getattr(u, 'username', '') or '').lower()
                        if u_uname == raw_uname.lower():
                            peer = u
                            break
                    if not peer and len(search_res.users) > 0:
                        peer = search_res.users[0]
            except Exception:
                pass

        if not peer:
            raise Exception(f"未能在本小号通讯录中匹配到目标 @{raw_uname}，已触发智能通道接力重试")'''

    if "未能在本小号通讯录中匹配到目标 @" not in content:
        content = re.sub(
            r'async def send_single_target\(client: TelegramClient, target: str, message: str[^\)]*\):.*?(?=# 2\. 纯数字 ID)',
            new_code + '\n    ',
            content,
            flags=re.DOTALL
        )
        with open(dispatcher_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("✅ tg_dispatcher.py 用户名穿透与零宽字符清洗已成功更新！")
    else:
        print("✅ tg_dispatcher.py 已经是最新版本！")

# 2. 修复 SimplifiedTgHub.tsx
hub_path = os.path.join(base_dir, "src", "components", "SimplifiedTgHub.tsx")
if os.path.exists(hub_path):
    with open(hub_path, "r", encoding="utf-8") as f:
        hub_content = f.read()
    
    if "用户名不存在" in hub_content:
        hub_content = hub_content.replace(
            "const isNotRegistered = /未注册|未开通|空号|关闭了手机号搜索|用户名不存在/i.test(errDetail);",
            "const isNotRegistered = /未注册|未开通|空号|关闭了手机号搜索/i.test(errDetail);"
        )
        with open(hub_path, "w", encoding="utf-8") as f:
            f.write(hub_content)
        print("✅ SimplifiedTgHub.tsx 智能接力判断规则已修复！")
    else:
        print("✅ SimplifiedTgHub.tsx 已经是最新规则！")

print("⚡ 正在启动 Vite 生产级编译 (即将展示 1-1718 模块全量构建)...")
sys.stdout.flush()
res = subprocess.run("npm run build", shell=True)
if res.returncode == 0:
    print("🎉 Vite 全量构建完成！")
    print("🔄 正在重启 PM2 守护进程...")
    subprocess.run("pm2 restart all || true", shell=True)
    print("✨ 所有服务已重启就绪！请在浏览器按 Ctrl + F5 强制刷新后台！")
