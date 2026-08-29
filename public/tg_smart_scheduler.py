#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tg_smart_scheduler.py
Telegram 巴西利亚时区 (Brasília Time UTC-3) 智能黄金作息发信调度守护进程
- ☀️ 午休摸鱼波峰期 (11:30 ~ 14:00 BRT): 自动提频发信
- 🔥 晚间下班爆奖黄金期 (19:30 ~ 23:30 BRT): 充值峰值期极速轮发
- 💤 深夜静默避险休眠 (00:00 ~ 08:00 BRT): 自动暂停私发，转入小号互养对聊
"""

import os
import sys
import time
from datetime import datetime, timezone, timedelta

def get_brasilia_time():
    # UTC-3
    utc_now = datetime.now(timezone.utc)
    return utc_now - timedelta(hours=3)

def check_time_slot():
    br_now = get_brasilia_time()
    hour = br_now.hour
    minute = br_now.minute
    total_mins = hour * 60 + minute

    time_str = br_now.strftime("%H:%M:%S")
    
    if 11 * 60 + 30 <= total_mins <= 14 * 60:
        return "LUNCH_PEAK", time_str, "☀️ 午休摸鱼波峰期 (加速发信，转化率高)"
    elif 19 * 60 + 30 <= total_mins <= 23 * 60 + 30:
        return "EVENING_PEAK", time_str, "🔥 晚间下班黄金期 (充值高峰，全力发信)"
    elif 0 <= total_mins < 8 * 60:
        return "NIGHT_SLEEP", time_str, "💤 深夜静默休眠 (暂停陌生人私聊，转小号互养)"
    else:
        return "DAY_NORMAL", time_str, "⛅ 常规平稳发信期 (匀速轮巡)"

def main():
    print("⏰ [Smart Scheduler] 启动巴西当地作息调度守护引擎...")
    status, t_str, desc = check_time_slot()
    print(f"🇧🇷 巴西利亚当前时间 (BRT): {t_str}")
    print(f"📊 当前作息阶段: [{status}] -> {desc}")

if __name__ == "__main__":
    main()
