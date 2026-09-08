import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        
        {/* Top Header Section */}
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-star">★</span> Travel <span className="logo-accent">AI</span>
            </Link>
            <p className="footer-tagline">Travel should feel personal.</p>
          </div>

          <div className="footer-nav">
            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li><Link to="/packages?destination=dubai">Dubai</Link></li>
                <li><Link to="/packages?destination=japan">Japan</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Journeys</h4>
              <ul>
                <li><Link to="/packages?destination=dubai">Dubai Journeys</Link></li>
                <li><Link to="/packages?destination=japan">Japan Journeys</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Travel AI</h4>
              <ul>
                <li><a href="#about">Our Story</a></li>
                <li><a href="#how">How It Works</a></li>
                <li><Link to="/agents">Travel AI Agents</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Help</h4>
              <ul>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/faqs">FAQs</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Travel Professional Banner */}
        <div className="footer-pro-box">
          <p className="pro-box-text">Are you a travel professional?</p>
          <Link to="/become-agent" className="btn-pro-agent">
            Become a Travel AI Agent ↗
          </Link>
        </div>

        {/* Bottom Bar Section */}
        <div className="footer-bottom">
          <p className="footer-copy">© 2026 Travel AI. All rights reserved.</p>
          <div className="footer-legal-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/booking-terms">Booking Terms</Link>
            <Link to="/cancellation-policy">Cancellation Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}