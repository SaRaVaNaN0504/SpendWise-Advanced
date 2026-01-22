import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Bills.css'

const Bills = () => {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bill_name: '',
    amount: '',
    due_date: '',
    reminder_days: 3,
    is_recurring: false
  })

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/bills')
      setBills(response.data)
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bill_name || !formData.amount || !formData.due_date) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const billData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      await axios.post('/bills', billData)
      
      // Reset form
      setFormData({
        bill_name: '',
        amount: '',
        due_date: '',
        reminder_days: 3,
        is_recurring: false
      })
      
      // Refresh bills list
      fetchBills()
      alert('Bill added successfully!')
    } catch (error) {
      console.error('Error adding bill:', error)
      alert('Failed to add bill')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'var(--success)'
      case 'OVERDUE': return 'var(--error)'
      case 'UPCOMING': return 'var(--warning)'
      default: return 'var(--text-secondary)'
    }
  }

  const getDaysUntilDue = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const upcomingBills = bills.filter(bill => bill.status === 'UPCOMING')
  const paidBills = bills.filter(bill => bill.status === 'PAID')
  const overdueBills = bills.filter(bill => bill.status === 'OVERDUE')

  return (
    <div className="container">
      <div className="page-header">
        <h1>📅 Bill Management</h1>
        <p>Never miss a payment deadline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Bill Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add New Bill</h2>
          </div>
          <form onSubmit={handleSubmit} className="bill-form">
            <div className="form-group">
              <label className="form-label">Bill Name *</label>
              <input
                type="text"
                value={formData.bill_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bill_name: e.target.value }))}
                className="form-input"
                placeholder="e.g., Electricity Bill, Rent"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
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
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reminder (Days Before)</label>
              <select
                value={formData.reminder_days}
                onChange={(e) => setFormData(prev => ({ ...prev, reminder_days: parseInt(e.target.value) }))}
                className="form-input"
              >
                <option value="1">1 Day Before</option>
                <option value="3">3 Days Before</option>
                <option value="7">1 Week Before</option>
                <option value="14">2 Weeks Before</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Recurring Bill</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-full">
              ➕ Add Bill
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {/* Bills Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="summary-card upcoming">
              <div className="summary-icon">⏰</div>
              <div className="summary-content">
                <h3>Upcoming</h3>
                <div className="summary-count">{upcomingBills.length}</div>
              </div>
            </div>

            <div className="summary-card paid">
              <div className="summary-icon">✅</div>
              <div className="summary-content">
                <h3>Paid</h3>
                <div className="summary-count">{paidBills.length}</div>
              </div>
            </div>

            <div className="summary-card overdue">
              <div className="summary-icon">⚠️</div>
              <div className="summary-content">
                <h3>Overdue</h3>
                <div className="summary-count">{overdueBills.length}</div>
              </div>
            </div>
          </div>

          {/* Bills List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Your Bills</h2>
            </div>

            <div className="bills-list">
              {loading ? (
                <div className="loading-state">Loading bills...</div>
              ) : bills.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No bills added</h3>
                  <p>Add your first bill to get started!</p>
                </div>
              ) : (
                <div className="bills-grid">
                  {bills.map(bill => {
                    const daysUntilDue = getDaysUntilDue(bill.due_date)
                    const isOverdue = daysUntilDue < 0
                    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0

                    return (
                      <div key={bill.id} className="bill-item">
                        <div className="bill-main">
                          <div className="bill-info">
                            <div className="bill-name">{bill.bill_name}</div>
                            <div className="bill-amount">₹{bill.amount.toFixed(2)}</div>
                          </div>
                          <div className="bill-status" style={{ color: getStatusColor(bill.status) }}>
                            {bill.status}
                          </div>
                        </div>

                        <div className="bill-details">
                          <div className="bill-due">
                            <strong>Due:</strong> {formatDate(bill.due_date)}
                            {isOverdue && (
                              <span className="due-alert overdue">
                                {Math.abs(daysUntilDue)} days overdue!
                              </span>
                            )}
                            {isDueSoon && (
                              <span className="due-alert due-soon">
                                Due in {daysUntilDue} days
                              </span>
                            )}
                          </div>
                          
                          <div className="bill-meta">
                            <span className="reminder">
                              Reminder: {bill.reminder_days} days before
                            </span>
                            {bill.is_recurring && (
                              <span className="recurring">🔄 Recurring</span>
                            )}
                          </div>
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
    </div>
  )
}

export default Bills