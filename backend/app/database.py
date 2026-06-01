import os
import psycopg2
import psycopg2.extras


class _PGConnection:
    """sqlite3 인터페이스와 호환되는 psycopg2 래퍼"""

    def __init__(self, raw_conn):
        self._conn = raw_conn
        self._cur = raw_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        self.lastrowid = None

    def execute(self, sql, params=None):
        sql = sql.replace("?", "%s")
        if params:
            self._cur.execute(sql, params)
        else:
            self._cur.execute(sql)
        if sql.strip().upper().startswith("INSERT"):
            try:
                self._cur.execute("SELECT lastval()")
                row = self._cur.fetchone()
                self.lastrowid = row["lastval"] if row else None
            except Exception:
                self.lastrowid = None
        return self

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def commit(self):
        self._conn.commit()

    def close(self):
        self._cur.close()
        self._conn.close()


def get_connection() -> _PGConnection:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL 환경변수가 설정되지 않았습니다")
    # postgres:// → postgresql:// 변환 (psycopg2 호환)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if '?' not in url:
        url += '?sslmode=require'
    conn = psycopg2.connect(url)
    return _PGConnection(conn)


def _col_exists(conn: _PGConnection, table: str, column: str) -> bool:
    conn._cur.execute(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = %s AND column_name = %s",
        (table, column),
    )
    return conn._cur.fetchone() is not None


def init_db():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            username      TEXT   NOT NULL UNIQUE,
            name          TEXT   NOT NULL,
            email         TEXT   NOT NULL UNIQUE,
            password_hash TEXT   NOT NULL,
            nickname      TEXT   NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id            SERIAL    PRIMARY KEY,
            category      TEXT      NOT NULL,
            original_text TEXT      NOT NULL,
            summary       TEXT,
            user_id       INTEGER   REFERENCES users(id),
            baby_id       INTEGER,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    if not _col_exists(conn, "records", "user_id"):
        conn.execute("ALTER TABLE records ADD COLUMN user_id INTEGER REFERENCES users(id)")
    if not _col_exists(conn, "records", "baby_id"):
        conn.execute("ALTER TABLE records ADD COLUMN baby_id INTEGER")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS breastfeeding_records (
            id           SERIAL  PRIMARY KEY,
            record_id    INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            duration_min INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS formula_records (
            id        SERIAL  PRIMARY KEY,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            amount_ml INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS baby_food_records (
            id        SERIAL  PRIMARY KEY,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            food_name TEXT,
            amount_g  INTEGER,
            reaction  TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS diaper_records (
            id        SERIAL  PRIMARY KEY,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            type      TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sleep_records (
            id           SERIAL  PRIMARY KEY,
            record_id    INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            sleep_type   TEXT,
            duration_min INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS growth_records (
            id        SERIAL  PRIMARY KEY,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            height_cm REAL,
            weight_kg REAL,
            head_cm   REAL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS development_records (
            id        SERIAL  PRIMARY KEY,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            milestone TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_records (
            id          SERIAL  PRIMARY KEY,
            record_id   INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            temperature REAL,
            medicine    TEXT,
            symptom     TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hospital_records (
            id            SERIAL  PRIMARY KEY,
            record_id     INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            hospital_name TEXT,
            purpose       TEXT,
            prescription  TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_records (
            id        SERIAL  PRIMARY KEY,
            record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
            memo      TEXT
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS babies (
            id         SERIAL  PRIMARY KEY,
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
