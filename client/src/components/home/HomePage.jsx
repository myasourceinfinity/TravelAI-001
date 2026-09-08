import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import './HomePage.css';

// ── Images Import ─────────────────────────────────────────────────────────────
import heroBg from '../../assets/images/hero.webp';
import exploreDubaiImg from '../../assets/images/explore-dubai.webp';
import exploreJapanImg from '../../assets/images/explore-japan.webp';
import mapKyotoImg from '../../assets/images/map-kyoto.webp';
import portraitJamesImg from '../../assets/images/portrait-james.webp';
import portraitSofiaImg from '../../assets/images/portrait-sofia.webp';
import portraitDanielImg from '../../assets/images/portrait-daniel.webp';
import portraitRachelImg from '../../assets/images/portrait-rachel.webp';
import ctaBg from '../../assets/images/cta.webp';

// Sample Journeys Data
const FEATURED_JOURNEYS = [
  {
    id: 'dubai-luxury',
    title: 'The Dubai Experience',
    eyebrow: 'Dubai',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85',
    description: 'A curated week exploring iconic skylines, desert retreats, and private dining.',
    tag: 'Popular'
  },
  {
    id: 'japan-heritage',
    title: 'Japan Heritage Journey',
    eyebrow: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85',
    description: 'Immerse in Tokyo modern energy, Kyoto timeless temples, and serene thermal springs.',
    tag: 'Curated'
  }
];

