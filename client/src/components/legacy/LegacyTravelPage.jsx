import { createElement, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_BY_PATH = {
  '/': 'index.html',
  '/about-us': 'about-us.html',
  '/ai-planner': 'ai-planner.html',
  '/ai-planner-result': 'ai-planner-result.html',
  '/journeys': 'journeys.html',
  '/journey-details': 'journey-details.html',
  '/blog-listing': 'blog-listing.html',
  '/blog-details': 'blog-details.html',
  '/contact': 'contact.html',
  '/privacy-policy': 'privacy-policy.html',
  '/terms-of-use': 'terms-of-use.html',
  '/my-trips.html': 'my-trips.html',
  '/profile.html': 'profile.html',
  '/reset-password.html': 'reset-password.html',
  '/404': '404.html',
};

const PLANNER_CHIPS = {
  dubai: ['Explore Dubai Marina', 'Explore Burj Khalifa', 'Explore Palm Jumeirah', 'Explore Dubai Mall', 'Explore Desert Safari'],
  japan: ['Explore Tokyo Shibuya', 'Explore Mount Fuji', 'Explore Kyoto Temples', 'Explore Osaka Dotonbori', 'Explore Nara Deer Park'],
};

const PLANNER_PROMPTS = {
  dubai: 'Five relaxed days in Dubai in November — good food, one desert night, no early starts.',
  japan: 'Seven days across Tokyo and Kyoto in spring — culinary focus, historic temples, scenic trains, no rush.',
};

const PLANNER_ITINERARIES = {
  dubai: {
    title: 'Five days in Dubai',
    meta: '3 days · Dubai · <span class="result-status--draft">Draft</span> · not booked',
    days: [
      [['Morning', 'Old Dubai and the creek', 'Cross by abra, then walk the spice and gold lanes while it is still cool.', 'dubai-creek-morning.webp'],
       ['Afternoon', 'Al Fahidi and lunch', 'Wind-tower houses, a slow Emirati lunch and an hour out of the sun.', 'dubai-fahidi-afternoon.webp'],
       ['Evening', 'Dubai Creek Harbour', 'See the skyline from the quieter side of the water, with dinner along the promenade.', 'dubai-harbour-evening.webp']],
      [['Morning', 'Dubai Marina Promenade', 'Waterfront breakfast along the canal, yacht watching, and morning sea breeze.', 'dubai-marina-morning.webp'],
       ['Afternoon', 'Arabian Desert Safari', 'Dune driving, falconry and sunset over the golden sands.', 'dubai-desert-afternoon.webp'],
       ['Evening', 'Downtown and Fountain Lake', 'Burj Khalifa lights, fountain choreography, and dinner by the promenade.', 'dubai-mall-evening.webp']],
    ],
  },
  japan: {
    title: 'Seven days in Tokyo & Kyoto',
    meta: '3 days · Japan · <span class="result-status--draft">Draft</span> · not booked',
    days: [
      [['Morning', 'Asakusa and Senso-ji Temple', 'Early morning incense at Tokyo’s oldest temple, before the stalls fill with crowds.', 'trip-tokyo-tech.webp'],
       ['Afternoon', 'Shibuya Crossing and Omotesando', 'A city walk through tree-lined streets, coffee and skyline views.', 'explore-japan.webp'],
       ['Evening', 'Shinjuku Omoide Yokocho', 'Lantern-lit alleyways, yakitori and quiet craft cocktails.', 'about-japan.webp']],
      [['Morning', 'Shinkansen to Kyoto', 'Travel past Mount Fuji and arrive in Kyoto for a peaceful canal walk.', 'contact-kyoto.webp'],
       ['Afternoon', 'Fushimi Inari Mountain Path', 'Walk through vermilion torii gates and forest trails.', 'journey-japan.webp'],
       ['Evening', 'Gion at dusk', 'A slow evening through historic lanes and intimate local dining.', 'map-kyoto.webp']],
    ],
  },
};

const ROUTE_BY_FILE = Object.fromEntries(
  Object.entries(PAGE_BY_PATH).map(([path, file]) => [file, path]),
);

const LEGACY_STYLESHEETS = [
  'fonts.css', 'tokens.css', 'reset.css', 'base.css', 'layout.css',
  'components.css', 'auth.css', 'chat.css', 'home.css', 'about.css',
  'ai-planner.css', 'ai-planner-result.css', 'blog.css', 'blog-detail.css',
  'contact.css', 'detail.css', 'error.css', 'journeys.css', 'my-trips.css',
  'profile.css', 'reset-password.css', 'terms.css', 'motion.css', 'responsive.css',
];

const headerMarkup = `
  <div class="container site-header__inner">
    <a class="brand" href="/" aria-label="Travel AI home">
      <img class="brand__logo-svg" src="/travel-ai/assets/icons/brand-logo.svg" alt="Travel AI" width="109" height="34" />
    </a>
    <nav class="nav" id="primary-nav" aria-label="Primary">
      <a class="nav__link" href="/about-us">About Us</a>
      <a class="nav__link" href="/journeys">Packages</a>
      <a class="nav__link" href="/ai-planner">AI Planner</a>
      <a class="nav__link" href="/my-trips.html">My Trips</a>
      <a class="nav__link" href="/blog-listing">Blog</a>
    </nav>
    <div class="nav-actions">
      <a class="nav-link-signin" href="/login">Sign In</a>
      <a class="btn btn--pill btn--accent nav-cta-btn" href="/signup">Get Started</a>
    </div>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">
      <span class="nav-toggle__box" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
  </div>`;

const footerMarkup = `
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand" href="/"><img class="brand__logo-svg" src="/travel-ai/assets/icons/brand-logo.svg" alt="Travel AI" width="109" height="34" /></a>
        <p class="footer-brand__tag">Travel should feel personal.</p>
      </div>
      <div class="footer-cols">
        <nav class="footer-col" aria-label="Explore"><h2 class="footer-col__head">Explore</h2><a class="footer-link" href="/journeys">Dubai</a><a class="footer-link" href="/journeys">Japan</a></nav>
        <nav class="footer-col" aria-label="Journeys"><h2 class="footer-col__head">Journeys</h2><a class="footer-link" href="/journeys">Dubai Journeys</a><a class="footer-link" href="/journeys">Japan Journeys</a></nav>
        <nav class="footer-col" aria-label="Travel AI"><h2 class="footer-col__head">Travel AI</h2><a class="footer-link" href="/about-us">Our Story</a><a class="footer-link" href="/#how">How It Works</a></nav>
        <nav class="footer-col" aria-label="Help"><h2 class="footer-col__head">Help</h2><a class="footer-link" href="/contact">Contact</a><a class="footer-link" href="/404">FAQs</a></nav>
      </div>
    </div>
    <div class="footer-bottom"><p class="footer-copy">© 2026 Travel AI. All rights reserved.</p><div class="footer-legal"><a href="/terms-of-use">Terms</a><a href="/privacy-policy">Privacy</a></div></div>
  </div>`;

function normalizeMarkup(html) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script, link[rel="stylesheet"], link[rel="preload"], meta, title').forEach((node) => node.remove());

  document.querySelectorAll('[src], [href]').forEach((node) => {
    for (const attribute of ['src', 'href']) {
      const value = node.getAttribute(attribute);
      if (!value || value.startsWith('#') || value.startsWith('http') || value.startsWith('mailto:')) continue;
      if (value.startsWith('assets/')) node.setAttribute(attribute, `/travel-ai/${value}`);
      else if (value.includes('.html')) {
        const [file, hash = ''] = value.split('#');
        const route = ROUTE_BY_FILE[file] || '/404';
        node.setAttribute(attribute, `${route}${hash ? `#${hash}` : ''}`);
      }
    }
  });

  const header = document.querySelector('#site-header');
  if (header) header.innerHTML = headerMarkup;
  const footer = document.querySelector('#site-footer');
  if (footer) footer.innerHTML = footerMarkup;
  return document.body.innerHTML;
}

const ATTRIBUTE_NAMES = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  autofocus: 'autoFocus',
  autocomplete: 'autoComplete',
  crossorigin: 'crossOrigin',
  fetchpriority: 'fetchPriority',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-width': 'strokeWidth',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
};

