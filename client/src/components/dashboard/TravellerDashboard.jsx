import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';
import PopularDestinationsCarousel from '../common/PopularDestinationsCarousel';
import '../home/HomePage.css';
import { getMyAttractions, getPopularDestinations, getRecentSearches } from '../../services/recentSearchService';
import { chatWithAI } from '../../services/tripService';
import AnimatedTripPlannerInput from '../trips/AnimatedTripPlannerInput';
import travelAILogo from '../../assets/travelai-logo.png';
import PlanTripWithTravelAI from '../trips/PlanTripWithTravelAI';

function formatSearchDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Client-side fallback: strips travel-intent phrases from a raw user query
 * and returns only the destination/place portion in Title Case.
 * Used only for legacy rows that predate server-side extraction.
 */
function cleanQueryLabel(query) {
  if (!query) return '';
  let s = query.trim();

  const prefixes = [
    /^(i\s+)?(want|wanna|would like|like)\s+(to\s+)?(go|travel|visit|explore|plan|take a trip|fly|head)\s+(to\s+)?/i,
    /^(plan\s+)?(me\s+)?a\s+(trip|travel|holiday|vacation|journey)(\s+to)?\s*/i,
    /^(let'?s\s+)?(go|travel|visit|explore)\s+(to\s+)?/i,
    /^(take me to|show me|book me a trip to|book a trip to|how about)\s+/i,
    /^(i am|i'm|we are|we're)\s+(going|travelling|traveling|flying)\s+to\s+/i,
  ];
  for (const re of prefixes) s = s.replace(re, '');

  // Keep only the part before the first comma, period, digit qualifier, etc.
  const stop = s.match(/^([^,\.!?\d]+?)(?:\s*[,\.!?]|\s+\d|$)/i);
  if (stop) s = stop[1];

  return s.trim().replace(/\b\w/g, c => c.toUpperCase()) || query;
}

export default function TravellerDashboard() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const chatMessagesRef = useRef(null);
  const popularDeckRef = useRef(null);
  const plannerRef = useRef(null);
  const hasMountedMessagesRef = useRef(false);

  const DEFAULT_POPULAR_DESTINATIONS = [
    { name: 'Burj Khalifa', subtitle: 'Skyline views · Downtown Dubai', searchCount: 0, isFeatured: true },
    { name: 'Dubai Mall', subtitle: 'Shopping, dining & entertainment', searchCount: 0, isFeatured: true },
    { name: 'Palm Jumeirah', subtitle: 'Beaches, resorts & sea views', searchCount: 0, isFeatured: true },
    { name: 'Dubai Frame', subtitle: 'Old and new Dubai panoramas', searchCount: 0, isFeatured: true },
  ];

  const [recentSearches, setRecentSearches] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [myAttractions, setMyAttractions] = useState([]);
  const [plannerQuery, setPlannerQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am TravelAI, your interactive travel consultant buddy. 🌍 Where are we dreaming of going for your next adventure? Tell me your destination, travel dates, number of travellers, and budget -- or we can figure it out together!',
    },
  ]);

  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  const [preferences, setPreferences] = useState({
    destination: '',
    originCity: '',
    days: 0,
    travelers: 0,
    budgetLevel: '',
    budgetAmount: 0,
    flightBudget: 0,
    hotelBudgetPerNight: 0,
    departDate: '',
    returnDate: '',
    location_types: [],
  });

  const refreshRecentSearches = async () => {
    if (!accessToken) return;
    try {
      const [recentData, attractionsData] = await Promise.all([
        getRecentSearches(accessToken),
        getMyAttractions(accessToken),
      ]);
      setRecentSearches(recentData.recentSearches || []);
      setMyAttractions(attractionsData.popularDestinations || []);
    } catch (err) {
      console.error('[TravellerDashboard] Failed to refresh recent searches:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      if (!accessToken) {
        setRecentSearches([]);
        setPopularDestinations([]);
        return;
      }

      try {
        const [recentData, popularData, attractionsData] = await Promise.all([
          getRecentSearches(accessToken),
          getPopularDestinations(accessToken),
          getMyAttractions(accessToken),
        ]);

        if (!cancelled) {
          setRecentSearches(recentData.recentSearches || []);
          setPopularDestinations(
            popularData.popularDestinations?.length > 0
              ? popularData.popularDestinations
              : DEFAULT_POPULAR_DESTINATIONS
          );
          setMyAttractions(attractionsData.popularDestinations || DEFAULT_POPULAR_DESTINATIONS);
        }
      } catch (err) {
        console.error('[TravellerDashboard] Failed to load recent searches:', err);
        if (!cancelled) {
          setPopularDestinations(DEFAULT_POPULAR_DESTINATIONS);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!hasMountedMessagesRef.current) {
      hasMountedMessagesRef.current = true;
      return;
    }

    const chatBox = chatMessagesRef.current;
    if (!chatBox) return;

    chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages]);

  function parseBoldText(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} style={{ color: '#111827', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  }

  function renderFormattedMessage(content) {
    if (!content) return null;

    const cleaned = content
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\(https?:[^)]+\)/g, '$1');

    return cleaned.split('\n').map((line, lineIdx) => {
      const t = line.trim();

      if (!t) return <div key={lineIdx} style={{ height: '0.4rem' }} />;

      if (t === '---') {
        return (
          <hr
            key={lineIdx}
            style={{
              border: 'none',
              borderTop: '1px solid rgba(15,23,42,0.1)',
              margin: '0.75rem 0',
            }}
          />
        );
      }

      if (t.startsWith('###')) {
        return (
          <h3
            key={lineIdx}
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#4f46e5',
              margin: '0.75rem 0 0.4rem',
            }}
          >
            {parseBoldText(t.replace(/^###\s*/, ''))}
          </h3>
        );
      }

      if (t.startsWith('##')) {
        return (
          <h4
            key={lineIdx}
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#6366f1',
              margin: '0.9rem 0 0.5rem',
            }}
          >
            {parseBoldText(t.replace(/^##\s*/, ''))}
          </h4>
        );
      }

      if (t.startsWith('#')) {
        return (
          <h2
            key={lineIdx}
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#1f2937',
              margin: '1.1rem 0 0.6rem',
            }}
          >
            {parseBoldText(t.replace(/^#\s*/, ''))}
          </h2>
        );
      }

      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div
            key={lineIdx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginLeft: '0.5rem',
              marginBottom: '0.3rem',
            }}
          >
            <span style={{ color: '#6366f1', fontSize: '0.8rem', marginTop: 4 }}>
              •
            </span>
            <span style={{ flex: 1, color: '#374151' }}>
              {parseBoldText(t.substring(2))}
            </span>
          </div>
        );
      }

      return (
        <p
          key={lineIdx}
          style={{ margin: '0 0 0.5rem', lineHeight: 1.6, color: '#374151' }}
        >
          {parseBoldText(line)}
        </p>
      );
    });
  }

  async function handleSend(prompt) {
    const userMsg = String((typeof prompt === 'string' ? prompt : userInput) || '').trim();
    if (!userMsg || isSending) return;

    setUserInput('');
    setIsSending(true);
    setChatError(null);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    try {
      const data = await chatWithAI(accessToken, { messages: newMessages });
      const assistantText =
        data?.message || 'Sorry, I did not get a reply. Please try again.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);

      if (data?.extractedPreferences) {
        setPreferences((prev) => ({ ...prev, ...data.extractedPreferences }));
      }

      if (data?.recentSearch) {
        setRecentSearches((prev) => [data.recentSearch, ...prev].slice(0, 5));
        getPopularDestinations(accessToken)
          .then((popularData) => setPopularDestinations(popularData.popularDestinations || []))
          .catch((loadErr) => console.error('[TravellerDashboard] Failed to refresh popular destinations:', loadErr));
      }
    } catch (err) {
      setChatError(err.message || 'Something went wrong while chatting with TravelAI.');
    } finally {
      setIsSending(false);
    }
  }

  function handleRecentSearchClick(search) {
    const query = search?.query;
    const cleanQuery = String(query || '').trim();

    if (!cleanQuery) return;

    sessionStorage.setItem('pending_trip_description', cleanQuery);
    if (search?.analysis) {
      sessionStorage.setItem('recent_search_analysis', JSON.stringify(search.analysis));
    }
    navigate('/plan-trip');
  }

  function getDestinationImage(destination) {
    const name = String(destination?.name || '').toLowerCase();

    // --- Specific AI highlight / landmark mappings ---
    if (name.includes('burj khalifa')) return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85';
    if (name.includes('dubai mall')) return 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=85';
    if (name.includes('palm jumeirah')) return 'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=900&q=85';
    if (name.includes('dubai frame')) return 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=900&q=85';
    if (name.includes('eiffel tower')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85';
    if (name.includes('louvre')) return 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?auto=format&fit=crop&w=900&q=85';
    if (name.includes('montmartre')) return 'https://images.unsplash.com/photo-1551634979-2b11f8c946fe?auto=format&fit=crop&w=900&q=85';
    if (name.includes('colosseum') || name.includes('coliseum')) return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=85';
    if (name.includes('vatican')) return 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=900&q=85';
    if (name.includes('trevi fountain')) return 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&w=900&q=85';
    if (name.includes('sagrada familia')) return 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=85';
    if (name.includes('park güell') || name.includes('park guell')) return 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=85';
    if (name.includes('la rambla') || name.includes('las ramblas')) return 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=900&q=85';
    if (name.includes('sky tower')) return 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=900&q=85';
    if (name.includes('waiheke')) return 'https://images.unsplash.com/photo-1508278236937-a1d2a0441dea?auto=format&fit=crop&w=900&q=85';
    if (name.includes('harbour bridge') || name.includes('harbor bridge')) return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=85';
    if (name.includes('opera house')) return 'https://images.unsplash.com/photo-1523428096881-5bd79d043006?auto=format&fit=crop&w=900&q=85';
    if (name.includes('bondi beach')) return 'https://images.unsplash.com/photo-1500948304999-5df8d29f4bc0?auto=format&fit=crop&w=900&q=85';
    if (name.includes('senso-ji') || name.includes('sensoji') || name.includes('senso ji')) return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=85';
    if (name.includes('shibuya')) return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=85';
    if (name.includes('meiji')) return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=85';
    if (name.includes('milford sound')) return 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=900&q=85';
    if (name.includes('shotover') || name.includes('skyline gondola')) return 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=900&q=85';
    if (name.includes('te puia') || name.includes('geothermal') || name.includes('rotorua') || name.includes('redwood')) return 'https://images.unsplash.com/photo-1561481654-39b1df7af6d1?auto=format&fit=crop&w=900&q=85';
    if (name.includes('times square')) return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=85';
    if (name.includes('central park')) return 'https://images.unsplash.com/photo-1444084316824-dc26d6657664?auto=format&fit=crop&w=900&q=85';
    if (name.includes('statue of liberty')) return 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&w=900&q=85';
    if (name.includes('gardens by the bay') || name.includes('marina bay')) return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85';
    if (name.includes('hagia sophia') || name.includes('grand bazaar')) return 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=85';
    if (name.includes('lake ashi') || name.includes('mt. fuji') || name.includes('mount fuji') || name.includes('hot spring')) return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=85';
    if (name.includes('ubud') || name.includes('tanah lot') || name.includes('bali')) return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85';

    // --- City / country level fallbacks ---
    if (name.includes('maldives') || name.includes('maldive')) return 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=85';
    if (name.includes('paris')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85';
    if (name.includes('london')) return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=85';
    if (name.includes('tokyo')) return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=85';
    if (name.includes('new york') || name.includes('nyc')) return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=85';
    if (name.includes('sydney')) return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=85';
    if (name.includes('singapore')) return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85';
    if (name.includes('bangkok')) return 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?auto=format&fit=crop&w=900&q=85';
    if (name.includes('istanbul')) return 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=85';
    if (name.includes('rome')) return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=85';
    if (name.includes('barcelona')) return 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=85';
    if (name.includes('amsterdam')) return 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=85';
    if (name.includes('prague')) return 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=900&q=85';
    if (name.includes('auckland')) return 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=900&q=85';
    if (name.includes('queenstown')) return 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=900&q=85';

    // Generic fallback — search Unsplash by the exact attraction name
    const encoded = encodeURIComponent(destination?.name || 'travel attraction');
    return `https://source.unsplash.com/900x600/?${encoded},travel,landmark`;
  }


  function scrollPopularDeck() {
    popularDeckRef.current?.scrollBy({ left: 360, behavior: 'smooth' });
  }

  function handleAttractionClick(destination) {
    // Write the attraction name to sessionStorage (same key used by HomePage / PackageDetail)
    // then navigate to /plan-trip where PlanTripWithTravelAI will pick it up on mount.
    sessionStorage.setItem('pending_trip_description', `I'd like to plan a trip to ${destination.name}.`);
    navigate('/plan-trip');
  }

  return (
    <div className="home-page-container">
      <Navbar />

      <header className="traveller-home-section">
        <div className="traveller-home-grid">
          <div ref={plannerRef} className="traveller-home-card traveller-home-hero-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <PlanTripWithTravelAI isDashboardMode={true} onNewSearchSaved={refreshRecentSearches} prefillQuery={plannerQuery} />
          </div>

          <aside className="traveller-home-card traveller-recent-card">
            <div className="traveller-recent-header">
              <div>
                <span className="traveller-recent-kicker">AI History</span>
                <h2>Recent Searches</h2>
              </div>

              <span className="traveller-recent-count">{recentSearches.length}/5</span>
            </div>

            {recentSearches.length === 0 ? (
              <div className="traveller-recent-empty">
                <p>No recent searches yet.</p>
                <span>Your AI trip searches will appear here.</span>
              </div>
            ) : (
              <div className="traveller-recent-list">
                {recentSearches.map((item, index) => (
                  <button
                    key={item.id || index}
                    type="button"
                    className="traveller-recent-item"
                    onClick={() => handleRecentSearchClick(item)}
                  >
                    <span className="traveller-recent-number">{index + 1}</span>

                    <span className="traveller-recent-text">
                      <strong>{item.destination || cleanQueryLabel(item.query)}</strong>
                      <small>
                        {item.durationDays ? `${item.durationDays} days · ` : ''}
                        {formatSearchDate(item.completedAt || item.createdAt)}
                      </small>
                    </span>

                    <span className="traveller-recent-arrow">→</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      </header>

      <section className="home-dest-section" id="explore">
        <div className="home-dest-header">
          <h2 className="home-section-title">
            {myAttractions.some(a => !a.isFeatured) ? 'Your Trip Attractions' : 'Popular Destinations'}
          </h2>
          <button type="button" className="home-view-all traveller-deck-next" onClick={scrollPopularDeck}>
            Explore more <span>→</span>
          </button>
        </div>

        <PopularDestinationsCarousel
          popularDestinations={myAttractions}
          loading={false}
          scrollRef={popularDeckRef}
          onScrollLeft={() => scrollPopularDeck(-1)}
          onScrollRight={() => scrollPopularDeck(1)}
          onDestinationClick={handleAttractionClick}
          getDestinationImage={getDestinationImage}
        />
      </section>
    </div>
  );
}
