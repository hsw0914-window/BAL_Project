import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect(r'C:\stone\BAL_Project\backend\baby_records.db')
conn.text_factory = str
cur = conn.cursor()
cur.execute("SELECT id, username, name, email, nickname FROM users")
for row in cur.fetchall():
    print(row)
conn.close()