function toReactAttributes(element) {
  return Array.from(element.attributes).reduce((attributes, attribute) => {
    const name = ATTRIBUTE_NAMES[attribute.name] || attribute.name;
    if (name === 'style') {
      attributes.style = attribute.value.split(';').reduce((styles, declaration) => {
        const [property, value] = declaration.split(':');
        if (property && value) {
          const reactProperty = property.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          styles[reactProperty] = value.trim();
        }
        return styles;
      }, {});
    } else if (attribute.name.startsWith('aria-') || attribute.name.startsWith('data-')) {
      attributes[attribute.name] = attribute.value;
    } else {
      attributes[name] = attribute.value;
    }
    return attributes;
  }, {});
}

function domNodeToReact(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const children = Array.from(node.childNodes)
    .map((child, index) => domNodeToReact(child, index))
    .filter(Boolean);

  return createElement(
    node.tagName.toLowerCase(),
    { ...toReactAttributes(node), key },
    ...children,
  );
}

function markupToReact(markup) {
  const document = new DOMParser().parseFromString(markup, 'text/html');
  return Array.from(document.body.childNodes)
    .map((node, index) => domNodeToReact(node, index))
    .filter(Boolean);
}

function TidioLauncher() {
  const openChat = () => {
    if (window.tidioChatApi?.open) {
      window.tidioChatApi.open();
    } else if (window.tidioChatApi?.show) {
      window.tidioChatApi.show();
    }
  };

  return (
    // <button
    //   type="button"
    //   aria-label="Open TravelAI chat"
    //   onClick={openChat}
    //   style={{
    //     position: 'fixed',
    //     right: 24,
    //     bottom: 24,
    //     zIndex: 1000000000,
    //     width: 58,
    //     height: 58,
    //     border: 0,
    //     borderRadius: '50%',
    //     color: '#fff',
    //     background: '#3028dc',
    //     boxShadow: '0 10px 28px rgba(48, 40, 220, 0.35)',
    //     cursor: 'pointer',
    //     fontSize: 25,
    //   }}
    // >
    //   <span aria-hidden="true">💬</span>
    // </button>
    <></>
  );
}

