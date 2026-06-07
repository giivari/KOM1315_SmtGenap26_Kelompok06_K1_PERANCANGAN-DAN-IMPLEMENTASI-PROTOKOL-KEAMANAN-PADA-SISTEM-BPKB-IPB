import { useState, useEffect } from 'react';
import { aspirationsAPI } from '../../services/api';
import { toast } from 'sonner';
import { Wrench, ZapOff, Leaf, MessageCircle, BarChart3, Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const categories = {
  laporan_kerusakan: { label: 'Laporan Kerusakan', icon: Wrench },
  pemborosan_energi: { label: 'Pemborosan Energi', icon: ZapOff },
  ide_penghijauan: { label: 'Ide Penghijauan', icon: Leaf },
  lainnya: { label: 'Lainnya', icon: MessageCircle },
};

const statusConfig = {
  pending: { label: 'Menunggu', badge: 'badge-warning' },
  in_progress: { label: 'Diproses', badge: 'badge-info' },
  resolved: { label: 'Selesai', badge: 'badge-success' },
  dismissed: { label: 'Ditolak', badge: 'badge-danger' },
};

export default function AdminAspirations() {
  const [aspirations, setAspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ status: '', adminNote: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    setLoading(true);
    try {
      const res = await aspirationsAPI.getAll();
      setAspirations(res.data);
    } catch {
      console.error('Failed to fetch aspirations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (aspiration) => {
    setEditingId(aspiration.id);
    setEditData({
      status: aspiration.status,
      adminNote: aspiration.adminNote || '',
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await aspirationsAPI.updateStatus(id, editData);
      setEditingId(null);
      fetchAspirations();
      toast.success('Status diupdate');
    } catch {
      toast.error('Gagal mengupdate status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus aspirasi ini?')) return;
    try {
      await aspirationsAPI.delete(id);
      fetchAspirations();
      toast.success('Aspirasi dihapus');
    } catch {
      toast.error('Gagal menghapus aspirasi.');
    }
  };

  const filtered = filter === 'all' ? aspirations : aspirations.filter(a => a.status === filter);

  const stats = {
    total: aspirations.length,
    pending: aspirations.filter(a => a.status === 'pending').length,
    in_progress: aspirations.filter(a => a.status === 'in_progress').length,
    resolved: aspirations.filter(a => a.status === 'resolved').length,
  };

  if (loading && aspirations.length === 0) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Leaf size={28} /> Kelola Aspirasi Kampus Hijau</h1>
        <p>Review dan tanggapi laporan serta aspirasi dari civitas kampus</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-primary-50)' }}><BarChart3 size={24} color="var(--color-primary-600)" /></div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Aspirasi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-warning-soft)' }}><Clock size={24} color="var(--color-warning)" /></div>
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Menunggu</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-info-soft)' }}><RefreshCw size={24} color="var(--color-info)" /></div>
          <div>
            <div className="stat-value">{stats.in_progress}</div>
            <div className="stat-label">Diproses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-soft)' }}><CheckCircle size={24} color="var(--color-success)" /></div>
          <div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Selesai</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { value: 'all', label: 'Semua' },
          { value: 'pending', label: 'Menunggu', icon: Clock },
          { value: 'in_progress', label: 'Diproses', icon: RefreshCw },
          { value: 'resolved', label: 'Selesai', icon: CheckCircle },
          { value: 'dismissed', label: 'Ditolak', icon: XCircle },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {f.icon && <f.icon size={14} />} {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Judul</th>
                <th>Pelapor</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(aspiration => {
                const cat = categories[aspiration.category] || categories.lainnya;
                const sc = statusConfig[aspiration.status] || statusConfig.pending;
                const isEditing = editingId === aspiration.id;

                return (
                  <tr key={aspiration.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(aspiration.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><cat.icon size={14} /> {cat.label}</span>
                    </td>
                    <td>
                      <div style={{ maxWidth: '250px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{aspiration.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {aspiration.description}
                        </div>
                        {aspiration.imagePath && (
                          <img
                            src={`${API_BASE}${aspiration.imagePath}`}
                            alt="Bukti"
                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' }}
                          />
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {aspiration.user?.name || '-'}
                      <br />
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{aspiration.user?.email}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{aspiration.location || '-'}</td>
                    <td>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: '120px' }}
                          value={editData.status}
                          onChange={e => setEditData({ ...editData, status: e.target.value })}
                        >
                          <option value="pending">Menunggu</option>
                          <option value="in_progress">Diproses</option>
                          <option value="resolved">Selesai</option>
                          <option value="dismissed">Ditolak</option>
                        </select>
                      ) : (
                        <span className={`badge ${sc.badge}`}>{sc.label}</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                          <textarea
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.85rem', minHeight: '60px' }}
                            placeholder="Catatan admin..."
                            value={editData.adminNote}
                            onChange={e => setEditData({ ...editData, adminNote: e.target.value })}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleSave(aspiration.id)} className="btn btn-sm btn-primary" disabled={saving}>
                              {saving ? '...' : 'Simpan'}
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-sm btn-outline">Batal</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEdit(aspiration)} className="btn btn-sm btn-outline">Edit</button>
                          <button onClick={() => handleDelete(aspiration.id)} className="btn btn-sm btn-danger">Hapus</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center" style={{ padding: '32px' }}>Tidak ada aspirasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
