from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, date, timedelta
from typing import List, Optional
import json

from database import db
from auth import hash_password, verify_password, create_access_token, verify_token
from models import *

app = FastAPI(title="SpendWise Advanced API", version="2.0.0")
from apscheduler.schedulers.background import BackgroundScheduler
from reminder_service import process_bill_reminders

@app.get("/")
def home():
    return {
        "message": "SpendWise API is running!",
        "status": "healthy",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "spendwise-backend"}


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    db.init_db()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

# ==================== AUTH ENDPOINTS ====================
@app.post("/register", response_model=dict)
async def register(user: UserCreate):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user - THIS IS CORRECT (uses hashed_password)
        hashed_pwd = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (email, hashed_password, name, currency) VALUES (?, ?, ?, ?)",
            (user.email, hashed_pwd, user.name, user.currency)
        )
        connection.commit()
        user_id = cursor.lastrowid
        
        # Create token
        token = create_access_token({"user_id": user_id, "email": user.email})
        
        return {
            "message": "User created successfully", 
            "token": token, 
            "user_id": user_id,
            "name": user.name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

@app.post("/login", response_model=dict)
async def login(user: UserLogin):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
        db_user = cursor.fetchone()
        
        if not db_user or not verify_password(user.password, db_user['hashed_password']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token({"user_id": db_user['id'], "email": db_user['email']})
        
        return {
            "message": "Login successful", 
            "token": token, 
            "user_id": db_user['id'],
            "name": db_user['name']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

# ==================== EXPENSE ENDPOINTS ====================
@app.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        if expense.date_time is None:
            expense.date_time = datetime.now()
        
        cursor.execute(
            """INSERT INTO expenses (user_id, amount, category, date_time, payment_method, note) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (current_user['user_id'], expense.amount, expense.category.value, 
             expense.date_time, expense.payment_method.value, expense.note)
        )
        connection.commit()
        expense_id = cursor.lastrowid
        
        # Get created expense
        cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
        created_expense = cursor.fetchone()
        
        return ExpenseResponse(
            id=created_expense['id'],
            amount=float(created_expense['amount']),
            category=created_expense['category'],
            date_time=created_expense['date_time'],
            payment_method=created_expense['payment_method'],
            note=created_expense['note'] or "",
            user_id=created_expense['user_id']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

@app.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    current_user: dict = Depends(get_current_user),
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        query = "SELECT * FROM expenses WHERE user_id = ?"
        params = [current_user['user_id']]
        
        if category:
            query += " AND category = ?"
            params.append(category)
        
        if start_date:
            query += " AND DATE(date_time) >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(date_time) <= ?"
            params.append(end_date)
        
        query += " ORDER BY date_time DESC"
        
        cursor.execute(query, params)
        expenses = cursor.fetchall()
        
        return [ExpenseResponse(
            id=expense['id'],
            amount=float(expense['amount']),
            category=expense['category'],
            date_time=expense['date_time'],
            payment_method=expense['payment_method'],
            note=expense['note'] or "",
            user_id=expense['user_id']
        ) for expense in expenses]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        # Verify expense belongs to user
        cursor.execute("SELECT user_id FROM expenses WHERE id = ?", (expense_id,))
        expense = cursor.fetchone()
        
        if not expense or expense['user_id'] != current_user['user_id']:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        connection.commit()
        
        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

# ==================== BUDGET ENDPOINTS ====================
@app.post("/budgets", response_model=BudgetResponse)
async def create_budget(budget: BudgetCreate, current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        # Check if budget exists
        cursor.execute(
            "SELECT id FROM budgets WHERE user_id = ? AND budget_type = ?",
            (current_user['user_id'], budget.budget_type.value)
        )
        existing_budget = cursor.fetchone()
        
        if existing_budget:
            # Update existing budget
            cursor.execute(
                "UPDATE budgets SET amount = ?, start_date = DATE('now') WHERE id = ?",
                (budget.amount, existing_budget['id'])
            )
            budget_id = existing_budget['id']
        else:
            # Insert new budget
            cursor.execute(
                """INSERT INTO budgets (user_id, budget_type, amount, start_date) 
                VALUES (?, ?, ?, DATE('now'))""",
                (current_user['user_id'], budget.budget_type.value, budget.amount)
            )
            budget_id = cursor.lastrowid
        
        connection.commit()
        
        # Get created budget
        cursor.execute(
            "SELECT * FROM budgets WHERE id = ?",
            (budget_id,)
        )
        created_budget = cursor.fetchone()
        
        return BudgetResponse(
            id=created_budget['id'],
            budget_type=created_budget['budget_type'],
            amount=float(created_budget['amount']),
            start_date=created_budget['start_date']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

@app.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets(current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        cursor.execute(
            "SELECT * FROM budgets WHERE user_id = ?",
            (current_user['user_id'],)
        )
        budgets = cursor.fetchall()
        
        return [BudgetResponse(
            id=budget['id'],
            budget_type=budget['budget_type'],
            amount=float(budget['amount']),
            start_date=budget['start_date']
        ) for budget in budgets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

# ==================== BILL ENDPOINTS ====================
@app.post("/bills", response_model=BillResponse)
async def create_bill(bill: BillCreate, current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        cursor.execute(
            """INSERT INTO bills (user_id, bill_name, amount, due_date, reminder_days, is_recurring) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (current_user['user_id'], bill.bill_name, bill.amount, 
             bill.due_date, bill.reminder_days, bill.is_recurring)
        )
        connection.commit()
        bill_id = cursor.lastrowid
        
        # Get created bill
        cursor.execute("SELECT * FROM bills WHERE id = ?", (bill_id,))
        created_bill = cursor.fetchone()
        
        return BillResponse(
            id=created_bill['id'],
            bill_name=created_bill['bill_name'],
            amount=float(created_bill['amount']),
            due_date=created_bill['due_date'],
            reminder_days=created_bill['reminder_days'],
            status=created_bill['status'],
            is_recurring=bool(created_bill['is_recurring'])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

@app.get("/bills", response_model=List[BillResponse])
async def get_bills(current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        cursor.execute(
            "SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC",
            (current_user['user_id'],)
        )
        bills = cursor.fetchall()
        
        return [BillResponse(
            id=bill['id'],
            bill_name=bill['bill_name'],
            amount=float(bill['amount']),
            due_date=bill['due_date'],
            reminder_days=bill['reminder_days'],
            status=bill['status'],
            is_recurring=bool(bill['is_recurring'])
        ) for bill in bills]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

# ==================== DASHBOARD & INSIGHTS ====================
@app.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        user_id = current_user['user_id']
        
        # Today's total
        cursor.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND DATE(date_time) = DATE('now')",
            (user_id,)
        )
        today_total = float(cursor.fetchone()['total'])
        
        # Weekly total
        cursor.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date_time >= DATE('now', '-7 days')",
            (user_id,)
        )
        week_total = float(cursor.fetchone()['total'])
        
        # Monthly total
        cursor.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date_time >= DATE('now', '-30 days')",
            (user_id,)
        )
        month_total = float(cursor.fetchone()['total'])
        
        # Weekly count
        cursor.execute(
            "SELECT COUNT(*) as count FROM expenses WHERE user_id = ? AND date_time >= DATE('now', '-7 days')",
            (user_id,)
        )
        week_count = cursor.fetchone()['count']
        
        # Category breakdown
        cursor.execute(
            """SELECT category, SUM(amount) as total 
            FROM expenses 
            WHERE user_id = ? AND date_time >= DATE('now', '-30 days')
            GROUP BY category ORDER BY total DESC""",
            (user_id,)
        )
        categories_data = cursor.fetchall()
        
        total_amount = sum(item['total'] for item in categories_data)
        categories = []
        for item in categories_data:
            percentage = (item['total'] / total_amount * 100) if total_amount > 0 else 0
            categories.append(CategorySummary(
                category=item['category'],
                total=float(item['total']),
                percentage=round(percentage, 2)
            ))
        
        # Budget status
        budget_status = {}
        cursor.execute("SELECT * FROM budgets WHERE user_id = ?", (user_id,))
        budgets = cursor.fetchall()
        
        for budget in budgets:
            budget_type = budget['budget_type']
            budget_amount = float(budget['amount'])
            
            if budget_type == 'weekly':
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND date_time >= DATE('now', '-7 days')",
                    (user_id,)
                )
                spent = float(cursor.fetchone()['spent'])
            else:  # monthly
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND strftime('%m', date_time) = strftime('%m', 'now') AND strftime('%Y', date_time) = strftime('%Y', 'now')",
                    (user_id,)
                )
                spent = float(cursor.fetchone()['spent'])
            
            percentage = (spent / budget_amount * 100) if budget_amount > 0 else 0
            status = "within" if percentage <= 100 else "exceeded"
            
            budget_status[budget_type] = {
                "budget_amount": budget_amount,
                "spent": spent,
                "percentage": round(percentage, 2),
                "status": status
            }
        
        return DashboardResponse(
            today_total=today_total,
            week_total=week_total,
            month_total=month_total,
            week_count=week_count,
            categories=categories,
            budget_status=budget_status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

@app.get("/insights")
async def get_insights(current_user: dict = Depends(get_current_user)):
    connection = db.get_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = connection.cursor()
    
    try:
        user_id = current_user['user_id']
        
        # Top category this month
        cursor.execute(
            """SELECT category, SUM(amount) as total 
            FROM expenses 
            WHERE user_id = ? AND strftime('%m', date_time) = strftime('%m', 'now') AND strftime('%Y', date_time) = strftime('%Y', 'now')
            GROUP BY category ORDER BY total DESC LIMIT 1""",
            (user_id,)
        )
        top_category_data = cursor.fetchone()
        top_category = top_category_data['category'] if top_category_data else "No data"
        top_category_amount = float(top_category_data['total']) if top_category_data else 0
        
        # Week comparison
        cursor.execute(
            """SELECT 
                COALESCE(SUM(CASE WHEN date_time >= DATE('now', '-7 days') THEN amount END), 0) as current_week,
                COALESCE(SUM(CASE WHEN date_time BETWEEN DATE('now', '-14 days') AND DATE('now', '-7 days') THEN amount END), 0) as previous_week
            FROM expenses WHERE user_id = ?""",
            (user_id,)
        )
        week_data = cursor.fetchone()
        current_week = float(week_data['current_week'])
        previous_week = float(week_data['previous_week'])
        week_comparison = current_week - previous_week
        
        # Budget status message
        cursor.execute(
            "SELECT budget_type, amount FROM budgets WHERE user_id = ?",
            (user_id,)
        )
        budgets = cursor.fetchall()
        
        budget_messages = []
        for budget in budgets:
            budget_type = budget['budget_type']
            budget_amount = float(budget['amount'])
            
            if budget_type == 'weekly':
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND date_time >= DATE('now', '-7 days')",
                    (user_id,)
                )
                spent = float(cursor.fetchone()['spent'])
            else:
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND strftime('%m', date_time) = strftime('%m', 'now') AND strftime('%Y', date_time) = strftime('%Y', 'now')",
                    (user_id,)
                )
                spent = float(cursor.fetchone()['spent'])
            
            if spent <= budget_amount:
                budget_messages.append(f"You are within your {budget_type} budget")
            else:
                budget_messages.append(f"You exceeded your {budget_type} budget by ₹{spent - budget_amount:.2f}")
        
        budget_status = " | ".join(budget_messages) if budget_messages else "No budgets set"
        
        # Simple predictions (average of last 4 weeks)
        cursor.execute(
            """SELECT 
                AVG(weekly_total) as avg_weekly,
                AVG(weekly_food) as avg_food,
                AVG(weekly_transport) as avg_transport
            FROM (
                SELECT 
                    strftime('%Y-%W', date_time) as week,
                    SUM(amount) as weekly_total,
                    SUM(CASE WHEN category = 'FOOD' THEN amount ELSE 0 END) as weekly_food,
                    SUM(CASE WHEN category = 'TRANSPORT' THEN amount ELSE 0 END) as weekly_transport
                FROM expenses 
                WHERE user_id = ? AND date_time >= DATE('now', '-28 days')
                GROUP BY strftime('%Y-%W', date_time)
            ) weekly_data""",
            (user_id,)
        )
        prediction_data = cursor.fetchone()
        
        predictions = {
            "next_week_total": round(float(prediction_data['avg_weekly'] or 0), 2),
            "category_breakdown": {
                "FOOD": round(float(prediction_data['avg_food'] or 0), 2),
                "TRANSPORT": round(float(prediction_data['avg_transport'] or 0), 2),
                "OTHER": round(float((prediction_data['avg_weekly'] or 0) - (prediction_data['avg_food'] or 0) - (prediction_data['avg_transport'] or 0)), 2)
            }
        }
        
        return {
            "top_category": top_category,
            "top_category_amount": top_category_amount,
            "week_comparison": week_comparison,
            "budget_status": budget_status,
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()

# ==================== CHATBOT ENDPOINT ====================
from models import ChatRequest
from models import ChatRequest

@app.post("/chatbot")
async def chatbot_query(
    data: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    connection = db.get_connection()
    cursor = connection.cursor()

    try:
        user_id = current_user["user_id"]
        query = data.message.lower()

        if "today" in query:
            cursor.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND DATE(date_time) = DATE('now')",
                (user_id,)
            )
            total = cursor.fetchone()[0]
            return {"reply": f"You spent ₹{total:.2f} today."}

        elif "week" in query:
            cursor.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND date_time >= DATE('now', '-7 days')",
                (user_id,)
            )
            total = cursor.fetchone()[0]
            return {"reply": f"Your last 7 days spending is ₹{total:.2f}."}

        elif "month" in query:
            cursor.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND strftime('%m', date_time) = strftime('%m', 'now')",
                (user_id,)
            )
            total = cursor.fetchone()[0]
            return {"reply": f"You spent ₹{total:.2f} this month."}

        elif "budget" in query:
            cursor.execute(
                "SELECT budget_type, amount FROM budgets WHERE user_id = ?",
                (user_id,)
            )
            budgets = cursor.fetchall()
            if not budgets:
                return {"reply": "You have not set any budgets yet."}

            text = "Your budgets: "
            for b in budgets:
                text += f"{b['budget_type']} ₹{b['amount']}, "
            return {"reply": text.rstrip(", ")}

        return {
            "reply": "I can help with daily, weekly, monthly spending and budget status."
        }

    finally:
        cursor.close()
        connection.close()

@app.get("/")
async def root():
    return {"message": "SpendWise Advanced API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)