import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';
import PopularDestinationsCarousel from '../common/PopularDestinationsCarousel';
import '../home/HomePage.css';
import './TravellerDashboard.css';
import { getMyAttractions, getRecentSearches } from '../../services/recentSearchService';
import PlanTripWithTravelAI from '../trips/PlanTripWithTravelAI';
import TidioWidget from '../common/TidioWidget';

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

  const popularDeckRef = useRef(null);
  const plannerRef = useRef(null);

  const DEFAULT_POPULAR_DESTINATIONS = [
    { name: 'Burj Khalifa', subtitle: 'Skyline views · Downtown Dubai', searchCount: 0, isFeatured: true },
    { name: 'Dubai Mall', subtitle: 'Shopping, dining & entertainment', searchCount: 0, isFeatured: true },
    { name: 'Palm Jumeirah', subtitle: 'Beaches, resorts & sea views', searchCount: 0, isFeatured: true },
    { name: 'Dubai Frame', subtitle: 'Old and new Dubai panoramas', searchCount: 0, isFeatured: true },
  ];

  function withPopularFallback(destinations) {
    return Array.isArray(destinations) && destinations.length > 0
      ? destinations
      : DEFAULT_POPULAR_DESTINATIONS;
  }

  const [recentSearches, setRecentSearches] = useState([]);
  const [myAttractions, setMyAttractions] = useState([]);
  const [plannerQuery, setPlannerQuery] = useState('');
  const [todos, setTodos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('travelai_dashboard_todos') || 'null') || [
        { id: 'profile', label: 'Complete your travel profile', done: false },
        { id: 'first-plan', label: 'Create your first AI itinerary', done: false },
        { id: 'save-trip', label: 'Save a trip for later', done: false },
      ];
    } catch {
      return [];
    }
  });
  const [newTodo, setNewTodo] = useState('');

  const refreshRecentSearches = async () => {
    if (!accessToken) return;
    try {
      const [recentData, attractionsData] = await Promise.all([
        getRecentSearches(accessToken),
        getMyAttractions(accessToken),
      ]);
      setRecentSearches(recentData.recentSearches || []);
      setMyAttractions(withPopularFallback(attractionsData.popularDestinations));
    } catch (err) {
      console.error('[TravellerDashboard] Failed to refresh recent searches:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      if (!accessToken) {
        setRecentSearches([]);
        return;
      }

      try {
        const [recentData, attractionsData] = await Promise.all([
          getRecentSearches(accessToken),
          getMyAttractions(accessToken),
        ]);

        if (!cancelled) {
          setRecentSearches(recentData.recentSearches || []);
          setMyAttractions(withPopularFallback(attractionsData.popularDestinations));
        }
      } catch (err) {
        console.error('[TravellerDashboard] Failed to load recent searches:', err);
        if (!cancelled) {
          setMyAttractions(DEFAULT_POPULAR_DESTINATIONS);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    localStorage.setItem('travelai_dashboard_todos', JSON.stringify(todos));
  }, [todos]);

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

  function addTodo(event) {
    event.preventDefault();
    const label = newTodo.trim();
    if (!label) return;
    setTodos((current) => [...current, { id: crypto.randomUUID(), label, done: false }]);
    setNewTodo('');
  }

  return (
    <div className="home-page-container">
      <Navbar />
      <TidioWidget user={user} />

      <header className="traveller-home-section">
        <div className="traveller-dashboard-heading">
          <div>
            <span className="traveller-dashboard-kicker">YOUR TRAVEL SPACE</span>
            <h1>Plan something unforgettable{user?.first_name ? `, ${user.first_name}` : ''}.</h1>
            <p>Tell TravelAI where you want to go and we will help you take it from idea to itinerary.</p>
          </div>
          <span className="traveller-free-chat">1-2 chats free</span>
        </div>
        <div className="traveller-quick-prompts" aria-label="Quick travel prompts">
          {['Explore Dubai Marina', 'Explore Burj Khalifa', 'Explore Palm Jumeirah', 'Explore Dubai Mall', 'Explore Desert Safari'].map((prompt) => (
            <button key={prompt} type="button" onClick={() => setPlannerQuery(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <div className="traveller-lyro-card">
          <div>
            <span className="traveller-lyro-badge">Travel AI AGENT</span>
            <h2>Need help planning?</h2>
            <p>Ask our AI travel agent about destinations, dates, budgets, and trip ideas.</p>
          </div>
          <button
            type="button"
            onClick={() => window.tidioChatApi?.open?.() || window.tidioChatApi?.show?.()}
          >
            Chat with Agent
          </button>
        </div>
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

      <section className="traveller-todo-section" aria-labelledby="todo-title">
        <div className="traveller-todo-header">
          <div>
            <span className="traveller-dashboard-kicker">YOUR CHECKLIST</span>
            <h2 id="todo-title">Travel to-dos</h2>
          </div>
          <span>{todos.filter((todo) => todo.done).length}/{todos.length} complete</span>
        </div>
        <div className="traveller-todo-list">
          {todos.map((todo) => (
            <label key={todo.id} className={`traveller-todo-item${todo.done ? ' is-done' : ''}`}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => setTodos((current) => current.map((item) => (
                  item.id === todo.id ? { ...item, done: !item.done } : item
                )))}
              />
              <span>{todo.label}</span>
            </label>
          ))}
        </div>
        <form className="traveller-todo-form" onSubmit={addTodo}>
          <input
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Add a travel task..."
            aria-label="Add a travel task"
          />
          <button type="submit">Add todo</button>
        </form>
      </section>

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
