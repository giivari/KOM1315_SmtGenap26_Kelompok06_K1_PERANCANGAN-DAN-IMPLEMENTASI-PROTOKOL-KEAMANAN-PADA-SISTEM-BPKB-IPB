import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aspirationsAPI, uploadAPI } from '../../services/api';
import { toast } from 'sonner';
import { Wrench, ZapOff, Leaf, MessageCircle, MapPin, User, Calendar, Plus, X, Send, LeafyGreen } from 'lucide-react';
import './Aspirations.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const categories = [
  { value: 'laporan_kerusakan', label: 'Laporan Kerusakan', icon: Wrench, color: 'var(--color-danger)' },
  { value: 'pemborosan_energi', label: 'Pemborosan Energi', icon: ZapOff, color: 'var(--color-warning)' },
  { value: 'ide_penghijauan', label: 'Ide Penghijauan', icon: Leaf, color: 'var(--color-success)' },
  { value: 'lainnya', label: 'Lainnya', icon: MessageCircle, color: 'var(--color-info)' },
];

const statusLabels = {
  pending: 'Menunggu',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  dismissed: 'Ditolak',
};

export default function Aspirations() {
  const { user } = useAuth();
  const [aspirations, setAspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'laporan_kerusakan', location: '', imagePath: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    try {
      const res = await aspirationsAPI.getPublic();
      setAspirations(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(file);
      setFormData({ ...formData, imagePath: res.data.path });
      toast.success('Foto berhasil diupload');
    } catch {
      toast.error('Gagal mengupload foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Judul dan deskripsi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await aspirationsAPI.create(formData);
      toast.success('Aspirasi berhasil dikirim! Terima kasih atas kontribusi Anda.');
      setFormData({ title: '', description: '', category: 'laporan_kerusakan', location: '', imagePath: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAspirations();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim aspirasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = filter === 'all'
    ? aspirations
    : aspirations.filter(a => a.category === filter);

  const getCategoryInfo = (cat) => categories.find(c => c.value === cat) || categories[3];

  if (loading) return <div className="loading-container" style={{ marginTop: '120px' }}><div className="spinner"></div></div>;

  return (
    <div className="aspirations-page">
      <div className="aspirations-hero">
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <LeafyGreen size={36} /> Aspirasi & Pelaporan Kampus Hijau
        </h1>
        <p>Laporkan isu keberlanjutan atau berikan ide penghijauan untuk kampus IPB yang lebih baik</p>
      </div>

      <div className="container">
        {/* Submit Form Section */}
        <div className="aspiration-form-section">
          {user ? (
            <>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn btn-primary toggle-form-btn"
                style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {showForm ? <><X size={18} /> Tutup Form</> : <><Plus size={18} /> Buat Laporan / Aspirasi Baru</>}
              </button>

              {showForm && (
                <div className="aspiration-form-card">
                  <h2>Buat Laporan Baru</h2>
                  <p className="form-subtitle">Bantu kami menjaga kampus tetap hijau dan berkelanjutan</p>

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Judul Laporan *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Kran air bocor di gedung C"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Kategori *</label>
                        <select
                          className="form-input"
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Lokasi</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: Gedung Rektorat Lt. 2"
                          value={formData.location}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Deskripsi *</label>
                      <textarea
                        className="form-input"
                        style={{ minHeight: '120px' }}
                        placeholder="Jelaskan detail laporan atau ide Anda..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Foto Bukti (Opsional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className="form-input"
                        disabled={uploading}
                      />
                      {uploading && <span className="text-primary" style={{ marginTop: '8px', display: 'block' }}>Uploading...</span>}
                      {formData.imagePath && (
                        <div style={{ marginTop: '12px' }}>
                          <img src={`${API_BASE}${formData.imagePath}`} alt="Preview" style={{ height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => { setFormData({ ...formData, imagePath: '' }); if(fileInputRef.current) fileInputRef.current.value=''; }}
                            className="btn-link text-danger"
                            style={{ marginLeft: '12px' }}
                          >Hapus Foto</button>
                        </div>
                      )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Send size={18} /> {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                Silakan <Link to="/login" style={{ color: 'var(--color-primary-500)', fontWeight: 600 }}>login</Link> untuk membuat laporan atau aspirasi baru.
              </p>
            </div>
          )}
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--color-primary-700)', marginBottom: '16px' }}>Laporan & Aspirasi Terbaru</h2>
          <div className="category-pills">
            <button
              className={`category-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >Semua</button>
            {categories.map(c => (
              <button
                key={c.value}
                className={`category-pill ${filter === c.value ? 'active' : ''}`}
                onClick={() => setFilter(c.value)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              ><c.icon size={14} /> {c.label}</button>
            ))}
          </div>
        </div>

        {/* Aspirations Grid */}
        <div className="aspirations-grid stagger-children">
          {filtered.map(aspiration => {
            const catInfo = getCategoryInfo(aspiration.category);
            return (
              <div key={aspiration.id} className={`aspiration-card cat-${aspiration.category}`}>
                {aspiration.imagePath && (
                  <img src={`${API_BASE}${aspiration.imagePath}`} alt={aspiration.title} className="aspiration-card-image" />
                )}
                <div className="aspiration-card-body">
                  <div className="aspiration-card-header">
                    <h3>{aspiration.title}</h3>
                    <span className={`badge ${
                      aspiration.status === 'pending' ? 'badge-warning' :
                      aspiration.status === 'in_progress' ? 'badge-info' :
                      aspiration.status === 'resolved' ? 'badge-success' : 'badge-danger'
                    }`}>
                      <span className={`status-dot ${aspiration.status}`}></span>
                      {statusLabels[aspiration.status]}
                    </span>
                  </div>
                  <p className="aspiration-card-desc">{aspiration.description}</p>
                  <div className="aspiration-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><catInfo.icon size={14} /> {catInfo.label}</span>
                    {aspiration.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {aspiration.location}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {aspiration.user?.name || 'Anonim'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(aspiration.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  {aspiration.adminNote && (
                    <div className="aspiration-admin-note">
                      <strong>Respon Admin:</strong> {aspiration.adminNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}><LeafyGreen size={64} /></div>
            <h3 style={{ color: 'var(--color-text-secondary)' }}>Belum ada laporan</h3>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
              {filter !== 'all' ? 'Tidak ada laporan untuk kategori ini.' : 'Jadilah yang pertama mengirim aspirasi!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