const REGION_PLACES = {
  Japan: ['Tokyo', 'Kyoto', 'Osaka', 'Mount Fuji', 'Nara'],
  Dubai: ['Downtown Dubai', 'Palm Jumeirah', 'Old Dubai', 'Desert Reserve', 'Marina']
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Selected Place & Region State for Section 06
  const [activeRegion, setActiveRegion] = useState('Japan');
  const [selectedPlace, setSelectedPlace] = useState('Kyoto');

  // Handle region switch and update selected place automatically
  const handleRegionChange = (region) => {
    setActiveRegion(region);
    setSelectedPlace(REGION_PLACES[region][0]);
  };

  // Headless Tidio Integration
  useEffect(() => {
    const setupHeadlessTidio = () => {
      if (window.tidioChatApi) {
        window.tidioChatApi.on('ready', () => {
          window.tidioChatApi.hide();
          const style = document.createElement('style');
          style.innerHTML = '#tidio-chat, #tidio-chat-iframe, .tidio-chat-widget { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }';
          document.head.appendChild(style);
        });
      }
    };

    if (!document.querySelector('script[src*="tidio.co"]')) {
      const script = document.createElement('script');
      script.src = "//code.tidio.co/0ol3wmhhqxu6mzmhmizhkg9vpyaf5sqk.js"; 
      script.async = true;
      script.onload = setupHeadlessTidio;
      document.body.appendChild(script);
    } else {
      setupHeadlessTidio();
    }
  }, []);

  return (
    <div className="homepage-wrapper">
      <a className="skip-link" href="#main">Skip to content</a>

      {/* Dynamic Header Navbar integrated into Page Header */}
      <header id="site-header" className="site-header">
        <Navbar />
      </header>

      <main id="main">

        {/* ===================== 01 — Hero ===================== */}
        <section className="hero" aria-labelledby="hero-title">
          <img className="hero__bg" src={heroBg} alt="Serene mountain landscape"
               fetchPriority="high" decoding="async" width="2200" height="1467" />
          <div className="hero__overlay" aria-hidden="true"></div>
          <div className="hero__inner">
            <h1 className="hero__title" id="hero-title">Travel, made<br />personal.</h1>
            <div className="hero__text">
              <p>Some journeys begin with a destination. Others begin with a feeling.</p>
              <p>Tell us what you're looking for, and discover a more thoughtful way to experience Dubai and Japan.</p>
            </div>
            <a className="btn-hero hero__cta" href="#destinations">
              Discover
              <span className="btn-hero__icon" aria-hidden="true">
                <svg className="icon icon--arrow" viewBox="0 0 9 9" focusable="false">
                  <path d="M2.25 6.75 6.75 2.25M6.75 5.76V2.25H3.24" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </a>
          </div>
        </section>

        {/* ===================== 02 — Introduction ===================== */}
        <section className="section section--deep" aria-labelledby="intro-title">
          <div className="container">
            <div className="split reveal">
              <div className="section-head">
                <p className="eyebrow">02 — Introduction</p>
                <h2 className="section-title" id="intro-title">Two destinations.<br />So much to discover.</h2>
              </div>
              <div className="stack-3 lede measure">
                <p>For now, we've chosen to focus on two extraordinary parts of the world — Dubai and Japan.</p>
                <p>Not simply to show you where to stay or what to see, but to help you understand each destination, discover experiences worth your time, and find a journey that feels right for you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== 03 — Explore / Destinations ===================== */}
        <section className="section section--surface" id="destinations" aria-labelledby="dest-heading">
          <div className="container">
            <p className="eyebrow reveal">03 — Explore</p>
            <h2 className="sr-only" id="dest-heading">Explore our destinations</h2>
            <div className="destinations reveal">

              <article className="dest-card">
                <img className="dest-card__img" src={exploreDubaiImg}
                     alt="Dubai skyline under dusk sky" loading="lazy" decoding="async" />
                <div className="dest-card__scrim" aria-hidden="true"></div>
                <div className="dest-card__body">
                  <p className="dest-card__eyebrow">Dubai</p>
                  <h3 className="dest-card__title">A city of extraordinary contrasts.</h3>
                  <p className="dest-card__text">From quiet mornings in the desert to evenings overlooking one of the world's most remarkable skylines, Dubai is far more than what you see at first glance.</p>
                  <button onClick={() => navigate('/packages?destination=dubai')} className="btn btn--glass">
                    Explore Dubai
                    <svg className="icon icon--arrow" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
                      <path d="M2.25 6.75 6.75 2.25M6.75 5.76V2.25H3.24" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </article>

              <article className="dest-card">
                <img className="dest-card__img" src={exploreJapanImg}
                     alt="Traditional pagoda in Kyoto" loading="lazy" decoding="async" />
                <div className="dest-card__scrim" aria-hidden="true"></div>
                <div className="dest-card__body">
                  <p className="dest-card__eyebrow">Japan</p>
                  <h3 className="dest-card__title">A world you'll want to understand.</h3>
                  <p className="dest-card__text">Tradition and modern life exist beautifully side by side. From the energy of Tokyo to the quiet streets of Kyoto, every part of Japan tells a different story.</p>
                  <button onClick={() => navigate('/packages?destination=japan')} className="btn btn--glass">
                    Explore Japan
                    <svg className="icon icon--arrow" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
                      <path d="M2.25 6.75 6.75 2.25M6.75 5.76V2.25H3.24" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </article>

            </div>
          </div>
        </section>

        {/* ===================== 04 — About ===================== */}
        <section className="section section--surface" id="about" aria-labelledby="about-title">
          <div className="container">
            <div className="split split--top reveal">
              <div className="section-head">
                <p className="eyebrow">04 — About</p>
                <h2 className="section-title" id="about-title">Technology can find a place.<br />People make it a journey.</h2>
              </div>
              <div className="stack-3 lede">
                <p>Travel AI was created around a simple idea: planning a meaningful holiday should feel personal.</p>
                <p>Explore freely. Ask questions. Learn about the places that interest you. And when you're ready to travel, discover carefully considered journeys created by people who understand the destination.</p>
                <p>Behind every journey is a Travel AI Agent — a real travel professional who can listen, advise and help you take the next step.</p>
              </div>
            </div>

            <hr className="divider divider--section" />

            <div className="features reveal">
              <div className="feature">
                <svg className="feature__icon" viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="18" cy="18" r="14"/>
                  <path d="M12 18H24M18 12V24"/>
                </svg>
                <p className="feature__label">Intelligent Discovery</p>
                <h3 className="feature__title">Knowledge when you want it.</h3>
                <p className="feature__text">Ask about neighbourhoods, culture, experiences, seasons, food or simply what a place feels like. Travel AI helps you explore naturally.</p>
              </div>

              <div className="feature">
                <svg className="feature__icon" viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 20C21.31 20 24 17.31 24 14 24 10.69 21.31 8 18 8 14.69 8 12 10.69 12 14 12 17.31 14.69 20 18 20Z"/>
                  <path d="M6 30C7.8 24.8 12 22 18 22 24 22 28.2 24.8 30 30"/>
                </svg>
                <p className="feature__label">Personal Expertise</p>
                <h3 className="feature__title">A real person when it matters.</h3>
                <p className="feature__text">Our Travel AI Agents bring experience, judgement and personal attention to every curated journey.</p>
              </div>
            </div>

            <p className="quote about-quote reveal">Because great travel should never feel automated.</p>
          </div>
        </section>

        {/* ===================== 05 — Packages / Journeys ===================== */}
        <section className="section section--deep" id="journeys" aria-labelledby="journeys-title">
          <div className="container">
            <div className="split split--bordered reveal">
              <div className="section-head">
                <p className="eyebrow">05 — Packages</p>
                <h2 className="section-title" id="journeys-title">Journeys worth taking.</h2>
              </div>
              <p className="lede">We don't believe in showing you hundreds of holidays and leaving you to choose. Instead, our Travel AI Agents bring together a considered collection of journeys across Dubai and Japan — each with its own character, pace and way of experiencing the destination.</p>
            </div>

            <div className="journeys reveal">
              {FEATURED_JOURNEYS.map((j) => (
                <article key={j.id} className="dest-card journey-card">
                  <img className="dest-card__img" src={j.image} alt={j.title} loading="lazy" />
                  <div className="dest-card__scrim"></div>
                  <div className="dest-card__body">
                    <span className="badge">{j.tag}</span>
                    <p className="dest-card__eyebrow">{j.eyebrow}</p>
                    <h3 className="dest-card__title">{j.title}</h3>
                    <p className="dest-card__text">{j.description}</p>
                    <button onClick={() => navigate(`/packages`)} className="btn btn--glass">
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="reveal center-row mt-8">
              <button onClick={() => navigate('/packages')} className="btn btn--ghost btn--pill">
                View all Journeys
                <svg className="icon icon--arrow" viewBox="0 0 9 9" aria-hidden="true">
                  <path d="M2.25 6.75 6.75 2.25M6.75 5.76V2.25H3.24" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ===================== 06 — Deep Exploration / Map ===================== */}
        <section className="section section--surface" id="explore" aria-labelledby="explore-title">
          <div className="container">
            <div className="split split--top reveal">
              <div>
                <div className="section-head">
                  <p className="eyebrow">06 — Deep Exploration / Map</p>
                  <h2 className="section-title" id="explore-title">Get to know a place<br />before you arrive.</h2>
                </div>
                <div className="stack-3 lede measure mt-5">
                  <p>Sometimes the best part of travelling begins long before the flight.</p>
                  <p>Explore neighbourhoods, landmarks, traditions, experiences and stories from Dubai and Japan — and ask Travel AI whenever something catches your curiosity.</p>
                </div>

                <div className="explore-tabs mt-6">
                  {['Dubai', 'Japan'].map((region) => (
                    <button 
                      key={region}
                      className={`chip ${activeRegion === region ? 'chip--active' : ''}`} 
                      onClick={() => handleRegionChange(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>

                <div className="explore-places mt-4">
                  {REGION_PLACES[activeRegion].map((place) => (
                    <button
                      key={place}
                      className={`place-btn ${selectedPlace === place ? 'place-btn--active' : ''}`}
                      onClick={() => setSelectedPlace(place)}
                    >
                      {place}
                    </button>
                  ))}
                </div>
              </div>

              <article className="place-card">
                <div className="place-card__media">
                  <img className="place-card__img" src={mapKyotoImg}
                       alt={`Scenic view of ${selectedPlace}`} loading="lazy" />
                </div>
                <div className="place-card__body">
                  <h3 className="place-card__title">{selectedPlace}</h3>
                  <p className="place-card__text">A region where centuries of tradition and modernity meet seamlessly. Wander through iconic landmarks and experience a unique side of {activeRegion}.</p>
                  <div className="place-card__actions mt-4">
                    <button onClick={() => navigate('/plan-trip')} className="btn btn--primary">Discover {selectedPlace} →</button>
                    <button onClick={() => navigate('/plan-trip')} className="btn btn--ghost">Ask about {selectedPlace}</button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ===================== 07 — How It Works ===================== */}
        <section className="section section--deep" id="how" aria-labelledby="how-title">
          <div className="container">
            <div className="section-head section-head--full reveal">
              <p className="eyebrow">07 — How It Works</p>
              <h2 className="section-title" id="how-title">From an idea to<br />somewhere unforgettable.</h2>
            </div>

            <ol className="steps reveal" role="list">
              <li className="step">
                <p className="step__num">01</p>
                <div className="step__rule" aria-hidden="true"></div>
                <h3 className="step__title">Start with a conversation</h3>
                <p className="step__cue">Tell us what's on your mind.</p>
                <p className="step__text">A destination, an occasion, something you've always wanted to experience — or simply a question.</p>
              </li>
              <li className="step">
                <p className="step__num">02</p>
                <div className="step__rule" aria-hidden="true"></div>
                <h3 className="step__title">Discover what feels right</h3>
                <p className="step__cue">Explore at your own pace.</p>
                <p className="step__text">Learn about the destination and discover curated journeys that reflect the way you'd like to travel.</p>
              </li>
              <li className="step">
                <p className="step__num">03</p>
                <div className="step__rule" aria-hidden="true"></div>
                <h3 className="step__title">Meet the person behind your journey</h3>
                <p className="step__cue">Human expertise, when you're ready.</p>
                <p className="step__text">Connect with a Travel AI Agent who can understand what matters to you and answer practical questions.</p>
              </li>
              <li className="step">
                <p className="step__num">04</p>
                <div className="step__rule" aria-hidden="true"></div>
                <h3 className="step__title">Leave the rest to us</h3>
                <p className="step__cue">Simply look forward to going.</p>
                <p className="step__text">Once you've found the right journey, your Travel AI Agent helps take care of all details from there.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* ===================== 08 — Testimonials ===================== */}
        <section className="section section--surface" aria-labelledby="testimonials-title">
          <div className="container">
            <div className="testimonials-grid reveal">
              <div className="testimonial-grid">
                <figure className="person-card">
                  <img className="person-card__img" src={portraitJamesImg} alt="James R." loading="lazy" />
                  <figcaption className="person-card__caption">
                    <p className="person-card__name">James R.</p>
                    <p className="person-card__place">Auckland, New Zealand</p>
                  </figcaption>
                </figure>
                <figure className="person-card">
                  <img className="person-card__img" src={portraitSofiaImg} alt="Sofia M." loading="lazy" />
                  <figcaption className="person-card__caption">
                    <p className="person-card__name">Sofia M.</p>
                    <p className="person-card__place">Wellington, New Zealand</p>
                  </figcaption>
                </figure>
                <figure className="person-card">
                  <img className="person-card__img" src={portraitDanielImg} alt="Daniel K." loading="lazy" />
                  <figcaption className="person-card__caption">
                    <p className="person-card__name">Daniel K.</p>
                    <p className="person-card__place">Christchurch, New Zealand</p>
                  </figcaption>
                </figure>
                <figure className="person-card">
                  <img className="person-card__img" src={portraitRachelImg} alt="Rachel T." loading="lazy" />
                  <figcaption className="person-card__caption">
                    <p className="person-card__name">Rachel T.</p>
                    <p className="person-card__place">Queenstown, New Zealand</p>
                  </figcaption>
                </figure>
              </div>

              <div className="testimonials-copy">
                <div className="section-head">
                  <p className="eyebrow">08 — Testimonials</p>
                  <h2 className="section-title" id="testimonials-title">Words from the people who've travelled.</h2>
                </div>
                <div className="notes mt-6">
                  <div className="note">
                    <p className="note__plus">+</p>
                    <h3 className="note__title">Real journeys, real people.</h3>
                    <p className="note__text">Every review comes from a traveller who experienced a journey we helped create — no templates, no guesswork.</p>
                  </div>
                  <div className="note">
                    <p className="note__plus">+</p>
                    <p className="note__text note__text--strong">We measure our success by how you feel when you return home — and whether you can't wait to go back.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== CTA ===================== */}
        <section className="cta" aria-labelledby="cta-title">
          <img className="cta__bg" src={ctaBg} alt="Destination scenic view" loading="lazy" />
          <div className="cta__overlay" aria-hidden="true"></div>
          <div className="reveal">
            <p className="cta__kicker">Perhaps it's time</p>
            <h2 className="cta__title" id="cta-title">to go somewhere extraordinary.</h2>
            <p className="cta__sub">Dubai and Japan are waiting.</p>
            <button onClick={() => navigate('/plan-trip')} className="btn btn--glass btn--pill btn--lg cta__btn">
              Discover
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}