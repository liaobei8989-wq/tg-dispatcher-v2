import os, re, subprocess, sys

base_dir = "/var/www/tg-dispatcher-v2" if os.path.exists("/var/www/tg-dispatcher-v2") else os.getcwd()
os.chdir(base_dir)

print("🚀 开始执行 VPS 核心补丁与全量构建升级...")

# 1. 修复 tg_dispatcher.py
dispatcher_path = os.path.join(base_dir, "tg_dispatcher.py")
import os, subprocess, sys

base_dir = "/var/www/tg-dispatcher-v2" if os.path.exists("/var/www/tg-dispatcher-v2") else os.getcwd()
os.chdir(base_dir)
print("🚀 开始执行 VPS 核心构建与服务重载...")

# 确保 public/tg_dispatcher.py 与根目录 tg_dispatcher.py 保持 100% 同步
if os.path.exists("tg_dispatcher.py") and os.path.exists("public"):
    import shutil
    shutil.copy2("tg_dispatcher.py", "public/tg_dispatcher.py")

print("⚡ 正在启动 Vite 生产级编译...")
sys.stdout.flush()
res = subprocess.run("npm run build", shell=True)
if res.returncode == 0:
    print("🎉 Vite 全量构建完成！")
    print("🔄 正在重启 PM2 守护进程...")
    subprocess.run("pm2 restart all || true", shell=True)
    print("✨ 所有服务已重启就绪！请在浏览器按 Ctrl + F5 强制刷新后台！")

