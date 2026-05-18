import { useState, useEffect, useRef } from 'react';
import { documentationAPI, uploadAPI } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ description: '', date: '', photoPath: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await documentationAPI.getAll();
      setDocs(res.data);
    } catch (error) {
      console.error('Failed to fetch docs');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ description: '', date: '', photoPath: '' });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (doc) => {
    setEditingId(doc.id);
    setFormData({
      description: doc.description,
      date: new Date(doc.date).toISOString().split('T')[0],
      photoPath: doc.photoPath || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this documentation?')) return;
    try {
      await documentationAPI.delete(id);
      fetchDocs();
    } catch (error) {
      alert('Failed to delete doc');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(file);
      setFormData({ ...formData, photoPath: res.data.path });
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
        await documentationAPI.update(editingId, formData);
      } else {
        await documentationAPI.create(formData);
      }
      resetForm();
      fetchDocs();
    } catch (error) {
      alert('Failed to save documentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && docs.length === 0) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Kelola Dokumentasi</h1>
        <p>Tambah, edit, atau hapus foto dokumentasi kegiatan</p>
      </div>

      <div className="card mb-32" style={{padding: '24px'}}>
        <h3 style={{marginBottom: '20px', color: 'var(--color-primary-700)'}}>
          {editingId ? 'Edit Dokumentasi' : 'Tambah Dokumentasi Baru'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Deskripsi / Judul Kegiatan *</label>
            <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Tanggal Kegiatan *</label>
            <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>

          <div className="form-group">
            <label className="form-label">Foto Dokumentasi *</label>
            <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
              <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="form-input" style={{flex: 1}} disabled={uploading} required={!formData.photoPath} />
              {uploading && <span className="text-primary">Uploading...</span>}
            </div>
            {formData.photoPath && (
              <div style={{marginTop: '12px'}}>
                <img src={`${API_BASE}${formData.photoPath}`} alt="Preview" style={{height: '150px', borderRadius: '8px', objectFit: 'cover'}} />
              </div>
            )}
          </div>

          <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading}>
              {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Dokumentasi' : 'Simpan Dokumentasi')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{padding: '24px', borderBottom: '1px solid var(--color-border)'}}>
          <h3 style={{margin: 0, color: 'var(--color-primary-700)'}}>Daftar Dokumentasi</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td style={{width: '120px'}}>
                    {doc.photoPath ? (
                      <img src={`${API_BASE}${doc.photoPath}`} alt="Doc" style={{width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} />
                    ) : (
                      <div style={{width: '100px', height: '60px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>No Image</div>
                    )}
                  </td>
                  <td style={{whiteSpace: 'nowrap'}}>{new Date(doc.date).toLocaleDateString('id-ID')}</td>
                  <td>{doc.description}</td>
                  <td style={{whiteSpace: 'nowrap'}}>
                    <button onClick={() => handleEdit(doc)} className="btn btn-sm btn-outline" style={{marginRight: '8px'}}>Edit</button>
                    <button onClick={() => handleDelete(doc.id)} className="btn btn-sm btn-danger">Hapus</button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan="4" className="text-center">Belum ada dokumentasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
