import { useState, useEffect } from 'react'
import { 
  initiateLogin, 
  handleSSOCallback, 
  getUserInfo, 
  isAuthenticated,
  logout as authLogout,
  getToken
} from './auth.js'
import { APP_CONFIG } from './config.js'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for SSO callback on mount
    const processCallback = async () => {
      try {
        setLoading(true)
        const result = await handleSSOCallback()
        
        if (result && Object.keys(result).length > 0) {
          // Just logged in, set user info
          setUser(result)
        } else if (isAuthenticated()) {
          // Already authenticated, get user info
          const userInfo = getUserInfo()
          setUser(userInfo)
        }
      } catch (err) {
        setError(err.message)
        console.error('SSO callback error:', err)
      } finally {
        setLoading(false)
      }
    }

    processCallback()
  }, [])

  const handleLogin = () => {
    initiateLogin()
  }

  const handleLogout = () => {
    authLogout()
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="login-container">
            <h1>Welcome to FMT SSO</h1>
            <p>Please login to continue</p>
            <button className="login-button" onClick={handleLogin}>
              Login with SSO
            </button>
            <div className="test-mode">
              <details>
                <summary>Test Mode (No Backend)</summary>
                <p className="test-note">
                  For testing without backend, you can manually set a test JWT token:
                </p>
                <div className="test-token-input">
                  <input
                    type="text"
                    id="testTokenInput"
                    placeholder="Paste JWT token here"
                    className="token-input"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('testTokenInput');
                      const token = input.value.trim();
                      if (token) {
                        localStorage.setItem(APP_CONFIG.testTokenKey, token);
                        window.location.reload();
                      } else {
                        alert('Please enter a JWT token');
                      }
                    }}
                    className="test-button"
                  >
                    Set Test Token
                  </button>
                </div>
                <p className="test-note-small">
                  Or add <code>?test_token=YOUR_JWT_TOKEN</code> to the URL
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="card">
        <div className="user-container">
          <div className="header">
            <h1>Welcome, {user?.name || 'User'}!</h1>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="user-info">
            <div className="info-section success-section">
              <h2>✓ Token Received Successfully!</h2>
              <p className="success-message">Token has been received from Ping Identity and stored.</p>
              <div className="token-status">
                <strong>Token Status:</strong> <span className="status-active">Active</span>
              </div>
            </div>

            <div className="info-section">
              <h2>Token Information</h2>
              <div className="info-item">
                <strong>Token (Raw):</strong>
                <div className="token-display">
                  {getToken() ? getToken().substring(0, 50) + '...' : 'N/A'}
                </div>
              </div>
              <div className="info-item">
                <strong>Token Expiration:</strong> {user?.exp ? new Date(user.exp * 1000).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="info-section">
              <h2>User Information</h2>
              <div className="info-item">
                <strong>Name:</strong> {user?.name || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Display Name:</strong> {user?.displayName || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {user?.email || 'N/A'}
              </div>
            </div>

            <div className="info-section">
              <h2>Complete JWT Payload</h2>
              <p className="info-note">All data returned from Ping Identity:</p>
              <pre className="json-display">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

