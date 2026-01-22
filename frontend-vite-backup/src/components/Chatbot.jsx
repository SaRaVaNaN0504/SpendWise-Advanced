import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import '../styles/Chatbot.css'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm your SpendWise assistant. Ask me about your spending, budgets, or insights!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    setMessages(prev => [...prev, { type: 'user', text: input }])
    setLoading(true)

    try {
      const res = await axios.post('/chatbot', {
        message: input
      })

      setMessages(prev => [
        ...prev,
        { type: 'bot', text: res.data.reply }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { type: 'bot', text: "Sorry, I'm having trouble connecting right now." }
      ])
    } finally {
      setInput('')
      setLoading(false)
    }
  }

  return (
    <>
      <button className="chatbot-button" onClick={() => setIsOpen(!isOpen)}>
        🤖
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>SpendWise Assistant</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.type}`}>{m.text}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your finances..."
            />
            <button onClick={sendMessage}>➤</button>
          </div>
        </div>
      )}
    </>
  )
}

export default Chatbot
