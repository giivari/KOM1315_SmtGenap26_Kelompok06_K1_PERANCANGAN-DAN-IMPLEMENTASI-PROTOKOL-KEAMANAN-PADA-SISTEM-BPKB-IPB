import { useState, useEffect, useRef } from 'react';
import { articlesAPI, uploadAPI } from '../../services/api';
import { toast } from 'sonner';
import { Newspaper, Clock, User, CheckCircle, XCircle, Trash2, Edit, FileText, Check, X, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const statusConfig = {
  draft: { label: 'Draft', badge: 'badge-info' },
  pending: { label: 'Menunggu Review', badge: 'badge-warning' },
  approved: { label: 'Approved', badge: 'badge-success' },
  rejected: { label: 'Rejected', badge: 'badge-danger' },
};

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [pendingArticles, setPendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: '', date: '', author: '', imagePath: '', isDraft: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'pending'
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchArticles();
    fetchPending();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await articlesAPI.getAll();
      setArticles(res.data);
    } catch (error) {
      console.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await articlesAPI.getPending();
      setPendingArticles(res.data);
    } catch (error) {
      console.error('Failed to fetch pending articles');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', content: '', date: '', author: '', imagePath: '', isDraft: false });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (article) => {
    setEditingId(article.id);
    setFormData({
      name: article.name,
      content: article.content,
      date: new Date(article.date).toISOString().split('T')[0],
      author: article.author || '',
      imagePath: article.imagePath || '',
      isDraft: article.isDraft,
    });
    setActiveTab('manage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await articlesAPI.delete(id);
      fetchArticles();
      fetchPending();
      toast.success('Berita berhasil dihapus');
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(file);
      setFormData({ ...formData, imagePath: res.data.path });
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await articlesAPI.update(editingId, formData);
      } else {
        await articlesAPI.create(formData);
      }
      resetForm();
      fetchArticles();
      toast.success('Berita berhasil disimpan');
    } catch (error) {
      toast.error('Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (id, action) => {
    try {
      await articlesAPI.review(id, { action, reviewNote });
      setReviewingId(null);
      setReviewNote('');
      fetchPending();
      fetchArticles();
      toast.success(`Artikel berhasil di-${action === 'approve' ? 'approve' : 'reject'}`);
    } catch (error) {
      toast.error('Gagal mereview artikel.');
    }
  };

  if (loading && articles.length === 0) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Kelola Berita</h1>
        <p>Tambah, edit, atau hapus berita dan artikel</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('manage')}
          className={`btn btn-sm ${activeTab === 'manage' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        ><Newspaper size={16} /> Kelola Berita</button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Clock size={16} /> Review Artikel User
          {pendingArticles.length > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px',
              background: 'var(--color-danger)', color: 'white',
              width: '22px', height: '22px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
            }}>{pendingArticles.length}</span>
          )}
        </button>
      </div>

      {/* ===== TAB: MANAGE ARTICLES ===== */}
      {activeTab === 'manage' && (
        <>
          <div className="card mb-32" style={{padding: '24px'}}>
            <h3 style={{marginBottom: '20px', color: 'var(--color-primary-700)'}}>
              {editingId ? 'Edit Berita' : 'Tambah Berita Baru'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Judul Berita *</label>
                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Konten *</label>
                <textarea className="form-input" style={{height: '200px'}} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required></textarea>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div className="form-group">
                  <label className="form-label">Tanggal *</label>
                  <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Penulis</label>
                  <input type="text" className="form-input" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gambar/Foto</label>
                <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="form-input" style={{flex: 1}} disabled={uploading} />
                  {uploading && <span className="text-primary">Uploading...</span>}
                </div>
                {formData.imagePath && (
                  <div style={{marginTop: '12px'}}>
                    <img src={`${API_BASE}${formData.imagePath}`} alt="Preview" style={{height: '100px', borderRadius: '8px', objectFit: 'cover'}} />
                    <button type="button" onClick={() => setFormData({...formData, imagePath: ''})} className="btn-link text-danger" style={{marginLeft:'12px'}}>Hapus Gambar</button>
                  </div>
                )}
              </div>

              <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input type="checkbox" id="isDraft" checked={formData.isDraft} onChange={e => setFormData({...formData, isDraft: e.target.checked})} style={{width: '18px', height: '18px'}} />
                <label htmlFor="isDraft" style={{cursor: 'pointer'}}>Simpan sebagai Draft (Tidak dipublikasikan)</label>
              </div>

              <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading}>
                  {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Berita' : 'Simpan Berita')}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <div style={{padding: '24px', borderBottom: '1px solid var(--color-border)'}}>
              <h3 style={{margin: 0, color: 'var(--color-primary-700)'}}>Daftar Berita</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Judul</th>
                    <th>Penulis</th>
                    <th>Status</th>
                    <th>Sumber</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => {
                    const sc = statusConfig[article.status] || statusConfig.draft;
                    return (
                      <tr key={article.id}>
                        <td style={{whiteSpace: 'nowrap'}}>{new Date(article.date).toLocaleDateString('id-ID')}</td>
                        <td>{article.name}</td>
                        <td>{article.author || '-'}</td>
                        <td>
                          <span className={`badge ${sc.badge}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={14} /> {article.submitter ? article.submitter.name : 'Admin'}
                          </span>
                        </td>
                        <td style={{whiteSpace: 'nowrap'}}>
                          <button onClick={() => handleEdit(article)} className="btn btn-sm btn-outline" style={{marginRight: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}><Edit size={14}/> Edit</button>
                          <button onClick={() => handleDelete(article.id)} className="btn btn-sm btn-danger" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}><Trash2 size={14}/> Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                  {articles.length === 0 && (
                    <tr><td colSpan="6" className="text-center">Belum ada berita.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB: PENDING REVIEW ===== */}
      {activeTab === 'pending' && (
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-700)' }}>
                Artikel Menunggu Review ({pendingArticles.length})
              </h3>
            </div>

            {pendingArticles.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}><CheckCircle size={48} className="mx-auto" /></div>
                Tidak ada artikel yang perlu direview.
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                {pendingArticles.map(article => (
                  <div key={article.id} style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    marginBottom: '16px',
                    background: 'var(--color-bg)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary-700)' }}>{article.name}</h3>
                          <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Pending</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {article.submitter?.name || 'Unknown'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📧 {article.submitter?.email}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(article.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        {article.imagePath && (
                          <img
                            src={`${API_BASE}${article.imagePath}`}
                            alt={article.name}
                            style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}
                          />
                        )}
                        <div style={{
                          color: 'var(--color-text-secondary)',
                          lineHeight: '1.7',
                          fontSize: '0.95rem',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '200px',
                          overflow: 'auto',
                          padding: '16px',
                          background: 'var(--color-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}>
                          {article.content}
                        </div>
                      </div>
                    </div>

                    {/* Review actions */}
                    <div style={{ marginTop: '20px', padding: '20px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      {reviewingId === article.id ? (
                        <div>
                          <label className="form-label">Catatan Review (Opsional)</label>
                          <textarea
                            className="form-input"
                            style={{ minHeight: '80px', marginBottom: '12px' }}
                            placeholder="Berikan catatan untuk penulis..."
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleReview(article.id, 'approve')} className="btn btn-sm btn-primary" style={{ background: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={16} /> Approve & Publish
                            </button>
                            <button onClick={() => handleReview(article.id, 'reject')} className="btn btn-sm btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <X size={16} /> Reject
                            </button>
                            <button onClick={() => { setReviewingId(null); setReviewNote(''); }} className="btn btn-sm btn-outline">
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button onClick={() => setReviewingId(article.id)} className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={16} /> Review Artikel
                          </button>
                          <button onClick={() => handleDelete(article.id)} className="btn btn-sm btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={16} /> Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
