import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="app-header">
      <Link to="/" className="app-header-logo">AI Testcase Generator</Link>
      <nav className="app-header-nav">
        {user && (
          <>
            <Link to="/upload" className="app-header-link">Upload</Link>
            <Link to="/rag" className="app-header-link">Generate test cases</Link>
            <Link to="/features" className="app-header-link">Features</Link>
          </>
        )}
      </nav>
      <div className="app-header-right">
        {user ? (
          <>
            <span className="app-header-user">
              {user.first_name} {user.last_name}
            </span>
            <button type="button" onClick={logout} className="app-header-logout">
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="app-header-signin">Sign in</Link>
        )}
      </div>
    </header>
  )
}
