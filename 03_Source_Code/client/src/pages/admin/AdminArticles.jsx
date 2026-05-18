import { useState, useEffect, useRef } from 'react';
import { articlesAPI, uploadAPI } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: '', date: '', author: '', imagePath: '', isDraft: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchArticles();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await articlesAPI.delete(id);
      fetchArticles();
    } catch (error) {
      alert('Failed to delete article');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(file);
      setFormData({ ...formData, imagePath: res.data.path });
    } catch (error) {
      alert('Image upload failed');
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
    } catch (error) {
      alert('Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && articles.length === 0) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Kelola Berita</h1>
        <p>Tambah, edit, atau hapus berita dan artikel</p>
      </div>

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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id}>
                  <td style={{whiteSpace: 'nowrap'}}>{new Date(article.date).toLocaleDateString('id-ID')}</td>
                  <td>{article.name}</td>
                  <td>{article.author || '-'}</td>
                  <td>
                    <span className={`badge ${article.isDraft ? 'badge-warning' : 'badge-success'}`}>
                      {article.isDraft ? 'Draft' : 'Published'}
                    </span>
                  </td>
                  <td style={{whiteSpace: 'nowrap'}}>
                    <button onClick={() => handleEdit(article)} className="btn btn-sm btn-outline" style={{marginRight: '8px'}}>Edit</button>
                    <button onClick={() => handleDelete(article.id)} className="btn btn-sm btn-danger">Hapus</button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan="5" className="text-center">Belum ada berita.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
