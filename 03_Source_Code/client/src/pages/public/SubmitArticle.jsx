import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { articlesAPI, uploadAPI } from '../../services/api';
import { toast } from 'sonner';
import { CheckCircle, Lock, X, Send, Edit } from 'lucide-react';
import './SubmitArticle.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function SubmitArticle() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', content: '', imagePath: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(file);
      setFormData({ ...formData, imagePath: res.data.path });
      toast.success('Gambar berhasil diupload');
    } catch {
      toast.error('Gagal mengupload gambar. Coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Judul dan konten wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await articlesAPI.submit(formData);
      setSubmitted(true);
      toast.success('Artikel berhasil dikirim!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim artikel. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="submit-article-page">
        <div className="submit-article-hero">
          <h1>Tulis Artikel</h1>
          <p>Bagikan pemikiran, informasi, dan ide Anda seputar kampus hijau</p>
        </div>
        <div className="container">
          <div className="login-prompt-card">
            <div className="prompt-icon"><Lock size={48} color="var(--color-text-secondary)" /></div>
            <h2>Login Diperlukan</h2>
            <p>Silakan login terlebih dahulu untuk menulis dan mengirim artikel.</p>
            <Link to="/login" className="btn btn-primary">Login Sekarang</Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="submit-article-page">
        <div className="submit-article-hero">
          <h1>Tulis Artikel</h1>
          <p>Bagikan pemikiran, informasi, dan ide Anda seputar kampus hijau</p>
        </div>
        <div className="container">
          <div className="submit-form-card submit-success">
            <div className="success-icon">
              <CheckCircle size={40} color="var(--color-success)" />
            </div>
            <h2>Artikel Berhasil Dikirim!</h2>
            <p>Artikel Anda sedang menunggu review dari admin. Anda akan mendapat notifikasi saat artikel disetujui.</p>
            <div className="success-actions">
              <button onClick={() => { setSubmitted(false); setFormData({ name: '', content: '', imagePath: '' }); if(fileInputRef.current) fileInputRef.current.value=''; }} className="btn btn-primary">
                Tulis Artikel Lagi
              </button>
              <Link to="/my-submissions" className="btn btn-outline">Lihat Artikel Saya</Link>
              <Link to="/articles" className="btn btn-outline">Kembali ke Berita</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-article-page">
      <div className="submit-article-hero">
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Edit size={32} /> Tulis Artikel
        </h1>
        <p>Bagikan pemikiran, informasi, dan ide Anda seputar kampus hijau</p>
      </div>

      <div className="container">
        <div className="submit-form-card">
          <h2>Form Pengiriman Artikel</h2>
          <p className="form-subtitle">Artikel Anda akan direview oleh admin sebelum dipublikasikan</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Judul Artikel *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan judul artikel..."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Konten Artikel *</label>
              <textarea
                className="form-input"
                placeholder="Tulis konten artikel Anda di sini..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gambar/Foto (Opsional)</label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="form-input"
                  style={{ flex: 1 }}
                  disabled={uploading}
                />
                {uploading && <span className="text-primary">Uploading...</span>}
              </div>
              {formData.imagePath && (
                <div className="image-preview-box">
                  <img src={`${API_BASE}${formData.imagePath}`} alt="Preview" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => { setFormData({ ...formData, imagePath: '' }); if(fileInputRef.current) fileInputRef.current.value=''; }}
                  ><X size={14} /></button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting || uploading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} />
                {isSubmitting ? 'Mengirim...' : 'Kirim Artikel'}
              </button>
              <Link to="/articles" className="btn btn-outline btn-lg">Batal</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
