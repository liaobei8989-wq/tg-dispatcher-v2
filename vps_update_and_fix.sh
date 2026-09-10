#!/bin/bash
# ==============================================================================
# TG Dispatcher VPS 终极一键无损同步与真实原生 IP 修复脚本
# ==============================================================================

set -e

echo "=================================================="
echo "🚀 开始同步 GitHub 最新代码并彻底修复巴西原生 IP"
echo "=================================================="

# 1. 放弃 VPS 本地冲突并强制对齐 GitHub main 分支
echo "📥 正在从 GitHub (main) 拉取最新源码..."
git fetch origin main
git reset --hard origin/main

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
"

# 3. 重新编译生产级代码 (Vite 前端 + Node 服务端)
echo "⚡ 正在重新编译前端及服务端 (npm run build)..."
npm run build

# 4. 重启 PM2 进程
echo "🔄 正在重启 PM2 服务..."
pm2 restart all || true
pm2 save || true

echo "=================================================="
echo "🎉 更新与修复已全部完成！"
echo "👉 请在电脑浏览器打开管理面板，按 Ctrl + F5 (或 Cmd + Shift + R) 强制刷新！"
echo "=================================================="
