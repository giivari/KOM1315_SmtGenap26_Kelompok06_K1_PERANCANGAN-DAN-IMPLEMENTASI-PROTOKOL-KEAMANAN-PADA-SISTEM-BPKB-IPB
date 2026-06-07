import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { articlesAPI } from '../../services/api';
import { FileText, Clock, CheckCircle, XCircle, Calendar, Inbox, Edit3 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const statusConfig = {
  pending: { label: 'Menunggu Review', badge: 'badge-warning', Icon: Clock },
  approved: { label: 'Disetujui', badge: 'badge-success', Icon: CheckCircle },
  rejected: { label: 'Ditolak', badge: 'badge-danger', Icon: XCircle },
  draft: { label: 'Draft', badge: 'badge-info', Icon: FileText },
};

export default function MySubmissions() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesAPI.getMySubmissions()
      .then(r => setArticles(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center' }} className="container section">
        <h2>Login diperlukan</h2>
        <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>Silakan login untuk melihat artikel Anda.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '16px' }}>Login</Link>
      </div>
    );
  }

  if (loading) return <div className="loading-container" style={{ marginTop: '120px' }}><div className="spinner"></div></div>;

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '48px', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-500) 50%, var(--color-accent) 100%)',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'white',
        marginBottom: '40px',
        borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
      }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <FileText size={32} /> Artikel Saya
        </h1>
        <p style={{ opacity: 0.85, fontSize: '1.05rem' }}>Pantau status artikel yang sudah Anda kirim</p>
      </div>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--color-primary-700)' }}>Daftar Artikel</h2>
          <Link to="/submit-article" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} /> Tulis Artikel Baru
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}><Inbox size={64} /></div>
            <h3 style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Belum ada artikel</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Anda belum mengirim artikel apapun.</p>
            <Link to="/submit-article" className="btn btn-primary">Tulis Artikel Pertama</Link>
          </div>
        ) : (
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {articles.map(article => {
              const sc = statusConfig[article.status] || statusConfig.draft;
              return (
                <div key={article.id} className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {article.imagePath && (
                    <img
                      src={`${API_BASE}${article.imagePath}`}
                      alt={article.name}
                      style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-700)' }}>{article.name}</h3>
                      <span className={`badge ${sc.badge}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <sc.Icon size={14} /> {sc.label}
                      </span>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      {article.content?.substring(0, 150)}...
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> {new Date(article.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {article.reviewNote && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        background: article.status === 'rejected' ? 'var(--color-danger-soft)' : 'var(--color-success-soft)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                      }}>
                        <strong>Catatan Admin:</strong> {article.reviewNote}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
