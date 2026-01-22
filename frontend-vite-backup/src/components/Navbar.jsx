import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/Navbar.css'

const Navbar = ({ user, logout }) => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard">
            <span className="brand-icon">💰</span>
            SpendWise
          </Link>
        </div>

        <div className="navbar-links">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/expenses" 
            className={`nav-link ${isActive('/expenses') ? 'active' : ''}`}
          >
            💸 Expenses
          </Link>
          <Link 
            to="/budgets" 
            className={`nav-link ${isActive('/budgets') ? 'active' : ''}`}
          >
            🎯 Budgets
          </Link>
          <Link 
            to="/bills" 
            className={`nav-link ${isActive('/bills') ? 'active' : ''}`}
          >
            📅 Bills
          </Link>
          <Link 
            to="/insights" 
            className={`nav-link ${isActive('/insights') ? 'active' : ''}`}
          >
            🧠 Insights
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-greeting">Hello, {user?.name}</span>
          <button onClick={logout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
