import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatWithAI, saveTripToDB, confirmBooking } from '../../services/tripService';
import travelAILogo from '../../assets/travelai-logo.png';
import FlightCard from './FlightCard';
import HotelCard  from './HotelCard';
import Navbar from '../common/Navbar';
import '../home/HomePage.css';
import { saveRecentSearchToDB } from '../../services/recentSearchService';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

// -- Detect the USER's confirmation reply (not the AI's wording) ---------------
// This is the reliable trigger point -- the user is the one saying "yes, book it",
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

// -- Extract a numeric budget from free-text budgetLevel (e.g. "$5000", "5000 NZD", "moderate") --
function parseNumericBudget(budgetLevel = '') {
  const match = String(budgetLevel).match(/[\d,]+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// -- Component type icons ------------------------------------------------------
const COMPONENT_META = {
  flight:   { icon: '✈️', colour: '#38bdf8' },
  hotel:    { icon: '🏨', colour: '#a78bfa' },
  activity: { icon: '🎯', colour: '#34d399' },
  transfer: { icon: '🚌', colour: '#fb923c' },
};

// -- Curated destination hero images (Unsplash direct CDN, no key needed) -----
const DEST_IMAGES = {
  'auckland':           'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=75',
  'wellington':         'https://images.unsplash.com/photo-1577048982768-5cb3e7ddfa23?w=600&q=75',
  'rotorua':            'https://images.unsplash.com/photo-1583236070780-6ece19db7fa7?w=600&q=75',
  'queenstown':         'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=600&q=75',
  'christchurch':       'https://images.unsplash.com/photo-1547300352-2c6fee46e3a2?w=600&q=75',
  'dunedin':            'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&q=75',
  'tauranga':           'https://images.unsplash.com/photo-1570737209810-87a8e7245f88?w=600&q=75',
  'napier':             'https://images.unsplash.com/photo-1608490531175-57e6c6c26ae6?w=600&q=75',
  'milford sound':      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=75',
  'fiordland':          'https://images.unsplash.com/photo-1589196728941-5f04fc59d7f3?w=600&q=75',
  'tongariro':          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=75',
  'waiheke':            'https://images.unsplash.com/photo-1493219686142-5a8641badc78?w=600&q=75',
  'coromandel':         'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?w=600&q=75',
  'dubai':              'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=75',
  'abu dhabi':          'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=600&q=75',
  'new zealand':        'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?w=600&q=75',
};

function getDestImage(dest) {
  const key = (dest.name || '').toLowerCase();
  // exact match first
  if (DEST_IMAGES[key]) return DEST_IMAGES[key];
  // partial match
  for (const [k, url] of Object.entries(DEST_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return url;
  }
  // generic NZ/Dubai fallback based on country
  if ((dest.country || '').toLowerCase().includes('zealand'))
    return 'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?w=600&q=75';
  if ((dest.country || '').toLowerCase().includes('emirates') || (dest.country || '').toLowerCase().includes('dubai'))
    return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=75';
  return 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=75'; // generic travel
}

const BUDGET_COLORS = {
  budget:   { bg: 'rgba(52,211,153,0.85)',  text: '#065f46' },
  moderate: { bg: 'rgba(251,191,36,0.85)',  text: '#78350f' },
  luxury:   { bg: 'rgba(167,139,250,0.85)', text: '#2e1065' },
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

// -- Destination card (itinerary panel) ---------------------------------------
function DestinationCard({ dest, onRemove, agentPkg, bookingData, selectedFlight, selectedHotel, onSelectFlight, onSelectHotel, budgetLevel }) {
  const cheapestFlight = bookingData?.flights?.length
    ? Math.min(...bookingData.flights.map(f => f.price ?? Infinity))
    : null;

  // Determine displayed price: live booking > agent package > AI estimate
  const liveFlightPrice  = cheapestFlight && isFinite(cheapestFlight) ? cheapestFlight : null;
  const liveHotelPrice   = bookingData?.hotels?.[0]?.price ?? null;
  const liveTotalPrice   = (liveFlightPrice || 0) + (liveHotelPrice || 0);
  const agentPkgPrice    = agentPkg ? parseFloat(agentPkg.price_per_person ?? agentPkg.base_price ?? 0) : null;
  const estimatedTotal   = dest.estimatedPrice?.total ?? null;

  const displayPrice = liveTotalPrice > 0
    ? { amount: liveTotalPrice, label: 'Live estimate', live: true }
    : agentPkgPrice > 0
    ? { amount: agentPkgPrice, label: 'Agent package', live: false }
    : estimatedTotal > 0
    ? { amount: estimatedTotal, label: dest.estimatedPrice?.note || 'Estimate', live: false }
    : null;

  const heroImg  = getDestImage(dest);
  const budgetSt = BUDGET_COLORS[budgetLevel] || BUDGET_COLORS.moderate;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: 12, border: '1px solid #e2e0da', background: '#f8f7f4', marginBottom: '0.75rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0, gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0, flex: 1 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={`https://picsum.photos/seed/${dest.id}/150/150`} alt={dest.name}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-500)' }} />
            <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '1rem', background: '#f8f7f4', borderRadius: '50%', padding: 2, lineHeight: 1 }}>
              {dest.emoji}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: '#1f2937', overflowWrap: 'break-word' }}>
              {dest.name} <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{dest.country}</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4, overflowWrap: 'break-word', whiteSpace: 'normal' }}>
              {dest.highlights?.slice(0, 2).join(' . ')}
            </p>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}
          onClick={() => onRemove(dest.id)}>x</button>
      </div>

      {/* Agent package inclusions -- only activities and transfers shown here.
          Flights and hotels are deliberately EXCLUDED from this list once live
          Booking.com search results exist for this destination, since showing
          a static agent-package hotel or flight line item alongside the live,
          selectable, real-priced FlightCard or HotelCard results below creates
          confusing duplicate choices for the same category. */}
      {agentPkg?.components?.length > 0 && (() => {
        const hasLiveFlights = bookingData?.flights?.length > 0;
        const hasLiveHotels  = bookingData?.hotels?.length > 0;
        // Also suppress agent hotel/flight items while search is in progress (loading)
        // or once booking has been searched at all -- avoids the race condition where
        // agent package hotels show briefly before live Booking.com results arrive.
        const searchInProgress = bookingData === 'loading';
        const searchHasRun     = bookingData && bookingData !== 'loading';
        const visibleComponents = agentPkg.components.filter(comp => {
          const type = comp.component_type || comp.componentType || '';
          if (type === 'flight' && (hasLiveFlights || searchInProgress || searchHasRun)) return false;
          if (type === 'hotel'  && (hasLiveHotels  || searchInProgress || searchHasRun)) return false;
          return true;
        });
        if (visibleComponents.length === 0) return null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {visibleComponents.map((comp, i) => {
              const meta = COMPONENT_META[comp.component_type] || { icon: '📌', colour: '#94a3b8' };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: `${meta.colour}0f`, border: `1px solid ${meta.colour}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13 }}>{meta.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2937' }}>{comp.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: meta.colour, fontWeight: 700 }}>
                    NZD ${parseFloat(comp.price_per_person ?? comp.pricePerPerson ?? 0).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Bookme deals */}
      {!agentPkg && dest.bookmeDeals?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.75rem', color: '#4f46e5', margin: '0 0 6px 0', fontWeight: 600 }}>✨ Recommended on Bookme</h4>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, minWidth: 0, maxWidth: '100%' }}>
            {dest.bookmeDeals.map((deal, i) => (
              <a key={i} href={deal.link} target="_blank" rel="noreferrer"
                style={{ minWidth: 160, flexShrink: 0, background: '#f1f0ec', border: '1px solid #e2e0da', borderRadius: 8, padding: 7, display: 'block', textDecoration: 'none' }}>
                <div style={{ height: 70, borderRadius: 5, backgroundImage: `url(${deal.image})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 5 }} />
                <h5 style={{ fontSize: '0.7rem', fontWeight: 600, margin: '0 0 3px 0', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.title}</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>{deal.price}</span>
                  {deal.discount && <span style={{ fontSize: '0.6rem', background: '#f97316', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>{deal.discount}</span>}
                </div>
              </a>
            ))}
            </div>
          </div>
        )}

        {/* Price breakdown */}
        {displayPrice && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {dest.estimatedPrice?.flight > 0 && !liveFlightPrice && (
              <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }}>
                ✈️ est. NZD {dest.estimatedPrice.flight.toLocaleString()}
              </span>
            )}
            {liveFlightPrice && (
              <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8' }}>
                ✈️ NZD {Math.round(liveFlightPrice).toLocaleString()}
              </span>
            )}
            {dest.estimatedPrice?.hotel > 0 && !liveHotelPrice && (
              <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                🏨 est. NZD {dest.estimatedPrice.hotel.toLocaleString()}
              </span>
            )}
            {liveHotelPrice && (
              <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa' }}>
                🏨 NZD {Math.round(liveHotelPrice).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Agent package inclusions */}
        {agentPkg?.components?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h4 style={{ fontSize: '0.7rem', color: '#34d399', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📦 Agent Package</h4>
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

      {/* -- FLIGHTS (shown after itinerary confirmed) -- */}
      {bookingData?.flights?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.78rem', color: '#38bdf8', margin: '0 0 8px 0', fontWeight: 600 }}>
            ✈️ Flights to {dest.name}
            {selectedFlight && <span style={{ color: '#34d399', marginLeft: 8 }}>. Selected v</span>}
          </h4>
          {bookingData.flights.every(f => f.overBudget) && (
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginBottom: 6, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.4 }}>
              ⚠️ No flights to {dest.name} fit your stated budget for these dates -- showing the cheapest available instead. Try increasing your budget, or ask the consultant to check nearby dates (fares often vary day to day).
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

      {/* -- No flights found (searched, but zero results -- common on RapidAPI free tier) -- */}
      {bookingData && bookingData !== 'loading' && bookingData.noFlightsFound && (
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, padding: '8px 10px' }}>
          ✈️ No live flights found to {dest.name} for these dates -- you can still add this leg manually or save the itinerary without flight pricing.
        </div>
      )}

      {/* -- HOTELS (shown after itinerary confirmed) -- */}
      {bookingData?.hotels?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.78rem', color: '#a78bfa', margin: '8px 0 8px 0', fontWeight: 600 }}>
            🏨 Hotels in {dest.name}
            {selectedHotel !== null && selectedHotel !== undefined && <span style={{ color: '#34d399', marginLeft: 8 }}>. Selected v</span>}
          </h4>
          {bookingData.hotels.every(h => h.overBudget) && (
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginBottom: 6 }}>
              ⚠️ No hotels found within budget for {dest.name} -- showing the cheapest available options instead.
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
          Searching flights &amp; hotels for {dest.name}...
        </div>
      )}

      {/* Error or no results state */}
      {bookingData?.error && (
        <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '8px 10px' }}>
          ⚠️ Live flights &amp; hotels unavailable for {dest.name} right now -- you can still save this itinerary.
        </div>
      )}
    </div>
  );
}

