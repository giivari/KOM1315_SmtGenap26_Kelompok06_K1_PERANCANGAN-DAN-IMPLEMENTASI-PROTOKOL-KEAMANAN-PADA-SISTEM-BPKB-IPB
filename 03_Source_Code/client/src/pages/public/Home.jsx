import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { articlesAPI, documentationAPI, operationsAPI } from '../../services/api';
import './Home.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [documentations, setDocumentations] = useState([]);
  const [operations, setOperations] = useState([]);

  useEffect(() => {
    articlesAPI.getPublished().then(r => setArticles(r.data.slice(0, 3))).catch(() => {});
    documentationAPI.getAll().then(r => setDocumentations(r.data.slice(0, 10))).catch(() => {});
    operationsAPI.getAll().then(r => setOperations(r.data)).catch(() => {});
  }, []);

  const opsIcons = {
    'Setting and Infrastructure': { icon: '/assets/bangunan.png', label: 'Setting and Infrastructure' },
    'Energy Conversion': { icon: '/assets/energy.png', label: 'Energy Conversion' },
    'Water': { icon: '/assets/water.png', label: 'Water' },
    'Education and Research': { icon: '/assets/education.png', label: 'Education and Research' },
    'Transportation': { icon: '/assets/tutt.png', label: 'Transportation' },
    'Waste': { icon: '/assets/sampah.png', label: 'Waste' },
  };

  return (
    <div className="home-page">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-content animate-fadeInUp">
          <h3 className="hero-subtitle">IPB University</h3>
          <h1 className="hero-title">BPKB</h1>
          <h2 className="hero-desc">Badan Pengembangan Kampus Berkelanjutan</h2>
          <a href="#rank" className="btn btn-accent btn-lg">Selengkapnya</a>
        </div>
      </section>

      {/* ===== RANKING SECTION ===== */}
      <section id="rank" className="rank-section section">
        <div className="container">
          <h2 className="section-title animate-fadeInUp">Journey of UI GreenMetric</h2>
          <div className="rank-wrapper animate-fadeInUp">
            <img className="rank-certificate" src="/assets/Group 11.jpg" alt="GreenMetric Certificate" />
            <div className="rank-text">
              <h2 className="rank-year">2024</h2>
              <p>IPB University meraih peringkat <strong>29 di dunia</strong> sebagai Kampus Hijau Berkelanjutan versi UI GreenMetric World University Rankings 2024.</p>
              <p>Posisi tersebut meningkat dari peringkat 34 pada tahun 2023 lalu.</p>
              <p>Prestasi ini diberikan pada UI GreenMetric World University Rankings 2024 yang dilaksanakan di Sao Paulo University, Brazil.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWS SECTION ===== */}
      <section id="news" className="news-section section">
        <div className="container">
          <h2 className="section-title">News</h2>
          <div className="news-grid stagger-children">
            {articles.map((article) => (
              <Link to={`/articles/${article.id}`} className="news-card card" key={article.id}>
                {article.imagePath && (
                  <div
                    className="news-card-image"
                    style={{ backgroundImage: `url(${API_BASE}${article.imagePath})` }}
                  ></div>
                )}
                {!article.imagePath && (
                  <div className="news-card-image news-card-image-placeholder">
                    <span>📰</span>
                  </div>
                )}
                <div className="news-card-body">
                  <h3 className="news-card-title">{article.name}</h3>
                  <p className="news-card-excerpt">
                    {article.content?.substring(0, 120)}...
                  </p>
                  <span className="btn btn-sm btn-outline">Read More</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center" style={{ marginTop: '32px' }}>
            <Link to="/articles" className="btn btn-primary">Lihat Semua Berita</Link>
          </div>
        </div>
      </section>

      <div className="section-separator"></div>

      {/* ===== DOCUMENTATION SECTION ===== */}
      <section id="dokumentasi" className="docs-section section">
        <div className="container">
          <h2 className="section-title">Documentation</h2>
          {documentations.length > 0 && (
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="docs-swiper"
            >
              {documentations.map((doc) => (
                <SwiperSlide key={doc.id}>
                  <div className="doc-card card">
                    {doc.photoPath ? (
                      <img src={`${API_BASE}${doc.photoPath}`} alt={doc.description} className="doc-card-img" />
                    ) : (
                      <div className="doc-card-img doc-card-placeholder">📸</div>
                    )}
                    <div className="doc-card-body">
                      <h4>{doc.description}</h4>
                      <p className="doc-card-date">
                        {new Date(doc.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* ===== OPERATIONS SECTION ===== */}
      <section id="ops" className="ops-section section">
        <div className="ops-bg"></div>
        <div className="container ops-content">
          <h3 className="ops-title">Green Campus Operations</h3>
          <div className="ops-grid stagger-children">
            {operations.map((op) => {
              const info = opsIcons[op.category] || {};
              return (
                <div className="ops-card card-glass" key={op.id}>
                  <img src={info.icon || '/assets/bangunan.png'} alt={op.category} className="ops-icon" />
                  <p className="ops-label">{op.category}</p>
                  <p className="ops-value">{op.value}/{op.maxValue}</p>
                  <div className="ops-bar">
                    <div
                      className="ops-bar-fill"
                      style={{ width: `${Math.min((op.value / op.maxValue) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
