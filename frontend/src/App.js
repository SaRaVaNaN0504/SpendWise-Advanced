import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Checking backend...')
  const backendUrl = import.meta.env.VITE_API_URL || 'https://spendwise-backend-kagw.onrender.com'

  useEffect(() => {
    fetch(`${backendUrl}/health`)
      .then(res => res.json())
      .then(data => setStatus(`✅ Backend: ${data.status}`))
      .catch(() => setStatus('❌ Backend connection failed'))
  }, [backendUrl])

  return (
    <div className="app">
      <header className="header">
        <h1>💰 SpendWise Advanced</h1>
        <p>Smart Personal Expense Management</p>
        
        <div className="status-box">
          <p>{status}</p>
          <p className="url">Backend: <code>{backendUrl}</code></p>
        </div>

        <div className="links">
          <a href={`${backendUrl}/docs`} target="_blank" rel="noopener noreferrer" className="btn">
            📚 Open API Documentation
          </a>
          <a href="https://github.com/SaRaVaNaN0504/SpendWise-Advanced" target="_blank" rel="noopener noreferrer" className="btn secondary">
            ⭐ View GitHub Repository
          </a>
        </div>
      </header>
    </div>
  )
}

export default App