import { Link } from 'react-router-dom';
import './Footer.css';
import footerLogo from '../../assets/TravelAI_Transparent.png';

function FooterIcon({ type }) {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
      </>
    ),
    shield: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    blog: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    support: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2Z" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2Z" />
      </>
    ),
    ai: (
      <>
        <path d="M4 19 12 4l8 15" />
        <path d="M8 14h8" />
        <path d="M6 19h3" />
        <path d="M15 19h3" />
      </>
    ),
    map: (
      <>
        <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </>
    ),
    pin: (
      <>
        <path d="M12 22s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    bulb: (
      <>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M8 14a6 6 0 1 1 8 0c-.8.7-1 1.5-1 2H9c0-.5-.2-1.3-1-2Z" />
      </>
    ),
  };

  return (
    <svg
      className="site-footer-link-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  );
}

const footerColumns = [
  [
    { label: 'About Us', href: '#about', icon: 'user' },
    { label: 'Terms of Use', href: '#terms', icon: 'shield' },
    { label: 'Privacy Policy', href: '#privacy', icon: 'lock' },
    { label: 'Contact', href: '#contact', icon: 'mail' },
  ],
  [
    { label: 'Packages', to: '/packages', icon: 'map' },
    { label: 'Blogs', href: '#blogs', icon: 'blog' },
    { label: 'Support', href: '#support', icon: 'support' },
    { label: 'Travel AI', to: '/plan-trip', icon: 'ai' },
  ],
  [
    { label: 'Travel Guide', href: '#travel-guide', icon: 'map' },
    { label: 'Top Destinations', href: '#top-destinations', icon: 'pin' },
    { label: 'Travel Tips', href: '#travel-tips', icon: 'bulb' },
  ],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-glow site-footer-glow-left" />
      <div className="site-footer-glow site-footer-glow-right" />
      <div className="site-footer-arc site-footer-arc-top" />
      <div className="site-footer-arc site-footer-arc-bottom" />

      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src={footerLogo} alt="Travel AI" className="site-footer-logo-img" />
          <div className="site-footer-tagline-row">
            <span className="site-footer-spark">✦</span>
            <p>Plan smarter. Travel better.</p>
            <span className="site-footer-spark">✦</span>
          </div>
        </div>

        <div className="site-footer-panel">
          {footerColumns.map((column, columnIndex) => (
            <nav className="site-footer-column" aria-label={`Footer column ${columnIndex + 1}`} key={columnIndex}>
              {column.map(item => {
                const content = (
                  <>
                    <FooterIcon type={item.icon} />
                    <span>{item.label}</span>
                    <span className="site-footer-chevron">›</span>
                  </>
                );

                return item.to ? (
                  <Link key={item.label} to={item.to} className="site-footer-link">
                    {content}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="site-footer-link">
                    {content}
                  </a>
                );
              })}
            </nav>
          ))}
        </div>

        <div className="site-footer-divider">
          <span />
        </div>

        <div className="site-footer-bottom">
          <p>© 2026 Travel AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}