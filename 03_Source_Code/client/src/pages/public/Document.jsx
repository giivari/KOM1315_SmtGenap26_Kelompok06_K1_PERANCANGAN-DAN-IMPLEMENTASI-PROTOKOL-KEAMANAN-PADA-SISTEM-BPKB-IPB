import './Document.css';

export default function Document() {
  const sections = [
    {
      title: 'Road Map',
      cards: [
        { img: '/assets/road-map.png', title: 'Rencana Jangka Panjang IPB\n2019 - 2025', link: 'https://drive.google.com/file/d/1S40vBaUNF5KCWKvRkoYhvQxFDvCw-uuz/view?usp=drive_link' },
      ]
    },
    {
      title: 'Magazine',
      cards: [
        { img: '/assets/ipb-suv.png', title: 'IPB SUV', link: 'https://drive.google.com/file/d/124m44iyncjnRudxFP-w15ejV02AVlCo4/view?usp=drive_link' },
        { img: '/assets/ipb-town.png', title: 'IPB TOWN', link: 'https://drive.google.com/file/d/10DBc1m6SYkJZG08EjVAU1TeZgLkZSoW9/view?usp=drive_link' },
      ]
    },
    {
      title: 'Integrated Sustainability Report and Learning Module',
      cards: [
        { img: '/assets/sustainability-report.png', title: 'Sustainability Report', link: 'https://drive.google.com/file/d/1EYa9b2eEGOHBS76WzQq5E81VNZvNQL5z/view?usp=drive_link' },
        { img: '/assets/life-action.png', title: 'Sustainable Lifestyle Action', link: 'https://drive.google.com/file/d/12E9UyQNOc9yBtYM8Zlzzi3MI24bLDbCw/view?usp=drive_link' },
        { img: '/assets/mindful-sustainability.png', title: 'Mindful Sustainability Compass', link: 'https://drive.google.com/file/d/1qjcaa0xKjOGoG7ZvqXhWUxPkh1x3izNs/view?usp=drive_link' },
      ]
    },
    {
      title: 'Policy Brief',
      cards: [
        { img: '/assets/tata-ruang.png', title: 'Penguatan Tata Ruang Kota dalam Mitigasi Dampak Perubahan Iklim', link: 'https://journal.ipb.ac.id/index.php/agro-maritim/article/view/59033/29430' },
        { img: '/assets/waste.png', title: 'Wujudkan Kampus Berkelanjutan melalui Regenerative Waste Governance', link: 'https://journal.ipb.ac.id/index.php/agro-maritim/article/view/56638/29270' },
        { img: '/assets/polbrief-nature.png', title: 'Komitmen IPB University sebagai Nature Positive Universities', link: 'https://journal.ipb.ac.id/index.php/agro-maritim/article/view/56649/29268' },
      ]
    },
  ];

  return (
    <div className="document-page">
      <div className="document-hero">
        <h1>Document</h1>
        <p>Dokumen dan publikasi BPKB IPB University</p>
      </div>
      {sections.map((section, idx) => (
        <section key={idx} className="doc-section section">
          <div className="container">
            <h2 className="section-title">{section.title}</h2>
            <div className="doc-cards-grid">
              {section.cards.map((card, i) => (
                <div className="doc-dl-card card" key={i}>
                  <img src={card.img} alt={card.title} className="doc-dl-img" />
                  <div className="doc-dl-body">
                    <h3 style={{whiteSpace:'pre-line'}}>{card.title}</h3>
                    <a href={card.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Read More</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
