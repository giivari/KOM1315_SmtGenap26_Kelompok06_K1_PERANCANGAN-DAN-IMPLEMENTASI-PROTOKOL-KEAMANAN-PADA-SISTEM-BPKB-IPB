import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Welcome to Admin BPKB IPB University</p>
      </div>

      <div className="dashboard-welcome card">
        <div className="welcome-text">
          <h2>Halo, {user?.name}! 👋</h2>
          <p>
            Selamat datang di panel admin Badan Pengembangan Kampus Berkelanjutan (BPKB) IPB University.
            Gunakan menu di sebelah kiri untuk mengelola konten website dan memantau keamanan sistem.
          </p>
        </div>
        <div className="welcome-image">
          <img src="/assets/harmonis.png" alt="Harmonis IPB" />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6'}}>📰</div>
          <div>
            <div className="stat-value">Articles</div>
            <div className="stat-label">Kelola Berita & Artikel</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e'}}>📸</div>
          <div>
            <div className="stat-value">Docs</div>
            <div className="stat-label">Kelola Dokumentasi</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b'}}>⚙️</div>
          <div>
            <div className="stat-value">Ops</div>
            <div className="stat-label">Kelola Data Operasi</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444'}}>🛡️</div>
          <div>
            <div className="stat-value">Security</div>
            <div className="stat-label">Pantau Keamanan (AAA)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
