import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';
import '../home/HomePage.css';
import { getRecentSearches, saveRecentSearchToDB } from '../../services/recentSearchService';
import { chatWithAI } from '../../services/tripService';

function formatSearchDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TravellerDashboard() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const chatMessagesRef = useRef(null);
  const hasMountedMessagesRef = useRef(false);

  const [recentSearches, setRecentSearches] = useState([]);
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

  useEffect(() => {
    let cancelled = false;

    async function loadRecentSearches() {
      if (!accessToken) {
        setRecentSearches([]);
        return;
      }

      try {
        const data = await getRecentSearches(accessToken);

        if (!cancelled) {
          setRecentSearches(data.recentSearches || []);
        }
      } catch (err) {
        console.error('[TravellerDashboard] Failed to load recent searches:', err);
      }
    }

    loadRecentSearches();

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

  async function saveRecentSearch(query) {
    const cleanQuery = String(query || '').trim();

    if (!cleanQuery || !accessToken) return;

    try {
      const data = await saveRecentSearchToDB(accessToken, cleanQuery);
      setRecentSearches(data.recentSearches || []);
    } catch (err) {
      console.error('[TravellerDashboard] Failed to save recent search:', err);
    }
  }

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

  async function handleSend() {
    if (!userInput.trim() || isSending) return;

    const userMsg = userInput.trim();

    saveRecentSearch(userMsg).catch((err) => {
      console.warn('[TravellerDashboard] Failed to save recent search:', err);
    });

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
    } catch (err) {
      setChatError(err.message || 'Something went wrong while chatting with TravelAI.');
    } finally {
      setIsSending(false);
    }
  }

  function handleRecentSearchClick(query) {
    const cleanQuery = String(query || '').trim();

    if (!cleanQuery) return;

    sessionStorage.setItem('pending_trip_description', cleanQuery);
    navigate('/plan-trip');
  }

  return (
    <div className="home-page-container">
      <Navbar />

      <header className="traveller-home-section">
        <div className="traveller-home-grid">
          <div className="traveller-home-card traveller-home-hero-card">
            <span className="traveller-home-badge">AI Travel Assistant</span>

            <div className="traveller-chat-grid">
              <div className="traveller-chat-panel">
                <div className="traveller-chat-header">
                  <div className="traveller-chat-avatar">🤖</div>

                  <div>
                    <div className="traveller-chat-title">TravelAI Consultant</div>
                    <div className="traveller-chat-status">
                      <span className="traveller-chat-status-dot" />
                      Online &amp; Listening
                    </div>
                  </div>
                </div>

                <div className="traveller-chat-messages" ref={chatMessagesRef}>
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';

                    return (
                      <div
                        key={index}
                        className={`traveller-chat-message ${isUser ? 'user' : 'assistant'}`}
                      >
                        {isUser ? msg.content : renderFormattedMessage(msg.content)}
                      </div>
                    );
                  })}
                </div>

                {chatError && (
                  <div className="traveller-chat-error">⚠️ {chatError}</div>
                )}

                <div className="traveller-chat-input-row">
                  <input
                    type="text"
                    placeholder="Tell TravelAI your destination, interests, dates, or plans..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSending}
                  />

                  <button
                    type="button"
                    className="traveller-chat-send-btn"
                    onClick={handleSend}
                    disabled={isSending || !userInput.trim()}
                  >
                    {isSending ? 'Thinking...' : 'Send'}
                  </button>
                </div>
              </div>

              <div className="traveller-tracker-panel">
                <div className="traveller-tracker-header">
                  <span className="traveller-tracker-title">
                    🎯 Live Consultant Tracker
                  </span>
                </div>

                <div className="traveller-tracker-row">
                  <span>📍 Destination</span>
                  <strong>{preferences.destination || 'Finding...'}</strong>
                </div>

                <div className="traveller-tracker-row">
                  <span>🛫 Flying From</span>
                  <strong>{preferences.originCity || 'Finding...'}</strong>
                </div>

                <div className="traveller-tracker-row">
                  <span>📅 Duration</span>
                  <strong>{preferences.days > 0 ? `${preferences.days} Days` : 'Finding...'}</strong>
                </div>

                <div className="traveller-tracker-row">
                  <span>🗓 Depart Date</span>
                  <strong>{preferences.departDate || 'Finding...'}</strong>
                </div>

                <div className="traveller-tracker-row">
                  <span>🗓 Return Date</span>
                  <strong>{preferences.returnDate || 'Finding...'}</strong>
                </div>

                <div className="traveller-tracker-row">
                  <span>👥 Travelers</span>
                  <strong>
                    {preferences.travelers > 0
                      ? `${preferences.travelers} Traveler(s)`
                      : 'Finding...'}
                  </strong>
                </div>

                <div className="traveller-tracker-row">
                  <span>💰 Budget</span>
                  <strong>
                    {preferences.budgetAmount > 0
                      ? `$${preferences.budgetAmount.toLocaleString()}`
                      : preferences.flightBudget > 0 || preferences.hotelBudgetPerNight > 0
                        ? `✈️ $${preferences.flightBudget.toLocaleString()} · 🏨 $${preferences.hotelBudgetPerNight.toLocaleString()}/night`
                        : preferences.budgetLevel || 'Finding...'}
                  </strong>
                </div>

                {preferences.location_types?.length > 0 && (
                  <div className="traveller-tracker-tags">
                    {preferences.location_types.map((type, idx) => (
                      <span key={idx} className="traveller-tracker-tag">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="traveller-home-card traveller-recent-card">
            <div className="traveller-recent-header">
              <div>
                <span className="traveller-recent-kicker">AI History</span>
                <h2>Recent Search</h2>
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
                    onClick={() => handleRecentSearchClick(item.query)}
                  >
                    <span className="traveller-recent-number">{index + 1}</span>

                    <span className="traveller-recent-text">
                      <strong>{item.query}</strong>
                      <small>{formatSearchDate(item.createdAt)}</small>
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
          <h2 className="home-section-title">Popular Destinations</h2>
          <a href="#explore" className="home-view-all">
            View all <span>→</span>
          </a>
        </div>

        <div className="home-dest-grid">
          <div className="home-dest-card">
            <div className="home-dest-banner paris" />
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">Paris</span>
                <span className="home-dest-country">France</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>

          <div className="home-dest-card">
            <div className="home-dest-banner bali" />
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">Bali</span>
                <span className="home-dest-country">Indonesia</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>

          <div className="home-dest-card">
            <div className="home-dest-banner dubai" />
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">Dubai</span>
                <span className="home-dest-country">UAE</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>

          <div className="home-dest-card">
            <div className="home-dest-banner newyork" />
            <div className="home-dest-footer">
              <div className="home-dest-details">
                <span className="home-dest-name">New York</span>
                <span className="home-dest-country">USA</span>
              </div>
              <span className="home-dest-rating">★ 4.8</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}