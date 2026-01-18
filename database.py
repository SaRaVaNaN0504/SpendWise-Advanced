import sqlite3
import os

class Database:
    def __init__(self):
        self.db_file = 'spendwise.db'
    
    def get_connection(self):
        try:
            connection = sqlite3.connect(self.db_file)
            connection.row_factory = sqlite3.Row
            return connection
        except Exception as e:
            print(f"Error connecting to SQLite: {e}")
            return None
    
    def init_db(self):
        connection = self.get_connection()
        if connection:
            cursor = connection.cursor()
            
            # ⚠️ Drop tables (DEV ONLY)
            cursor.execute('DROP TABLE IF EXISTS bills')
            cursor.execute('DROP TABLE IF EXISTS budgets')
            cursor.execute('DROP TABLE IF EXISTS expenses')
            cursor.execute('DROP TABLE IF EXISTS users')
            
            # ================= USERS =================
            cursor.execute('''
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    name TEXT NOT NULL,
                    currency TEXT DEFAULT 'INR',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # ================= EXPENSES =================
            cursor.execute('''
                CREATE TABLE expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    payment_method TEXT DEFAULT 'CASH',
                    note TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            # ================= BUDGETS =================
            cursor.execute('''
                CREATE TABLE budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    budget_type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    start_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    UNIQUE(user_id, budget_type)
                )
            ''')
            
            # ================= BILLS (UPDATED) =================
            cursor.execute('''
                CREATE TABLE bills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    bill_name TEXT NOT NULL,
                    amount REAL NOT NULL,
                    due_date DATE NOT NULL,
                    reminder_days INTEGER DEFAULT 3,
                    status TEXT DEFAULT 'UPCOMING',
                    is_recurring BOOLEAN DEFAULT FALSE,
                    last_reminder_sent DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            connection.commit()
            connection.close()

            print("✅ Database initialized successfully")
            print("✅ Bill reminders enabled (last_reminder_sent column added)")

# Global instance
db = Database()
