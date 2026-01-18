from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str



class Category(str, Enum):
    FOOD = "FOOD"
    TRANSPORT = "TRANSPORT"
    ENTERTAINMENT = "ENTERTAINMENT"
    BILLS = "BILLS"
    SHOPPING = "SHOPPING"
    HEALTHCARE = "HEALTHCARE"
    EDUCATION = "EDUCATION"
    OTHER = "OTHER"

class PaymentMethod(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    WALLET = "WALLET"
    NET_BANKING = "NET_BANKING"

class BudgetType(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class BillStatus(str, Enum):
    UPCOMING = "UPCOMING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"

# User models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    currency: str = "INR"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    currency: str

# Expense models
class ExpenseCreate(BaseModel):
    amount: float
    category: Category
    date_time: Optional[datetime] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    note: str = ""

class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    date_time: datetime
    payment_method: str
    note: str
    user_id: int

# Budget models
class BudgetCreate(BaseModel):
    budget_type: BudgetType
    amount: float

class BudgetResponse(BaseModel):
    id: int
    budget_type: str
    amount: float
    start_date: Optional[date]

# Bill models
class BillCreate(BaseModel):
    bill_name: str
    amount: float
    due_date: date
    reminder_days: int = 3
    is_recurring: bool = False

class BillResponse(BaseModel):
    id: int
    bill_name: str
    amount: float
    due_date: date
    reminder_days: int
    status: str
    is_recurring: bool

# Dashboard models
class CategorySummary(BaseModel):
    category: str
    total: float
    percentage: float

class DashboardResponse(BaseModel):
    today_total: float
    week_total: float
    month_total: float
    week_count: int
    categories: List[CategorySummary]
    budget_status: dict

# Insights models
class InsightResponse(BaseModel):
    top_category: str
    top_category_amount: float
    week_comparison: float
    budget_status: str
    predictions: dict
    
    
class ChatRequest(BaseModel):
    message: str
