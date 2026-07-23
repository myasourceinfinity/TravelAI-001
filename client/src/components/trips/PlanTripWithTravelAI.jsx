import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatWithAI, saveTripToDB } from '../../services/tripService';
import FlightCard from './FlightCard';
import HotelCard  from './HotelCard';
import Navbar from '../common/Navbar';
import '../home/HomePage.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Detect the USER's confirmation reply (not the AI's wording) ───────────────
// This is the reliable trigger point — the user is the one saying "yes, book it",
// not the AI. Matching the AI's reply text was fragile since its phrasing varies.
const USER_CONFIRM_KEYWORDS = [
  'yes please', 'looks good', 'looks great', 'go ahead', 'proceed',
  'book it', 'confirm', 'sounds good', 'perfect, let', 'that works',
  'let\'s book', 'lets book', 'yes book', 'yes lets', 'yes let\'s',
  'prepare itinerary', 'yes please prepare', 'go for it', 'all good',
];

function isUserConfirmation(text = '') {
  const lower = text.toLowerCase().trim();
  return USER_CONFIRM_KEYWORDS.some(k => lower.includes(k));
}

// ── Extract a numeric budget from free-text budgetLevel (e.g. "$5000", "5000 NZD", "moderate") ──
function parseNumericBudget(budgetLevel = '') {
  const match = String(budgetLevel).match(/[\d,]+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Component type icons ──────────────────────────────────────────────────────
const COMPONENT_META = {
  flight:   { icon: '✈️', colour: '#38bdf8' },
  hotel:    { icon: '🏨', colour: '#a78bfa' },
  activity: { icon: '🎯', colour: '#34d399' },
  transfer: { icon: '🚌', colour: '#fb923c' },
};

function packageEmoji(pkg) {
  const name = (pkg.destination_name || '').toLowerCase();
  if (name.includes('auckland'))     return '🌆';
  if (name.includes('wellington'))   return '🌧️';
  if (name.includes('rotorua'))      return '🌋';
  if (name.includes('queenstown'))   return '🏔️';
  if (name.includes('christchurch')) return '🌿';
  if (name.includes('tauranga'))     return '🏖️';
  return '📍';
}

// ── Destination card (itinerary panel) ───────────────────────────────────────
function DestinationCard({ dest, onRemove, agentPkg, bookingData, selectedFlight, selectedHotel, onSelectFlight, onSelectHotel }) {
  const cheapestFlight = bookingData?.flights?.length
    ? Math.min(...bookingData.flights.map(f => f.price ?? Infinity))
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(10px)', marginBottom: '0.75rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img src={`https://picsum.photos/seed/${dest.id}/150/150`} alt={dest.name}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-500)' }} />
            <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '1rem', background: 'var(--bg-800)', borderRadius: '50%', padding: 2, lineHeight: 1 }}>
              {dest.emoji}
            </span>
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: '#f8fafc' }}>
              {dest.name} <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{dest.country}</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {dest.highlights?.slice(0, 2).join(' · ')}
            </p>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          onClick={() => onRemove(dest.id)}>✕</button>
      </div>

      {/* Agent package inclusions */}
      {agentPkg?.components?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {agentPkg.components.map((comp, i) => {
            const meta = COMPONENT_META[comp.component_type] || { icon: '📌', colour: '#94a3b8' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: `${meta.colour}0f`, border: `1px solid ${meta.colour}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{meta.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9' }}>{comp.title}</span>
                </div>
                <span style={{ fontSize: 11, color: meta.colour, fontWeight: 700 }}>
                  NZD ${parseFloat(comp.price_per_person ?? comp.pricePerPerson ?? 0).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bookme deals */}
      {!agentPkg && dest.bookmeDeals?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.75rem', color: '#38bdf8', margin: '0 0 6px 0', fontWeight: 600 }}>✨ Recommended on Bookme</h4>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, minWidth: 0, maxWidth: '100%' }}>
            {dest.bookmeDeals.map((deal, i) => (
              <a key={i} href={deal.link} target="_blank" rel="noreferrer"
                style={{ minWidth: 160, flexShrink: 0, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 7, display: 'block', textDecoration: 'none' }}>
                <div style={{ height: 70, borderRadius: 5, backgroundImage: `url(${deal.image})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 5 }} />
                <h5 style={{ fontSize: '0.7rem', fontWeight: 600, margin: '0 0 3px 0', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.title}</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>{deal.price}</span>
                  {deal.discount && <span style={{ fontSize: '0.6rem', background: '#f97316', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>{deal.discount}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── FLIGHTS (shown after itinerary confirmed) ── */}
      {bookingData?.flights?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.78rem', color: '#38bdf8', margin: '0 0 8px 0', fontWeight: 600 }}>
            ✈️ Flights to {dest.name}
            {selectedFlight && <span style={{ color: '#34d399', marginLeft: 8 }}>· Selected ✓</span>}
          </h4>
          {bookingData.flights.every(f => f.overBudget) && (
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginBottom: 6, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.4 }}>
              ⚠️ No flights to {dest.name} fit your stated budget for these dates — showing the cheapest available instead. Try increasing your budget, or ask the consultant to check nearby dates (fares often vary day to day).
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, minWidth: 0, maxWidth: '100%' }}>
            {bookingData.flights.map((flight, i) => (
              <FlightCard
                key={i}
                flight={flight}
                index={i}
                cheapestPrice={cheapestFlight}
                selected={selectedFlight === i}
                onSelect={() => onSelectFlight(dest.id, i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── No flights found (searched, but zero results — common on RapidAPI free tier) ── */}
      {bookingData && bookingData !== 'loading' && bookingData.noFlightsFound && (
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, padding: '8px 10px' }}>
          ✈️ No live flights found to {dest.name} for these dates — you can still add this leg manually or save the itinerary without flight pricing.
        </div>
      )}

      {/* ── HOTELS (shown after itinerary confirmed) ── */}
      {bookingData?.hotels?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.78rem', color: '#a78bfa', margin: '8px 0 8px 0', fontWeight: 600 }}>
            🏨 Hotels in {dest.name}
            {selectedHotel !== null && selectedHotel !== undefined && <span style={{ color: '#34d399', marginLeft: 8 }}>· Selected ✓</span>}
          </h4>
          {bookingData.hotels.every(h => h.overBudget) && (
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginBottom: 6 }}>
              ⚠️ No hotels found within budget for {dest.name} — showing the cheapest available options instead.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookingData.hotels.map((hotel, i) => (
              <HotelCard
                key={i}
                hotel={hotel}
                selected={selectedHotel === i}
                onSelect={() => onSelectHotel(dest.id, i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {bookingData === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#94a3b8', padding: '8px 0' }}>
          <span className="spinner" style={{ width: 14, height: 14 }} />
          Searching flights &amp; hotels for {dest.name}…
        </div>
      )}

      {/* Error / no results state */}
      {bookingData?.error && (
        <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '8px 10px' }}>
          ⚠️ Live flights &amp; hotels unavailable for {dest.name} right now — you can still save this itinerary.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PlanTripWithTravelAI() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  const messagesEndRef = useRef(null);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I am TravelAI, your interactive travel consultant buddy. 🌍 Where are we dreaming of going for your next adventure? Tell me your destination, travel dates, number of travellers, and budget — or we can figure it out together!"
  }]);
  const [userInput,  setUserInput]  = useState('');
  const [isSending,  setIsSending]  = useState(false);
  const [error,      setError]      = useState(null);

  // ── Preferences ───────────────────────────────────────────────────────────
  const [preferences, setPreferences] = useState({
    destination: '', originCity: '', days: 0, travelers: 0, budgetLevel: '', departDate: '', returnDate: '', location_types: []
  });

  // ── Plan state ────────────────────────────────────────────────────────────
  const [readyToPlan,   setReadyToPlan]   = useState(false);
  const [plan,          setPlan]          = useState(null);
  const [agentPackages, setAgentPackages] = useState([]);
  const [loadingPkgs,   setLoadingPkgs]   = useState(false);

  // ── Booking state ─────────────────────────────────────────────────────────
  // bookingResults: { [destName]: 'loading' | { flights: [], hotels: [] } }
  const [bookingResults,   setBookingResults]   = useState({});
  // selectedFlights: { [destId]: flightIndex }
  const [selectedFlights,  setSelectedFlights]  = useState({});
  // selectedHotels:  { [destId]: hotelIndex }
  const [selectedHotels,   setSelectedHotels]   = useState({});
  const [bookingSearched,  setBookingSearched]   = useState(false);

  // ── Save state ────────────────────────────────────────────────────────────
  const [tripTitle,   setTripTitle]   = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load agent packages when plan arrives
  useEffect(() => {
    if (!plan) return;
    setAgentPackages([]);
    const destNames = (plan.destinations || []).map(d => d.name).filter(Boolean).join(',');
    if (!destNames) return;
    setLoadingPkgs(true);
    fetch(`${API}/packages?destinations=${encodeURIComponent(destNames)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setAgentPackages(data.packages || []))
      .catch(() => {})
      .finally(() => setLoadingPkgs(false));
  }, [plan, accessToken]);

  // ── Trigger booking search after itinerary confirmed ──────────────────────
  const triggerBookingSearch = useCallback(async (currentPlan, currentPrefs) => {
    if (!currentPlan?.destinations?.length || bookingSearched) return;
    setBookingSearched(true);

    // Mark all destinations as loading
    const loadingState = {};
    currentPlan.destinations.forEach(d => { loadingState[d.name] = 'loading'; });
    setBookingResults(loadingState);

    // Hard cap: never let the UI spin forever, even if the backend hangs.
    const controller = new AbortController();
    const hardTimeout = setTimeout(() => controller.abort(), 45000); // 45s max wait — flight search alone can take up to 20s per destination

    try {
      const res = await fetch(`${API}/booking/search`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          origin:       currentPrefs.originCity || currentPrefs.origin || '',
          // NOTE: plan.startCity represents the traveller's origin/home city
          // (e.g. "Auckland"), NOT the destination — using it as a hotel/flight
          // fallback would search the wrong city entirely. Prefer the actual
          // destination the user described.
          fallbackCity: currentPrefs.destination || currentPlan.destinations?.[0]?.country || '',
          destinations: currentPlan.destinations,
          depart_date:  currentPrefs.departDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          return_date:  currentPrefs.returnDate  || null,
          adults:       currentPrefs.travelers   || 1,
          totalBudget:  parseNumericBudget(currentPrefs.budgetLevel),
        }),
      });
      clearTimeout(hardTimeout);

      if (!res.ok) throw new Error(`Booking search failed (${res.status})`);
      const data = await res.json();
      if (data.destinations) {
        const newResults = {};
        data.destinations.forEach(d => { newResults[d.name] = { flights: d.flights, hotels: d.hotels, noFlightsFound: d.noFlightsFound }; });
        setBookingResults(newResults);
      } else {
        throw new Error('No booking data returned.');
      }
    } catch (err) {
      clearTimeout(hardTimeout);
      console.error('[BookingSearch]', err);
      // Graceful fallback — clear loading state, let user continue with itinerary
      // as-is instead of leaving the "Searching..." spinner stuck forever.
      const errorState = {};
      currentPlan.destinations.forEach(d => { errorState[d.name] = { flights: [], hotels: [], error: true }; });
      setBookingResults(errorState);
      setError(
        err.name === 'AbortError'
          ? 'Flight & hotel search timed out. You can continue and save your itinerary without live pricing, or try again.'
          : 'Could not fetch live flights & hotels right now. You can still save your itinerary.'
      );
      setBookingSearched(false); // allow the user to retry via the button
    }
  }, [accessToken, bookingSearched]);

  // ── Send chat message ─────────────────────────────────────────────────────
  async function handleSend() {
    if (!userInput.trim() || isSending) return;
    const userMsg = userInput.trim();
    setUserInput('');
    setIsSending(true);
    setError(null);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    try {
      const data = await chatWithAI(accessToken, { messages: newMessages });

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      if (data.extractedPreferences) {
        setPreferences(prev => ({ ...prev, ...data.extractedPreferences }));
      }

      let effectivePlan = plan;
      if (data.readyToPlan) {
        setReadyToPlan(true);
        if (data.plan?.destinations?.length > 0) {
          setPlan(data.plan);
          effectivePlan = data.plan;
        }
      }

      // Trigger booking search when the USER confirms — checked against what
      // the user just typed, not the AI's reply wording. Requires a plan to exist.
      if (effectivePlan?.destinations?.length > 0 && isUserConfirmation(userMsg)) {
        triggerBookingSearch(effectivePlan, { ...preferences, ...data.extractedPreferences });
      }

    } catch (err) {
      if (err.status === 401) { await logout(); navigate('/login'); }
      else setError(err.message || 'Something went wrong.');
    } finally {
      setIsSending(false);
    }
  }

  // ── Selection handlers ────────────────────────────────────────────────────
  const handleSelectFlight = (destId, idx) => {
    setSelectedFlights(prev => ({ ...prev, [destId]: prev[destId] === idx ? null : idx }));
  };
  const handleSelectHotel = (destId, idx) => {
    setSelectedHotels(prev => ({ ...prev, [destId]: prev[destId] === idx ? null : idx }));
  };

  // ── Remove destination ────────────────────────────────────────────────────
  function removeDestination(id) {
    if (!id.startsWith('pkg-')) {
      setPlan(prev => ({ ...prev, destinations: prev.destinations.filter(d => d.id !== id) }));
    } else {
      setAgentPackages(prev => prev.filter(p => p.id !== id.replace('pkg-', '')));
    }
  }

  // ── Build selected components for save ────────────────────────────────────
  // NOTE: Booking.com's price fields (flights and hotels) are TOTAL prices for
  // the whole booking as searched (all travelers, whole stay) — NOT per-person.
  // We do not multiply by travelers again here to avoid double-counting.
  function buildSelectedComponents() {
    const components = [];
    let totalSelected = 0;

    (plan?.destinations || []).forEach(dest => {
      const bData = bookingResults[dest.name];
      const fi = selectedFlights[dest.id];
      const hi = selectedHotels[dest.id];

      if (fi != null && bData?.flights?.[fi]) {
        const f = bData.flights[fi];
        components.push({ source: 'booking', componentType: 'flight', title: `Flight to ${dest.name} (${f.airline})`, pricePerPerson: f.price || 0, provider: f.airline });
        totalSelected += f.price || 0;
      }
      if (hi != null && bData?.hotels?.[hi]) {
        const h = bData.hotels[hi];
        components.push({ source: 'booking', componentType: 'hotel', title: `${h.name} (${dest.name})`, pricePerPerson: h.price || 0, provider: h.name });
        totalSelected += h.price || 0;
      }
    });

    return { components, totalPerPerson: totalSelected, totalAll: totalSelected };
  }

  // ── Save trip ─────────────────────────────────────────────────────────────
  async function handleSaveTrip() {
    if (!plan) return;
    setIsSaving(true); setError(null); setSaveSuccess(false);
    try {
      const { components, totalPerPerson, totalAll } = buildSelectedComponents();
      const response = await saveTripToDB(accessToken, {
        plan,
        title: tripTitle.trim() || `${plan.startCity || preferences.destination} Trip`,
        selectedComponents:    components,
        totalPricePerPerson:   totalPerPerson,
        totalPriceAll:         totalAll,
        selectedPackageIds:    agentPackages.map(p => p.id),
      });
      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => navigate('/my-trips'), 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to save trip.');
    } finally {
      setIsSaving(false);
    }
  }

  function packageToDestCard(pkg) {
    const components = pkg.components || [];
    return {
      id:          `pkg-${pkg.id}`,
      name:        pkg.destination_name,
      country:     pkg.country || 'New Zealand',
      emoji:       packageEmoji(pkg),
      highlights:  components.slice(0, 3).map(c => c.title),
      bookmeDeals: [],
    };
  }

  const allDestCards = [
    ...(plan?.destinations || []).map(d => ({ dest: d, agentPkg: null })),
    ...agentPackages.map(pkg => ({ dest: packageToDestCard(pkg), agentPkg: pkg })),
  ];

  // Summary of selected bookings for save bar
  const { components: selectedComponents, totalPerPerson, totalAll } = buildSelectedComponents();
  const hasBookingSelections = selectedComponents.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderFormattedMessage = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, lineIdx) => {
      const t = line.trim();
      if (!t) return <div key={lineIdx} style={{ height: '0.4rem' }} />;
      if (t === '---') return <hr key={lineIdx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 0' }} />;
      if (t.startsWith('###')) return <h3 key={lineIdx} style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', margin: '0.75rem 0 0.4rem 0' }}>{parseBoldText(t.replace(/^###\s*/, ''))}</h3>;
      if (t.startsWith('##'))  return <h4 key={lineIdx} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', margin: '0.9rem 0 0.5rem 0' }}>{parseBoldText(t.replace(/^##\s*/, ''))}</h4>;
      if (t.startsWith('#'))   return <h2 key={lineIdx} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '1.1rem 0 0.6rem 0' }}>{parseBoldText(t.replace(/^#\s*/, ''))}</h2>;
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginLeft: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ color: '#818cf8', fontSize: '0.8rem', marginTop: 4 }}>•</span>
            <span style={{ flex: 1, color: '#e2e8f0' }}>{parseBoldText(t.substring(2))}</span>
          </div>
        );
      }
      return <p key={lineIdx} style={{ margin: '0 0 0.5rem 0', lineHeight: 1.6, color: '#e2e8f0' }}>{parseBoldText(line)}</p>;
    });
  };

  return (
    <div className="trip-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc', overflow: 'hidden', background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="home-orb home-orb-shadow-beige" style={{ left: '10%', top: '45%' }} />
        <div className="home-orb home-orb-shadow-small" style={{ left: '15%', top: '15%' }} />
        <div className="home-orb home-orb-pink"         style={{ left: '45%', top: '10%' }} />
        <div className="home-orb home-orb-blue"         style={{ left: '62%', top: '12%' }} />
        <div className="home-orb home-orb-orange"       style={{ left: '78%', top: '14%' }} />
        <div className="home-orb home-orb-large-yellow" style={{ left: '48%', bottom: '25%' }} />
        <div className="home-orb home-orb-large-blue"   style={{ left: '70%', top: '30%' }} />
      </div>

      {/* Header */}
      <Navbar />

      {/* Main split view */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: '1.5rem', gap: '1.5rem', height: 'calc(100vh - 80px)', overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>

        {/* ── LEFT: Chat ── */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', minWidth: 0 }}>

          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', background: 'rgba(30,41,59,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>🤖</div>
            <div>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>TravelAI Consultant</div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%', display: 'inline-block' }} /> Online &amp; Listening
              </div>
            </div>
            {bookingSearched && (
              <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '3px 10px', borderRadius: 20 }}>
                ✈️ Searching flights &amp; hotels…
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '0.85rem 1.1rem',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background:   isUser ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : 'rgba(30,41,59,0.85)',
                    border:       isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow:    '0 4px 12px rgba(0,0,0,0.15)',
                    color: '#f8fafc', fontSize: '0.9rem', lineHeight: 1.5,
                  }}>
                    {isUser ? msg.content : renderFormattedMessage(msg.content)}
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.85rem' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} /> TravelAI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderTop: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '1rem', background: 'rgba(30,41,59,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Tell TravelAI your destination, interests, dates, or plans..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              disabled={isSending}
              className="premium-chat-input"
              style={{ flex: 1, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.65rem 1rem', color: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !userInput.trim()}
              className={`premium-send-btn ${isSending || !userInput.trim() ? 'disabled' : 'active'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg) translate(2px,-2px)' }}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Tracker + Itinerary ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, overflowY: 'auto', paddingRight: 4 }}>

          {/* Preference Tracker */}
          <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              🎯 Live Consultant Tracker
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '📍 Destination', value: preferences.destination, key: 'destination' },
                { label: '🛫 Flying From',  value: preferences.originCity, key: 'originCity' },
                { label: '📅 Duration',    value: preferences.days > 0 ? `${preferences.days} Days` : null, key: 'days' },
                { label: '🗓 Depart Date', value: preferences.departDate, key: 'departDate' },
                { label: '🗓 Return Date', value: preferences.returnDate, key: 'returnDate' },
                { label: '👥 Travelers',   value: preferences.travelers > 0 ? `${preferences.travelers} Traveler(s)` : null, key: 'travelers' },
                { label: '💰 Budget',      value: preferences.budgetLevel, key: 'budgetLevel' },
              ].map(row => (
                <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', color: row.value ? '#38bdf8' : '#fbbf24' }}>
                    {row.value || 'Finding...'}
                  </span>
                </div>
              ))}
              {preferences.location_types?.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 500 }}>🏷️ Interests</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                    {preferences.location_types.map((t, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: 9999, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#c7d2fe', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Itinerary Panel */}
          {readyToPlan && plan ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>
              <div style={{ padding: '1.25rem', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.24)', minWidth: 0 }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#38bdf8' }}>✨ Your Itinerary</h3>
                  {!bookingSearched && (
                    <button
                      onClick={() => triggerBookingSearch(plan, preferences)}
                      style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', background: '#38bdf8', border: 'none', padding: '5px 12px', borderRadius: 20, cursor: 'pointer' }}
                    >
                      ✈️ Find Flights &amp; Hotels
                    </button>
                  )}
                  {bookingSearched && !Object.values(bookingResults).includes('loading') && (
                    <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 10px', borderRadius: 20 }}>
                      ✈️ Flights &amp; hotels loaded
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>{plan.summary}</p>

                {loadingPkgs && (
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="spinner" style={{ width: 12, height: 12 }} /> Searching agent packages...
                  </div>
                )}

                <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 4, minWidth: 0, width: '100%' }}>
                  {allDestCards.map(({ dest, agentPkg }) => (
                    <DestinationCard
                      key={dest.id}
                      dest={dest}
                      agentPkg={agentPkg}
                      onRemove={removeDestination}
                      bookingData={bookingResults[dest.name]}
                      selectedFlight={selectedFlights[dest.id]}
                      selectedHotel={selectedHotels[dest.id]}
                      onSelectFlight={handleSelectFlight}
                      onSelectHotel={handleSelectHotel}
                    />
                  ))}
                </div>

                {/* Booking summary */}
                {hasBookingSelections && (
                  <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>Your selection summary:</div>
                    {selectedComponents.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', marginBottom: 3 }}>
                        <span>{c.componentType === 'flight' ? '✈️' : '🏨'} {c.title}</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>NZD ${c.pricePerPerson?.toFixed(0)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ color: '#f8fafc' }}>Total for {preferences.travelers || 1} traveler{preferences.travelers > 1 ? 's' : ''} (flights &amp; hotels)</span>
                      <span style={{ color: '#38bdf8', fontSize: '0.95rem' }}>NZD ${totalAll?.toFixed(0)}</span>
                    </div>
                  </div>
                )}

                {/* Save bar */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Itinerary Name (Optional)"
                    value={tripTitle}
                    onChange={e => setTripTitle(e.target.value)}
                    style={{ flex: 1, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.8rem' }}
                  />
                  <button
                    onClick={handleSaveTrip}
                    disabled={isSaving || saveSuccess || allDestCards.length === 0}
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: 600, fontSize: '0.8rem', padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                  >
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved! ✓' : 'Save Itinerary'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, background: '#1e293b', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.2)', padding: '1.5rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}>
              <span style={{ fontSize: '2rem', marginBottom: 8 }}>💬</span>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500, lineHeight: 1.4 }}>Chat with the consultant to design your itinerary!</span>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>Your live recommendations will appear here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
