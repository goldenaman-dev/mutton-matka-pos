
import companyLogo from '../assets/mmlogo.png'

import { useNavigate } from 'react-router-dom'

function Home(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const navigate = useNavigate()

  const handleLogin = (): void => {
    console.log('Login clicked')
    // Add your login logic here
  }

  return (
    <>
      <img alt="logo" className="logo" src={companyLogo} />
      <div className="creator">Taste of Tradition</div>

      <button
        onClick={() => navigate('/login')}
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
        Login
      </button>

     
      
    </>
  )
}

export default Home
