#!/bin/bash
# ==============================================================================
# TG Dispatcher VPS 终极一键无损同步与真实原生 IP 修复脚本
# ==============================================================================

set -e

echo "=================================================="
echo "🚀 开始同步 GitHub 最新代码并彻底修复巴西原生 IP"
echo "=================================================="

# 1. 安全备份真实的 .session 凭证文件，防止被 git reset 覆盖
echo "🛡️ 正在保护与暂存真实的 .session 协议号凭证..."
mkdir -p /tmp/tg_sessions_safe_backup
for f in sessions/*.session; do
    if [ -f "$f" ]; then
        sz=$(wc -c < "$f" 2>/dev/null || echo 0)
        if [ "$sz" -gt 200 ]; then
            cp -f "$f" /tmp/tg_sessions_safe_backup/
        fi
    fi
done

# 2. 从 GitHub (main) 拉取最新源码 (仅更新代码文件，严禁覆盖真实 session)
echo "📥 正在从 GitHub (main) 拉取最新源码..."
git fetch origin main
git checkout origin/main -- server.ts tg_dispatcher.py public/tg_dispatcher.py update_all.py tg_auto_responder.py tdata_converter.py src/ package.json dist/ index.html vite.config.ts proxies.txt public/proxies.txt account_proxies.json vps_update_and_fix.sh 2>/dev/null || git reset --hard origin/main
cp -f tg_dispatcher.py public/tg_dispatcher.py 2>/dev/null || true

# 安装/更新 tdata 转换引擎与 Telethon 自动追发核心依赖 (opentele / telethon / pysocks / aiofiles)
echo "📦 正在校验并安装 tdata 与 24h 自动追发雷达依赖 (opentele / telethon / pysocks)..."
pip3 install --break-system-packages opentele telethon tgcrypto aiofiles pysocks 2>/dev/null || pip install opentele telethon tgcrypto aiofiles pysocks 2>/dev/null || true

# 3. 恢复真实 .session 凭证，并自动清除小于 200 字节的空占位文件
if [ -d /tmp/tg_sessions_safe_backup ] && [ "$(ls -A /tmp/tg_sessions_safe_backup 2>/dev/null)" ]; then
    echo "🔄 正在还原健康 .session 凭证..."
    cp -f /tmp/tg_sessions_safe_backup/*.session sessions/ 2>/dev/null || true
fi

# 彻底清理任何小于 200 字节的假 session / 占位凭证，防止报错
find sessions/ -type f -name "*.session" -size -200c -delete 2>/dev/null || true
rm -rf /tmp/tg_sessions_safe_backup 2>/dev/null || true

# 2. 彻底清洗本地所有 json 凭证文件与代理映射 (绝对杜绝 144.*)
echo "🧹 正在执行 1:1 独立原生 IP 权威校验与清洗..."
python3 -c "
import os
import json

with open('account_proxies.json', 'r', encoding='utf-8') as f:
    mappings = json.load(f)

# 确保 mapping 里面无任何 144
for k, v in list(mappings.items()):
    if '144.' in v or not v.startswith('200.'):
        print(f'Purging invalid proxy for {k}: {v}')
        del mappings[k]

with open('account_proxies.json', 'w', encoding='utf-8') as f:
    json.dump(mappings, f, indent=2)

if os.path.exists('sessions'):
    with open('sessions/account_proxies.json', 'w', encoding='utf-8') as f:
        json.dump(mappings, f, indent=2)
    
    # 清洗 sessions/*.json
    for sf in os.listdir('sessions'):
        if sf.endswith('.json') and not sf.startswith('auto_') and sf not in ['account_proxies.json', 'inbox_conversations.json', 'replied_chats.json', 'replied_customers.json']:
            p = os.path.join('sessions', sf)
            phone = sf.replace('.json', '').replace('+', '')
            try:
                with open(p, 'r', encoding='utf-8') as jf:
                    data = json.load(jf)
                assigned = mappings.get(phone)
                if assigned:
                    parts = assigned.split(':')
                    data['proxy'] = {
                        'addr': parts[0],
                        'port': int(parts[1]) if len(parts) > 1 else 12323,
                        'username': parts[2] if len(parts) > 2 else '14abdb1a0db2e',
                        'password': parts[3] if len(parts) > 3 else 'cb8f30f1a9',
                        'proxy_type': 'socks5'
                    }
                    with open(p, 'w', encoding='utf-8') as jf:
                        json.dump(data, jf, indent=2)
            except Exception as e:
                pass
print('✅ 物理文件清洗完毕，全部对齐 200.* 原生巴西代理！')

# 自动清洗远古买号残留历史会话 (剔除 2025 年、2026 年 3 月等旧协议号自带的陈旧记录，并清洗换行符)
for cfile in ['sessions/replied_customers.json', 'replied_customers.json']:
    if os.path.exists(cfile):
        try:
            with open(cfile, 'r', encoding='utf-8') as f:
                cdata = json.load(f)
            if isinstance(cdata, list):
                from datetime import datetime
                clean_c = []
                for c in cdata:
                    t_str = str(c.get('repliedAt', '') or c.get('timestamp', '')).strip()
                    if t_str.startswith(('2023', '2024', '2025')) or t_str.startswith('2026-09-06'):
                        continue
                    try:
                        dt = datetime.strptime(t_str[:10], '%Y-%m-%d')
                        if (datetime.now() - dt).days > 2:
                            continue
                    except Exception:
                        continue
                    # 彻底清洗换行与首尾空白
                    if 'lastReplyText' in c:
                        c['lastReplyText'] = ' '.join(str(c['lastReplyText']).replace('\r', ' ').replace('\n', ' ').split()).strip()
                    clean_c.append(c)
                with open(cfile, 'w', encoding='utf-8') as f:
                    json.dump(clean_c, f, indent=2, ensure_ascii=False)
                print(f'🧹 [客资库净化完毕]: 已剔除买号远古历史残留并洗净多余换行，保留近期真实客资 {len(clean_c)} 条')
        except Exception as e:
            print(f'⚠️ 客资库清洗跳过: {e}')
"

# 3. 重新编译生产级代码 (Vite 前端 + Node 服务端)
echo "⚡ 正在重新编译前端及服务端 (npm run build)..."
npm run build

# 4. 重启 PM2 进程
echo "🔄 正在重启 PM2 服务..."
pm2 restart all || true

# 5. 守护启动 24h Telegram 客户回复自动追发守护进程 (彻底更新代码并加载最新监听引擎)
echo "🤖 正在启动/重载 24h 客户私聊回复自动追发雷达 (tg_auto_responder.py)..."
pm2 delete tg-responder 2>/dev/null || true
pm2 start tg_auto_responder.py --name "tg-responder" --interpreter python3 --cwd "$(pwd)" || python3 tg_auto_responder.py &
pm2 save || true

echo "=================================================="
echo "🎉 更新与修复已全部完成！24h 自动追发守护已常驻运行！"
echo "👉 请在电脑浏览器打开管理面板，按 Ctrl + F5 (或 Cmd + Shift + R) 强制刷新！"
echo "=================================================="
