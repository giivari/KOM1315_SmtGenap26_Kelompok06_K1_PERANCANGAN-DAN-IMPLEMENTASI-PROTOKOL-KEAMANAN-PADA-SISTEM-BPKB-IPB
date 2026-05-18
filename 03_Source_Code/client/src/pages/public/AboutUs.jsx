import './AboutUs.css';

export default function AboutUs() {
  return (
    <div className="about-page">
      {/* Intro Section */}
      <section className="about-intro section">
        <div className="container">
          <div className="intro-card">
            <div className="intro-text">
              <p className="intro-label">IPB University</p>
              <h1 className="intro-title">BPKB</h1>
              <h2 className="intro-subtitle">Badan Pengembangan Kampus Berkelanjutan</h2>
              <p className="intro-desc">
                BPKB bertugas pada perencanaan dan pengembangan kampus berkelanjutan untuk meningkatkan
                reputasi IPB dalam pencapaian tujuan pembangunan berkelanjutan, serta memperjelas arah IPB
                dalam mewujudkan socio-technopreneur university sesuai Rencana Jangka Panjang IPB.
              </p>
            </div>
            <div className="intro-image">
              <img src="/assets/ipb foto.png" alt="IPB Building" />
            </div>
          </div>
        </div>
      </section>

      {/* Fungsi Section */}
      <section id="fungsi" className="fungsi-section section">
        <div className="container">
          <div className="fungsi-wrapper">
            <div className="fungsi-accent"></div>
            <div className="fungsi-content">
              <h2>Fungsi BPKB</h2>
              <ul>
                <li>Koordinasi penyusun Rencana Induk Pengembangan IPB mencakup infrastruktur, bidang akademik, dan nonakademik dengan berbasiskan manajemen risiko</li>
                <li>Koordinasi penyusun Rencana Tata Ruang (RTR) IPB University Town yang meliputi areal kampus dan sekitarnya</li>
                <li>Pemberian arahan strategis dan desain pengembangan program kampus berkelanjutan dan pencapaian SDGs untuk bidang akademik, riset, pengabdian masyarakat, dan operasional kampus</li>
                <li>Koordinasi peningkatan rekognisi terhadap IPB dan reputasi dalam pencapaian SDGs dan sebagai kampus berkelanjutan di tingkat nasional dan global</li>
                <li>Pemonitoran dan evaluasi terhadap pembangunan sarana fisik dan non fisik untuk mewujudkan kampus keberlanjutan</li>
                <li>Koordinasi penyusunan Rencana Strategis IPB</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section id="our-team" className="team-section section">
        <div className="container">
          <div className="team-card">
            <h2>OUR TEAM</h2>
            <img src="/assets/tim-bpkb.jpg" alt="Team Photo" className="team-photo" />
          </div>
        </div>
      </section>

      {/* Struktur Organisasi */}
      <section id="struktur" className="struktur-section section">
        <div className="container">
          <h2 className="section-title">STRUKTUR ORGANISASI</h2>
          <p className="struktur-desc">Tim BPKB IPB terdiri dari berbagai unit yang saling berkolaborasi demi pengembangan kampus berkelanjutan.</p>

          <div className="org-chart">
            <div className="org-row org-top">
              <div className="org-card org-head">
                <h4>Ketua BPKB</h4>
                <p>Dr. Ir. Ibnul Qayim</p>
              </div>
            </div>
            <div className="org-line"></div>
            <div className="org-row org-middle">
              <div className="org-column">
                <div className="org-card">
                  <h4>Wakil Ketua Pengembangan Infrastruktur</h4>
                  <p>Dr. Heriansyah Putra</p>
                </div>
                <div className="org-card">
                  <h4>Asisten Pengembangan Infrastruktur</h4>
                  <p>Dr. Anisa Dwi Utami</p>
                </div>
              </div>
              <div className="org-column">
                <div className="org-card">
                  <h4>Wakil Reputasi</h4>
                  <p>Dr. Rina Mardiana</p>
                </div>
                <div className="org-card">
                  <h4>Asisten Pengembangan Reputasi</h4>
                  <p>Fifi Gus Dwiyanti</p>
                </div>
              </div>
              <div className="org-card">
                <h4>Supervisor Administrasi</h4>
                <p>Ade Iskandar</p>
              </div>
              <div className="org-card">
                <h4>Sekretaris</h4>
                <p>Naro Jihadi, Ridwan, Siti Aminah, Anwar</p>
              </div>
              <div className="org-card">
                <h4>Asisten Peneliti</h4>
                <p>Windi Mayang Sari, Hana, Khoirunisa, Aliyah Baida, Zahra Wajdini, Jessica, Veronica, Zayyaan, Nabiila</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
