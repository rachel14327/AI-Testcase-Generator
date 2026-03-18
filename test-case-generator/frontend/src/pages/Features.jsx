import { useAuth } from '../context/AuthContext'
import './Features.css'

export default function Features() {
  const { user } = useAuth()

  return (
    <div className="features-page">
      <div className="features-card">
        <h1>Features</h1>
        <p className="features-subtitle">
          {user ? 'Manage and view your features here.' : 'Sign in to access features.'}
        </p>
      </div>
    </div>
  )
}
