import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import '../styles/Insights.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const Insights = () => {
  const [insights, setInsights] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsightsData()
  }, [])

  const fetchInsightsData = async () => {
    try {
      const [insightsResponse, dashboardResponse] = await Promise.all([
        axios.get('/insights'),
        axios.get('/dashboard')
      ])
      
      setInsights(insightsResponse.data)
      setDashboardData(dashboardResponse.data)
    } catch (error) {
      console.error('Error fetching insights data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-card">Loading insights...</div>
      </div>
    )
  }

  if (!insights || !dashboardData) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Unable to load insights</h2>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  // Category comparison chart
  const categoryChartData = {
    labels: dashboardData.categories.map(cat => cat.category),
    datasets: [
      {
        label: 'Spending (₹)',
        data: dashboardData.categories.map(cat => cat.total),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgb(102, 126, 234)',
        borderWidth: 2,
      },
    ],
  }

  // Weekly trend data (mock data for demonstration)
  const weeklyTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Weekly Spending',
        data: [2500, 3200, 2800, 3500],
        borderColor: 'rgb(118, 75, 162)',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        tension: 0.4,
        fill: true,
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

  return (
    <div className="container">
      <div className="page-header">
        <h1>🧠 Financial Insights</h1>
        <p>Smart analysis of your spending patterns</p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">💰 Key Insights</h2>
          </div>
          <div className="insights-list">
            {insights.top_category && insights.top_category !== "No data" && (
              <div className="insight-card primary">
                <div className="insight-icon">🏆</div>
                <div className="insight-content">
                  <h3>Top Spending Category</h3>
                  <p>
                    You spent the most on <strong>{insights.top_category}</strong>
                    {insights.top_category_amount > 0 && (
                      <> - ₹{insights.top_category_amount.toFixed(2)}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {insights.week_comparison !== 0 && (
              <div className={`insight-card ${insights.week_comparison > 0 ? 'warning' : 'success'}`}>
                <div className="insight-icon">
                  {insights.week_comparison > 0 ? '📈' : '📉'}
                </div>
                <div className="insight-content">
                  <h3>Weekly Comparison</h3>
                  <p>
                    You spent <strong>₹{Math.abs(insights.week_comparison).toFixed(2)}</strong>
                    {insights.week_comparison > 0 ? ' more ' : ' less '}
                    than last week
                  </p>
                </div>
              </div>
            )}

            {insights.budget_status && insights.budget_status !== "No budgets set" && (
              <div className="insight-card info">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <h3>Budget Status</h3>
                  <p>{insights.budget_status}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Predictions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔮 Spending Predictions</h2>
          </div>
          <div className="predictions-container">
            {insights.predictions && insights.predictions.next_week_total > 0 ? (
              <>
                <div className="prediction-main">
                  <div className="prediction-amount">
                    ₹{insights.predictions.next_week_total.toFixed(2)}
                  </div>
                  <div className="prediction-label">
                    Estimated spending next week
                  </div>
                </div>

                {insights.predictions.category_breakdown && (
                  <div className="breakdown-list">
                    <h4>Category Breakdown</h4>
                    {Object.entries(insights.predictions.category_breakdown).map(([category, amount]) => (
                      amount > 0 && (
                        <div key={category} className="breakdown-item">
                          <span className="breakdown-category">{category}</span>
                          <span className="breakdown-amount">
                            ₹{amount.toFixed(2)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-prediction">
                <div className="no-prediction-icon">📊</div>
                <h3>Not enough data yet</h3>
                <p>Continue tracking expenses to get personalized predictions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📊 Category Distribution</h2>
          </div>
          <div className="chart-container">
            {dashboardData.categories.length > 0 ? (
              <Bar data={categoryChartData} options={chartOptions} />
            ) : (
              <div className="no-data">
                <div className="no-data-icon">💸</div>
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Spending Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📈 Spending Trend</h2>
          </div>
          <div className="chart-container">
            <Line data={weeklyTrendData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Budget Analysis */}
      {dashboardData.budget_status && Object.keys(dashboardData.budget_status).length > 0 && (
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="card-title">🎯 Budget Analysis</h2>
          </div>
          <div className="budget-analysis">
            {Object.entries(dashboardData.budget_status).map(([type, data]) => (
              <div key={type} className="budget-analysis-item">
                <div className="budget-analysis-header">
                  <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Budget</h3>
                  <div className={`budget-status-indicator ${data.status}`}>
                    {data.status === 'within' ? '✅ On Track' : '❌ Exceeded'}
                  </div>
                </div>
                <div className="budget-analysis-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min(data.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    ₹{data.spent.toFixed(2)} / ₹{data.budget_amount.toFixed(2)}
                    <span className="progress-percentage">
                      ({data.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips & Recommendations */}
      <div className="card mt-8">
        <div className="card-header">
          <h2 className="card-title">💡 Smart Recommendations</h2>
        </div>
        <div className="recommendations-grid">
          <div className="recommendation-card">
            <div className="recommendation-icon">💰</div>
            <h3>Optimize Your Budget</h3>
            <p>Based on your spending patterns, consider adjusting your budget allocation for better balance.</p>
          </div>

          <div className="recommendation-card">
            <div className="recommendation-icon">📅</div>
            <h3>Plan Ahead</h3>
            <p>Set up bill reminders and recurring expense tracking to avoid last-minute surprises.</p>
          </div>

          <div className="recommendation-card">
            <div className="recommendation-icon">🎯</div>
            <h3>Set Savings Goals</h3>
            <p>Use your spending insights to identify areas where you can save more each month.</p>
          </div>

          <div className="recommendation-card">
            <div className="recommendation-icon">📊</div>
            <h3>Regular Reviews</h3>
            <p>Check your insights weekly to stay on top of your financial health and make adjustments.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights