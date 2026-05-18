import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesAPI.getById(id)
      .then(r => setArticle(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-container" style={{marginTop:'120px'}}><div className="spinner"></div></div>;
  if (!article) return <div className="container section" style={{paddingTop:'120px',textAlign:'center'}}><h2>Artikel tidak ditemukan</h2><Link to="/articles" className="btn btn-primary" style={{marginTop:'16px'}}>Kembali</Link></div>;

  return (
    <div style={{paddingTop:'90px',paddingBottom:'48px'}} className="container">
      <Link to="/articles" style={{display:'inline-flex',alignItems:'center',gap:'8px',color:'var(--color-primary-500)',fontWeight:600,marginBottom:'24px'}}>← Kembali ke Berita</Link>
      <article style={{background:'var(--color-surface)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-lg)',overflow:'hidden'}}>
        {article.imagePath && (
          <img src={`${API_BASE}${article.imagePath}`} alt={article.name} style={{width:'100%',height:'400px',objectFit:'cover'}} />
        )}
        <div style={{padding:'40px'}}>
          <div style={{display:'flex',gap:'16px',marginBottom:'16px',fontSize:'0.9rem',color:'var(--color-text-muted)'}}>
            <span>📅 {new Date(article.date).toLocaleDateString('id-ID',{year:'numeric',month:'long',day:'numeric'})}</span>
            {article.author && <span>✍️ {article.author}</span>}
          </div>
          <h1 style={{color:'var(--color-primary-700)',marginBottom:'24px',fontSize:'2rem'}}>{article.name}</h1>
          <div style={{color:'var(--color-text-secondary)',lineHeight:'1.8',fontSize:'1.05rem',whiteSpace:'pre-wrap'}}>{article.content}</div>
        </div>
      </article>
    </div>
  );
}
