import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Expenses.css'

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: ''
  })

  const [formData, setFormData] = useState({
    amount: '',
    category: 'FOOD',
    payment_method: 'CASH',
    note: ''
  })

  const categories = [
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'BILLS', 
    'SHOPPING', 'HEALTHCARE', 'EDUCATION', 'OTHER'
  ]

  const paymentMethods = ['CASH', 'UPI', 'CARD', 'WALLET', 'NET_BANKING']

  useEffect(() => {
    fetchExpenses()
  }, [filters])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.category) params.category = filters.category
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate

      const response = await axios.get('/expenses', { params })
      setExpenses(response.data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      alert('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || formData.amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      await axios.post('/expenses', expenseData)
      
      // Reset form
      setFormData({
        amount: '',
        category: 'FOOD',
        payment_method: 'CASH',
        note: ''
      })
      
      // Refresh expenses list
      fetchExpenses()
      alert('Expense added successfully!')
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Failed to add expense')
    }
  }

  const handleDelete = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      await axios.delete(`/expenses/${expenseId}`)
      setExpenses(expenses.filter(exp => exp.id !== expenseId))
      alert('Expense deleted successfully!')
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      startDate: '',
      endDate: ''
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category) => {
    const icons = {
      FOOD: '🍔',
      TRANSPORT: '🚗',
      ENTERTAINMENT: '🎬',
      BILLS: '📄',
      SHOPPING: '🛍️',
      HEALTHCARE: '🏥',
      EDUCATION: '📚',
      OTHER: '📦'
    }
    return icons[category] || '📦'
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="container">
      <div className="page-header">
        <h1>💸 Expense Management</h1>
        <p>Track and manage your daily expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add New Expense</h2>
          </div>
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="form-input"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="form-input"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Note (Optional)</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="form-input"
                placeholder="What was this for?"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              ➕ Add Expense
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Filters</h2>
              <button onClick={clearFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Expenses {expenses.length > 0 && `(${expenses.length})`}
              </h2>
              {totalAmount > 0 && (
                <div className="total-amount">
                  Total: ₹{totalAmount.toFixed(2)}
                </div>
              )}
            </div>

            <div className="expenses-list">
              {loading ? (
                <div className="loading-state">Loading expenses...</div>
              ) : expenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💸</div>
                  <h3>No expenses found</h3>
                  <p>Add your first expense to get started!</p>
                </div>
              ) : (
                <div className="expenses-grid">
                  {expenses.map(expense => (
                    <div key={expense.id} className="expense-item">
                      <div className="expense-main">
                        <div className="expense-category">
                          <span className="category-icon">
                            {getCategoryIcon(expense.category)}
                          </span>
                          {expense.category}
                        </div>
                        <div className="expense-amount">
                          ₹{expense.amount.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="expense-details">
                        {expense.note && (
                          <div className="expense-note">{expense.note}</div>
                        )}
                        <div className="expense-meta">
                          <span className="payment-method">
                            {expense.payment_method}
                          </span>
                          <span className="expense-date">
                            {formatDate(expense.date_time)}
                          </span>
                        </div>
                      </div>

                      <div className="expense-actions">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Expenses