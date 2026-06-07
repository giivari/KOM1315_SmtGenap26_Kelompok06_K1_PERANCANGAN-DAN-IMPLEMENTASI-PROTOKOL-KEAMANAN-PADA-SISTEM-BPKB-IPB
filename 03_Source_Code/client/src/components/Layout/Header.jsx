import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/assets/2-removebg-preview.png" alt="Logo BPKB" className="header-logo-img" />
        </Link>

        <nav className="header-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/about-us" className={`nav-link ${isActive('/about-us') ? 'active' : ''}`}>About Us</Link>
          <Link to="/articles" className={`nav-link ${isActive('/articles') ? 'active' : ''}`}>Berita</Link>
          <Link to="/aspirations" className={`nav-link ${isActive('/aspirations') ? 'active' : ''}`}>Aspirasi</Link>
          <Link to="/document" className={`nav-link ${isActive('/document') ? 'active' : ''}`}>Document</Link>
          {user && (
            <Link to="/submit-article" className={`nav-link ${isActive('/submit-article') ? 'active' : ''}`}>Tulis Artikel</Link>
          )}
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.name}</span>
              {isAdmin && (
                <Link to="/admin" className="btn btn-sm btn-accent">Admin Panel</Link>
              )}
              <button onClick={logout} className="btn btn-sm btn-outline">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
