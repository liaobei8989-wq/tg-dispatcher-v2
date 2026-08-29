# -*- coding: utf-8 -*-
"""
==============================================================================
WhatsApp 协议矩阵 & Meta Cloud API 实机真发 Python 脚本
文件名称: whatsapp_marketing_engine.py
运行依赖: pip install requests aiohttp
运行环境: Python 3.8+ (Windows / Mac / Linux / VPS)
==============================================================================
使用说明:
1. 在本地终端中运行: python3 whatsapp_marketing_engine.py
2. 支持输入您的真实 WhatsApp Meta Cloud API 令牌 (Access Token) 与 Phone Number ID 直发真机；
3. 或填入本地 Baileys / Gateway HTTP 接口节点，将消息 100% 真实投递至目标手机。
==============================================================================
"""

import sys
import os
import time
import json
import random
import re
import requests

# ------------------------------------------------------------------------------
# 1. 经典巴西 50 条防封问候语库 (Brazilian Greetings)
# ------------------------------------------------------------------------------
BRAZILIAN_50_GREETINGS = [
    "Fala jogador! Beleza?",
    "E aí, beleza? Como você tá?",
    "Opa, fala aí! Tudo certo por aí?",
    "Opa, tranquilo? Vi seu perfil no grupo!",
    "Salve! Como estão as coisas por aí?",
    "Opa amigo, suave? Tenho uma dica rápida pra você.",
    "E aí, mano! Beleza pura?",
    "Fala jogador! Tudo de boa?",
    "Opa, boa tarde! Como você tá hoje?",
    "E aí, parceiro! Tudo joia?",
    "Fala irmão! Tudo certinho?",
    "Opa! Beleza? Passando pra te dar um salve!",
    "Oi, tudo bem? Tudo tranquilo por aí?",
    "E aí, suave? Como tá o dia?",
    "Opa meu amigo! Como você tá?",
    "Salve, beleza? Tudo em paz?",
    "Fala fera, suave na nave?",
    "E aí, tudo bom? Bora conversar um minutinho?",
    "Opa, de boa? Espero que esteja tendo um ótimo dia!",
    "Oi amigo, beleza? Te achei no grupo aqui.",
    "Fala campeão, tudo 100% por aí?",
    "Opa, tudo na paz? Como você tá?",
    "E aí meu brother, beleza?",
    "Opa, suave? Tem um segundo pra falar?",
    "Fala parceiro! Tudo certinho com você?",
    "Salve salve! Tudo bem com você hoje?",
    "E aí, como vai? Tudo tranquilo?",
    "Opa, bom dia! Como estão as coisas?",
    "Oi oi! Tudo certo por aí?",
    "Fala jogador, preparado pro jogo de hoje?",
    "Opa mano, tranquilo? Dá uma olhada aqui rápido!",
    "E aí galera, tudo certo por aí?",
    "Fala amigo, tudo de boa com você?",
    "Opa, beleza irmão?",
    "Oi, tudo joia por aí?",
    "E aí, suave pra falar agora?",
    "Fala meu camarada, tudo bem?",
    "Opa, bom ver você por aqui! Tudo certo?",
    "Salve meu amigo, tranquilo?",
    "E aí, beleza? Como tá a semana?",
    "Opa, tudo em ordem por aí?",
    "Fala comigo! Beleza?",
    "Oi, tudo ótimo com você?",
    "E aí, de boa? Bora forrar hoje?",
    "Opa, tranquilo? Pronto pra dar uma jogada?",
    "Fala apostador, tudo na paz?",
    "Oi amigo, tudo 100%?",
    "E aí, como é que tá? Tudo bom?",
    "Opa, salve! Beleza pura por aí?",
    "Fala brother, tudo suave?"
]

# ------------------------------------------------------------------------------
# 2. 带 Spintax 离散子域名的追发营销文案 (Followup Template)
# ------------------------------------------------------------------------------
FOLLOWUP_LINK_SPINTAX = (
    "🔥 BÔNUS EXCLUSIVO LIBERADO! 🎁 Claim 500% de Bônus de Depósito + 150 Rodadas Grátis (Free Spins)! "
    "💰 Convide 1 pessoa e ganhe R$ 60 no PIX (Afiliado até R$ 1.000)! "
    "🎡 Roleta da Sorte & Chuva de Dinheiro: "
    "{https://m1.promobr1.xyz|https://m2.promobr1.xyz|https://m3.promobr1.xyz|https://m4.promobr1.xyz|https://m5.promobr1.xyz|https://m6.promobr1.xyz|https://m7.promobr1.xyz|https://m8.promobr1.xyz}"
)

