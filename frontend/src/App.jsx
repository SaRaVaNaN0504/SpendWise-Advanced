import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Budgets from './pages/Budgets'
import Bills from './pages/Bills'
import Insights from './pages/Insights'
import Chatbot from './components/Chatbot'
import './styles/App.css'

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setIsAuthenticated(false)
    setUser(null)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading SpendWise...</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navbar user={user} logout={logout} />}
        <main className={isAuthenticated ? 'main-with-navbar' : 'main-full'}>
          <Routes>
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <Register onLogin={login} /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/expenses" 
              element={isAuthenticated ? <Expenses /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/budgets" 
              element={isAuthenticated ? <Budgets /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/bills" 
              element={isAuthenticated ? <Bills /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/insights" 
              element={isAuthenticated ? <Insights /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </main>
        {isAuthenticated && <Chatbot />}
      </div>
    </Router>
  )
}

export default App