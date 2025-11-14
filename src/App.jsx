import { useState, useEffect } from 'react'
import { 
  initiateLogin, 
  handleSSOCallback, 
  getUserInfo, 
  isAuthenticated,
  logout as authLogout
} from './auth.js'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for SSO callback on mount
    const processCallback = () => {
      try {
        setLoading(true)
        const result = handleSSOCallback()
        
        if (result) {
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
    authLogout(true) // Redirect to SSO logout
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
            <div className="info-section">
              <h2>Complete JWT Payload</h2>
              <p className="info-note">All data returned from Ping Identity:</p>
              <pre className="json-display">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div className="info-section">
              <h2>Common Fields</h2>
              <div className="info-item">
                <strong>Subject (sub):</strong> {user?.sub || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Name:</strong> {user?.name || user?.preferred_username || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {user?.email || 'N/A'}
              </div>
              {user?.memberOf && (
                <div className="info-item">
                  <strong>Member Of:</strong> 
                  {Array.isArray(user.memberOf) ? (
                    <div className="roles-list">
                      {user.memberOf.map((role, index) => (
                        <span key={index} className="role-badge">
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="role-badge">{user.memberOf}</span>
                  )}
                </div>
              )}
              {user?.groups && (
                <div className="info-item">
                  <strong>Groups:</strong> 
                  {Array.isArray(user.groups) ? (
                    <div className="roles-list">
                      {user.groups.map((group, index) => (
                        <span key={index} className="role-badge">
                          {group}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="role-badge">{user.groups}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

