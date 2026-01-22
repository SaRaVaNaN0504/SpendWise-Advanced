const API_BASE = 'http://localhost:8000';

let currentUser = null;

// Auth functions
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert(data.detail || 'Registration failed');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(data));
            showApp();
        } else {
            alert(data.detail || 'Login failed');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
}

// Navigation
function showSection(section) {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('expenses-section').style.display = 'none';
    
    document.getElementById(`${section}-section`).style.display = 'block';
    
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'expenses') {
        loadExpenses();
    }
}

function showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    showSection('dashboard');
}

function showAuth() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('navbar').style.display = 'none';
}

// Expense functions
async function addExpense() {
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const note = document.getElementById('expense-note').value;

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/expenses/${currentUser.user_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                amount: parseFloat(amount), 
                category, 
                note 
            })
        });

        if (response.ok) {
            document.getElementById('expense-amount').value = '';
            document.getElementById('expense-note').value = '';
            loadExpenses();
            loadDashboard();
            alert('Expense added successfully!');
        } else {
            alert('Failed to add expense');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE}/expenses/${currentUser.user_id}`);
        const expenses = await response.json();

        const container = document.getElementById('expenses-container');
        container.innerHTML = '';

        if (expenses.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No expenses yet. Add your first expense!</p>';
            return;
        }

        expenses.forEach(expense => {
            const expenseEl = document.createElement('div');
            expenseEl.className = 'expense-item';
            expenseEl.innerHTML = `
                <div>
                    <div class="expense-note">${expense.note || 'No description'}</div>
                    <small>${new Date(expense.date_time).toLocaleDateString()}</small>
                </div>
                <div class="expense-category">${expense.category}</div>
                <div class="expense-amount">₹${expense.amount}</div>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
            `;
            container.appendChild(expenseEl);
        });
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            const response = await fetch(`${API_BASE}/expenses/${expenseId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadExpenses();
                loadDashboard();
            } else {
                alert('Failed to delete expense');
            }
        } catch (error) {
            alert('Error connecting to server');
        }
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/${currentUser.user_id}`);
        const data = await response.json();

        document.getElementById('today-total').textContent = `₹${data.today_total}`;
        document.getElementById('week-total').textContent = `₹${data.week_total}`;
        
        // Load expenses count
        const expensesResponse = await fetch(`${API_BASE}/expenses/${currentUser.user_id}`);
        const expenses = await expensesResponse.json();
        document.getElementById('total-expenses').textContent = expenses.length;

        // Load categories
        const categoriesList = document.getElementById('categories-list');
        categoriesList.innerHTML = '';

        if (data.categories.length === 0) {
            categoriesList.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">No category data yet</p>';
            return;
        }

        data.categories.forEach(cat => {
            const catEl = document.createElement('div');
            catEl.className = 'category-item';
            catEl.innerHTML = `
                <span>${cat.category}</span>
                <strong>₹${cat.total}</strong>
            `;
            categoriesList.appendChild(catEl);
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Check if user is already logged in
window.onload = function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    } else {
        showAuth();
    }
};