export default function LegacyTravelPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState({ file: null, markup: '' });
  const [error, setError] = useState(null);
  const file = PAGE_BY_PATH[pathname] || '404.html';

  useEffect(() => {
    if (pathname !== '/') return undefined;

    const scriptId = 'travel-ai-tidio-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      const tidioKey = import.meta.env.VITE_TIDIO_PUBLIC_KEY || 'pb9eycxl7gcdmijgtp0smwuiswvi5bj1';
      script.src = `https://code.tidio.co/${tidioKey}.js`;
      script.async = true;
      document.body.appendChild(script);
    }

    return undefined;
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const stylesheetLinks = LEGACY_STYLESHEETS.map((name) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/travel-ai/css/${name}`;
      link.dataset.legacyTravelStyle = 'true';
      document.head.appendChild(link);
      return link;
    });

    fetch(`/travel-ai/${file}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${file}`);
        return response.text();
      })
      .then((html) => {
        if (active) {
          const sourceDocument = new DOMParser().parseFromString(html, 'text/html');
          document.title = sourceDocument.title || 'Travel AI';
          setError(null);
          setPage({ file, markup: normalizeMarkup(html) });
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError);
      });
    return () => {
      active = false;
      stylesheetLinks.forEach((link) => link.remove());
    };
  }, [file]);

  const markup = page.file === file ? page.markup : '';

  useEffect(() => {
    if (!markup) return undefined;
    const root = document.querySelector('.legacy-travel-page');
    const toggle = root?.querySelector('.nav-toggle');
    document.documentElement.classList.add('js-ready');
    const animatedElements = root?.querySelectorAll('[data-motion]') || [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = reducedMotion
      ? null
      : new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    animatedElements.forEach((element) => {
      if (reducedMotion) element.classList.add('is-visible');
      else if (!element.closest('.hero, .about-hero')) observer.observe(element);
    });

    const entranceGroups = [
      ['.site-header', 0],
      ['[data-motion="hero-content"]', 120],
      ['[data-motion="hero-image"]', 150],
      ['[data-motion="hero-overlay"]', 180],
      ['[data-motion="about-hero-image"]', 100],
      ['[data-motion="about-hero-eyebrow"]', 220],
      ['[data-motion="about-hero-title"]', 300],
      ['[data-motion="about-hero-lede"]', 500],
      ['[data-motion="hero-title"]', 300],
      ['[data-motion="hero-text"]', 620],
      ['[data-motion="hero-cta"]', 850],
    ];
    const entranceTimers = entranceGroups.flatMap(([selector, delay]) => (
      Array.from(root?.querySelectorAll(selector) || []).map((element) => window.setTimeout(() => {
        element.classList.add('is-visible');
        element.querySelectorAll('.line-inner').forEach((line) => line.classList.add('is-visible'));
        element.querySelectorAll('p').forEach((paragraph) => paragraph.classList.add('is-visible'));
      }, reducedMotion ? 0 : delay))
    ));

    const setOpen = (open) => {
      root?.querySelector('.site-header')?.classList.toggle('nav-open', open);
      toggle?.setAttribute('aria-expanded', String(open));
    };
    toggle?.addEventListener('click', () => setOpen(!root.querySelector('.site-header')?.classList.contains('nav-open')));
    const plannerButtons = [...(root?.querySelectorAll('.planner__toggle-btn') || [])];
    const plannerInput = root?.querySelector('#planner-input');
    const plannerChips = root?.querySelector('#planner-chips');
    const setDestination = (destination) => {
      plannerButtons.forEach((button) => {
        const selected = button.dataset.dest === destination;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('is-active', selected);
      });
      if (plannerInput) plannerInput.value = PLANNER_PROMPTS[destination];
      if (plannerChips) {
        plannerChips.innerHTML = PLANNER_CHIPS[destination]
          .map((chip) => `<button type="button" class="planner__chip">${chip}</button>`)
          .join('');
      }
    };
    plannerButtons.forEach((button) => {
      button.addEventListener('click', () => setDestination(button.dataset.dest));
    });
    plannerChips?.addEventListener('click', (event) => {
      const chip = event.target.closest('.planner__chip');
      if (chip && plannerInput) plannerInput.value = chip.textContent;
    });
    const plannerForm = root?.querySelector('#planner-form');
    const submitPlanner = (event) => {
      event.preventDefault();
      if (!plannerInput?.value.trim()) {
        plannerInput?.focus();
        return;
      }
      const destination = plannerButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.dest || 'dubai';
      sessionStorage.setItem('travel-ai-planner', JSON.stringify({ destination, prompt: plannerInput.value.trim() }));
      navigate('/ai-planner-result');
    };
    plannerForm?.addEventListener('submit', submitPlanner);
    if (plannerButtons.length) setDestination(plannerButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.dest || 'dubai');

    const resultSection = root?.querySelector('#itinerary-result');
    const resultTabs = root?.querySelector('#result-tabs');
    const resultCards = root?.querySelector('#result-cards');
    if (resultSection && resultTabs && resultCards) {
      const savedPlanner = JSON.parse(sessionStorage.getItem('travel-ai-planner') || '{}');
      const destination = savedPlanner.destination === 'japan' ? 'japan' : 'dubai';
      const itinerary = PLANNER_ITINERARIES[destination];
      const resultTitle = root.querySelector('#result-title');
      const resultMeta = root.querySelector('#result-meta');
      if (resultTitle) resultTitle.textContent = itinerary.title;
      if (resultMeta) resultMeta.innerHTML = itinerary.meta;
      const renderDay = (dayIndex) => {
        const activities = itinerary.days[dayIndex] || [];
        resultCards.innerHTML = activities.map(([time, title, description, image]) => `
          <article class="result__card" data-motion="fade-up">
            <div class="result__card-media"><img class="result__card-img" src="/travel-ai/assets/images/${image}" alt="${title}" loading="lazy" /></div>
            <div class="result__card-content"><span class="result__card-time">${time}</span><h3 class="result__card-title">${title}</h3><p class="result__card-desc">${description}</p></div>
          </article>`).join('');
      };
      resultTabs.innerHTML = itinerary.days.map((_, index) => `
        <button class="result__tab" type="button" role="tab" aria-selected="${index === 0}" aria-pressed="${index === 0}" data-day="${index}">
          Day ${index + 1}
        </button>`).join('');
      resultTabs.querySelectorAll('.result__tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          resultTabs.querySelectorAll('.result__tab').forEach((item) => {
            item.setAttribute('aria-selected', 'false');
            item.setAttribute('aria-pressed', 'false');
          });
          tab.setAttribute('aria-selected', 'true');
          tab.setAttribute('aria-pressed', 'true');
          renderDay(Number(tab.dataset.day));
        });
      });
      renderDay(0);
    }

    const contactForm = root?.querySelector('.contact-form');
    const contactStatus = root?.querySelector('#form-status');
    const onContactSubmit = (event) => {
      event.preventDefault();
      if (!contactForm?.checkValidity()) {
        contactForm?.reportValidity();
        return;
      }
      if (contactStatus) {
        contactStatus.textContent = 'Message sent successfully! We will get back to you soon.';
        contactStatus.hidden = false;
      }
      contactForm.reset();
    };
    contactForm?.addEventListener('submit', onContactSubmit);

    const resetForm = root?.querySelector('#reset-password-form');
    const resetEmail = root?.querySelector('#reset-email');
    const resetError = root?.querySelector('#reset-email-error');
    const resetSuccess = root?.querySelector('#reset-success-state');
    const resetSentEmail = root?.querySelector('#reset-sent-email');
    const onResetSubmit = (event) => {
      event.preventDefault();
      const email = resetEmail?.value.trim() || '';
      const valid = /^\S+@\S+\.\S+$/.test(email);
      resetEmail?.classList.toggle('is-invalid', !valid);
      resetError?.classList.toggle('is-visible', !valid);
      if (resetError) resetError.textContent = valid ? '' : 'Please enter a valid email address.';
      if (!valid) {
        resetEmail?.focus();
        return;
      }
      if (resetSentEmail) resetSentEmail.textContent = email;
      if (resetSuccess) resetSuccess.classList.add('is-visible');
      if (resetForm) resetForm.style.display = 'none';
    };
    resetForm?.addEventListener('submit', onResetSubmit);
    const onClick = (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href?.startsWith('/') && !href.startsWith('//')) {
        event.preventDefault();
        navigate(href);
      }
    };
    root?.addEventListener('click', onClick);
    return () => {
      entranceTimers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      plannerForm?.removeEventListener('submit', submitPlanner);
      contactForm?.removeEventListener('submit', onContactSubmit);
      resetForm?.removeEventListener('submit', onResetSubmit);
      root?.removeEventListener('click', onClick);
      document.documentElement.classList.remove('js-ready');
    };
  }, [markup, navigate]);

  if (error) return <main className="legacy-error"><h1>Unable to load this page</h1><p>{error.message}</p></main>;
  if (!markup) return <div className="app-route-loader" aria-label="Loading page" />;
  return (
    <>
      <div className="legacy-travel-page">{markupToReact(markup)}</div>
      {pathname === '/' && <TidioLauncher />}
    </>
  );
}
