import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../../services/api';
import './Articles.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesAPI.getPublished()
      .then(r => setArticles(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container" style={{marginTop:'120px'}}><div className="spinner"></div></div>;

  return (
    <div className="articles-page">
      <div className="articles-hero">
        <h1>Berita & Artikel</h1>
        <p>Informasi terbaru seputar BPKB IPB University</p>
      </div>
      <div className="container section">
        <div className="articles-grid stagger-children">
          {articles.map(article => (
            <Link to={`/articles/${article.id}`} className="article-item card" key={article.id}>
              {article.imagePath ? (
                <div className="article-item-img" style={{backgroundImage:`url(${API_BASE}${article.imagePath})`}}></div>
              ) : (
                <div className="article-item-img article-placeholder">📰</div>
              )}
              <div className="article-item-body">
                <span className="article-date">{new Date(article.date).toLocaleDateString('id-ID',{year:'numeric',month:'long',day:'numeric'})}</span>
                <h3>{article.name}</h3>
                <p>{article.content?.substring(0,150)}...</p>
                {article.author && <span className="article-author">✍️ {article.author}</span>}
              </div>
            </Link>
          ))}
        </div>
        {articles.length === 0 && <p className="text-center text-muted">Belum ada artikel.</p>}
      </div>
    </div>
  );
}