// ===============================================================================
export default function PlanTripWithTravelAI() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  const messagesEndRef = useRef(null);

  // -- Landing / search-style entry screen (shown before chat starts) --------
  const [showLanding, setShowLanding] = useState(true);
  const EXPLORE_SUGGESTIONS = [
    'Dubai Marina', 'Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall',
    'Desert Safari', 'Global Village', 'Miracle Garden', 'Dubai Creek',
  ];

  // -- Chat state ------------------------------------------------------------
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I am TravelAI, your interactive travel consultant buddy. 🌍 Where are we dreaming of going for your next adventure? Tell me your destination, travel dates, number of travellers, and budget -- or we can figure it out together!"
  }]);
  const [userInput,  setUserInput]  = useState('');
  const [isSending,  setIsSending]  = useState(false);
  const [error,      setError]      = useState(null);

  // -- Preferences -----------------------------------------------------------
  const [preferences, setPreferences] = useState({
    destination: '', originCity: '', days: 0, travelers: 0, budgetLevel: '', budgetAmount: 0, flightBudget: 0, hotelBudgetPerNight: 0, departDate: '', returnDate: '', location_types: []
  });

  // -- Plan state ------------------------------------------------------------
  const [readyToPlan,   setReadyToPlan]   = useState(false);
  const [plan,          setPlan]          = useState(null);
  const [agentPackages, setAgentPackages] = useState([]);
  const [loadingPkgs,   setLoadingPkgs]   = useState(false);

  // -- Booking state ---------------------------------------------------------
  // bookingResults: { [destName]: 'loading' | { flights: [], hotels: [] } }
  const [bookingResults,   setBookingResults]   = useState({});
  // selectedFlights: { [destId]: flightIndex }
  const [selectedFlights,  setSelectedFlights]  = useState({});
  // selectedHotels:  { [destId]: hotelIndex }
  const [selectedHotels,   setSelectedHotels]   = useState({});
  const [bookingSearched,  setBookingSearched]   = useState(false);

  // -- Save state ------------------------------------------------------------
  const [tripTitle,   setTripTitle]   = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedTripId, setSavedTripId] = useState(null);

  // -- Booking confirmation state --------------------------------------------
  const [travelerName,        setTravelerName]        = useState('');
  const [travelerEmail,       setTravelerEmail]        = useState('');
  const [travelerPhone,       setTravelerPhone]        = useState('');
  const [isConfirmingBooking, setIsConfirmingBooking]  = useState(false);
  const [bookingConfirmation, setBookingConfirmation]  = useState(null); // { confirmationCode, status, ... }

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

  // -- Trigger booking search after itinerary confirmed ----------------------
  const triggerBookingSearch = useCallback(async (currentPlan, currentPrefs) => {
    if (!currentPlan?.destinations?.length || bookingSearched) return;
    setBookingSearched(true);

    // Mark all destinations as loading
    const loadingState = {};
    currentPlan.destinations.forEach(d => { loadingState[d.name] = 'loading'; });
    setBookingResults(loadingState);

    // Hard cap: never let the UI spin forever, even if the backend hangs.
    const controller = new AbortController();
    const hardTimeout = setTimeout(() => controller.abort(), 45000); // 45s max wait -- flight search alone can take up to 20s per destination

    try {
      const res = await fetch(`${API}/booking/search`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          origin:       currentPrefs.originCity || currentPrefs.origin || '',
          // NOTE: plan.startCity represents the traveller's origin/home city
          // (e.g. "Auckland"), NOT the destination -- using it as a hotel/flight
          // fallback would search the wrong city entirely. Prefer the actual
          // destination the user described.
          fallbackCity: currentPrefs.destination || currentPlan.destinations?.[0]?.country || '',
          destinations: currentPlan.destinations,
          depart_date:  currentPrefs.departDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          return_date:  currentPrefs.returnDate  || null,
          adults:       currentPrefs.travelers   || 1,
          // Prefer the dedicated numeric field -- falls back to text parsing
          // only for older sessions/messages that predate this field.
          totalBudget:  (currentPrefs.budgetAmount && currentPrefs.budgetAmount > 0)
                          ? currentPrefs.budgetAmount
                          : parseNumericBudget(currentPrefs.budgetLevel),
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
      // Graceful fallback -- clear loading state, let user continue with itinerary
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

  // -- Send chat message -----------------------------------------------------
  async function handleSend() {
    if (!userInput.trim() || isSending) return;
    const userMsg = userInput.trim();
    
    if (accessToken) {
      saveRecentSearchToDB(accessToken, userMsg).catch((err) => {
        console.warn('[PlanTrip] Failed to save recent search:', err);
      });
    }
    setUserInput('');
    setIsSending(true);
    setError(null);
    setShowLanding(false); // transition from landing screen to chat interface

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

      // -- Agentic path: the model itself decided to call search_flights /
      // search_hotels mid-conversation. Merge whatever it found straight into
      // bookingResults so the existing destination cards render them --
      // no separate /api/booking/search call needed for this to work.
      if ((data.flights && data.flights.length > 0) || (data.hotels && data.hotels.length > 0)) {
        const targetDestName = effectivePlan?.destinations?.[0]?.name || data.extractedPreferences?.destination || preferences.destination;
        if (targetDestName) {
          setBookingResults(prev => ({
            ...prev,
            [targetDestName]: {
              flights: data.flights || prev[targetDestName]?.flights || [],
              hotels:  data.hotels  || prev[targetDestName]?.hotels  || [],
              noFlightsFound: !data.flights || data.flights.length === 0,
            },
          }));
          setBookingSearched(true); // the AI already searched -- hide the manual button

          // If flights/hotels showed up before any formal plan exists, build a
          // minimal one-destination plan so the itinerary panel actually has
          // something to render -- otherwise the results only ever appear as
          // chat text and the itinerary panel stays empty.
          if (!effectivePlan?.destinations?.length) {
            const fallbackPlan = {
              summary: `A trip to ${targetDestName}.`,
              budgetLevel: preferences.budgetLevel || 'moderate',
              days: preferences.days || null,
              travelers: preferences.travelers || 1,
              destinations: [{
                id: `agentic-${targetDestName}`,
                name: targetDestName,
                country: preferences.country || 'New Zealand',
                emoji: '📍',
              }],
            };
            setPlan(fallbackPlan);
            setReadyToPlan(true);
            effectivePlan = fallbackPlan;
          }
        }
      }

      // Fallback: if the model didn't proactively search (e.g. still warming up
      // on tool usage), keep the keyword-based manual trigger as a safety net.
      if (
        !data.flights && !data.hotels &&
        effectivePlan?.destinations?.length > 0 &&
        isUserConfirmation(userMsg)
      ) {
        triggerBookingSearch(effectivePlan, { ...preferences, ...data.extractedPreferences });
      }

    } catch (err) {
      if (err.status === 401) { await logout(); navigate('/login'); }
      else setError(err.message || 'Something went wrong.');
    } finally {
      setIsSending(false);
    }
  }

  // -- Selection handlers ----------------------------------------------------
  const handleSelectFlight = (destId, idx) => {
    setSelectedFlights(prev => ({ ...prev, [destId]: prev[destId] === idx ? null : idx }));
  };
  const handleSelectHotel = (destId, idx) => {
    setSelectedHotels(prev => ({ ...prev, [destId]: prev[destId] === idx ? null : idx }));
  };

  // -- Remove destination ----------------------------------------------------
  function removeDestination(id) {
    if (!id.startsWith('pkg-')) {
      setPlan(prev => ({ ...prev, destinations: prev.destinations.filter(d => d.id !== id) }));
    } else {
      setAgentPackages(prev => prev.filter(p => p.id !== id.replace('pkg-', '')));
    }
  }

  // -- Build selected components for save ------------------------------------
  // NOTE: Booking.com's price fields (flights and hotels) are TOTAL prices for
  // the whole booking as searched (all travelers, whole stay) -- NOT per-person.
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

  // -- Save trip -------------------------------------------------------------
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
        setSavedTripId(response.trip?.id || response.tripId || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to save trip.');
    } finally {
      setIsSaving(false);
    }
  }

  // -- Booking confirmation -- the final reservation step, before payment ----
  async function handleConfirmBooking() {
    if (!travelerName.trim() || !travelerEmail.trim()) {
      setError('Please enter your name and email to confirm the booking.');
      return;
    }
    setIsConfirmingBooking(true); setError(null);
    try {
      const { components, totalPerPerson, totalAll } = buildSelectedComponents();
      const response = await confirmBooking(accessToken, {
        tripId:              savedTripId,
        destination:         plan?.startCity || preferences.destination,
        originCity:          preferences.originCity,
        departDate:          preferences.departDate,
        returnDate:          preferences.returnDate,
        travelers:           preferences.travelers || 1,
        selectedComponents:  components,
        totalPricePerPerson: totalPerPerson,
        totalPriceAll:       totalAll,
        travelerName:        travelerName.trim(),
        travelerEmail:       travelerEmail.trim(),
        travelerPhone:       travelerPhone.trim() || undefined,
      });
      if (response.success) {
        setBookingConfirmation(response.booking);
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm booking.');
    } finally {
      setIsConfirmingBooking(false);
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

  // Merge agent packages into the MATCHING existing AI destination card
  // (by name, case-insensitive) instead of creating a second standalone card
  // for the same city. Two separate cards for "Rotorua" both keyed by the
  // same dest.name would each independently render the same bookingResults
  // flights/hotels, causing everything to visibly duplicate. Only create a
  // standalone card if no AI destination matches that package's city at all.
  const aiDestinations = plan?.destinations || [];
  const matchedPackageIds = new Set();

  const mergedAiCards = aiDestinations.map(d => {
    const matchingPkg = agentPackages.find(
      pkg => pkg.destination_name?.toLowerCase() === d.name?.toLowerCase()
    );
    if (matchingPkg) matchedPackageIds.add(matchingPkg.id);
    return { dest: d, agentPkg: matchingPkg || null };
  });

  const unmatchedPackageCards = agentPackages
    .filter(pkg => !matchedPackageIds.has(pkg.id))
    .map(pkg => ({ dest: packageToDestCard(pkg), agentPkg: pkg }));

  const allDestCards = [...mergedAiCards, ...unmatchedPackageCards];

  // Summary of selected bookings for save bar
  const { components: selectedComponents, totalPerPerson, totalAll } = buildSelectedComponents();
  const hasBookingSelections = selectedComponents.length > 0;

  // -- Render ----------------------------------------------------------------
  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: '#111827', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderFormattedMessage = (content) => {
    if (!content) return null;
    // Strip markdown image syntax and bare URLs from AI output
    const cleaned = content.replace(/!\[([^\]]*)\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\(https?:[^)]+\)/g, '$1');
    return cleaned.split('\n').map((line, lineIdx) => {
      const t = line.trim();
      if (!t) return <div key={lineIdx} style={{ height: '0.4rem' }} />;
      if (t === '---') return <hr key={lineIdx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 0' }} />;
      if (t.startsWith('###')) return <h3 key={lineIdx} style={{ fontSize: '1rem', fontWeight: 700, color: '#4f46e5', margin: '0.75rem 0 0.4rem 0' }}>{parseBoldText(t.replace(/^###\s*/, ''))}</h3>;
      if (t.startsWith('##'))  return <h4 key={lineIdx} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', margin: '0.9rem 0 0.5rem 0' }}>{parseBoldText(t.replace(/^##\s*/, ''))}</h4>;
      if (t.startsWith('#'))   return <h2 key={lineIdx} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1f2937', margin: '1.1rem 0 0.6rem 0' }}>{parseBoldText(t.replace(/^#\s*/, ''))}</h2>;
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginLeft: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ color: '#6366f1', fontSize: '0.8rem', marginTop: 4 }}>•</span>
            <span style={{ flex: 1, color: '#374151' }}>{parseBoldText(t.substring(2))}</span>
          </div>
        );
      }
      return <p key={lineIdx} style={{ margin: '0 0 0.5rem 0', lineHeight: 1.6, color: '#374151' }}>{parseBoldText(line)}</p>;
    });
  };

  // -- Submit a suggestion pill directly -------------------------------------
  function handlePillClick(place) {
    setUserInput(`Tell me about visiting ${place}`);
  }

  // -- Landing screen (shown before the first message is sent) --------------
  if (showLanding) {
  return (
    <>
      <Navbar />

      <div style={{ minHeight: '100vh', background: '#f5f4f1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', fontFamily: 'Georgia, "Times New Roman", serif' }}>

        <div style={{ width: '100%', maxWidth: 900, background: '#faf9f6', border: '1px solid #e2e0da', borderRadius: 20, padding: '2.5rem 2.5rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          {/* Top-left brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem' }}>
            <img src={travelAILogo} alt="Travel AI" style={{ height: 28, width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={travelAILogo} alt="Travel AI" style={{ height: 110, width: 'auto', objectFit: 'contain', marginBottom: '0.75rem', mixBlendMode: 'multiply', display: 'inline-block' }} />
            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#9ca3af', margin: 0 }}>
              You're in <strong style={{ color: '#4b5563' }}>Auckland International</strong>
            </p>
          </div>

          {/* Suggestion pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: '2rem' }}>
            {EXPLORE_SUGGESTIONS.map(place => (
              <button
                key={place}
                onClick={() => handlePillClick(place)}
                style={{
                  fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 600, color: '#374151',
                  background: '#fdfcfa', border: '1px solid #d9d6cd', borderRadius: 999,
                  padding: '8px 18px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f1ea'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fdfcfa'; }}
              >
                Explore {place}
              </button>
            ))}
          </div>

          {/* Ask input */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e3dc', borderRadius: 16, padding: '1.5rem', minHeight: 160, display: 'flex', flexDirection: 'column' }}>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask here where do you want to go?"
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'Georgia, serif', fontSize: 18, color: '#9ca3af',
                background: 'transparent', width: '100%',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSend}
                disabled={!userInput.trim() || isSending}
                style={{
                  fontFamily: 'Arial, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff',
                  background: !userInput.trim() ? '#a5a3f5' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  border: 'none', borderRadius: 999, padding: '12px 24px',
                  cursor: !userInput.trim() ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {isSending ? 'Thinking...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#b4b2a8', textAlign: 'center', marginTop: '1.75rem', marginBottom: 0 }}>
            AI-powered . By using AI Mode you agree to our{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span> &{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </>
  );
}

  return (
  <>
    <Navbar />

    <div style={{ minHeight: '100vh', background: '#f5f4f1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', fontFamily: 'Georgia, "Times New Roman", serif' }}>

      <div style={{ width: '100%', maxWidth: 1400, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header -- same light branding continued from the landing screen */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={travelAILogo} alt="Travel AI" style={{ height: 30, width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ fontFamily: 'Arial, sans-serif', background: '#fff', border: '1px solid #e2e0da', color: '#4b5563', fontWeight: 600, fontSize: '0.82rem', padding: '0.45rem 1.1rem', borderRadius: 9999, cursor: 'pointer' }}
          >
            Home
          </button>
        </div>

      {/* Main split view */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1.25rem', minHeight: 0, minWidth: 0, maxWidth: '100%', height: 'calc(100vh - 130px)', position: 'relative' }}>

        {/* -- LEFT: Chat -- */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e0da', overflow: 'hidden', minWidth: 0, minHeight: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', background: '#f8f7f4', borderBottom: '1px solid #e5e3dc' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>🤖</div>
            <div>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>TravelAI Consultant</div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%', display: 'inline-block' }} /> Online &amp; Listening
              </div>
            </div>
            {bookingSearched && (
              <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '3px 10px', borderRadius: 20 }}>
                ✈️ Searching flights &amp; hotels...
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: (readyToPlan && plan) ? '0 0 auto' : 1,
            maxHeight: (readyToPlan && plan) ? '25vh' : 'none',
            minHeight: (readyToPlan && plan) ? '25vh' : 0,
            padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem',
          }}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '92%', padding: '1.1rem 1.35rem',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background:   isUser ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : '#f1f0ec',
                    border:       isUser ? 'none' : '1px solid #e2e0da',
                    boxShadow:    '0 4px 12px rgba(0,0,0,0.15)',
                    color: '#1f2937', fontSize: '0.98rem', lineHeight: 1.6,
                  }}>
                    {isUser ? msg.content : renderFormattedMessage(msg.content)}
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: '0.85rem' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} /> TravelAI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ✨ Itinerary panel -- appears inside chat panel when plan is ready */}
          {readyToPlan && plan && (
            <div style={{ borderTop: '1px solid #e5e3dc', background: '#ffffff', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>

              {/* Header row -- title + neutral status only */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#4f46e5' }}>✨ Your Itinerary</h3>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {loadingPkgs && (
                    <span style={{ fontSize: '0.68rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="spinner" style={{ width: 10, height: 10 }} /> packages...
                    </span>
                  )}
                  {bookingSearched && Object.values(bookingResults).includes('loading') && (
                    <span style={{ fontSize: '0.68rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="spinner" style={{ width: 10, height: 10 }} /> Searching prices...
                    </span>
                  )}
                  {bookingSearched && !Object.values(bookingResults).includes('loading') && (
                    <span style={{ fontSize: '0.68rem', color: '#059669', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', padding: '2px 10px', borderRadius: 20 }}>
                      ✅ Prices loaded
                    </span>
                  )}
                </div>
              </div>

              {/* Plan summary */}
              <p style={{ fontSize: '0.8rem', color: '#374151', margin: 0, lineHeight: 1.5, flexShrink: 0 }}>{plan.summary}</p>

              {/* Destination cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
                    budgetLevel={plan?.budgetLevel || preferences.budgetLevel}
                  />
                ))}
              </div>

              {/* Find Flights & Hotels CTA -- after destinations so user reviews the plan first */}
              {!bookingSearched && (
                <button
                  onClick={() => triggerBookingSearch(plan, preferences)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(79,70,229,0.2)',
                    flexShrink: 0,
                  }}
                >
                  ✈️ Find Live Flights &amp; Hotels for All Destinations
                </button>
              )}

              {/* Booking selection summary */}
              {hasBookingSelections && (
                <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, color: '#4f46e5', marginBottom: 5 }}>Selection summary</div>
                  {selectedComponents.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', marginBottom: 2 }}>
                      <span>{c.componentType === 'flight' ? '✈️' : '🏨'} {c.title}</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>NZD ${c.pricePerPerson?.toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e5e3dc', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: '#1f2937' }}>Total . {preferences.travelers || 1} traveller{preferences.travelers > 1 ? 's' : ''}</span>
                    <span style={{ color: '#4f46e5' }}>NZD ${totalAll?.toFixed(0)}</span>
                  </div>
                </div>
              )}

              {/* Save bar */}
              {bookingSearched && (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6, paddingBottom: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      if (!isSaving && !saveSuccess && allDestCards.length > 0) {
                        handleSaveTrip();
                      }
                    }}
                    disabled={isSaving || saveSuccess || allDestCards.length === 0}
                    style={{
                      background: 'linear-gradient(135deg,#10b981,#059669)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      padding: '0.6rem 1.4rem',
                      borderRadius: 8,
                      border: 'none',
                      cursor: (isSaving || saveSuccess || allDestCards.length === 0) ? 'default' : 'pointer',
                      opacity: (isSaving || allDestCards.length === 0) ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved! v' : 'Save Itinerary'}
                  </button>
                </div>
              )}

              {/* -- Booking confirmation -- appears once the trip is saved -- */}
              {saveSuccess && !bookingConfirmation && hasBookingSelections && (
                <div style={{ borderTop: '1px solid #e5e3dc', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>
                    🔒 Confirm Your Booking
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4 }}>
                    This locks in your selected flights and hotels at today's price. Payment will be required next to finalise it.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={travelerName}
                      onChange={e => setTravelerName(e.target.value)}
                      style={{ flex: '1 1 160px', background: '#f8f7f4', border: '1px solid #d1d5db', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#1f2937', fontSize: '0.8rem' }}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={travelerEmail}
                      onChange={e => setTravelerEmail(e.target.value)}
                      style={{ flex: '1 1 160px', background: '#f8f7f4', border: '1px solid #d1d5db', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#1f2937', fontSize: '0.8rem' }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={travelerPhone}
                      onChange={e => setTravelerPhone(e.target.value)}
                      style={{ flex: '1 1 140px', background: '#f8f7f4', border: '1px solid #d1d5db', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#1f2937', fontSize: '0.8rem' }}
                    />
                  </div>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isConfirmingBooking || !travelerName.trim() || !travelerEmail.trim()}
                    style={{
                      background: (!travelerName.trim() || !travelerEmail.trim()) ? '#d1d5db' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                      color: 'white', fontWeight: 600, fontSize: '0.85rem', padding: '0.6rem 1rem', borderRadius: 8, border: 'none',
                      cursor: (!travelerName.trim() || !travelerEmail.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isConfirmingBooking ? 'Confirming...' : '🔒 Confirm Booking'}
                  </button>
                </div>
              )}

              {/* -- Booking confirmed -- show confirmation code -- */}
              {bookingConfirmation && (
                <div style={{ borderTop: '1px solid #e5e3dc', paddingTop: '1rem', flexShrink: 0 }}>
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', marginBottom: 4 }}>
                      ✅ Booking Reserved!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: 8 }}>
                      Confirmation code: <strong style={{ color: '#1f2937', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{bookingConfirmation.confirmationCode}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                      Status: <span style={{ color: '#b45309', textTransform: 'capitalize' }}>{bookingConfirmation.status?.replace('_', ' ')}</span> -- payment required to finalise. We've noted your details and will follow up.
                    </div>
                    <button
                      onClick={() => navigate('/my-trips')}
                      style={{ marginTop: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#4f46e5', fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 0.9rem', borderRadius: 8, cursor: 'pointer' }}
                    >
                      View My Trips
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', borderTop: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '1rem', background: '#f8f7f4', borderTop: '1px solid #e5e3dc', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tell TravelAI your destination, interests, dates, or plans..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              disabled={isSending}
              style={{ all: 'unset', flex: 1, background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, padding: '0.6rem 1rem', color: '#1f2937', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !userInput.trim()}
              style={{ all: 'unset', cursor: isSending || !userInput.trim() ? 'default' : 'pointer', background: isSending || !userInput.trim() ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg) translate(2px,-2px)' }}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* -- RIGHT: Tracker + Itinerary -- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, maxWidth: '100%', overflowY: 'auto', overflowX: 'hidden', paddingRight: 4 }}>

          {/* Both the tracker and itinerary-placeholder are hidden until the
              user has actually sent a trip prompt -- messages starts with just
              the assistant's greeting (length 1), so anything beyond that
              means the conversation has genuinely started. */}
          {messages.length > 1 && (
            <>
          {/* Preference Tracker */}
          <div style={{ padding: '1.5rem', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e0da', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 0 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
              🎯 Live Consultant Tracker
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              {[
                { label: '📍 Destination', value: preferences.destination, key: 'destination' },
                { label: '🛫 Flying From',  value: preferences.originCity, key: 'originCity' },
                { label: '📅 Duration',    value: preferences.days > 0 ? `${preferences.days} Days` : null, key: 'days' },
                { label: '🗓 Depart Date', value: preferences.departDate, key: 'departDate' },
                { label: '🗓 Return Date', value: preferences.returnDate, key: 'returnDate' },
                { label: '👥 Travelers',   value: preferences.travelers > 0 ? `${preferences.travelers} Traveler(s)` : null, key: 'travelers' },
                { label: '💰 Budget',      value: preferences.budgetAmount > 0
                    ? `$${preferences.budgetAmount.toLocaleString()}`
                    : (preferences.flightBudget > 0 || preferences.hotelBudgetPerNight > 0)
                      ? `✈️ $${preferences.flightBudget.toLocaleString()} . 🏨 $${preferences.hotelBudgetPerNight.toLocaleString()}/night`
                      : preferences.budgetLevel, key: 'budgetLevel' },
              ].map(row => (
                <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0ede6', paddingBottom: 8, minWidth: 0, gap: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', color: row.value ? '#38bdf8' : '#fbbf24', textAlign: 'right', wordBreak: 'break-word', minWidth: 0 }}>
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

            </>
          )}
        </div>
      </div>
      </div>
    </div>
  </>
);
}