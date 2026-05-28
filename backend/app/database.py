import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "baby_records.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _col_exists(conn, table, column):
    cols = [row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    return column in cols


def init_db():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            name          TEXT    NOT NULL,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            nickname      TEXT    NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id            INTEGER   PRIMARY KEY AUTOINCREMENT,
            category      TEXT      NOT NULL,
            original_text TEXT      NOT NULL,
            summary       TEXT,
            user_id       INTEGER   REFERENCES users(id),
            baby_id       INTEGER,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 기존 records 테이블에 user_id / baby_id 없으면 추가 (마이그레이션)
    if not _col_exists(conn, "records", "user_id"):
        conn.execute("ALTER TABLE records ADD COLUMN user_id INTEGER REFERENCES users(id)")
    if not _col_exists(conn, "records", "baby_id"):
        conn.execute("ALTER TABLE records ADD COLUMN baby_id INTEGER")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS breastfeeding_records (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id    INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            duration_min INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS formula_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            amount_ml INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS baby_food_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            food_name TEXT,
            amount_g  INTEGER,
            reaction  TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS diaper_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            type      TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sleep_records (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id    INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            sleep_type   TEXT,
            duration_min INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS growth_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            height_cm REAL,
            weight_kg REAL,
            head_cm   REAL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS development_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            milestone TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_records (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id   INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            temperature REAL,
            medicine    TEXT,
            symptom     TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hospital_records (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id     INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            hospital_name TEXT,
            purpose       TEXT,
            prescription  TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            memo      TEXT
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS babies (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER REFERENCES users(id),
            name       TEXT,
            gender     TEXT,
            birth_date TEXT
        )
    """)
    if not _col_exists(conn, "babies", "user_id"):
        conn.execute("ALTER TABLE babies ADD COLUMN user_id INTEGER REFERENCES users(id)")

    conn.commit()
    conn.close()
