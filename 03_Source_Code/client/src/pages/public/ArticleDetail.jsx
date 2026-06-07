import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI, commentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, PenTool, MessageSquare, Send, Trash2, Lock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ArticleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    articlesAPI.getById(id)
      .then(r => setArticle(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchComments();
  }, [id]);

  const fetchComments = () => {
    commentsAPI.getByArticle(id)
      .then(r => setComments(r.data))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Komentar tidak boleh kosong.');
      return;
    }
    setSubmittingComment(true);
    try {
      const res = await commentsAPI.create(id, newComment.trim());
      setComments([res.data, ...comments]);
      setNewComment('');
      toast.success('Komentar ditambahkan!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim komentar.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await commentsAPI.delete(id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Komentar dihapus');
    } catch {
      toast.error('Gagal menghapus komentar.');
    }
  };

  if (loading) return <div className="loading-container" style={{marginTop:'120px'}}><div className="spinner"></div></div>;
  if (!article) return <div className="container section" style={{paddingTop:'120px',textAlign:'center'}}><h2>Artikel tidak ditemukan</h2><Link to="/articles" className="btn btn-primary" style={{marginTop:'16px'}}>Kembali</Link></div>;

  return (
    <div style={{paddingTop:'90px',paddingBottom:'48px'}} className="container">
      <Link to="/articles" style={{display:'inline-flex',alignItems:'center',gap:'8px',color:'var(--color-primary-500)',fontWeight:600,marginBottom:'24px'}}>
        <ArrowLeft size={18} /> Kembali ke Berita
      </Link>
      <article style={{background:'var(--color-surface)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-lg)',overflow:'hidden'}}>
        {article.imagePath && (
          <img src={`${API_BASE}${article.imagePath}`} alt={article.name} style={{width:'100%',height:'400px',objectFit:'cover'}} />
        )}
        <div style={{padding:'40px'}}>
          <div style={{display:'flex',gap:'16px',marginBottom:'16px',fontSize:'0.9rem',color:'var(--color-text-muted)'}}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(article.date).toLocaleDateString('id-ID',{year:'numeric',month:'long',day:'numeric'})}</span>
            {article.author && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><PenTool size={14} /> {article.author}</span>}
          </div>
          <h1 style={{color:'var(--color-primary-700)',marginBottom:'24px',fontSize:'2rem'}}>{article.name}</h1>
          <div style={{color:'var(--color-text-secondary)',lineHeight:'1.8',fontSize:'1.05rem',whiteSpace:'pre-wrap'}}>{article.content}</div>
        </div>
      </article>

      {/* ===== COMMENTS SECTION ===== */}
      <section style={{marginTop:'40px'}}>
        <div style={{
          background:'var(--color-surface)',
          borderRadius:'var(--radius-xl)',
          boxShadow:'var(--shadow-lg)',
          overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding:'24px 32px',
            borderBottom:'1px solid var(--color-border)',
            display:'flex',
            alignItems:'center',
            gap:'12px',
          }}>
            <h2 style={{margin:0,fontSize:'1.3rem',color:'var(--color-primary-700)', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <MessageSquare size={20} /> Komentar
            </h2>
            <span style={{
              background:'var(--color-primary-50)',
              color:'var(--color-primary-600)',
              padding:'4px 12px',
              borderRadius:'var(--radius-full)',
              fontSize:'0.85rem',
              fontWeight:600,
            }}>{comments.length}</span>
          </div>

          {/* Comment Form */}
          <div style={{padding:'24px 32px',borderBottom:'1px solid var(--color-border)'}}>
            {user ? (
              <form onSubmit={handleSubmitComment}>
                <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
                  <div style={{
                    width:'40px',height:'40px',borderRadius:'50%',
                    background:'linear-gradient(135deg, var(--color-primary-500), var(--color-accent))',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:'white',fontWeight:700,fontSize:'0.95rem',flexShrink:0,
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <textarea
                      className="form-input"
                      style={{minHeight:'80px',resize:'vertical'}}
                      placeholder="Tulis komentar Anda..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      maxLength={1000}
                    />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'10px'}}>
                      <span style={{fontSize:'0.8rem',color:'var(--color-text-muted)'}}>{newComment.length}/1000</span>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !newComment.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Send size={14} /> {submittingComment ? 'Mengirim...' : 'Kirim Komentar'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{textAlign:'center',padding:'16px',color:'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <Lock size={16} /> Silakan <Link to="/login" style={{color:'var(--color-primary-500)',fontWeight:600}}>Login</Link> untuk meninggalkan komentar.
              </div>
            )}
          </div>

          {/* Comments List */}
          <div style={{padding:'0'}}>
            {commentsLoading ? (
              <div className="loading-container" style={{padding:'32px'}}><div className="spinner"></div></div>
            ) : comments.length === 0 ? (
              <div style={{padding:'40px 32px',textAlign:'center',color:'var(--color-text-muted)'}}>
                <div style={{marginBottom:'16px'}}><MessageSquare size={48} className="mx-auto text-muted" /></div>
                Belum ada komentar. Jadilah yang pertama!
              </div>
            ) : (
              comments.map((comment, idx) => (
                <div key={comment.id} style={{
                  padding:'20px 32px',
                  borderBottom: idx < comments.length - 1 ? '1px solid var(--color-border)' : 'none',
                  animation:`fadeInUp 0.3s ease ${idx * 0.05}s both`,
                }}>
                  <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
                    <div style={{
                      width:'36px',height:'36px',borderRadius:'50%',
                      background: comment.user?.role === 'admin'
                        ? 'linear-gradient(135deg, var(--color-warning), #f97316)'
                        : 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      color:'white',fontWeight:700,fontSize:'0.85rem',flexShrink:0,
                    }}>
                      {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                        <span style={{fontWeight:600,color:'var(--color-text)',fontSize:'0.95rem'}}>
                          {comment.user?.name || 'Unknown'}
                        </span>
                        {comment.user?.role === 'admin' && (
                          <span style={{
                            background:'var(--color-warning-soft)',color:'var(--color-warning)',
                            padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:'0.7rem',
                            fontWeight:700,textTransform:'uppercase',
                          }}>Admin</span>
                        )}
                        <span style={{fontSize:'0.8rem',color:'var(--color-text-muted)'}}>
                          {new Date(comment.createdAt).toLocaleDateString('id-ID',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </span>
                      </div>
                      <p style={{color:'var(--color-text-secondary)',lineHeight:'1.6',fontSize:'0.95rem',margin:0,whiteSpace:'pre-wrap'}}>
                        {comment.content}
                      </p>
                    </div>
                    {/* Delete button for owner or admin */}
                    {user && (user.id === comment.userId || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          background:'none',border:'none',color:'var(--color-text-muted)',
                          cursor:'pointer',fontSize:'0.8rem',padding:'4px 8px',
                          borderRadius:'var(--radius-sm)',transition:'all var(--transition-fast)',
                          flexShrink:0,
                        }}
                        onMouseEnter={e => { e.target.style.color='var(--color-danger)'; e.target.style.background='var(--color-danger-soft)'; }}
                        onMouseLeave={e => { e.target.style.color='var(--color-text-muted)'; e.target.style.background='none'; }}
                        title="Hapus komentar"
                      ><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

