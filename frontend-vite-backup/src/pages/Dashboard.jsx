import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import '../styles/Dashboard.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchInsights()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard')
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await axios.get('/insights')
      setInsights(response.data)
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-card">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Unable to load dashboard data</h2>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const barChartData = {
    labels: ['Today', 'This Week', 'This Month'],
    datasets: [
      {
        label: 'Spending (₹)',
        data: [
          dashboardData.today_total,
          dashboardData.week_total,
          dashboardData.month_total
        ],
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(118, 75, 162, 0.8)',
          'rgba(79, 70, 229, 0.8)'
        ],
        borderColor: [
          'rgb(102, 126, 234)',
          'rgb(118, 75, 162)',
          'rgb(79, 70, 229)'
        ],
        borderWidth: 1,
      },
    ],
  }

  const doughnutData = {
    labels: dashboardData.categories.map(cat => cat.category),
    datasets: [
      {
        data: dashboardData.categories.map(cat => cat.total),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  const getBudgetStatus = (type) => {
    const budget = dashboardData.budget_status[type]
    if (!budget) return null
    
    const statusClass = budget.status === 'exceeded' ? 'exceeded' : 
                       budget.percentage > 80 ? 'warning' : 'good'
    
    return (
      <div className={`budget-status ${statusClass}`}>
        <div className="budget-header">
          <span>{type.charAt(0).toUpperCase() + type.slice(1)} Budget</span>
          <span>₹{budget.spent.toFixed(2)} / ₹{budget.budget_amount.toFixed(2)}</span>
        </div>
        <div className="budget-bar">
          <div 
            className="budget-progress" 
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          ></div>
        </div>
        <div className="budget-percentage">{budget.percentage.toFixed(1)}%</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}! 👋</h1>
        <p>Here's your financial overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="summary-card">
          <div className="summary-icon today">📅</div>
          <div className="summary-content">
            <h3>Today</h3>
            <div className="summary-amount">₹{dashboardData.today_total.toFixed(2)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon week">📊</div>
          <div className="summary-content">
            <h3>This Week</h3>
            <div className="summary-amount">₹{dashboardData.week_total.toFixed(2)}</div>
            <div className="summary-count">{dashboardData.week_count} transactions</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon month">💰</div>
          <div className="summary-content">
            <h3>This Month</h3>
            <div className="summary-amount">₹{dashboardData.month_total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="quick-actions-grid">
          <Link to="/expenses" className="action-card">
            <div className="action-icon">➕</div>
            <span>Add Expense</span>
          </Link>
          <Link to="/budgets" className="action-card">
            <div className="action-icon">🎯</div>
            <span>Set Budget</span>
          </Link>
          <Link to="/bills" className="action-card">
            <div className="action-icon">📅</div>
            <span>Manage Bills</span>
          </Link>
          <Link to="/insights" className="action-card">
            <div className="action-icon">📈</div>
            <span>View Insights</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Spending Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Spending Overview</h2>
          </div>
          <div className="chart-container">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Spending by Category</h2>
          </div>
          <div className="chart-container">
            {dashboardData.categories.length > 0 ? (
              <Doughnut data={doughnutData} options={chartOptions} />
            ) : (
              <div className="no-data">No spending data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Budget Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Budget Status</h2>
          </div>
          <div className="budget-container">
            {getBudgetStatus('weekly') || getBudgetStatus('monthly') || (
              <div className="no-budget">
                <p>No budgets set yet</p>
                <Link to="/budgets" className="btn btn-primary">
                  Set Up Budgets
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Smart Insights */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Smart Insights</h2>
          </div>
          <div className="insights-container">
            {insights ? (
              <>
                {insights.top_category && insights.top_category !== "No data" && (
                  <div className="insight-item">
                    <div className="insight-icon">🏆</div>
                    <div className="insight-text">
                      You spent the most on <strong>{insights.top_category}</strong>
                      {insights.top_category_amount > 0 && (
                        <> (₹{insights.top_category_amount.toFixed(2)})</>
                      )}
                    </div>
                  </div>
                )}
                
                {insights.week_comparison !== 0 && (
                  <div className="insight-item">
                    <div className="insight-icon">
                      {insights.week_comparison > 0 ? '📈' : '📉'}
                    </div>
                    <div className="insight-text">
                      You spent <strong>₹{Math.abs(insights.week_comparison).toFixed(2)}</strong>
                      {insights.week_comparison > 0 ? ' more ' : ' less '}
                      than last week
                    </div>
                  </div>
                )}
                
                {insights.predictions && insights.predictions.next_week_total > 0 && (
                  <div className="insight-item">
                    <div className="insight-icon">🔮</div>
                    <div className="insight-text">
                      Next week's estimated spending: <strong>₹{insights.predictions.next_week_total.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data">Loading insights...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard