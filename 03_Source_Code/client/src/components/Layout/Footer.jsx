import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4 className="footer-title">BPKB IPB University</h4>
          <p className="footer-desc">Badan Pengembangan Kampus Berkelanjutan IPB University</p>
          <div className="footer-contact">
            <h5>Contact Us:</h5>
            <a href="mailto:bpkb@apps.ipb.ac.id?subject=Pertanyaan%20dari%20Website">📧 bpkb@apps.ipb.ac.id</a>
            <a href="tel:+6281454575">📞 +62-8145-4575</a>
            <a href="https://www.instagram.com/bpkbipb" target="_blank" rel="noopener noreferrer">📷 @bpkbipb</a>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Location</h4>
          <a className="footer-address" href="https://maps.app.goo.gl/WREwn5KjrmAi8rdMA" target="_blank" rel="noopener noreferrer">
            📍 Gedung B Perpustakaan Lt. 4, Kampus IPB Dramaga, Dramaga, Bogor, Jawa Barat, Indonesia, 16680
          </a>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Campus Location</h4>
          <ul className="footer-links">
            <li><a href="https://maps.app.goo.gl/Pmt6GtwjoD71S1M19" target="_blank" rel="noopener noreferrer">IPB Dramaga</a></li>
            <li><a href="https://maps.app.goo.gl/tH5zvpEaG71hm93n9" target="_blank" rel="noopener noreferrer">IPB Baranangsiang</a></li>
            <li><a href="https://maps.app.goo.gl/QEMyNJCdAvfng39D6" target="_blank" rel="noopener noreferrer">IPB Taman Kencana</a></li>
            <li><a href="https://maps.app.goo.gl/i6HqNLEUosaGkqtBA" target="_blank" rel="noopener noreferrer">IPB Gunung Gede</a></li>
            <li><a href="https://maps.app.goo.gl/r3LB6zvrGQuSTwQz8" target="_blank" rel="noopener noreferrer">IPB Cilibende</a></li>
            <li><a href="https://maps.app.goo.gl/f6mR3qRSXQLbHUCb7" target="_blank" rel="noopener noreferrer">IPB Sukabumi</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Badan Pengembangan Kampus Berkelanjutan. All rights reserved.</p>
      </div>
    </footer>
  );
}
