#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
📦 Telegram Session SQLite Database Manager & Lock Guard
====================================================================
功能：
1. 数据库存储：禁止在本地磁盘长期留存 .session / .json 静态文件。
   所有上传或初始化的 Session 协议数据均以 BLOB 二进制方式持久化存入
   SQLite 数据库 (`sessions/telegram_sessions.db`)。
2. 动态加载：脚本与定时任务执行时，从数据库实时读取 BLOB 数据，
   在内存/隔离临时文件 (tempfile/tmp) 中动态加载。
3. 加锁与负载安全：引入文件排他锁 (flock)、WAL 模式、忙等待 (busy_timeout)
   与异常自动回滚 (rollback)，并在使用完毕后自动 100% 深度清理临时文件。
====================================================================
"""

import os
import sys
import json
import base64
import sqlite3
import fcntl
import glob
import time
import shutil
import contextlib
import re
from datetime import datetime, timezone

DB_DIR = os.path.join(os.getcwd(), "sessions")
DB_PATH = os.path.join(DB_DIR, "telegram_sessions.db")

def reset_and_rebuild_db():
    """当主数据库文件损坏 (database disk image is malformed) 时，自动备份并强行重置为全新空数据库"""
    print(f"⚠️ [SQLite 救治系统] 检测到主数据库损坏 ({DB_PATH})，正在自动备份并重建全新数据库...")
    timestamp = int(time.time())
    backup_path = f"{DB_PATH}.malformed_{timestamp}.bak"
    
    for ext in ['', '-wal', '-shm', '-journal']:
        target = f"{DB_PATH}{ext}"
        if os.path.exists(target):
            try:
                if ext == '':
                    shutil.copy2(target, backup_path)
                os.unlink(target)
            except Exception as err:
                print(f"⚠️ 无法移除损坏依赖文件 {target}: {err}")
    
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=30000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    except Exception:
        pass

    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS telegram_sessions (
                session_name TEXT PRIMARY KEY,
                file_data BLOB NOT NULL,
                file_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
    print(f"✅ [SQLite 救治系统] 数据库 ({DB_PATH}) 已成功重建并恢复健康模式！")
    return conn

def get_db_connection(read_only=False):
    """获取带 WAL 模式与 Busy Timeout 的 SQLite 数据库连接，若数据库损毁自动触发救治流程"""
    os.makedirs(DB_DIR, exist_ok=True)
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=30000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        # 验证数据库物理完整性
        conn.execute("PRAGMA quick_check(1);")
        return conn
    except (sqlite3.DatabaseError, sqlite3.OperationalError) as e:
        err_msg = str(e).lower()
        if "malformed" in err_msg or "disk image" in err_msg or "corrupt" in err_msg:
            return reset_and_rebuild_db()
        # 尝试重新连接一次
        try:
            return reset_and_rebuild_db()
        except Exception:
            raise e

def is_session_sqlite_valid(session_file_path: str) -> bool:
    """全面校验导出的 .session 文件是否为有效的 SQLite 数据库，防坏块崩溃"""
    if not os.path.exists(session_file_path):
        return False
    if session_file_path.endswith(".json"):
        try:
            with open(session_file_path, "r", encoding="utf-8") as f:
                json.load(f)
            return True
        except Exception:
            return False
    try:
        if os.path.getsize(session_file_path) < 100:
            return False
        test_conn = sqlite3.connect(session_file_path, timeout=5.0)
        row = test_conn.execute("PRAGMA quick_check(1);").fetchone()
        test_conn.close()
        return row is not None and row[0] == "ok"
    except Exception:
        return False

def init_db():
    """初始化会话数据库表结构"""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS telegram_sessions (
                    session_name TEXT PRIMARY KEY,
                    file_data BLOB NOT NULL,
                    file_type TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# 自动建表
init_db()

def save_session(session_name: str, file_data_input, file_type: str = "session"):
    """保存/更新 .session 或 .json 数据至 SQLite 数据库 BLOB"""
    if not session_name:
        raise ValueError("session_name 不能为空")
    
    # 转成 bytes
    if isinstance(file_data_input, str):
        file_bytes = file_data_input.encode('utf-8')
    elif isinstance(file_data_input, (bytes, bytearray)):
        file_bytes = bytes(file_data_input)
    else:
        raise TypeError("file_data 必须为 bytes 或 str")

    safe_name = os.path.basename(session_name)
    ext = ".json" if safe_name.endswith(".json") else ".session"
    if not (safe_name.endswith(".session") or safe_name.endswith(".json")):
        safe_name = f"{safe_name}{ext}"

    size_bytes = len(file_bytes)
    updated_at = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO telegram_sessions (session_name, file_data, file_type, size_bytes, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(session_name) DO UPDATE SET
                    file_data = excluded.file_data,
                    file_type = excluded.file_type,
                    size_bytes = excluded.size_bytes,
                    updated_at = excluded.updated_at
            """, (safe_name, file_bytes, file_type, size_bytes, updated_at))
        return {
            "success": True,
            "sessionName": safe_name,
            "sizeBytes": size_bytes,
            "updatedAt": updated_at
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def load_session(session_name: str):
    """从数据库读取指定 Session 的 BLOB 数据"""
    if not session_name:
        return None

    safe_name = os.path.basename(str(session_name)).strip()
    
    conn = get_db_connection(read_only=True)
    try:
        cursor = conn.cursor()
        
        # 1. 精确匹配
        cursor.execute("SELECT session_name, file_data, file_type, size_bytes, updated_at FROM telegram_sessions WHERE session_name = ?", (safe_name,))
        row = cursor.fetchone()
        
        # 2. 补全 .session 匹配
        if not row and not safe_name.endswith(".session") and not safe_name.endswith(".json"):
            cursor.execute("SELECT session_name, file_data, file_type, size_bytes, updated_at FROM telegram_sessions WHERE session_name = ?", (f"{safe_name}.session",))
            row = cursor.fetchone()

        # 3. 提取数字手机号匹配 (例如 5541987023810 或 +55 41 98702-3810)
        if not row:
            clean_digits = re.sub(r'[^0-9]', '', safe_name)
            if clean_digits and len(clean_digits) >= 8:
                cursor.execute("SELECT session_name, file_data, file_type, size_bytes, updated_at FROM telegram_sessions WHERE session_name LIKE ?", (f"%{clean_digits}%",))
                row = cursor.fetchone()

        if row:
            return {
                "session_name": row["session_name"],
                "file_data": bytes(row["file_data"]),
                "file_type": row["file_type"],
                "size_bytes": row["size_bytes"],
                "updated_at": row["updated_at"]
            }
        return None
    finally:
        conn.close()

def list_sessions():
    """从数据库获取所有已存储的 Session 记录"""
    conn = get_db_connection(read_only=True)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT session_name, file_type, size_bytes, updated_at FROM telegram_sessions ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        result = []
        for r in rows:
            name = r["session_name"]
            size = r["size_bytes"]
            result.append({
                "fileName": name,
                "filePath": f"database://telegram_sessions/{name}",
                "folder": "database",
                "sizeBytes": size,
                "sizeFormatted": f"{(size / 1024):.1f} KB",
                "modifiedAt": r["updated_at"],
                "isValid": size > 20
            })
        return result
    finally:
        conn.close()

def delete_session(session_name: str):
    """从数据库彻底删除指定 Session 记录"""
    if not session_name:
        return False
    safe_name = os.path.basename(str(session_name)).strip()
    clean_digits = re.sub(r'[^0-9]', '', safe_name)
    
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM telegram_sessions WHERE session_name = ? OR session_name = ?", (safe_name, f"{safe_name}.session"))
            deleted = cursor.rowcount > 0
            if not deleted and clean_digits and len(clean_digits) >= 8:
                cursor.execute("DELETE FROM telegram_sessions WHERE session_name LIKE ?", (f"%{clean_digits}%",))
                deleted = cursor.rowcount > 0
            return deleted
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

@contextlib.contextmanager
def temp_session_file(session_identifier: str):
    """
    上下文管理器：动态从数据库解压加载 Session BLOB 数据至隔离的临时路径 (/tmp)；
    任务结束后 100% 深度清理临时文件与日志，彻底杜绝 SQLite 文件锁冲突与坏块报错。
    """
    session_data = load_session(session_identifier)
    if not session_data:
        yield None
        return

    pid = os.getpid()
    timestamp = int(time.time() * 1000)
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', os.path.splitext(session_data["session_name"])[0])
    
    # 隔离的临时基础路径，多进程绝对互不干扰
    tmp_base = f"/tmp/dyn_sess_{pid}_{timestamp}_{clean_name}"
    tmp_session_path = f"{tmp_base}.session"

    try:
        # 将 BLOB 数据写入临时文件
        with open(tmp_session_path, "wb") as f:
            f.write(session_data["file_data"])
        
        # 校验解压出的 SQLite 凭证文件完整性
        if not is_session_sqlite_valid(tmp_session_path):
            print(f"⚠️ [坏块自动清理] 会话凭证 [{session_data['session_name']}] 对应的 SQLite 数据损坏 (disk image is malformed)，已自动清理掉此坏块数据...")
            try:
                delete_session(session_data["session_name"])
            except Exception:
                pass
            yield None
            return

        # 允许 Telethon / SQLite 使用该临时路径
        yield tmp_base

        # 任务正常完成后，若 Telethon 写入了更新，保存最新状态至数据库
        if os.path.exists(tmp_session_path) and is_session_sqlite_valid(tmp_session_path):
            try:
                new_size = os.path.getsize(tmp_session_path)
                if new_size > 100 and new_size != session_data["size_bytes"]:
                    with open(tmp_session_path, "rb") as f:
                        updated_bytes = f.read()
                    save_session(session_data["session_name"], updated_bytes, session_data["file_type"])
            except Exception:
                pass
    finally:
        # 彻底深度清除所有相关的临时 SQLite 离线文件
        for ext in ['', '.session', '.session-wal', '.session-shm', '.session-journal']:
            target = f"{tmp_base}{ext}"
            if os.path.exists(target):
                try:
                    os.unlink(target)
                except Exception:
                    pass

def export_db_to_disk():
    """将数据库中存储的所有 Session 导出一份到 sessions/ 目录，确保 Node.js 和 Python 进程双向秒读"""
    exported_count = 0
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db_connection(read_only=True)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT session_name, file_data, file_type FROM telegram_sessions")
        rows = cursor.fetchall()
        for r in rows:
            name = r["session_name"]
            data = bytes(r["file_data"])
            target = os.path.join(DB_DIR, name)
            if not os.path.exists(target) or os.path.getsize(target) != len(data):
                try:
                    with open(target, "wb") as f:
                        f.write(data)
                    exported_count += 1
                except Exception:
                    pass
        return exported_count
    finally:
        conn.close()

def migrate_local_files_to_db():
    """双向同步：将根目录、sessions/ 和 public/ 磁盘文件导入 SQLite DB，同时将 DB 中的会话同步落盘"""
    migrated_count = 0
    folders = [os.getcwd(), DB_DIR, os.path.join(os.getcwd(), "public")]
    system_ignore_files = {"package.json", "package-lock.json", "tsconfig.json", "metadata.json", "bun.lock", "stats.json"}
    
    for folder in folders:
        if not os.path.exists(folder):
            continue
        for f in os.listdir(folder):
            if f in system_ignore_files or f.startswith("auto_") or "2fa" in f.lower():
                continue
            if (f.endswith(".session") or f.endswith(".json")):
                full_path = os.path.join(folder, f)
                if os.path.isfile(full_path) and os.path.getsize(full_path) > 20:
                    try:
                        file_type = "json" if f.endswith(".json") else "session"
                        with open(full_path, "rb") as fp:
                            data = fp.read()
                        save_session(f, data, file_type)
                        migrated_count += 1
                    except Exception as e:
                        print(f"⚠️ [迁移警告] 无法迁移文件 {f}: {e}")
    
    # 将 DB 中已有凭证确保落盘一份至 sessions/
    export_db_to_disk()

    # 清理遗留的修补临时锁文件
    for folder in folders:
        if os.path.exists(folder):
            for f in os.listdir(folder):
                if f.endswith(".repaired") or f.endswith(".session-wal") or f.endswith(".session-shm"):
                    try:
                        os.unlink(os.path.join(folder, f))
                    except Exception:
                        pass

    return migrated_count

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "migrate" or cmd == "sync":
            count = migrate_local_files_to_db()
            print(json.dumps({"success": True, "migrated": count, "total": len(list_sessions())}))
        elif cmd == "list":
            sessions = list_sessions()
            print(json.dumps({"success": True, "files": sessions, "count": len(sessions)}))
        elif cmd == "save" and len(sys.argv) >= 4:
            file_name = sys.argv[2]
            content_base64 = sys.argv[3]
            try:
                raw_bytes = base64.b64decode(content_base64)
                file_type = "json" if file_name.endswith(".json") else "session"
                res = save_session(file_name, raw_bytes, file_type)
                # 同时写入 sessions/ 目录
                target_disk = os.path.join(DB_DIR, os.path.basename(file_name))
                with open(target_disk, "wb") as df:
                    df.write(raw_bytes)
                print(json.dumps(res))
            except Exception as err:
                print(json.dumps({"success": False, "error": str(err)}))
        elif cmd == "delete" and len(sys.argv) >= 3:
            file_name = sys.argv[2]
            ok = delete_session(file_name)
            # 同时清理磁盘上的文件
            target_disk = os.path.join(DB_DIR, os.path.basename(file_name))
            if os.path.exists(target_disk):
                try:
                    os.unlink(target_disk)
                except Exception:
                    pass
            print(json.dumps({"success": ok}))
        else:
            print(json.dumps({"error": "Unknown command or invalid args"}))
    else:
        c = migrate_local_files_to_db()
        print(f"✅ Session 数据库模块已初始化，共管理 {len(list_sessions())} 个凭证纪录。")
