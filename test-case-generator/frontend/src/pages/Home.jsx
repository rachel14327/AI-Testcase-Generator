import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="home-page">
      <div className="home-card">
        <h1>AI Testcase Generator</h1>
        <p className="home-tagline">
          {user ? `Welcome back, ${user.first_name}.` : 'Sign in or create an account to continue.'}
        </p>
        <div className="home-actions">
          {!user && (
            <>
              <Link to="/login" className="home-btn home-btn-primary">Sign in</Link>
              <Link to="/register" className="home-btn home-btn-secondary">Register</Link>
            </>
          )}
          {user && (
            <>
              <Link to="/upload" className="home-btn home-btn-primary">Upload</Link>
              <Link to="/rag" className="home-btn home-btn-secondary">Generate test cases</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
