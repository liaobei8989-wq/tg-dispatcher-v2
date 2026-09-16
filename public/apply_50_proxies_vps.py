import os
import json

PHONES = [
    '5598984569687', '5598984627175', '5598984670055', '5598984671221', '5598984730611',
    '5598984731615', '5598984734606', '5598984804947', '5598984844174', '5598984845235',
    '5598984887183', '5598984906227', '5598984949562', '5598984953483', '5598984955625',
    '5598985089834', '5598985109474', '5598985162664', '5598985254155', '5598985259933',
    '5598985323153', '5598985338413', '5598985369605', '5598985432467', '5598985473494',
    '5598985487547', '5598985535121', '5598985583075', '5598985585283', '5598985602056',
    '5598985656993', '5598985703552', '5598985709101', '5598985759825', '5598985864741',
    '5598985926947', '5598985966188', '5598986270576', '5598987077789', '5598987743687',
    '5599984026594', '5599984139898', '5599984168673', '5599984179798', '5599984185644',
    '5599984232476', '5599984276272', '5599984277793', '5599984348008', '5599984387026'
]

PROXIES = [
    '200.160.38.179:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.215:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.32.90:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.220:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.36.36:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.21:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.38.149:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.32.42:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.244:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.32.8:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.38.171:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.75:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.38.12:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.25:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.36.8:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.37.147:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.39.17:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.151:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.38.152:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.57:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.179:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.37.235:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.32.193:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.32.44:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.39.80:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.175:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.38.77:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.85:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.103:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.213:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.103:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.34.214:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.35.219:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.160.39.250:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.137:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.113:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.154.37:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.153.126:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.154.149:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.153.70:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.154.77:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.82:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.154.254:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.175:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.155:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.243:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.155.124:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.152.195:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.155.35:12323:14abdb1a0db2e:cb8f30f1a9',
    '200.152.153.232:12323:14abdb1a0db2e:cb8f30f1a9'
]

def apply():
    base_dirs = ['.', '/var/www/tg-dispatcher-v2', '/root/tg-dispatcher', '/root/tg-dispatcher-v2']
    
    for bdir in base_dirs:
        if not os.path.exists(bdir):
            continue
        
        # 1. Update account_proxies.json
        for json_path in [os.path.join(bdir, 'account_proxies.json'), os.path.join(bdir, 'sessions', 'account_proxies.json')]:
            acc_map = {}
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        acc_map = json.load(f)
                except Exception:
                    acc_map = {}
            for ph, prx in zip(PHONES, PROXIES):
                acc_map[ph] = prx
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(acc_map, f, indent=2, ensure_ascii=False)
            print(f"✅ 已写入 1号1IP 映射: {json_path}")

        # 2. Update proxies.txt
        ptxt = os.path.join(bdir, 'proxies.txt')
        with open(ptxt, 'w', encoding='utf-8') as f:
            f.write('\n'.join(PROXIES) + '\n')
        print(f"✅ 已更新代理池文件: {ptxt}")

        # 3. Update companion JSON files in sessions/
        sess_dir = os.path.join(bdir, 'sessions')
        if os.path.exists(sess_dir):
            count = 0
            for ph, prx in zip(PHONES, PROXIES):
                cpath = os.path.join(sess_dir, f"{ph}.json")
                if os.path.exists(cpath):
                    try:
                        parts = prx.split(':')
                        addr, port, user, pwd = parts[0], int(parts[1]), parts[2], parts[3]
                        with open(cpath, 'r', encoding='utf-8') as f:
                            cdata = json.load(f)
                        cdata['proxy'] = {
                            'addr': addr,
                            'port': port,
                            'username': user,
                            'password': pwd,
                            'proxy_type': 'socks5'
                        }
                        with open(cpath, 'w', encoding='utf-8') as f:
                            json.dump(cdata, f, indent=2, ensure_ascii=False)
                        count += 1
                    except Exception as e:
                        print(f"⚠️ 更新 {ph}.json 失败: {e}")
            print(f"✅ 已同步更新 {count} 个账号伴随配置 JSON 专属代理 (sessions/*.json)")

if __name__ == '__main__':
    apply()
