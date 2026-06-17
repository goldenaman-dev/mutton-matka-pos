import '../assets/login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login(): React.JSX.Element {

    console.log(window.api)
console.log(window)
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')

    try {
      const result = await window.api.login(username, password)

      if (result.success) {
        navigate('/dashboard')
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      console.error(err)
      setError('Login failed')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Mutton Matka</h1>
        <p>Taste of Tradition</p>

        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <button
          className="login-button"
          onClick={handleLogin}
        >
          Login
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Home
        </button>
      </div>
    </div>
  )
}

export default Login