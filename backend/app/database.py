import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "baby_records.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()

    # 공통 부모 테이블
    conn.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id            INTEGER   PRIMARY KEY AUTOINCREMENT,
            category      TEXT      NOT NULL,
            original_text TEXT      NOT NULL,
            summary       TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 모유기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS breastfeeding_records (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id    INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            duration_min INTEGER
        )
    """)

    # 분유기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS formula_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            amount_ml INTEGER
        )
    """)

    # 이유식기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS baby_food_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            food_name TEXT,
            amount_g  INTEGER,
            reaction  TEXT
        )
    """)

    # 기저귀기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS diaper_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            type      TEXT
        )
    """)

    # 수면기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sleep_records (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id    INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            sleep_type   TEXT,
            duration_min INTEGER
        )
    """)

    # 성장기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS growth_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            height_cm REAL,
            weight_kg REAL,
            head_cm   REAL
        )
    """)

    # 발달기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS development_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            milestone TEXT
        )
    """)

    # 건강기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_records (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id   INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            temperature REAL,
            medicine    TEXT,
            symptom     TEXT
        )
    """)

    # 병원기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hospital_records (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id     INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            hospital_name TEXT,
            purpose       TEXT,
            prescription  TEXT
        )
    """)

    # 일상기록
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_records (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            memo      TEXT
        )
    """)

    conn.commit()
    conn.close()
