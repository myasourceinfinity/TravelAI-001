import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div
      className="splash-screen"
      role="status"
      aria-label="Loading Travel AI"
    >
      <div className="splash-decoration splash-decoration-one" />
      <div className="splash-decoration splash-decoration-two" />
      <div className="splash-decoration splash-decoration-three" />

      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <img
            src="/logo.png"
            alt="Travel AI"
            className="splash-logo"
          />
        </div>

        <h1 className="splash-title">
          Plan smarter. Travel better.
        </h1>

        <p className="splash-description">
          Preparing your AI-powered travel experience
        </p>

        <div className="splash-loader" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}