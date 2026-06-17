import { useNavigate } from 'react-router-dom'
import '../assets/BackButton.css'

function BackButton(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <button
      className="back-button"
      onClick={() => navigate('/dashboard')}
    >
      ← Dashboard
    </button>
  )
}

export default BackButton