# ------------------------------------------------------------------------------
# 3. Spintax 语法解析器 ({A|B|C} 随机提取)
# ------------------------------------------------------------------------------
def parse_spintax(text: str) -> str:
    """自动将 {a|b|c} 格式的 Spintax 解析为随机文本，有效绕过 Meta 风控重复词组文案识别"""
    def replace_choice(match):
        options = match.group(1).split('|')
        return random.choice(options)
    
    pattern = re.compile(r'\{([^{}]+)\}')
    while pattern.search(text):
        text = pattern.sub(replace_choice, text)
    return text

# ------------------------------------------------------------------------------
# 4. Meta WhatsApp Cloud API 发送函数
# ------------------------------------------------------------------------------
def send_via_whatsapp_cloud_api(phone_number_id: str, access_token: str, recipient_phone: str, message_text: str, is_template: bool = False, template_name: str = "hello_world"):
    """
    使用 Meta 官方 WhatsApp Cloud API 向真实手机号发包投递消息
    """
    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 过滤电话号码，格式统一为纯数字，如 5511942060830
    clean_phone = re.sub(r'\D', '', recipient_phone)
    
    if is_template:
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": "en_US"
                }
            }
        }
    else:
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {
                "preview_url": True,
                "body": message_text
            }
        }

    print(f"📡 [发包中...] 正在请求 Meta Graph API (目标: +{clean_phone}, 类型: {'模板' if is_template else '文本'})...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        res_data = response.json()
        if response.status_code == 200:
            print(f"✅ [直发成功] 消息已成功送达目标手机 +{clean_phone}！")
            print(f"   Message ID (WAMID): {res_data.get('messages', [{}])[0].get('id', 'N/A')}")
            return True
        else:
            error_msg = res_data.get('error', {}).get('message', json.dumps(res_data, ensure_ascii=False))
            print(f"❌ [API 报错] 代码 {response.status_code}: {error_msg}")
            if "24 hours" in error_msg or "131047" in str(res_data):
                print("💡 [解法提示] Meta 限制: 向 24 小时内未主动互动的陌生号码发信，必须使用【模板消息】(Template Message, 如 hello_world)。")
            return False
    except Exception as e:
        print(f"❌ [网络异常] 无法连接到 Meta API 服务器: {e}")
        return False

# ------------------------------------------------------------------------------
# 5. Baileys / WebSocket 本地 Gateway 发送函数
# ------------------------------------------------------------------------------
def send_via_local_gateway(gateway_url: str, recipient_phone: str, message_text: str):
    """
    使用本地 Node.js (Baileys / Whatsapp-web.js) Gateway 发送
    """
    clean_phone = re.sub(r'\D', '', recipient_phone)
    payload = {
        "phone": clean_phone,
        "message": message_text
    }
    try:
        res = requests.post(f"{gateway_url.rstrip('/')}/send", json=payload, timeout=10)
        if res.status_code == 200:
            print(f"✅ [Gateway 送达] 本地 Node.js 协议线程已成功推送消息到 +{clean_phone}")
            return True
        else:
            print(f"⚠️ [Gateway 响应异常] Code {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"⚠️ [Gateway 离线] 无法连接本地 Baileys Gateway ({gateway_url}): {e}")
        return False

# ------------------------------------------------------------------------------
# 主运行入口
# ------------------------------------------------------------------------------
def main():
    print("==========================================================================")
    print("  🚀 WhatsApp 协议集群 & Meta API 终端直发实机脚本")
    print("==========================================================================")
    
    # 自动尝试寻找当前目录下的 txt 目标号码文件 (如 targets.txt 或 巴西个人真机老号-2.txt)
    auto_txt_targets = []
    for possible_file in ["targets.txt", "巴西个人真机老号-2.txt", "phone_numbers.txt"]:
        if os.path.exists(possible_file):
            try:
                with open(possible_file, "r", encoding="utf-8") as f:
                    lines = [line.strip() for line in f if line.strip()]
                    if lines:
                        auto_txt_targets.extend(lines)
                        print(f"📁 [自动检测] 已从同目录下的 '{possible_file}' 成功读取 {len(lines)} 个目标号码！")
                        break
            except Exception:
                pass

    default_targets = auto_txt_targets if auto_txt_targets else ["5511942060830"]
    
    print("\n请选择您要使用的发送通道 / 模式:")
    print("1. 官方 Meta WhatsApp Cloud API (需要 Phone Number ID & Access Token)")
    print("2. 本地 Node.js Baileys HTTP 守护网关 (HTTP Gateway)")
    print("3. 终端模拟演示 (本地输出离散测试日志)")
    
    choice = input("\n请输入选项 [1/2/3] (默认 1): ").strip() or "1"
    
    print("\n请输入接收测试的手机号码 (支持逗号分隔多个号码，直接按回车将使用 txt 文件中的号码):")
    phone_input = input(f"目标手机号 [默认使用读取到的号码: {','.join(default_targets[:3])}{'...' if len(default_targets)>3 else ''}]: ").strip()
    
    if phone_input:
        target_list = [p.strip() for p in phone_input.split(',') if p.strip()]
    else:
        target_list = default_targets

    # 执行发送
    print("\n--------------------------------------------------------------------------")
    print("⚡ 开始运行两阶段防封营销推送流程...")
    print("--------------------------------------------------------------------------")

    if choice == "1":
        # 尝试读取同目录下的 config.json 文件
        saved_phone_id = ""
        saved_token = ""
        if os.path.exists("config.json"):
            try:
                with open("config.json", "r", encoding="utf-8") as cfg_f:
                    cfg_data = json.load(cfg_f)
                    saved_phone_id = cfg_data.get("phone_number_id", "").strip()
                    saved_token = cfg_data.get("access_token", "").strip()
                    if saved_phone_id and saved_token:
                        print(f"🔑 [自动读取配置] 已检测并载入 config.json 凭证 (Phone ID: {saved_phone_id[:6]}***)")
            except Exception:
                pass

        print("\n请输入 Meta API 配置参数 (如已在 config.json 设置可直接按回车):")
        phone_id_input = input(f"Phone Number ID [{saved_phone_id or '未配置'}]: ").strip()
        phone_id = phone_id_input if phone_id_input else saved_phone_id

        token_input = input(f"Access Token [{saved_token[:10] + '...' if saved_token else '未配置'}]: ").strip()
        token = token_input if token_input else saved_token

        if not phone_id or not token:
            print("\n⚠️ 提示: 您未输入 Phone Number ID 或 Access Token。")
            print("💡 获取方法: 访问 Meta Developers (developers.facebook.com) -> WhatsApp -> API Setup 复制凭证。")
            print("💡 技巧: 您可以在此目录下新建一个 config.json 文件保存凭证，格式如下:")
            print('   {\n     "phone_number_id": "您的Phone_Number_ID",\n     "access_token": "您的Access_Token"\n   }')
            sys.exit(0)

        # 提示选择消息模式：1. 模板消息 (hello_world - 针对首发/24h外陌生人) 2. 自由文本营销文案
        print("\n请选择 Meta 消息类型:")
        print("1. 官方 Template 模板消息 (标准 hello_world - 绕过 24h 陌生人发信限制，100% 可达)")
        print("2. 自由文本营销文案 (巴西 50 句问候 + 追发 Spintax 链接，适合已有互动好友)")
        msg_mode = input("请输入选项 [1/2] (默认 1): ").strip() or "1"

        for idx, target in enumerate(target_list):
            if msg_mode == "1":
                print(f"\n[1/1] 正在通过 Meta API 向 +{target} 发送 hello_world 模板消息...")
                send_via_whatsapp_cloud_api(phone_id, token, target, "", is_template=True, template_name="hello_world")
            else:
                greeting = BRAZILIAN_50_GREETINGS[idx % len(BRAZILIAN_50_GREETINGS)]
                print(f"\n[1/2] 正在向 +{target} 发送阶段 1 问候语: '{greeting}'")
                success1 = send_via_whatsapp_cloud_api(phone_id, token, target, greeting)
                
                if success1:
                    time.sleep(2)
                    followup = parse_spintax(FOLLOWUP_LINK_SPINTAX)
                    print(f"[2/2] 正在向 +{target} 追发阶段 2 营销文案与随机子域名...")
                    send_via_whatsapp_cloud_api(phone_id, token, target, followup)

    elif choice == "2":
        gateway_url = input("请输入本地 Gateway 地址 [默认 http://127.0.0.1:3000]: ").strip() or "http://127.0.0.1:3000"
        for idx, target in enumerate(target_list):
            greeting = BRAZILIAN_50_GREETINGS[idx % len(BRAZILIAN_50_GREETINGS)]
            print(f"\n[1/2] 通过 Gateway 向 +{target} 发送问候语: '{greeting}'")
            send_via_local_gateway(gateway_url, target, greeting)
            time.sleep(1.5)
            followup = parse_spintax(FOLLOWUP_LINK_SPINTAX)
            print(f"[2/2] 通过 Gateway 向 +{target} 追发带链接文案...")
            send_via_local_gateway(gateway_url, target, followup)

    else:
        for idx, target in enumerate(target_list):
            clean_p = re.sub(r'\D', '', target)
            greeting = BRAZILIAN_50_GREETINGS[idx % len(BRAZILIAN_50_GREETINGS)]
            followup = parse_spintax(FOLLOWUP_LINK_SPINTAX)
            print(f"\n📱 目标手机: +{clean_p}")
            print(f"   └─ [阶段1 问候语]: {greeting}")
            print(f"   └─ [阶段2 营销链接]: {followup[:80]}...")
            time.sleep(0.5)

    print("\n==========================================================================")
    print("🎉 脚本执行完毕！")
    print("==========================================================================")

if __name__ == "__main__":
    main()
