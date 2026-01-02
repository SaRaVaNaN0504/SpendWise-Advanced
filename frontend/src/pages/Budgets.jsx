import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Budgets.css'

const Budgets = () => {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    budget_type: 'weekly',
    amount: ''
  })

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/budgets')
      setBudgets(response.data)
    } catch (error) {
      console.error('Error fetching budgets:', error)
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
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      await axios.post('/budgets', budgetData)
      
      // Reset form
      setFormData({
        budget_type: 'weekly',
        amount: ''
      })
      
      // Refresh budgets list
      fetchBudgets()
      alert('Budget set successfully!')
    } catch (error) {
      console.error('Error setting budget:', error)
      alert('Failed to set budget')
    }
  }

  const getBudgetStatus = (budget) => {
    // This would typically come from the dashboard API
    // For now, we'll show a placeholder
    return {
      spent: data.spent,
      percentage: 0,
      status: 'good'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'var(--success)'
      case 'warning': return 'var(--warning)'
      case 'exceeded': return 'var(--error)'
      default: return 'var(--primary)'
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>🎯 Budget Management</h1>
        <p>Set and track your spending limits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Set Budget Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Set New Budget</h2>
          </div>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-group">
              <label className="form-label">Budget Type</label>
              <select
                value={formData.budget_type}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_type: e.target.value }))}
                className="form-input"
              >
                <option value="weekly">Weekly Budget</option>
                <option value="monthly">Monthly Budget</option>
              </select>
            </div>

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

            <button type="submit" className="btn btn-primary w-full">
              💰 Set Budget
            </button>
          </form>

          <div className="budget-tips">
            <h4>💡 Budgeting Tips</h4>
            <ul>
              <li>Start with a weekly budget to get comfortable</li>
              <li>Review and adjust your budgets monthly</li>
              <li>Consider different categories for better control</li>
              <li>Use insights to understand your spending patterns</li>
            </ul>
          </div>
        </div>

        {/* Budgets List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Budgets</h2>
          </div>

          <div className="budgets-list">
            {loading ? (
              <div className="loading-state">Loading budgets...</div>
            ) : budgets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No budgets set</h3>
                <p>Set your first budget to start tracking!</p>
              </div>
            ) : (
              <div className="budgets-grid">
                {budgets.map(budget => {
                  const status = getBudgetStatus(budget)
                  return (
                    <div key={budget.id} className="budget-item">
                      <div className="budget-header">
                        <div className="budget-type">
                          <span className="budget-icon">
                            {budget.budget_type === 'weekly' ? '📅' : '📊'}
                          </span>
                          {budget.budget_type.charAt(0).toUpperCase() + budget.budget_type.slice(1)} Budget
                        </div>
                        <div className="budget-amount">
                          ₹{budget.amount.toFixed(2)}
                        </div>
                      </div>

                      <div className="budget-progress-container">
                        <div className="budget-progress-bar">
                          <div 
                            className="budget-progress-fill"
                            style={{ 
                              width: `${Math.min(status.percentage, 100)}%`,
                              backgroundColor: getStatusColor(status.status)
                            }}
                          ></div>
                        </div>
                        <div className="budget-progress-text">
                          {status.percentage.toFixed(1)}% used
                        </div>
                      </div>

                      <div className="budget-stats">
                        <div className="stat">
                          <span className="stat-label">Spent:</span>
                          <span className="stat-value">₹{status.spent.toFixed(2)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Remaining:</span>
                          <span className="stat-value">
                            ₹{Math.max(0, budget.amount - status.spent).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className={`budget-status ${status.status}`}>
                        {status.status === 'good' && '✅ On track'}
                        {status.status === 'warning' && '⚠️ Close to limit'}
                        {status.status === 'exceeded' && '❌ Budget exceeded'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Budgets