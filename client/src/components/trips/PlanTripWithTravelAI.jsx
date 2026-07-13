import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatWithAI, saveTripToDB } from '../../services/tripService';
import '../home/HomePage.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Component type icons for package detail rows ─────────────────────────────
const COMPONENT_META = {
  flight: { icon: '✈️', colour: '#38bdf8' },
  hotel: { icon: '🏨', colour: '#a78bfa' },
  activity: { icon: '🎯', colour: '#34d399' },
  transfer: { icon: '🚌', colour: '#fb923c' },
};

function packageEmoji(pkg) {
  const name = (pkg.destination_name || '').toLowerCase();
  if (name.includes('auckland')) return '🌆';
  if (name.includes('wellington')) return '🌧️';
  if (name.includes('rotorua')) return '🌋';
  if (name.includes('queenstown')) return '🏔️';
  if (name.includes('christchurch')) return '🌿';
  if (name.includes('tauranga')) return '🏖️';
  return '📍';
}

function DestinationCard({ dest, onRemove, agentPkg }) {
  return (
    <div className="glass-card trip-dest-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(10px)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={`https://picsum.photos/seed/${dest.id}/150/150`}
              alt={dest.name}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-500)' }}
            />
            <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '1.1rem', background: 'var(--bg-800)', borderRadius: '50%', padding: 2, lineHeight: 1 }}>
              {dest.emoji}
            </span>
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: '#f8fafc' }}>
              {dest.name} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{dest.country}</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Highlights: {dest.highlights.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }} onClick={() => onRemove(dest.id)} title="Remove">✕</button>
      </div>

      {/* Bookme deals — AI cards only */}
      {!agentPkg && dest.bookmeDeals?.length > 0 && (
        <div className="bookme-deals-container" style={{ marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.8rem', color: '#38bdf8', margin: '0 0 8px 0', fontWeight: 600 }}>✨ Recommended Activities on Bookme</h4>
          <div className="bookme-deals-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
            {dest.bookmeDeals.map((deal, i) => (
              <a key={i} href={deal.link} target="_blank" rel="noreferrer" className="bookme-deal-card-new" style={{ minWidth: '200px', flexShrink: 0, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px', display: 'block', textDecoration: 'none' }}>
                <div style={{ height: '80px', borderRadius: '6px', backgroundImage: `url(${deal.image})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '6px' }} />
                <h5 style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 4px 0', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.title}</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>{deal.price}</span>
                  {deal.discount && <span style={{ fontSize: '0.65rem', background: '#f97316', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>{deal.discount}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Package inclusions — agent cards only */}
      {agentPkg && agentPkg.components?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: '0.5rem' }}>
          {agentPkg.components.map((comp, i) => {
            const meta = COMPONENT_META[comp.component_type] || { icon: '📌', colour: '#94a3b8' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: `${meta.colour}0f`, border: `1px solid ${meta.colour}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{comp.title}</span>
                </div>
                <span style={{ fontSize: 12, color: meta.colour, fontWeight: 700 }}>NZD ${parseFloat(comp.price_per_person ?? comp.pricePerPerson ?? 0).toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlanTripWithTravelAI() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  const messagesEndRef = useRef(null);

  // ── Chat & Messages State ──────────────────────────────────────────────────
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am TravelAI, your interactive travel consultant buddy. 🌍 Where are we dreaming of going for your next adventure?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // ── Extracted Preferences State (from backend chat parses) ──────────────────
  const [preferences, setPreferences] = useState({
    destination: '',
    days: 0,
    travelers: 0,
    budgetLevel: '',
    location_types: []
  });

  // ── Generated Plan State ────────────────────────────────────────────────────
  const [readyToPlan, setReadyToPlan] = useState(false);
  const [plan, setPlan] = useState(null);
  const [agentPackages, setAgentPackages] = useState([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);

  // ── Saving State ────────────────────────────────────────────────────────────
  const [tripTitle, setTripTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load packages when plan is generated
  useEffect(() => {
    if (!plan) return;
    setAgentPackages([]);
    const destNames = (plan.destinations || []).map(d => d.name).filter(Boolean).join(',');
    if (!destNames) return;

    setLoadingPkgs(true);
    fetch(`${API}/packages?destinations=${encodeURIComponent(destNames)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setAgentPackages(data.packages || []))
      .catch(() => { })
      .finally(() => setLoadingPkgs(false));
  }, [plan, accessToken]);

  // Handle message send
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
        setPreferences(data.extractedPreferences);
      }
      
      if (data.readyToPlan) {
        setReadyToPlan(true);
        if (data.plan && data.plan.destinations && data.plan.destinations.length > 0) {
          setPlan(data.plan);
        }
      }
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/login');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setIsSending(false);
    }
  }

  // Handle plan updates / destination removal
  function removeDestination(id) {
    if (!plan) return;
    if (!id.startsWith('pkg-')) {
      setPlan(prev => ({
        ...prev,
        destinations: prev.destinations.filter(d => d.id !== id),
      }));
    } else {
      const pkgId = id.replace('pkg-', '');
      setAgentPackages(prev => prev.filter(p => p.id !== pkgId));
    }
  }

  // Save the trip to database
  async function handleSaveTrip() {
    if (!plan) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const response = await saveTripToDB(accessToken, {
        plan,
        title: tripTitle.trim() || `${plan.startCity} Trip`,
        selectedComponents: [],
        totalPricePerPerson: 0,
        totalPriceAll: 0,
        selectedPackageIds: agentPackages.map(p => p.id),
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
    const highlights = components.slice(0, 3).map(c => c.title);
    return {
      id: `pkg-${pkg.id}`,
      name: pkg.destination_name,
      country: pkg.country || 'New Zealand',
      emoji: packageEmoji(pkg),
      highlights: highlights.length ? highlights : [pkg.package_name],
      bookmeDeals: [],
    };
  }

  const allDestCards = [
    ...(plan?.destinations || []).map(d => ({ dest: d, agentPkg: null })),
    ...agentPackages.map(pkg => ({ dest: packageToDestCard(pkg), agentPkg: pkg })),
  ];

  return (
    <div className="trip-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc', overflow: 'hidden', background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', position: 'relative' }}>
      
      {/* Background Floating Orbs */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Shadow/beige backing elements */}
        <div className="home-orb home-orb-shadow-beige" style={{ left: '10%', top: '45%' }}></div>
        <div className="home-orb home-orb-shadow-small" style={{ left: '15%', top: '15%' }}></div>
        {/* Foreground colored floating orbs */}
        <div className="home-orb home-orb-pink" style={{ left: '45%', top: '10%' }}></div>
        <div className="home-orb home-orb-blue" style={{ left: '62%', top: '12%' }}></div>
        <div className="home-orb home-orb-orange" style={{ left: '78%', top: '14%' }}></div>
        <div className="home-orb home-orb-large-yellow" style={{ left: '48%', bottom: '25%' }}></div>
        <div className="home-orb home-orb-large-blue" style={{ left: '70%', top: '30%' }}></div>
      </div>

      {/* Header bar */}
      <header className="trip-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.85rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          }}
        >
          ← Home
        </button>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>TravelAI Buddy</h1>
      </header>

      {/* Main Workspace Split View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: '1.5rem', gap: '1.5rem', height: 'calc(100vh - 80px)', overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>
        
        {/* Left Side: Premium Chat Buddy Consultant */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', minWidth: 0 }}>
          {/* Buddy status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: 'rgba(30,41,59,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #3b82f6)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>🤖</div>
            <div>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>TravelAI Consultant</div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', display: 'inline-block' }} /> Online & Listening
              </div>
            </div>
          </div>

          {/* Message List */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              
              // Helper to parse **bold** text in a line
              const parseBoldText = (text) => {
                const parts = text.split(/(\*\*[^*]+\*\*)/g);
                return parts.map((part, idx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={idx} style={{ color: '#ffffff', fontWeight: 700 }}>
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                });
              };

              // Helper to parse markdown-like structure to React elements
              const renderFormattedMessage = (content) => {
                if (!content) return null;
                const lines = content.split('\n');
                return lines.map((line, lineIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) {
                    return <div key={lineIdx} style={{ height: '0.4rem' }} />;
                  }
                  if (trimmed === '---') {
                    return <hr key={lineIdx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 0' }} />;
                  }
                  if (trimmed.startsWith('###')) {
                    return (
                      <h3 key={lineIdx} style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.75rem', marginBottom: '0.4rem' }}>
                        {parseBoldText(trimmed.replace(/^###\s*/, ''))}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('##')) {
                    return (
                      <h4 key={lineIdx} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginTop: '0.9rem', marginBottom: '0.5rem' }}>
                        {parseBoldText(trimmed.replace(/^##\s*/, ''))}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('#')) {
                    return (
                      <h2 key={lineIdx} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '1.1rem', marginBottom: '0.6rem' }}>
                        {parseBoldText(trimmed.replace(/^#\s*/, ''))}
                      </h2>
                    );
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                      <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginLeft: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#818cf8', fontSize: '0.8rem', marginTop: '4px' }}>•</span>
                        <span style={{ flex: 1, color: '#e2e8f0' }}>{parseBoldText(trimmed.substring(2))}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={lineIdx} style={{ margin: '0 0 0.5rem 0', lineHeight: '1.6', color: '#e2e8f0' }}>
                      {parseBoldText(line)}
                    </p>
                  );
                });
              };

              return (
                <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.85rem 1.1rem',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: isUser ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'rgba(30,41,59,0.85)',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}>
                    {isUser ? msg.content : renderFormattedMessage(msg.content)}
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} /> TravelAI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderTop: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>⚠️ {error}</div>}

          {/* Message Input Panel */}
          <div style={{ padding: '1rem', background: 'rgba(30,41,59,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Tell TravelAI your destination, interests, or plans..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              disabled={isSending}
              className="premium-chat-input"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !userInput.trim()}
              className={`premium-send-btn ${isSending || !userInput.trim() ? 'disabled' : 'active'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg) translate(2px, -2px)' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* Right Side: Preference Tracker & Itinerary Summary */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Preference Tracker Panel */}
          <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              🎯 Live Consultant Tracker
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>📍 Destination</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: preferences.destination ? '#38bdf8' : '#fbbf24' }}>
                  {preferences.destination || 'Finding...'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>📅 Duration</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: preferences.days > 0 ? '#38bdf8' : '#fbbf24' }}>
                  {preferences.days > 0 ? `${preferences.days} Days` : 'Finding...'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>👥 Travelers</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: preferences.travelers > 0 ? '#38bdf8' : '#fbbf24' }}>
                  {preferences.travelers > 0 ? `${preferences.travelers} Traveler(s)` : 'Finding...'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>💰 Budget Level</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize', color: preferences.budgetLevel ? '#34d399' : '#fbbf24' }}>
                  {preferences.budgetLevel || 'Finding...'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500, display: 'block', marginBottom: '8px' }}>🏷️ Interests / Location Styles</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {preferences.location_types && preferences.location_types.length > 0 ? (
                    preferences.location_types.map((type, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', color: '#c7d2fe', fontWeight: 500 }}>
                        {type}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontStyle: 'italic' }}>Waiting to discover...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Itinerary Panel (Rendered only when readyToPlan is true and plan exists) */}
          {readyToPlan && plan ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#38bdf8' }}>✨ Generated Itinerary Options</h3>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>{plan.summary}</p>
                
                {loadingPkgs && (
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="spinner" style={{ width: 12, height: 12 }} /> Searching matches...
                  </div>
                )}

                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                  {allDestCards.map(({ dest, agentPkg }) => (
                    <DestinationCard
                      key={dest.id}
                      dest={dest}
                      agentPkg={agentPkg}
                      onRemove={removeDestination}
                    />
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Itinerary Name (Optional)"
                    value={tripTitle}
                    onChange={e => setTripTitle(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}
                  />
                  <button
                    onClick={handleSaveTrip}
                    disabled={isSaving || saveSuccess || allDestCards.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved! ✓' : 'Save Itinerary'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', background: '#1e293b', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.5rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</span>
              <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 500, lineHeight: 1.4 }}>
                Chat with the consultant to design your itinerary!
              </span>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
                Your live recommendations will appear here.
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
