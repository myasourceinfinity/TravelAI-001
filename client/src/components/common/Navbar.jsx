import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="site-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-star">★</span>
          <span className="logo-text">Travel <span className="logo-accent">AI</span></span>
        </Link>

        {/* Navigation Links match exact image */}
        <div className="navbar-links">
          <a href="#about" className="nav-link">About Us</a>
          <a href="#how" className="nav-link">How it Works</a>
          <Link to="/for-advisors" className="nav-link">For Advisors</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
        </div>
      </div>
    </nav>
  );
}